# USER.md — what to do on your phone

This is the only part of Deskemon that needs manual setup on a physical
device. Everything else (backend, dashboards, native Mac agents) is
covered in `DEPLOY.md`. This doc assumes the Docker stack from `DEPLOY.md`
Step 1 is already running on your Mac.

## What this does

Your phone streams real GPS location and motion data straight into
Deskemon, replacing the simulator's fake `phone` events. No app install
or code on your side beyond the steps below — Deskemon uses the existing
third-party **Sensor Logger** app rather than a custom mobile app.

## Prerequisites

- Your phone and your Mac must be on the **same Wi-Fi network**. A guest
  network that isolates devices from each other will not work.
- The **Sensor Logger** app installed on your phone:
  - iOS: [App Store](https://apps.apple.com/app/sensor-logger/id1531582925)
  - Android: [Play Store](https://play.google.com/store/apps/details?id=com.tszheichoi.sensorlogger)

## Setup steps

1. **Find your Mac's LAN IP.** On the Mac, in a terminal:
   ```bash
   ipconfig getifaddr en0
   ```
   This changes between Wi-Fi sessions, so re-check it if the connection
   ever stops working.

2. **Open Sensor Logger → Settings → HTTP Push** (called "Streaming" or
   "HTTP Push" depending on app version).

3. **Set the push URL** to:
   ```
   http://<your-Mac-LAN-IP>:8000/webhooks/sensor-logger
   ```
   Example: `http://172.17.2.53:8000/webhooks/sensor-logger`

4. **Set the push interval** to a few seconds (e.g. 3–5s) — frequent
   enough to see live movement in the dashboard without flooding the
   backend.

5. **Enable these two sensors** (leave everything else off — Deskemon
   only reads these):
   - **Location**
   - **Accelerometer**

6. **Start recording** in the app.

## Confirm it's working

On the Mac:

```bash
curl "http://localhost:8000/events?source=phone" | python3 -m json.tool
```

You should see new `location` and `motion` events appended without a
`synthetic` key (fake/simulated events always carry `"synthetic": true`;
real events from your phone never do).

Or watch it live in the browser: open the monitoring dashboard at
`http://localhost:5174`, set the **"Fake events"** toggle to **No**, and
walk around — you should see new events streaming in every push interval.

## Stopping

Just stop recording in the Sensor Logger app, or close it. Nothing on
the Mac needs to change — the backend simply stops receiving new phone
events and the rest of the stack keeps running on whatever fake/other
real signals are still active.

## Troubleshooting

- **No events arriving**: re-check the push URL's IP — it may have
  changed if you reconnected to Wi-Fi. Re-run `ipconfig getifaddr en0` on
  the Mac and update the URL in the app.
- **App shows push errors**: confirm the Mac's Docker stack is running
  (`docker compose ps` should show `backend` healthy) and that both
  devices are truly on the same network, not a guest/isolated SSID.
- **Events arrive but `moving` never flips to `true`**: the motion
  threshold (`SENSOR_LOGGER_MOTION_THRESHOLD_MS2` in `docker-compose.yml`,
  default `1.5` m/s²) may be too high for how you're carrying the phone —
  ask whoever's running the backend to lower it.
