# Desktop Capture Agent

Real capture agent (A1, capture half) — polls the frontmost app + window
title on macOS every ~5s and posts `desktop`/`window_focus` events to the
ingest API. Capture only; does not read or act on nudges (see
`../notifier-agent/` for that).

Not Dockerized — runs natively on the host, since it needs access to the
real desktop (frontmost window). Uses macOS's built-in `osascript`
(AppleScript), no extra dependencies beyond `requests`.

## Run

Requires the backend stack already running (`docker compose up -d` from
the repo root, API on `http://localhost:8000`).

```bash
cd desktop-agent
uv sync
uv run python track.py
```

On first run, macOS will prompt for permission for your terminal app to
control "System Events" — allow it, otherwise window info can't be read.

## What it does

Only posts an event when the frontmost app or window title actually
changes since the last poll — switching back to an already-current
app/title does not produce duplicate rows.

Verify events are landing:

```bash
curl "http://localhost:8000/events?source=desktop" | python3 -m json.tool
```
