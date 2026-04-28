from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ....db.session import get_db_session
from ....services.ai_singleton import ai_service
from ....models.models import Station
from ....api.dependencies.auth import get_current_user
from ....api.dependencies.roles import require_role
from ....models.models import UserRole

router = APIRouter(prefix="/ai", tags=["AI"])

@router.get(
    "/station/{station_id}",
    dependencies=[Depends(require_role(UserRole.station_owner))]
)
async def analyze_station(
    station_id: int,
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    station = await session.get(Station, station_id)

    if not station or station.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await ai_service.analyze_station(session, station_id)

    return {
        **result,
        "alert": result["risk_level"] == "HIGH"
    }
