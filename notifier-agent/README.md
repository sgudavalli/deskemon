# Notifier Agent

Real dispatch agent (A1, notification half) — polls `GET /nudges` every
~15s and fires a native macOS notification for each new, undismissed
nudge. Dispatch only; does not track windows or post events (see
`../desktop-agent/` for that).

Not Dockerized — runs natively on the host so it can show real OS
notifications. Uses macOS's built-in `osascript`, no extra dependencies
beyond `requests`.

## Run

Requires the backend stack already running (`docker compose up -d` from
the repo root, API on `http://localhost:8000`).

```bash
cd notifier-agent
uv sync
uv run python notify.py
```

On first run, macOS may prompt for notification permission for your
terminal app — allow it.

## What it does

Keeps an in-memory set of nudge ids it has already notified on, so a
nudge only triggers one notification even across repeated polls (there is
no server-side dismiss/ack endpoint yet — this is a client-side
workaround, and the seen-set resets if the agent restarts).
