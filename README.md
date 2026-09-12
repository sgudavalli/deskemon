# Deskemon

Converges physical-world context (location, motion) with digital-world
context (browser activity, active app, calendar) to detect wellbeing
patterns and nudge the user — sedentary time, an experimental
cognitive-load/stress proxy, and hydration/food/medicine reminders.

See `DESIGN.md` for the full architecture (components vs. agents, data
model, build order).

Currently built: the backend foundation (events/nudges store, ingest API,
rules engine) — Phase 1 per `DESIGN.md`. No real capture agents yet; a
standalone simulator continuously streams fake phone/browser/calendar
events so the rules engine can be exercised end-to-end in near real time.

## Stack

- `backend/` — FastAPI ingest API + rules engine (Python)
- `postgres` — events/nudges store, its own container
- `simulator/` — standalone fake capture-agent service; continuously
  streams phone/browser/calendar events and triggers the rules engine,
  simulating real agents until they're built (a separate concern from the
  backend, its own minimal dependencies)
- `docker-compose.yml` — runs all three together

## Run it

From the repo root:

```bash
docker compose up -d --build
```

This starts three containers:
- `postgres` — the database (backend waits for it to report healthy)
- `backend` — the API + rules engine, exposed on `http://localhost:8000`
- `simulator` — starts once backend is healthy; continuously streams fake
  events and periodically triggers the rules engine, so nudges start
  appearing within about a minute

Check all three are up:

```bash
docker compose ps
docker compose logs -f simulator   # watch it stream events + nudges live
```

You should see `deskemon-postgres-1` (healthy), `deskemon-backend-1`
(healthy), and `deskemon-simulator-1` (up), with port `8000` published.

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

## API reference

| Endpoint | Description |
|---|---|
| `GET /health` | liveness check |
| `POST /events` | ingest one event: `{source, type, payload, timestamp?}` |
| `GET /events?since=&source=` | list stored events, optionally filtered |
| `GET /nudges?since=` | list generated nudges |
| `POST /rules/run` | run one rules-engine pass on demand |
