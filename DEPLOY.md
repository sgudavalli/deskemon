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

## Step 3 — Real phone signal via Sensor Logger (optional, adds real GPS/motion)

The Docker stack's `simulator` fakes `phone` events (location/motion) by
default. To replace that with real data from your phone, the backend
exposes `POST /webhooks/sensor-logger` (no extra port — rides on the
existing `8000`), which accepts the [Sensor Logger](https://www.tszheichoi.com/sensorlogger)
app's HTTP Push payload and maps it into the same `location`/`motion`
event schema the rules engine already reads.

This only requires action on your phone — see **`USER.md`** for the
exact steps (find your Mac's LAN IP, configure the app, start recording).
Nothing else in the Docker stack needs to change; the webhook is already
live once `backend` is up.

Once configured, verify real events are arriving:

```bash
curl "http://localhost:8000/events?source=phone" | python3 -m json.tool
```

Real events never carry a `synthetic` key (fake/simulator events always
do) — that's also what the monitor dashboard's "Fake events" toggle
filters on. Set it to **No** at `http://localhost:5174` to see only real
phone traffic.

Motion sensitivity is tunable via `SENSOR_LOGGER_MOTION_THRESHOLD_MS2` in
`docker-compose.yml` (default `1.5` m/s² deviation from gravity).

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
- **Sensor Logger events never show up**: confirm your phone and Mac are
  on the *same* Wi-Fi network (not a guest/isolated network — some
  routers block device-to-device traffic on guest SSIDs), that the URL in
  the app matches your Mac's *current* LAN IP (it can change between
  sessions — re-run `ipconfig getifaddr en0`), and that no firewall on
  the Mac is blocking inbound connections to port `8000`. See `USER.md`
  for the phone-side checklist.
