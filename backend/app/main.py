from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routes_events import router as events_router
from .routes_nudges import router as nudges_router
from .routes_routines import router as routines_router
from .routes_sensor_logger import router as sensor_logger_router
from .rules_engine import start_scheduler

app = FastAPI(title="Deskemon Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)
app.include_router(nudges_router)
app.include_router(routines_router)
app.include_router(sensor_logger_router)


@app.on_event("startup")
def on_startup():
    init_db()
    start_scheduler()


@app.get("/health")
def health():
    return {"status": "ok"}
