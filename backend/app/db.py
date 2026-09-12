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

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events (timestamp);
CREATE INDEX IF NOT EXISTS idx_events_source ON events (source);
CREATE INDEX IF NOT EXISTS idx_nudges_timestamp ON nudges (timestamp);
CREATE INDEX IF NOT EXISTS idx_nudges_type ON nudges (type);
"""


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(SCHEMA)


@contextmanager
def get_conn():
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
