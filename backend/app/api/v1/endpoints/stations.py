from fastapi import Path,APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ....db.session import get_db_session
from ....models.models import Station
from ....schemas.station import StationCreate, StationRead
from ....api.dependencies.auth import get_current_user
from ....api.dependencies.roles import require_role
from ....models.models import UserRole

router = APIRouter(prefix="/stations", tags=["Stations"])


@router.post(
    "/",
    response_model=StationRead,
    dependencies=[Depends(require_role(UserRole.admin, UserRole.station_owner))],
)
async def create_station(
    payload: StationCreate,
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    station = Station(
        owner_id=current_user.id,
        name=payload.name,
        location_lat=payload.location_lat,
        location_lng=payload.location_lng,
        status=payload.status,
        price_per_hour=payload.price_per_hour,
    )

    session.add(station)
    await session.commit()
    await session.refresh(station)
    return station


@router.get("/", response_model=list[StationRead])
async def list_stations(
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(select(Station))
    return result.scalars().all()

@router.patch(
    "/{station_id}/pricing",
    dependencies=[Depends(require_role(UserRole.station_owner))],
)
async def update_station_pricing(
    station_id: int,
    price_per_hour: float,
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    station = await session.get(Station, station_id)

    if not station or station.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    station.price_per_hour = price_per_hour
    await session.commit()

    return {"status": "pricing updated"}

@router.get("/{station_id}")
async def get_station(
    station_id: int = Path(..., gt=0),
    session: AsyncSession = Depends(get_db_session),
):
    station = await session.get(Station, station_id)
    if not station:
        raise HTTPException(404, "Station not found")
    return station
