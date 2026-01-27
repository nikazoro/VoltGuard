import os
from fastapi import FastAPI, WebSocket
from contextlib import asynccontextmanager
from app.services.ai_singleton import ai_service
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.services.simulator import IoTSimulatorService
from app.websockets.owner import owner_telemetry_ws
from app.websockets.admin import admin_alert_ws
from app.api.v1.endpoints import (
    auth,
    bookings,
    telemetry,
    stations,
    ai,
    driver, 
    owner, 
    profile,
    stations_status, 
    chargers,
    analytics,
    admin,
    notifications,
)


# Global service instance
iot_simulator = IoTSimulatorService(AsyncSessionLocal)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan replaces deprecated startup/shutdown events.
    Ensures deterministic initialization order.
    """

    # ---- STARTUP ----

    # Load or train AI model once
    try:
        ai_service.load_model()
    except Exception:
        ai_service.train_and_save_dummy_model()

    # Start background IoT simulator
    iot_simulator.start()

    yield

    # ---- SHUTDOWN ----
    # APScheduler shuts down automatically with event loop
    # No explicit DB cleanup required (sessions are scoped per request)


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# ROUTER REGISTRATION
# -------------------------
app.include_router(auth.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1")
app.include_router(stations.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(driver.router, prefix="/api/v1")
app.include_router(owner.router, prefix="/api/v1")
app.include_router(profile.router, prefix="/api/v1")
app.include_router(stations_status.router, prefix="/api/v1")
app.include_router(chargers.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")

@app.websocket("/ws/owner/telemetry")
async def owner_ws(websocket: WebSocket):
    await owner_telemetry_ws(websocket)

@app.websocket("/ws/ping")
async def ws_ping(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("pong")


@app.websocket("/ws/admin/alerts")
async def admin_ws(websocket: WebSocket):
    await admin_alert_ws(websocket)

# -------------------------
# HEALTH CHECK
# -------------------------

@app.get("/health")
async def health_check():
    return {"status": "ok"}
