from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field


class EventIn(BaseModel):
    source: str  # phone | browser | desktop | calendar
    type: str    # e.g. location, motion, tab_focus, window_focus, meeting
    payload: dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[str] = None

    def resolved_timestamp(self) -> str:
        return self.timestamp or datetime.now(timezone.utc).isoformat()


class EventOut(BaseModel):
    id: int
    timestamp: str
    source: str
    type: str
    payload: dict[str, Any]


class NudgeOut(BaseModel):
    id: int
    timestamp: str
    type: str
    message: str
    dismissed: bool
