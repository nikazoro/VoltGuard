# from fastapi import WebSocket

# active_connections: set[WebSocket] = set()


# async def admin_alert_ws(websocket: WebSocket):
#     await websocket.accept()
#     active_connections.add(websocket)

#     try:
#         while True:
#             await websocket.receive_text()
#     except Exception:
#         pass
#     finally:
#         active_connections.discard(websocket)


# async def broadcast_admin_alert(payload: dict):
#     if not active_connections:
#         return  # ✅ CRITICAL FIX

#     dead = set()
#     for ws in active_connections:
#         try:
#             await ws.send_json(payload)
#         except Exception:
#             dead.add(ws)

#     for ws in dead:
#         active_connections.discard(ws)


from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy import select
import asyncio

from ..core.security import decode_access_token
from ..db.session import AsyncSessionLocal
from ..models.models import User, UserRole


# Active admin websocket connections
active_connections: set[WebSocket] = set()


async def admin_alert_ws(websocket: WebSocket):
    # ✅ MUST accept first
    await websocket.accept()

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        user_id = decode_access_token(token)
    except Exception:
        await websocket.close(code=1008)
        return

    # ✅ Correct DB session usage
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if (
            user is None
            or user.is_active is False
            or user.role != UserRole.admin
        ):
            await websocket.close(code=1008)
            return

    # Register admin connection
    active_connections.add(websocket)

    try:
        # Keep connection alive (broadcast-only socket)
        while True:
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        pass
    finally:
        active_connections.discard(websocket)


async def broadcast_admin_alert(payload: dict):
    if not active_connections:
        return

    dead: set[WebSocket] = set()

    for ws in active_connections:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.add(ws)

    for ws in dead:
        active_connections.discard(ws)
