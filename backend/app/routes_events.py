import json
from typing import Optional

from fastapi import APIRouter, Query

from .db import get_conn
from .models import EventIn, EventOut

router = APIRouter()


@router.post("/events", response_model=EventOut)
def create_event(event: EventIn):
    timestamp = event.resolved_timestamp()
    payload_json = json.dumps(event.payload)
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO events (timestamp, source, type, payload) VALUES (%s, %s, %s, %s) RETURNING id",
            (timestamp, event.source, event.type, payload_json),
        )
        event_id = cur.fetchone()["id"]
    return EventOut(
        id=event_id,
        timestamp=timestamp,
        source=event.source,
        type=event.type,
        payload=event.payload,
    )


@router.get("/events", response_model=list[EventOut])
def list_events(
    since: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
):
    query = "SELECT * FROM events WHERE 1=1"
    params: list[str] = []
    if since:
        query += " AND timestamp >= %s"
        params.append(since)
    if source:
        query += " AND source = %s"
        params.append(source)
    query += " ORDER BY timestamp ASC"

    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()

    return [
        EventOut(
            id=row["id"],
            timestamp=row["timestamp"],
            source=row["source"],
            type=row["type"],
            payload=json.loads(row["payload"]),
        )
        for row in rows
    ]
