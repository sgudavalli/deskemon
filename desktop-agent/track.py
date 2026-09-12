"""
Desktop capture agent: polls the frontmost app + window title on macOS and
posts window_focus events to the ingest API. Capture only — no nudge
handling here (see notifier-agent for that).

Usage:
    uv run python track.py

BASE_URL env var (default http://localhost:8000) controls the target API.
Ctrl+C to stop.
"""

import os
import subprocess
import time
from datetime import datetime, timezone

import requests

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
POLL_INTERVAL_SEC = 5

APPLESCRIPT = """
tell application "System Events"
    set frontApp to name of first application process whose frontmost is true
    try
        set winTitle to name of front window of (first application process whose frontmost is true)
    on error
        set winTitle to ""
    end try
end tell
return frontApp & "|||" & winTitle
"""


def get_frontmost_window():
    result = subprocess.run(
        ["osascript", "-e", APPLESCRIPT],
        capture_output=True,
        text=True,
        timeout=5,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    app, _, title = result.stdout.strip().partition("|||")
    return app, title


def post_event(app: str, title: str) -> None:
    resp = requests.post(
        f"{BASE_URL}/events",
        json={
            "source": "desktop",
            "type": "window_focus",
            "payload": {"app": app, "title": title},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        timeout=5,
    )
    resp.raise_for_status()


def main() -> None:
    print(f"Tracking frontmost window, posting to {BASE_URL} (Ctrl+C to stop)...")
    last_seen = None

    while True:
        try:
            app, title = get_frontmost_window()
            current = (app, title)
            if current != last_seen:
                post_event(app, title)
                print(f"[desktop] {app} — {title}")
                last_seen = current
        except RuntimeError as exc:
            print(f"  [error reading frontmost window] {exc}")
        except requests.RequestException as exc:
            print(f"  [error posting event] {exc}")

        time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopping...")
