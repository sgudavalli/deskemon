# Deskemon

Deskemon is the physical embodiment of a Codex pet: a companion that continues
beyond the computer, understands what is happening around the desk, and connects
physical-world context with digital work.

The phone prototype is the judge-facing product. Its entire display becomes the
companion's animated face; information appears only when it has something useful
to say or needs the user's approval.

## Repository map

- `frontend-companion-app/` — **the primary Deskemon experience and visual source of truth**.
  React, TypeScript, the animated face, interaction states, privacy controls,
  ten scenarios, and presenter controls.
- `backend/` — FastAPI event ingestion, nudge storage, and rules engine.
- `desktop-agent/` — real macOS foreground-app/window capture.
- `notifier-agent/` — native macOS notification dispatcher.
- `simulator/` — simulated phone, browser, and calendar inputs for a reliable demo.
- `frontend-monitor-app/` — Shiva's engineering dashboard for inspecting raw
  events and nudges. This is an internal debugging surface, not the product UI.
- `frontend-dashboard-app/` — Deskemon Control Center: configure routine/reminder
  nudges (interval, enabled, context-aware) against the backend's `/routines` API.
- `frontend-companion-app/assets/` — character references and Codex pet motion assets.
- `frontend-companion-app/docs/` — scenario, interaction, integration, and UI documentation.

The visual and interaction decisions in `frontend-companion-app/`, its
`CLAUDE.md`, and `docs/UI-GUIDE.md` are authoritative for the user-facing
experience. Backend and agent work connects through adapters without replacing
that interface.

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

See **`DEPLOY.md`** for full step-by-step deployment instructions
(Docker stack, native agents, ports, troubleshooting). Quick summary:

1. **Docker stack** (always required): `docker compose up -d --build`
   from the repo root. Brings up `postgres`, `backend`, `simulator`,
   `frontend-companion-app`, `frontend-monitor-app`. This alone gives you
   a fully working demo driven by fake data — no Mac-specific setup needed.
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
above running locally."

## Run it

From the repo root:

```bash
docker compose up -d --build
```

This starts six containers:
- `postgres` — the database (backend waits for it to report healthy)
- `backend` — the API + rules engine, exposed on `http://localhost:8000`
- `simulator` — starts once backend is healthy; continuously streams fake
  events and periodically triggers the rules engine, so nudges start
  appearing within about a minute
- `frontend-companion-app` — the animated Deskemon companion, exposed on
  `http://localhost:5173`
- `frontend-monitor-app` — the engineering monitoring dashboard, exposed
  on `http://localhost:5174`
- `frontend-dashboard-app` — the Control Center for configuring routine
  reminders, exposed on `http://localhost:5175`

The companion remains deliberately demo-safe: its core judge scenario is seeded
and can run even if a live integration is unavailable. The backend, simulator,
desktop capture, and notifier can be demonstrated separately as evidence that
the physical-to-digital pipeline is real.

Check the services and simulator with:

```bash
docker compose ps
docker compose logs -f simulator   # watch it stream events + nudges live
```

You should see `deskemon-postgres-1` (healthy), `deskemon-backend-1`
(healthy), `deskemon-simulator-1` (up), `deskemon-frontend-companion-app-1`
(up), `deskemon-frontend-monitor-app-1` (up), and
`deskemon-frontend-dashboard-app-1` (up), with ports `8000`, `5173`, `5174`,
and `5175` published.

## Routines (Control Center)

Open `http://localhost:5175` to enable/disable reminder-style nudges
(sedentary, hydration, meals, medicine, focus recovery), change their
interval, and toggle whether each one is suppressed during calendar
meetings ("context aware"). This reads/writes the backend's `GET/POST
/routines` and `PUT /routines/{id}` endpoints directly (Postgres-backed,
seeded with demo-fast intervals on first boot) — changes take effect on
the next rules-engine pass, no restart needed.

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

Stop the stack while retaining database data with `docker compose down`. Add
`-v` only when you intentionally want to wipe the local database.

## Run only the companion

```bash
cd frontend-companion-app
npm install
npm run dev -- --host
```

Open it in landscape. Useful routes:

| URL | Purpose |
|---|---|
| `/` | Live companion |
| `/?demo=1` | Presenter controls |
| `/#scenarios` | All ten animated scenarios |
| `/#face-lab` | Expression library |
| `/#style` | UI system |

Presenter keys: `s` runs the hero scenario, `c` jumps to the conflict,
`a`/`b` demonstrates away and return, `r` resets, and `d` hides the controls.

## Engineering monitor

The monitor at `http://localhost:5174` polls the backend every three seconds. It
shows raw events and generated nudges. Its **Fake events** toggle separates
simulator traffic (`payload.synthetic: true`) from real capture-agent traffic.

## Real desktop capture and notifications

With the Docker stack running, use separate terminals:

```bash
cd desktop-agent && uv sync && uv run python track.py
```

```bash
cd notifier-agent && uv sync && uv run python notify.py
```

These run natively because containers cannot read the active macOS window or
send normal Notification Center alerts.

## Verify the data pipeline

```bash
curl http://localhost:8000/health
curl "http://localhost:8000/events?source=phone" | python3 -m json.tool
curl http://localhost:8000/nudges | python3 -m json.tool
```

For a deterministic one-shot seed:

```bash
cd backend
uv sync
uv run python scripts/seed_demo_events.py http://localhost:8000
curl -X POST http://localhost:8000/rules/run
```

PostgreSQL is available at `localhost:5432`, database and username `deskemon`,
with the local development password `deskemon`.

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
| `GET /health` | Backend health |
| `POST /events` | Ingest an event |
| `GET /events?since=&source=` | List events |
| `GET /nudges?since=` | List generated nudges |
| `POST /rules/run` | Run the rules engine |

## Start here

Read `frontend-companion-app/HANDOFF.md` for the current build state, demo path,
architecture, and known integration boundaries. Its `PROJECT_CONTEXT.md` is the
product source of truth and `DESIGN.md` describes the wider event architecture.
