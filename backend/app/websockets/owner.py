from fastapi import WebSocket

active_connections: set[WebSocket] = set()


async def owner_telemetry_ws(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)

    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        active_connections.discard(websocket)


async def broadcast_owner_telemetry(payload: dict):
    if not active_connections:
        return  # ✅ CRITICAL FIX

    dead = set()
    for ws in active_connections:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.add(ws)

    for ws in dead:
        active_connections.discard(ws)
