# Deskemon

Converges physical-world context (location, motion) with digital-world
context (browser activity, active app, calendar) to detect wellbeing
patterns and nudge the user — sedentary time, an experimental
cognitive-load/stress proxy, and hydration/food/medicine reminders.

See `DESIGN.md` for the full architecture (components vs. agents, data
model, build order).

Currently built: the backend foundation (events/nudges store, ingest API,
rules engine) — Phase 1 per `DESIGN.md` — plus the first real (non-
simulated) capture agent: desktop window tracking, with a matching
notification dispatcher. The simulator still covers phone/browser/calendar
so the rules engine has continuous data to react to.

## Stack

Dockerized (`docker compose up -d --build`):
- `backend/` — FastAPI ingest API + rules engine (Python)
- `postgres` — events/nudges store, its own container
- `simulator/` — standalone fake capture-agent service; continuously
  streams phone/browser/calendar events and triggers the rules engine,
  simulating agents not yet built (a separate concern from the backend,
  its own minimal dependencies)
- `frontend-monitor-app/` — React + Vite monitoring dashboard: live events feed and
  nudges list, served by nginx, proxying `/api/*` to the backend

Native, host-run (not containerized — need real desktop/GUI access):
- `desktop-agent/` — real capture agent: polls the frontmost app/window
  on macOS every ~5s and posts `desktop`/`window_focus` events. Capture
  only, one responsibility.
- `notifier-agent/` — real dispatch agent: polls nudges and fires a
  native macOS notification for each new one. Dispatch only, kept as a
  separate process from `desktop-agent` on purpose — each agent does one
  thing.

`docker-compose.yml` runs the four Dockerized services together; the two
native agents are started separately (see their own READMEs).

## Deployment (full local setup)

Two parts, run in order — the Docker stack first, then (optionally) the
native agents on your Mac:

1. **Docker stack** (always required): `docker compose up -d --build`
   from the repo root. Brings up `postgres`, `backend`, `simulator`,
   `frontend-monitor-app`. This alone gives you a fully working demo
   driven by fake data — no Mac-specific setup needed.
2. **Native agents** (optional, macOS only, adds real signal): in two
   separate terminals, `cd desktop-agent && uv sync && uv run python
   track.py` and `cd notifier-agent && uv sync && uv run python
   notify.py`. These are NOT in `docker-compose.yml` and never will be —
   they need direct access to your Mac's real GUI (frontmost window,
   notification center), which a container on macOS cannot see. Run them
   any time after the Docker stack is up; stop them any time with
   `Ctrl+C` independently of the Docker stack.

There's nothing to deploy beyond your own machine for this project — no
cloud target, no remote server. "Deployment" here means "get all of the
above running locally." Full details for each part below.

## Run it

From the repo root:

```bash
docker compose up -d --build
```

This starts four containers:
- `postgres` — the database (backend waits for it to report healthy)
- `backend` — the API + rules engine, exposed on `http://localhost:8000`
- `simulator` — starts once backend is healthy; continuously streams fake
  events and periodically triggers the rules engine, so nudges start
  appearing within about a minute
- `frontend-monitor-app` — the monitoring dashboard, exposed on `http://localhost:5173`

Check all four are up:

```bash
docker compose ps
docker compose logs -f simulator   # watch it stream events + nudges live
```

You should see `deskemon-postgres-1` (healthy), `deskemon-backend-1`
(healthy), `deskemon-simulator-1` (up), and `deskemon-frontend-monitor-app-1`
(up), with ports `8000` and `5173` published.

## Monitoring dashboard

Open `http://localhost:5173` — two live-updating panels, polling every 3s:
- **Events** — the raw incoming event stream (source, type, payload),
  newest first, capped to the 100 most recent
- **Nudges** — generated alerts (type, message, dismissed state), newest
  first, capped to the 10 most recent

A **"Fake events" toggle** in the header (default: Yes) lets you filter
the Events panel down to only real events. Every event the simulator/seed
script posts is tagged `payload.synthetic: true`; real agent events (e.g.
from `desktop-agent`) never carry that key. Flip the toggle to "No" to see
only real capture-agent traffic.

No Grafana/Prometheus here on purpose: the data is discrete JSON
events/nudges, not numeric time-series metrics, so a small custom feed/list
UI is a better fit than a metrics dashboard.

## Inspecting Postgres directly

Postgres is published on `localhost:5432` (see `docker-compose.yml`). Any
SQL client (DBeaver, psql, TablePlus) can connect with:
- Host: `localhost`, Port: `5432`, Database: `deskemon`
- Username: `deskemon`, Password: `deskemon`

## Test it end to end

With `docker compose up -d --build`, the simulator runs automatically and
continuously — no manual seeding needed. This exercises the full pipeline
(fake events in, nudges out) without any real phone/browser/calendar
integration.

**1. Confirm the API is alive**

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

**2. Watch the simulator stream events and trigger the rules engine**

```bash
docker compose logs -f simulator
```

You'll see `[phone]`, `[browser]`, and `[calendar]` lines as fake events
are posted, and `[rules] ran, created_nudges=N` lines every ~20s.

**3. Confirm raw events are landing in the store**

```bash
curl "http://localhost:8000/events?source=phone" | python3 -m json.tool
curl "http://localhost:8000/events?source=browser" | python3 -m json.tool
```

**4. Confirm nudges are being generated**

```bash
curl http://localhost:8000/nudges | python3 -m json.tool
```

Expected within a minute or two: `hydration`/`food`/`medicine` reminders
from the first automatic rules-engine pass, then `sedentary` and
`cognitive_load_experimental` nudges as the simulator's fake sedentary
stints and tab-switch bursts cross their thresholds. Demo-fast thresholds
are set via env vars in `docker-compose.yml` (`SEDENTARY_WINDOW_MIN=2`,
etc.) — see `backend/app/rules_engine.py` for the full list.

**Alternative: one-shot deterministic seed** (instead of the continuous
simulator) — useful for a fixed, repeatable scenario:

```bash
cd backend
uv sync
uv run python scripts/seed_demo_events.py http://localhost:8000
curl -X POST http://localhost:8000/rules/run
curl http://localhost:8000/nudges | python3 -m json.tool
```

**5. Clean up**

```bash
docker compose down        # stop containers, keep DB data
docker compose down -v     # stop containers and wipe DB data
```

**Full reset** (wipe everything — containers, DB volume, images — and
rebuild from scratch):

```bash
docker compose down -v --remove-orphans
docker compose build --no-cache
docker compose up -d
```

Or just run `./reset.sh` from the repo root, which does exactly that.

## Real desktop capture + notifications (optional, native)

With the Docker stack running, in two separate terminals on the host Mac:

```bash
cd desktop-agent && uv sync && uv run python track.py
```
```bash
cd notifier-agent && uv sync && uv run python notify.py
```

Switch between real apps/windows — `desktop-agent` posts real
`window_focus` events, visible in the dashboard's Events feed and via
`curl "http://localhost:8000/events?source=desktop"`. `notifier-agent`
watches `/nudges` and fires a real macOS notification banner for each new
one (it seeds itself against existing nudge history on startup, so it
won't spam notifications for nudges that already existed before it ran).

## API reference

| Endpoint | Description |
|---|---|
| `GET /health` | liveness check |
| `POST /events` | ingest one event: `{source, type, payload, timestamp?}` |
| `GET /events?since=&source=` | list stored events, optionally filtered |
| `GET /nudges?since=` | list generated nudges |
| `POST /rules/run` | run one rules-engine pass on demand |
