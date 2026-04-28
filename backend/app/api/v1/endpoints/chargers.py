from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from ....db.session import get_db_session
from ....models.models import StationTelemetry

router = APIRouter(prefix="/chargers", tags=["Charger Status"])

@router.get("/{charger_id}/status")
async def charger_status(
    charger_id: int = Path(..., gt=0),
    session: AsyncSession = Depends(get_db_session),
):
    """
    charger_id maps to station_id (v1 design).
    """
    result = await session.execute(
        select(StationTelemetry)
        .where(StationTelemetry.station_id == charger_id)
        .order_by(desc(StationTelemetry.timestamp))
        .limit(1)
    )

    telemetry = result.scalar_one_or_none()

    if not telemetry:
        return {
            "charger_id": charger_id,
            "status": "NO_DATA",
        }

    # Simple, deterministic rules
    if telemetry.temperature > 80:
        status = "OVERHEAT"
    elif telemetry.voltage < 180:
        status = "UNDERVOLTAGE"
    else:
        status = "NORMAL"

    return {
        "charger_id": charger_id,
        "status": status,
        "voltage": telemetry.voltage,
        "current": telemetry.current,
        "temperature": telemetry.temperature,
        "timestamp": telemetry.timestamp,
    }
