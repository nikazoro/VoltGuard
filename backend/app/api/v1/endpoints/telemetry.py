from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from ....db.session import get_db_session
from ....models.models import Station, StationTelemetry
from ....api.dependencies.auth import get_current_user
from ....api.dependencies.roles import require_role
from ....models.models import UserRole

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.get(
    "/station/{station_id}",
    dependencies=[Depends(require_role(UserRole.station_owner))]
)
async def get_station_telemetry(
    station_id: int,
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    station = await session.get(Station, station_id)

    if not station or station.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await session.execute(
        select(StationTelemetry)
        .where(StationTelemetry.station_id == station_id)
        .order_by(desc(StationTelemetry.timestamp))
        .limit(100)
    )

    return result.scalars().all()
