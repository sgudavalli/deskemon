"""
Posts a fake event sequence to the ingest API to demo the rules engine
without needing real capture agents.

Usage:
    python scripts/seed_demo_events.py [base_url]
"""

import sys
from datetime import datetime, timedelta, timezone

import requests

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"


def post_event(source: str, type_: str, payload: dict, timestamp: datetime) -> None:
    resp = requests.post(
        f"{BASE_URL}/events",
        json={
            "source": source,
            "type": type_,
            "payload": payload,
            "timestamp": timestamp.isoformat(),
        },
        timeout=5,
    )
    resp.raise_for_status()


def main() -> None:
    now = datetime.now(timezone.utc)

    # Sedentary scenario: same location for the last 30+ minutes, no motion.
    same_location = {"lat": 37.7749, "lon": -122.4194}
    for minutes_ago in (35, 25, 15, 5):
        post_event(
            "phone",
            "location",
            same_location,
            now - timedelta(minutes=minutes_ago),
        )
        post_event(
            "phone",
            "motion",
            {"moving": False},
            now - timedelta(minutes=minutes_ago),
        )

    # Cognitive load scenario: a burst of tab switches in the last 15 minutes.
    tabs = ["docs.google.com", "github.com", "slack.com", "jira.atlassian.net", "gmail.com"]
    for i in range(20):
        post_event(
            "browser",
            "tab_focus",
            {"url": tabs[i % len(tabs)], "title": f"Tab {i}"},
            now - timedelta(minutes=14 - (i * 14 // 20)),
        )

    # Calendar scenario: a meeting currently in progress.
    post_event(
        "calendar",
        "meeting",
        {
            "title": "Sprint Planning",
            "start": (now - timedelta(minutes=10)).isoformat(),
            "end": (now + timedelta(minutes=20)).isoformat(),
        },
        now - timedelta(minutes=10),
    )

    print("Seeded demo events. Now call POST /rules/run to generate nudges.")


if __name__ == "__main__":
    main()
