"""
Notifier agent: polls the nudges API and fires a native macOS notification
for each new, undismissed nudge. Dispatch only — no window tracking here
(see desktop-agent for that).

Usage:
    uv run python notify.py

BASE_URL env var (default http://localhost:8000) controls the target API.
Ctrl+C to stop.
"""

import os
import subprocess
import time

import requests

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
POLL_INTERVAL_SEC = 15

seen_nudge_ids = set()


def _applescript_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace('"', '\\"')


def show_notification(title: str, message: str) -> None:
    script = (
        f'display notification "{_applescript_escape(message)}" '
        f'with title "{_applescript_escape(title)}"'
    )
    subprocess.run(["osascript", "-e", script], capture_output=True, timeout=5)


def fetch_nudges():
    resp = requests.get(f"{BASE_URL}/nudges", timeout=5)
    resp.raise_for_status()
    return resp.json()


def main() -> None:
    print(f"Watching {BASE_URL}/nudges for new nudges (Ctrl+C to stop)...")

    # Seed the seen-set from whatever nudges already exist so we don't fire
    # a notification storm for pre-existing history on startup.
    try:
        for nudge in fetch_nudges():
            seen_nudge_ids.add(nudge["id"])
        print(f"Starting fresh — {len(seen_nudge_ids)} existing nudge(s) marked as seen.")
    except requests.RequestException as exc:
        print(f"  [error fetching initial nudges] {exc}")

    while True:
        time.sleep(POLL_INTERVAL_SEC)
        try:
            nudges = fetch_nudges()
            for nudge in nudges:
                if nudge["dismissed"] or nudge["id"] in seen_nudge_ids:
                    continue
                show_notification("Deskemon", nudge["message"])
                print(f"[notified] {nudge['type']}: {nudge['message']}")
                seen_nudge_ids.add(nudge["id"])
        except requests.RequestException as exc:
            print(f"  [error fetching nudges] {exc}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopping...")
