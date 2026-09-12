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


class NudgeIn(BaseModel):
    type: str
    message: str


class NudgeOut(BaseModel):
    id: int
    timestamp: str
    type: str
    message: str
    dismissed: bool


class SummaryIn(BaseModel):
    window_start: str
    window_end: str
    summary: str
    sources: list[str] = Field(default_factory=list)


class SummaryOut(BaseModel):
    id: int
    timestamp: str
    window_start: str
    window_end: str
    summary: str
    sources: list[str]


class RoutineIn(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    enabled: bool
    every: float
    unit: str  # minutes | hours | daily
    activeStart: str
    activeEnd: str
    quietStart: str
    quietEnd: str
    interruption: str  # quiet | gentle | important
    contextAware: bool


class RoutinePatch(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    enabled: Optional[bool] = None
    every: Optional[float] = None
    unit: Optional[str] = None
    activeStart: Optional[str] = None
    activeEnd: Optional[str] = None
    quietStart: Optional[str] = None
    quietEnd: Optional[str] = None
    interruption: Optional[str] = None
    contextAware: Optional[bool] = None
