# Deskemon — Project Notes for Claude

Hackathon project converging physical-world context (location, motion)
with digital-world context (browser activity, active app, calendar) to
detect wellbeing patterns and nudge the user. Full architecture, decisions,
and build order live in `DESIGN.md` — read that first for the "why".

## Current state (as of this writing)

All Phase 1 backend foundation + first real agent pair are built and
verified working end-to-end:

- **Dockerized** (`docker compose up -d --build` from repo root):
  `postgres`, `backend` (FastAPI ingest API + rules engine), `simulator`
  (fake phone/browser/calendar events, drives the rules engine
  continuously), `frontend-monitor-app` (React/Vite monitoring dashboard on `:5173`)
- **Native, host-run** (macOS only, not containerized — need real
  desktop/GUI access): `desktop-agent/` (real window-focus capture) and
  `notifier-agent/` (real OS notification dispatch). Run manually with
  `uv run python track.py` / `uv run python notify.py` in separate
  terminals, alongside the Docker stack.

Not yet built: real browser extension (A2), real calendar sync (A3), real
mobile/Sensor Logger wiring (A5) — all still simulated by `simulator/`.
See `DESIGN.md`'s Components/Agents tables and build order for what's
built (✅) vs. simulated.

## Conventions established in this project

- **Package manager**: `uv`, not pip/venv. Every Python service
  (`backend/`, `simulator/`, `desktop-agent/`, `notifier-agent/`) has its
  own `pyproject.toml` + `uv.lock`. Run things with `uv sync` / `uv run`.
- **One agent, one responsibility** — this was explicitly requested and
  applied repeatedly: capture and dispatch are always separate processes
  (`desktop-agent` vs `notifier-agent`), the simulator is its own
  container (not folded into backend), Postgres is its own container (not
  SQLite embedded in the backend). Don't combine concerns when adding new
  agents — split them instead.
- **Components vs. Agents** — strict distinction, see `DESIGN.md`. A
  component (table, API endpoint) is passive infrastructure; an agent is
  a running process that does something on a schedule or in response to
  events. Keep this vocabulary when discussing architecture.
- **Real vs. fake events** — every event payload the simulator/seed script
  posts is tagged `"synthetic": true`. Real agent events never carry that
  key. The frontend's "Fake events" toggle filters on this — if adding a
  new fake/simulated source, tag it the same way.
- **Stress proxy honesty** — the `cognitive_load_experimental` nudge is a
  synthetic proxy (tab-switch rate + meeting density), never presented as
  real physiological stress detection. Keep the "(experimental)" prefix
  and this framing if touched.
- **No LLM calls anywhere in this project** — confirmed early on the
  rules engine is pure deterministic threshold/interval logic. Don't
  introduce an LLM call without discussing it first; it wasn't needed for
  the MVP.
- **Demo-fast thresholds**: `docker-compose.yml` overrides the rules
  engine's real-world thresholds (30min sedentary, etc.) down to
  minutes/seconds via env vars, purely so demos don't require waiting.
  See `backend/app/rules_engine.py` for the env var names and real
  defaults.

## Where things are documented

- `DESIGN.md` — architecture, components/agents tables, decisions log,
  Mermaid diagram, build priority order
- Root `README.md` — how to run everything (Docker stack + native agents),
  end-to-end test walkthrough, API reference
- Each service directory has its own `README.md` with just that service's
  run instructions

## Gotchas hit before (don't reintroduce)

- Sedentary-check bug: comparing a `location` event's lat/lon against the
  *previous* event's payload even when that previous event was a `motion`
  reading (no lat/lon) caused false "movement detected". Fixed in
  `backend/app/rules_engine.py`'s `check_sedentary` — only compare
  consecutive `location` payloads to each other.
- Notifier-agent startup storm: on first run it originally treated ALL
  pre-existing nudges as "new" and fired a notification for every one.
  Fixed by seeding the seen-set from the first fetch silently before
  entering the notify loop (`notifier-agent/notify.py`).
- `python3.14`'s venv/`ensurepip` was broken on this machine; use
  `python3.12` (or `uv`, which sidesteps this entirely — another reason
  `uv` was adopted).
- Docker port publishing: a service needs an explicit `ports:` mapping in
  `docker-compose.yml` to be reachable from the host (Postgres wasn't
  published until asked for — added `5432:5432` for DBeaver access).
