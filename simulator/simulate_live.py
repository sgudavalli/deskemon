"""
Continuously streams fake events to the ingest API, simulating live
capture agents (phone, browser, calendar), and periodically triggers the
rules engine so nudges appear in near real time.

Usage:
    uv run python simulate_live.py [base_url]

BASE_URL env var takes precedence if set; otherwise a positional arg is
used, falling back to http://localhost:8000.

Ctrl+C to stop. Prints each posted event and any nudges created.
"""

import os
import random
import sys
import threading
import time
from datetime import datetime, timedelta, timezone

import requests

BASE_URL = os.environ.get("BASE_URL") or (
    sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
)

PHONE_INTERVAL_SEC = 8
BROWSER_INTERVAL_SEC = 3
CALENDAR_CHECK_INTERVAL_SEC = 60
RULES_RUN_INTERVAL_SEC = 20

# Once "sedentary mode" is entered, stay there for a while so the sedentary
# nudge actually has a chance to fire, instead of resetting every event.
SEDENTARY_STINT_MIN_CYCLES = 20   # ~2.5 min of no movement at 8s/cycle
SEDENTARY_STINT_MAX_CYCLES = 40

TABS = [
    "docs.google.com",
    "github.com",
    "slack.com",
    "jira.atlassian.net",
    "gmail.com",
    "stackoverflow.com",
    "figma.com",
]

BASE_LOCATION = {"lat": 37.7749, "lon": -122.4194}
stop_event = threading.Event()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def post_event(source: str, type_: str, payload: dict) -> None:
    try:
        resp = requests.post(
            f"{BASE_URL}/events",
            json={"source": source, "type": type_, "payload": payload, "timestamp": now_iso()},
            timeout=5,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        print(f"  [error posting {source}/{type_}] {exc}")


def phone_loop() -> None:
    sedentary_cycles_left = 0
    while not stop_event.is_set():
        if sedentary_cycles_left <= 0:
            # Decide whether to start a sedentary stint or move around.
            if random.random() < 0.4:
                sedentary_cycles_left = random.randint(
                    SEDENTARY_STINT_MIN_CYCLES, SEDENTARY_STINT_MAX_CYCLES
                )
            location = BASE_LOCATION
            moving = sedentary_cycles_left == 0
        else:
            location = BASE_LOCATION
            moving = False
            sedentary_cycles_left -= 1

        post_event("phone", "location", location)
        post_event("phone", "motion", {"moving": moving})
        state = "sedentary" if not moving else "moving"
        print(f"[phone] location + motion ({state})")

        stop_event.wait(PHONE_INTERVAL_SEC)


def browser_loop() -> None:
    while not stop_event.is_set():
        # Occasionally burst tab-switch activity to trigger cognitive load.
        burst = random.random() < 0.3
        count = random.randint(3, 6) if burst else 1
        for _ in range(count):
            tab = random.choice(TABS)
            post_event("browser", "tab_focus", {"url": tab, "title": tab})
        print(f"[browser] {count} tab_focus event(s){' (burst)' if burst else ''}")

        stop_event.wait(BROWSER_INTERVAL_SEC)


def calendar_loop() -> None:
    while not stop_event.is_set():
        # ~1 in 4 checks, schedule a "meeting" happening right now.
        if random.random() < 0.25:
            now = datetime.now(timezone.utc)
            start = now - timedelta(minutes=2)
            end = now + timedelta(minutes=random.randint(10, 30))
            post_event(
                "calendar",
                "meeting",
                {
                    "title": "Simulated Meeting",
                    "start": start.isoformat(),
                    "end": end.isoformat(),
                },
            )
            print("[calendar] meeting in progress")
        stop_event.wait(CALENDAR_CHECK_INTERVAL_SEC)


def rules_loop() -> None:
    while not stop_event.is_set():
        stop_event.wait(RULES_RUN_INTERVAL_SEC)
        if stop_event.is_set():
            break
        try:
            resp = requests.post(f"{BASE_URL}/rules/run", timeout=5)
            resp.raise_for_status()
            created = resp.json().get("created_nudges", 0)
            marker = " <-- new nudge(s)!" if created else ""
            print(f"[rules] ran, created_nudges={created}{marker}")
        except requests.RequestException as exc:
            print(f"  [error running rules] {exc}")


def main() -> None:
    print(f"Streaming fake events to {BASE_URL} (Ctrl+C to stop)...")
    threads = [
        threading.Thread(target=phone_loop, daemon=True),
        threading.Thread(target=browser_loop, daemon=True),
        threading.Thread(target=calendar_loop, daemon=True),
        threading.Thread(target=rules_loop, daemon=True),
    ]
    for t in threads:
        t.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping...")
        stop_event.set()
        for t in threads:
            t.join(timeout=2)


if __name__ == "__main__":
    main()
