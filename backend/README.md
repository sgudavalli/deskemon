# Deskemon Backend

Phase 1: events/nudges store (Postgres), ingest API, and rules engine. No
capture agents yet — a seed script simulates them.

## Run (Docker Compose — recommended)

From the repo root:

```bash
docker compose up -d --build
```

This starts two containers: `postgres` (the events/nudges store) and
`backend` (the FastAPI ingest API + rules engine, port 8000). The backend
waits for Postgres to report healthy before starting.

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

Expected: a `sedentary` nudge and a `cognitive_load_experimental` nudge.
Hydration/food/medicine reminders are intentionally suppressed in this seed
scenario because it includes an in-progress calendar meeting — this
demonstrates meeting-aware suppression. Remove the calendar event from the
seed script, or wait long enough, to see reminder nudges fire instead.

## API

- `POST /events` — `{source, type, payload, timestamp?}`
- `GET /events?since=&source=`
- `GET /nudges?since=`
- `POST /rules/run` — run one rules-engine pass on demand
- `POST /webhooks/sensor-logger` — real phone webhook, see below
- `GET /health`

## Real phone signal (Sensor Logger app)

The [Sensor Logger](https://www.tszheichoi.com/sensorlogger) app (iOS/Android)
can push real GPS/accelerometer data straight into this backend, replacing
the simulator's fake `phone` events. `POST /webhooks/sensor-logger` accepts
Sensor Logger's native HTTP Push JSON and maps it into our normal
`location`/`motion` event schema (`app/routes_sensor_logger.py`).

Setup, phone and Mac on the same Wi-Fi:

1. In Sensor Logger: Settings → HTTP Push.
2. URL: `http://<your-Mac-LAN-IP>:8000/webhooks/sensor-logger` — find your
   Mac's LAN IP with `ipconfig getifaddr en0`.
3. Push interval: a few seconds.
4. Enable the **Location** and **Accelerometer** sensors.
5. Start recording. Real events show up in `GET /events?source=phone` and
   in the monitor dashboard with the "Fake events" toggle set to **No**
   (real events never carry the `synthetic` payload key).

Motion is derived from raw accelerometer magnitude vs. gravity; the
sensitivity is `SENSOR_LOGGER_MOTION_THRESHOLD_MS2` (default `1.5` m/s²,
set in `docker-compose.yml`).
