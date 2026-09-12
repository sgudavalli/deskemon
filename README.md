# Deskemon

Deskemon is the physical embodiment of a Codex pet: a companion that continues
beyond the computer, understands what is happening around the desk, and connects
physical-world context with digital work.

The phone prototype is the judge-facing product. Its entire display becomes the
companion's animated face; information appears only when it has something useful
to say or needs the user's approval.

## Repository map

- `app/` — **the primary Deskemon experience and visual source of truth**.
  React, TypeScript, the animated face, interaction states, privacy controls,
  ten scenarios, and presenter controls.
- `backend/` — FastAPI event ingestion, nudge storage, and rules engine.
- `desktop-agent/` — real macOS foreground-app/window capture.
- `notifier-agent/` — native macOS notification dispatcher.
- `simulator/` — simulated phone, browser, and calendar inputs for a reliable demo.
- `frontend-monitor-app/` — Shiva's engineering dashboard for inspecting raw
  events and nudges. This is an internal debugging surface, not the product UI.
- `assets/` — character references and Codex pet motion assets.
- `docs/` — scenario, interaction, integration, and UI documentation.

The visual and interaction decisions in `app/`, `CLAUDE.md`, and
`docs/UI-GUIDE.md` are authoritative for the user-facing experience. Backend and
agent work connects through adapters without replacing that interface.

## Run the full local stack

```bash
docker compose up -d --build
```

This starts:

- Deskemon companion at `http://localhost:5173`
- Engineering monitor at `http://localhost:5174`
- Backend API at `http://localhost:8000`
- PostgreSQL and the event simulator

The companion remains deliberately demo-safe: its core judge scenario is seeded
and can run even if a live integration is unavailable. The backend, simulator,
desktop capture, and notifier can be demonstrated separately as evidence that
the physical-to-digital pipeline is real.

Check the services and simulator with:

```bash
docker compose ps
docker compose logs -f simulator
```

Stop the stack while retaining database data with `docker compose down`. Add
`-v` only when you intentionally want to wipe the local database.

## Run only the companion

```bash
cd app
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

## API

| Endpoint | Description |
|---|---|
| `GET /health` | Backend health |
| `POST /events` | Ingest an event |
| `GET /events?since=&source=` | List events |
| `GET /nudges?since=` | List generated nudges |
| `POST /rules/run` | Run the rules engine |

## Start here

Read `HANDOFF.md` for the current build state, demo path, architecture, and
known integration boundaries. `PROJECT_CONTEXT.md` is the product source of
truth and `DESIGN.md` describes the wider event architecture.
