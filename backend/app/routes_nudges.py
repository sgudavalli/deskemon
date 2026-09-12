from typing import Optional

from fastapi import APIRouter, Query

from .db import get_conn
from .models import NudgeOut
from .rules_engine import run_once

router = APIRouter()


@router.get("/nudges", response_model=list[NudgeOut])
def list_nudges(since: Optional[str] = Query(default=None)):
    query = "SELECT * FROM nudges WHERE 1=1"
    params: list[str] = []
    if since:
        query += " AND timestamp >= %s"
        params.append(since)
    query += " ORDER BY timestamp ASC"

    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()

    return [
        NudgeOut(
            id=row["id"],
            timestamp=row["timestamp"],
            type=row["type"],
            message=row["message"],
            dismissed=bool(row["dismissed"]),
        )
        for row in rows
    ]


@router.post("/rules/run")
def trigger_rules_run():
    created = run_once()
    return {"created_nudges": created}
