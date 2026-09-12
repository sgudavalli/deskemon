import json
import math
import os
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from .db import get_conn

router = APIRouter()

MOTION_THRESHOLD_MS2 = float(os.environ.get("SENSOR_LOGGER_MOTION_THRESHOLD_MS2", "1.5"))
GRAVITY_MS2 = 9.81


def _ns_to_iso(time_ns: int) -> str:
    return datetime.fromtimestamp(time_ns / 1e9, tz=timezone.utc).isoformat()


def _insert_event(timestamp: str, source: str, type_: str, payload: dict[str, Any]) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO events (timestamp, source, type, payload) VALUES (%s, %s, %s, %s)",
            (timestamp, source, type_, json.dumps(payload)),
        )


@router.post("/webhooks/sensor-logger")
def sensor_logger_webhook(body: dict[str, Any]):
    readings = body.get("payload", [])

    locations = [r for r in readings if r.get("name") == "location"]
    if locations:
        latest = max(locations, key=lambda r: r["time"])
        values = latest["values"]
        _insert_event(
            _ns_to_iso(latest["time"]),
            "phone",
            "location",
            {"lat": values["latitude"], "lon": values["longitude"]},
        )

    accel_readings = [r for r in readings if r.get("name") == "accelerometer"]
    if accel_readings:
        moving = any(
            abs(
                math.sqrt(r["values"]["x"] ** 2 + r["values"]["y"] ** 2 + r["values"]["z"] ** 2)
                - GRAVITY_MS2
            )
            > MOTION_THRESHOLD_MS2
            for r in accel_readings
        )
        latest_time = max(r["time"] for r in accel_readings)
        _insert_event(
            _ns_to_iso(latest_time),
            "phone",
            "motion",
            {"moving": moving},
        )

    mic_readings = [r for r in readings if r.get("name") == "microphone"]
    if mic_readings:
        avg_dbfs = sum(r["values"]["dBFS"] for r in mic_readings) / len(mic_readings)
        latest_time = max(r["time"] for r in mic_readings)
        _insert_event(
            _ns_to_iso(latest_time),
            "phone",
            "audio_level",
            {"dbfs": avg_dbfs},
        )

    return {"status": "ok"}
