import json
import os
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.environ["DATABASE_URL"]

SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    timestamp TEXT NOT NULL,
    source TEXT NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nudges (
    id SERIAL PRIMARY KEY,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    dismissed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS routine_configs (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_summaries (
    id SERIAL PRIMARY KEY,
    timestamp TEXT NOT NULL,
    window_start TEXT NOT NULL,
    window_end TEXT NOT NULL,
    summary TEXT NOT NULL,
    sources TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events (timestamp);
CREATE INDEX IF NOT EXISTS idx_events_source ON events (source);
CREATE INDEX IF NOT EXISTS idx_nudges_timestamp ON nudges (timestamp);
CREATE INDEX IF NOT EXISTS idx_nudges_type ON nudges (type);
CREATE INDEX IF NOT EXISTS idx_event_summaries_window_end ON event_summaries (window_end);
"""

# Demo-fast intervals on the routines enabled by default, consistent with
# this project's other demo-cadence overrides (see docker-compose.yml).
DEFAULT_ROUTINES = [
    {
        "id": "sedentary",
        "name": "Time to stand",
        "description": "A gentle nudge after continuous desk presence.",
        "icon": "stand",
        "enabled": True,
        "every": 2,
        "unit": "minutes",
        "activeStart": "09:00",
        "activeEnd": "18:00",
        "quietStart": "12:00",
        "quietEnd": "13:00",
        "interruption": "gentle",
        "contextAware": True,
    },
    {
        "id": "hydration",
        "name": "Hydration",
        "description": "Small reminders that are easy to ignore when busy.",
        "icon": "water",
        "enabled": True,
        "every": 2,
        "unit": "minutes",
        "activeStart": "09:00",
        "activeEnd": "20:00",
        "quietStart": "22:00",
        "quietEnd": "08:00",
        "interruption": "quiet",
        "contextAware": True,
    },
    {
        "id": "food",
        "name": "Meals",
        "description": "Notice when the day is full and a meal is being missed.",
        "icon": "food",
        "enabled": True,
        "every": 3,
        "unit": "minutes",
        "activeStart": "11:30",
        "activeEnd": "20:00",
        "quietStart": "20:00",
        "quietEnd": "11:30",
        "interruption": "gentle",
        "contextAware": True,
    },
    {
        "id": "medicine",
        "name": "Medicine",
        "description": "A persistent reminder that waits for acknowledgement.",
        "icon": "medicine",
        "enabled": False,
        "every": 4,
        "unit": "minutes",
        "activeStart": "21:00",
        "activeEnd": "21:30",
        "quietStart": "22:00",
        "quietEnd": "08:00",
        "interruption": "important",
        "contextAware": False,
    },
    {
        "id": "focus-recovery",
        "name": "Focus recovery",
        "description": "Suggest a reset after an unusually fragmented work block.",
        "icon": "focus",
        "enabled": False,
        "every": 1,
        "unit": "minutes",
        "activeStart": "09:00",
        "activeEnd": "18:00",
        "quietStart": "12:00",
        "quietEnd": "13:00",
        "interruption": "quiet",
        "contextAware": True,
    },
]


def _seed_default_routines(conn) -> None:
    count = conn.execute("SELECT COUNT(*) AS n FROM routine_configs").fetchone()["n"]
    if count > 0:
        return
    for routine in DEFAULT_ROUTINES:
        conn.execute(
            "INSERT INTO routine_configs (id, data) VALUES (%s, %s)",
            (routine["id"], json.dumps(routine)),
        )


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(SCHEMA)
        _seed_default_routines(conn)


@contextmanager
def get_conn():
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
