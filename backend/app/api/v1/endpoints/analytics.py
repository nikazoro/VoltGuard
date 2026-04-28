from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta

from ....db.session import get_db_session
from ....models.models import (
    Station,
    Booking,
    BookingStatus,
    StationTelemetry,
)
from ....api.dependencies.auth import get_current_user
from ....api.dependencies.roles import require_role
from ....models.models import UserRole

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get(
    "/station/{station_id}",
    dependencies=[Depends(require_role(UserRole.station_owner, UserRole.admin))]
)
async def station_analytics(
    station_id: int,
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    station = await session.get(Station, station_id)

    if not station:
        raise HTTPException(404, "Station not found")

    if (
        current_user.role == UserRole.station_owner
        and station.owner_id != current_user.id
    ):
        raise HTTPException(403, "Access denied")

    # Last 24 hours window
    since = datetime.utcnow() - timedelta(hours=24)

    # Booking counts
    booking_result = await session.execute(
        select(
            func.count(Booking.id),
            func.sum(Booking.total_cost),
        )
        .where(
            Booking.station_id == station_id,
            Booking.status == BookingStatus.completed,
            Booking.end_time >= since,
        )
    )

    booking_count, revenue = booking_result.one()

    # Fault count
    fault_result = await session.execute(
        select(func.count(StationTelemetry.id))
        .where(
            StationTelemetry.station_id == station_id,
            StationTelemetry.timestamp >= since,
            StationTelemetry.temperature > 80,
        )
    )

    fault_count = fault_result.scalar()

    return {
        "station_id": station_id,
        "last_24h": {
            "completed_bookings": booking_count or 0,
            "revenue": revenue or 0,
            "fault_events": fault_count or 0,
        },
    }


@router.get(
    "/usage",
    dependencies=[Depends(require_role(UserRole.station_owner, UserRole.admin))]
)
async def usage_analytics(
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    base_query = select(
        func.date(Booking.start_time),
        func.count(Booking.id),
    ).where(Booking.status == BookingStatus.completed)

    if current_user.role == UserRole.station_owner:
        base_query = base_query.join(
            Station, Booking.station_id == Station.id
        ).where(Station.owner_id == current_user.id)

    result = await session.execute(
        base_query.group_by(func.date(Booking.start_time))
        .order_by(func.date(Booking.start_time))
    )

    return [
        {
            "date": str(date),
            "completed_bookings": count,
        }
        for date, count in result.all()
    ]

@router.get(
    "/revenue",
    dependencies=[Depends(require_role(UserRole.station_owner, UserRole.admin))]
)
async def revenue_analytics(
    session: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    base_query = select(
        func.date(Booking.end_time),
        func.sum(Booking.total_cost),
    ).where(Booking.status == BookingStatus.completed)

    if current_user.role == UserRole.station_owner:
        base_query = base_query.join(
            Station, Booking.station_id == Station.id
        ).where(Station.owner_id == current_user.id)

    result = await session.execute(
        base_query.group_by(func.date(Booking.end_time))
        .order_by(func.date(Booking.end_time))
    )

    return [
        {
            "date": str(date),
            "revenue": revenue or 0,
        }
        for date, revenue in result.all()
    ]
