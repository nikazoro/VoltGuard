from fastapi import APIRouter, Depends, HTTPException, Path, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ....db.session import get_db_session
from ....models.models import Station
from ....models.models import User
from ....models.models import StationStatus, UserRole
from ....api.dependencies.auth import get_current_user
from ....api.dependencies.roles import require_role
from ....services.ai_singleton import ai_service

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get(
    "/stations",
    dependencies=[Depends(require_role(UserRole.admin))],
)
async def admin_list_stations(
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(select(Station))
    return result.scalars().all()


@router.patch(
    "/stations/{station_id}/status",
    dependencies=[Depends(require_role(UserRole.admin))],
)
async def admin_update_station_status(
    station_id: int = Path(..., gt=0),
    new_status: StationStatus = Body(...),
    session: AsyncSession = Depends(get_db_session),
):
    station = await session.get(Station, station_id)

    if station is None:
        raise HTTPException(404, "Station not found")

    station.status = new_status
    await session.commit()

    return {
        "station_id": station.id,
        "status": station.status,
    }


@router.get(
    "/faults/critical",
    dependencies=[Depends(require_role(UserRole.admin))],
)
async def admin_critical_faults(
    session: AsyncSession = Depends(get_db_session),
):
    stations = (await session.execute(select(Station))).scalars().all()
    critical = []

    for station in stations:
        result = await ai_service.analyze_station(session, station.id)
        if result["risk_level"] == "HIGH":
            critical.append(
                {
                    "station_id": station.id,
                    "health_score": result["health_score"],
                    "anomalies": result["anomalies_detected"],
                }
            )

    return critical


@router.patch(
    "/users/{user_id}/disable",
    dependencies=[Depends(require_role(UserRole.admin))],
)
async def admin_disable_user(
    user_id: int = Path(..., gt=0),
    session: AsyncSession = Depends(get_db_session),
):
    user = await session.get(User, user_id)

    if user is None:
        raise HTTPException(404, "User not found")

    user.is_active = False
    await session.commit()

    return {"user_id": user.id, "status": "disabled"}


@router.patch(
    "/users/{user_id}/enable",
    dependencies=[Depends(require_role(UserRole.admin))],
)
async def admin_enable_user(
    user_id: int = Path(..., gt=0),
    session: AsyncSession = Depends(get_db_session),
):
    user = await session.get(User, user_id)

    if user is None:
        raise HTTPException(404, "User not found")

    user.is_active = True
    await session.commit()

    return {"user_id": user.id, "status": "enabled"}
