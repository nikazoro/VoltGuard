from fastapi import Path,APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ....db.session import get_db_session
from ....models.models import Station
from ....api.dependencies.auth import get_current_user
from ....api.dependencies.roles import require_role
from ....models.models import UserRole

router = APIRouter(prefix="/owner", tags=["Owner"])


@router.get(
    "/stations",
    dependencies=[Depends(require_role(UserRole.station_owner))]
)
async def owner_stations(
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    result = await session.execute(
        select(Station).where(Station.owner_id == current_user.id)
    )
    return result.scalars().all()

@router.get(
    "/stations/{station_id}",
    dependencies=[Depends(require_role(UserRole.station_owner))],
)
async def owner_station_detail(
    station_id: int = Path(..., gt=0),
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    station = await session.get(Station, station_id)
    if not station or station.owner_id != current_user.id:
        raise HTTPException(404, "Station not found")
    return station

from fastapi import Body


@router.patch(
    "/stations/{station_id}/pricing",
    dependencies=[Depends(require_role(UserRole.station_owner))],
)
async def update_station_pricing(
    station_id: int = Path(..., gt=0),
    price_per_hour: float = Body(..., gt=0),
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    station = await session.get(Station, station_id)
    if not station or station.owner_id != current_user.id:
        raise HTTPException(403, "Access denied")

    station.price_per_hour = price_per_hour
    await session.commit()

    return {"station_id": station.id, "price_per_hour": station.price_per_hour}

from sqlalchemy import func
from ....models.models import Booking, BookingStatus


# @router.get(
#     "/revenue",
#     dependencies=[Depends(require_role(UserRole.station_owner))],
# )
# async def owner_revenue(
#     session: AsyncSession = Depends(get_db_session),
#     current_user=Depends(get_current_user),
# ):
#     result = await session.execute(
#         select(func.sum(Booking.total_cost))
#         .join(Station)
#         .where(
#             Station.owner_id == current_user.id,
#             Booking.status == BookingStatus.completed,
#         )
#     )

#     return {"total_revenue": result.scalar() or 0}
@router.get(
    "/revenue",
    dependencies=[Depends(require_role(UserRole.station_owner))]
)
async def owner_revenue(
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    result = await session.execute(
        select(
            func.sum(Booking.total_cost),
            func.count(Booking.id),
        )
        .join(Station)
        .where(
            Station.owner_id == current_user.id,
            Booking.status == BookingStatus.completed,
        )
    )

    total_revenue, completed_count = result.one()

    active = await session.execute(
        select(func.count(Booking.id))
        .join(Station)
        .where(
            Station.owner_id == current_user.id,
            Booking.status == BookingStatus.confirmed,
        )
    )

    return {
        "total": float(total_revenue or 0),
        "this_week": float(total_revenue or 0),  # placeholder
        "growth_percentage": None,
        "period": "All time",
        "completed_bookings": completed_count or 0,
        "active_bookings": active.scalar(),
    }



@router.get(
    "/revenue/breakdown",
    dependencies=[Depends(require_role(UserRole.station_owner))],
)
async def owner_revenue_breakdown(
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    result = await session.execute(
        select(
            func.date(Booking.end_time),
            func.sum(Booking.total_cost),
        )
        .join(Station)
        .where(
            Station.owner_id == current_user.id,
            Booking.status == BookingStatus.completed,
        )
        .group_by(func.date(Booking.end_time))
        .order_by(func.date(Booking.end_time))
    )

    return [
        {"date": str(date), "revenue": revenue}
        for date, revenue in result.all()
    ]
