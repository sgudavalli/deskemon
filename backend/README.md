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
- `GET /health`
