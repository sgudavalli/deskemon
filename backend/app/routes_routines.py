import json

from fastapi import APIRouter, HTTPException

from .db import get_conn
from .models import RoutineIn, RoutinePatch

router = APIRouter()


@router.get("/routines")
def list_routines():
    with get_conn() as conn:
        rows = conn.execute("SELECT data FROM routine_configs").fetchall()
    return [json.loads(row["data"]) for row in rows]


@router.post("/routines")
def create_routine(routine: RoutineIn):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO routine_configs (id, data) VALUES (%s, %s)",
            (routine.id, routine.model_dump_json()),
        )
    return routine


@router.put("/routines/{routine_id}")
def update_routine(routine_id: str, patch: RoutinePatch):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT data FROM routine_configs WHERE id = %s", (routine_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="routine not found")

        current = json.loads(row["data"])
        current.update(patch.model_dump(exclude_none=True))

        conn.execute(
            "UPDATE routine_configs SET data = %s WHERE id = %s",
            (json.dumps(current), routine_id),
        )
    return current
