import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Query

from .db import get_conn
from .models import SummaryIn, SummaryOut

router = APIRouter()


@router.post("/summaries", response_model=SummaryOut)
def create_summary(summary: SummaryIn):
    timestamp = datetime.now(timezone.utc).isoformat()
    sources_json = json.dumps(summary.sources)
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO event_summaries (timestamp, window_start, window_end, summary, sources) "
            "VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (timestamp, summary.window_start, summary.window_end, summary.summary, sources_json),
        )
        summary_id = cur.fetchone()["id"]
    return SummaryOut(
        id=summary_id,
        timestamp=timestamp,
        window_start=summary.window_start,
        window_end=summary.window_end,
        summary=summary.summary,
        sources=summary.sources,
    )


@router.get("/summaries", response_model=list[SummaryOut])
def list_summaries(since: Optional[str] = Query(default=None)):
    query = "SELECT * FROM event_summaries WHERE 1=1"
    params: list[str] = []
    if since:
        query += " AND window_end >= %s"
        params.append(since)
    query += " ORDER BY window_end ASC"

    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()

    return [
        SummaryOut(
            id=row["id"],
            timestamp=row["timestamp"],
            window_start=row["window_start"],
            window_end=row["window_end"],
            summary=row["summary"],
            sources=json.loads(row["sources"]),
        )
        for row in rows
    ]
