# Deskemon Backend

Phase 1: events/nudges store (Postgres), ingest API, and rules engine. No
capture agents yet — a seed script simulates them.

## Run (Docker Compose — recommended)

From the repo root:

```bash
docker compose up -d --build
```

This starts the full stack (see root `README.md`/`DEPLOY.md` for all seven
services); the two this backend directly depends on are `postgres` (the
events/nudges store) and `backend` itself (the FastAPI ingest API + rules
engine, port 8000). The backend waits for Postgres to report healthy before
starting.

## Run (local, non-Docker)

Postgres is required — no SQLite fallback. Start just the DB via Compose,
then run the API locally against it:

```bash
docker compose up -d postgres
cd backend
uv sync
export DATABASE_URL=postgresql://deskemon:deskemon@localhost:5432/deskemon
uv run uvicorn app.main:app --reload
```

A background rules-engine loop runs every 5 minutes in either mode.

## Demo

In another terminal, with the server running:

```bash
cd backend
uv run python scripts/seed_demo_events.py
curl -X POST localhost:8000/rules/run
curl localhost:8000/nudges
```

Expected: a `sedentary` nudge. Hydration/food/meal reminders are
intentionally suppressed in this seed scenario because it includes an
in-progress calendar meeting — this demonstrates meeting-aware suppression
(the `contextAware` flag on those routines). Remove the calendar event from
the seed script, or wait long enough, to see reminder nudges fire instead.

## API

- `POST /events` — `{source, type, payload, timestamp?}`
- `GET /events?since=&source=`
- `GET /nudges?since=`
- `POST /nudges` — `{type, message}`, create a nudge directly (used by
  `digest-agent`; the rules engine still creates its own internally)
- `POST /rules/run` — run one rules-engine pass on demand
- `GET /routines` / `POST /routines` / `PUT /routines/{id}` — configure
  reminder routines (interval, enabled, interruption, context-aware); see
  below
- `GET /summaries?since=` / `POST /summaries` — 5-minute event summaries
  written by `digest-agent`, see below
- `POST /webhooks/sensor-logger` — real phone webhook, see below
- `GET /health`

## Routine configuration (Control Center)

The five reminder-style nudges (sedentary, hydration, meals, medicine,
focus recovery) are pure interval timers driven entirely by rows in the
`routine_configs` table — no event capture involved. They're seeded with
demo-fast intervals on first boot (`app/db.py`'s `DEFAULT_ROUTINES`) and
are configurable at runtime via the API or the
`frontend-dashboard-app` Control Center UI (`http://localhost:5175`):

- `enabled` — pauses/resumes the routine
- `every` / `unit` (`minutes`/`hours`/`daily`) — the reminder interval
- `contextAware` — when true, suppresses the nudge while a calendar
  meeting is in progress (reuses the same meeting-detection logic as
  before)

`app/rules_engine.py`'s `check_routines` reads this table once per
scheduler pass; there are no more `SEDENTARY_WINDOW_MIN` /
`REMINDER_*_INTERVAL_MIN` env vars — those are gone, replaced by this
config. Active/quiet-hour time windows are stored (for UI parity) but not
yet enforced — interval + enabled + context-aware only, for now.

## Real phone signal (Sensor Logger app)

The [Sensor Logger](https://www.tszheichoi.com/sensorlogger) app (iOS/Android)
can push real GPS/accelerometer/microphone data straight into this backend,
replacing the simulator's fake `phone` events. `POST /webhooks/sensor-logger`
accepts Sensor Logger's native HTTP Push JSON and maps it into our normal
`location`/`motion`/`audio_level` event schema (`app/routes_sensor_logger.py`).

Note: Sensor Logger's HTTP Push does **not** stream camera/vision data at
all (only numeric/metadata sensors) — a "vision" event source isn't
possible via this app.

Setup, phone and Mac on the same Wi-Fi:

1. In Sensor Logger: Settings → HTTP Push.
2. URL: `http://<your-Mac-LAN-IP>:8000/webhooks/sensor-logger` — find your
   Mac's LAN IP with `ipconfig getifaddr en0`.
3. Push interval: a few seconds.
4. Enable the **Location**, **Accelerometer**, and **Microphone** sensors.
5. Start recording. Real events show up in `GET /events?source=phone` and
   in the monitor dashboard with the "Fake events" toggle set to **No**
   (real events never carry the `synthetic` payload key).

Motion is derived from raw accelerometer magnitude vs. gravity; the
sensitivity is `SENSOR_LOGGER_MOTION_THRESHOLD_MS2` (default `1.5` m/s²,
set in `docker-compose.yml`).

`audio_level` events carry `{"dbfs": <float>}` — the average loudness
(dBFS) across the microphone samples in that push batch, one event per
webhook call (same downsampling approach as `motion`). This is a raw
sound-level reading only; Sensor Logger does not transmit actual audio
content over HTTP Push.

## Hourly ingest (digest agent)

`digest-agent` (its own container, `../digest-agent/`) is the only
LLM-calling piece of this project. It never touches Postgres directly —
only these two endpoints:
- `POST /summaries` — a 5-minute synthesis of recent events, written to the
  `event_summaries` table.
- `POST /nudges` — the final hourly narrative, `type: "digest"`, once an
  hour's worth of summaries have accumulated.

See `../digest-agent/README.md` for how it works and its env vars
(`ANTHROPIC_API_KEY` required).
