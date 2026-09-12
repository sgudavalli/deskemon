import json
import os
import threading
from datetime import datetime, timedelta, timezone

from .db import get_conn


def _env_float(name: str, default: float) -> float:
    return float(os.environ.get(name, default))


SCHEDULE_INTERVAL_SEC = _env_float("RULES_SCHEDULE_INTERVAL_SEC", 5 * 60)

# Static copy for the built-in routines; user-created custom routines fall
# back to their own "description" field instead.
MESSAGES = {
    "sedentary": "You've been sedentary for a while. Time for a short walk?",
    "hydration": "Time to drink some water.",
    "food": "Time to eat something.",
    "medicine": "Reminder: take your medicine.",
    "focus-recovery": "Consider a short break to reset focus.",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


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


def _interval_minutes(routine: dict) -> float:
    unit = routine.get("unit")
    every = routine.get("every", 0)
    if unit == "hours":
        return every * 60
    if unit == "daily":
        return every * 1440
    return every


def check_routines(conn) -> int:
    now = _now()
    created = 0

    rows = conn.execute("SELECT data FROM routine_configs").fetchall()
    for row in rows:
        routine = json.loads(row["data"])

        if not routine.get("enabled"):
            continue
        if routine.get("contextAware") and _is_in_meeting(conn, now):
            continue

        interval_min = _interval_minutes(routine)
        last = _last_nudge_timestamp(conn, routine["id"])
        if last is not None and now - last < timedelta(minutes=interval_min):
            continue

        message = MESSAGES.get(routine["id"], routine.get("description", routine["name"]))
        _insert_nudge(conn, routine["id"], message)
        created += 1

    return created


def run_once() -> int:
    with get_conn() as conn:
        return check_routines(conn)


def _scheduler_loop(stop_event: threading.Event) -> None:
    while not stop_event.is_set():
        run_once()
        stop_event.wait(SCHEDULE_INTERVAL_SEC)


def start_scheduler() -> threading.Event:
    stop_event = threading.Event()
    thread = threading.Thread(target=_scheduler_loop, args=(stop_event,), daemon=True)
    thread.start()
    return stop_event
