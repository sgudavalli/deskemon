import json
import os
import threading
import time
from datetime import datetime, timedelta, timezone

from .db import get_conn


def _env_float(name: str, default: float) -> float:
    return float(os.environ.get(name, default))


# Overridable via env vars for fast demo/simulation cadences, e.g.:
#   SEDENTARY_WINDOW_MIN=2 COGNITIVE_LOAD_WINDOW_MIN=1
#   REMINDER_HYDRATION_INTERVAL_MIN=2 REMINDER_FOOD_INTERVAL_MIN=3 REMINDER_MEDICINE_INTERVAL_MIN=4
SEDENTARY_WINDOW_MIN = _env_float("SEDENTARY_WINDOW_MIN", 30)
COGNITIVE_LOAD_WINDOW_MIN = _env_float("COGNITIVE_LOAD_WINDOW_MIN", 15)
COGNITIVE_LOAD_TAB_SWITCH_THRESHOLD = int(
    _env_float("COGNITIVE_LOAD_TAB_SWITCH_THRESHOLD", 15)
)

REMINDER_INTERVALS_MIN = {
    "hydration": _env_float("REMINDER_HYDRATION_INTERVAL_MIN", 60),
    "food": _env_float("REMINDER_FOOD_INTERVAL_MIN", 180),
    "medicine": _env_float("REMINDER_MEDICINE_INTERVAL_MIN", 240),
}

SCHEDULE_INTERVAL_SEC = _env_float("RULES_SCHEDULE_INTERVAL_SEC", 5 * 60)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _fetch_events(conn, source: str, since: datetime):
    return conn.execute(
        "SELECT * FROM events WHERE source = %s AND timestamp >= %s ORDER BY timestamp ASC",
        (source, _iso(since)),
    ).fetchall()


def _has_recent_undismissed_nudge(conn, nudge_type: str, since: datetime) -> bool:
    row = conn.execute(
        "SELECT id FROM nudges WHERE type = %s AND timestamp >= %s AND dismissed = 0 LIMIT 1",
        (nudge_type, _iso(since)),
    ).fetchone()
    return row is not None


def _last_nudge_timestamp(conn, nudge_type: str):
    row = conn.execute(
        "SELECT timestamp FROM nudges WHERE type = %s ORDER BY timestamp DESC LIMIT 1",
        (nudge_type,),
    ).fetchone()
    return datetime.fromisoformat(row["timestamp"]) if row else None


def _insert_nudge(conn, nudge_type: str, message: str) -> None:
    conn.execute(
        "INSERT INTO nudges (timestamp, type, message, dismissed) VALUES (%s, %s, %s, 0)",
        (_iso(_now()), nudge_type, message),
    )


def _is_in_meeting(conn, at: datetime) -> bool:
    rows = conn.execute(
        "SELECT * FROM events WHERE source = 'calendar' AND type = 'meeting'"
    ).fetchall()
    for row in rows:
        payload = json.loads(row["payload"])
        start = payload.get("start")
        end = payload.get("end")
        if not start or not end:
            continue
        try:
            start_dt = datetime.fromisoformat(start)
            end_dt = datetime.fromisoformat(end)
        except ValueError:
            continue
        if start_dt <= at <= end_dt:
            return True
    return False


def check_sedentary(conn) -> int:
    now = _now()
    window_start = now - timedelta(minutes=SEDENTARY_WINDOW_MIN)

    motion_events = _fetch_events(conn, "phone", window_start)
    movement_events = [
        e for e in motion_events if e["type"] in ("location", "motion")
    ]

    if not movement_events:
        return 0

    has_movement = False
    prev_location = None
    for e in movement_events:
        payload = json.loads(e["payload"])
        if e["type"] == "motion" and payload.get("moving"):
            has_movement = True
            break
        if e["type"] == "location":
            if prev_location and (
                payload.get("lat") != prev_location.get("lat")
                or payload.get("lon") != prev_location.get("lon")
            ):
                has_movement = True
                break
            prev_location = payload

    if has_movement:
        return 0

    if _has_recent_undismissed_nudge(conn, "sedentary", window_start):
        return 0

    _insert_nudge(
        conn,
        "sedentary",
        f"You've been sedentary for {SEDENTARY_WINDOW_MIN}+ minutes. Time for a short walk?",
    )
    return 1


def check_cognitive_load(conn) -> int:
    now = _now()
    window_start = now - timedelta(minutes=COGNITIVE_LOAD_WINDOW_MIN)

    tab_events = [
        e
        for e in _fetch_events(conn, "browser", window_start)
        if e["type"] == "tab_focus"
    ]
    tab_switch_count = len(tab_events)

    meeting_dense = _is_in_meeting(conn, now)

    if tab_switch_count < COGNITIVE_LOAD_TAB_SWITCH_THRESHOLD:
        return 0

    if _has_recent_undismissed_nudge(conn, "cognitive_load_experimental", window_start):
        return 0

    suffix = " while in back-to-back meetings" if meeting_dense else ""
    _insert_nudge(
        conn,
        "cognitive_load_experimental",
        f"(experimental) High tab-switching detected{suffix} — consider a short break.",
    )
    return 1


def check_reminders(conn) -> int:
    now = _now()
    if _is_in_meeting(conn, now):
        return 0

    created = 0
    messages = {
        "hydration": "Time to drink some water.",
        "food": "Time to eat something.",
        "medicine": "Reminder: take your medicine.",
    }
    for nudge_type, interval_min in REMINDER_INTERVALS_MIN.items():
        last = _last_nudge_timestamp(conn, nudge_type)
        if last is not None and now - last < timedelta(minutes=interval_min):
            continue
        _insert_nudge(conn, nudge_type, messages[nudge_type])
        created += 1
    return created


def run_once() -> int:
    with get_conn() as conn:
        created = 0
        created += check_sedentary(conn)
        created += check_cognitive_load(conn)
        created += check_reminders(conn)
    return created


def _scheduler_loop(stop_event: threading.Event) -> None:
    while not stop_event.is_set():
        run_once()
        stop_event.wait(SCHEDULE_INTERVAL_SEC)


def start_scheduler() -> threading.Event:
    stop_event = threading.Event()
    thread = threading.Thread(target=_scheduler_loop, args=(stop_event,), daemon=True)
    thread.start()
    return stop_event
