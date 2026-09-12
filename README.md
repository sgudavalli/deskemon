# Deskemon

Deskemon is the physical embodiment of a Codex pet: a companion that continues
beyond the computer, understands what is happening around the desk, and connects
physical-world context with digital work.

The phone prototype is the judge-facing product. Its entire display becomes the
companion's animated face; information appears only when it has something useful
to say or needs the user's approval.

## What the combined prototype contains

- `app/` — **the primary Deskemon experience and visual source of truth**.
  React, TypeScript, the animated face, interaction states, privacy controls,
  ten scenarios, and presenter controls.
- `backend/` — FastAPI event ingestion, nudge storage, and rules engine.
- `desktop-agent/` — real macOS foreground-app/window capture.
- `notifier-agent/` — native macOS notification dispatcher.
- `simulator/` — simulated phone, browser, and calendar inputs for a reliable demo.
- `frontend/` — Shiva's engineering dashboard for inspecting raw events and
  nudges. This is an internal debugging surface, not the product UI, and Shiva
  is renaming it separately.
- `assets/` — character references and Codex pet motion assets.
- `docs/` — scenario, interaction, integration, and UI documentation.

The visual and interaction decisions in `app/`, `CLAUDE.md`, and
`docs/UI-GUIDE.md` are authoritative for the user-facing experience. Backend and
agent work should connect through adapters without replacing that interface.

## Run the full stack

From the repository root:

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

## Run the real desktop agents

With the Docker stack running, use separate terminals:

```bash
cd desktop-agent && uv sync && uv run python track.py
```

```bash
cd notifier-agent && uv sync && uv run python notify.py
```

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
