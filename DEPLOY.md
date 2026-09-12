# Deploying Deskemon

There's nothing to deploy beyond your own machine for this project — no
cloud target, no remote server. "Deployment" here means "get the full
stack running locally." See `README.md` for a repo map and `DESIGN.md`
for architecture. This doc is just the step-by-step run instructions.

## Prerequisites

- Docker + Docker Compose
- `uv` (only needed if you also want to run the native macOS agents)
- macOS (only needed for the native agents — `desktop-agent` and
  `notifier-agent`; the Docker stack itself runs on any platform)

## Step 1 — Docker stack (always required)

From the repo root:

```bash
docker compose up -d --build
```

This brings up five containers:

| Service | Purpose | Host port |
|---|---|---|
| `postgres` | database | `5432` |
| `backend` | FastAPI ingest API + rules engine | `8000` |
| `simulator` | streams fake phone/browser/calendar events continuously | — (internal only) |
| `frontend-companion-app` | the animated companion, judge-facing product | `5173` |
| `frontend-monitor-app` | engineering dashboard for raw events/nudges | `5174` |

`backend` waits for `postgres` to report healthy; `simulator` and both
frontends wait for `backend` to report healthy. No two services share a
host port — safe to bring the whole stack up in one shot.

Verify it's up:

```bash
docker compose ps
curl http://localhost:8000/health
# {"status":"ok"}
docker compose logs -f simulator   # watch it stream events + nudges live
```

You should see all five containers listed, with `postgres` and `backend`
reporting `healthy`.

Open:
- Deskemon companion: `http://localhost:5173`
- Engineering monitor: `http://localhost:5174`
- Backend API: `http://localhost:8000`

## Step 2 — Native agents (optional, macOS only, adds real signal)

These are **not** in `docker-compose.yml` and never will be — they need
direct access to your Mac's real GUI (frontmost window, notification
center), which a container on macOS cannot see. Run them any time after
the Docker stack is up, in two separate terminals:

```bash
cd desktop-agent && uv sync && uv run python track.py
```

```bash
cd notifier-agent && uv sync && uv run python notify.py
```

`desktop-agent` polls the frontmost app/window every ~5s and posts real
`window_focus` events. `notifier-agent` polls `/nudges` and fires a native
macOS notification for each new one (it seeds itself against existing
nudge history on startup, so it won't spam notifications for nudges that
already existed before it ran). Stop either any time with `Ctrl+C`,
independently of the Docker stack.

## Stopping / resetting

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

## Troubleshooting

- **Port already in use / container fails to bind a port**: check nothing
  else on your machine is already listening on `5432`, `8000`, `5173`, or
  `5174` (`lsof -i :<port>`). `docker-compose.yml` should define exactly
  five services (`postgres`, `backend`, `simulator`,
  `frontend-companion-app`, `frontend-monitor-app`), each with a distinct
  host port — if you see duplicate or conflicting `ports:` entries after
  a merge, that's a sign of leftover merge-conflict duplication and
  should be cleaned up back to this 5-service shape.
- **`docker compose up` fails to parse the compose file**: look for
  literal `<<<<<<<` / `=======` / `>>>>>>>` markers — an unresolved git
  merge conflict.
