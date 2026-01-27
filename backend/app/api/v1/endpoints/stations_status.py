from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta

from ....db.session import get_db_session
from ....models.models import Station, Booking, BookingStatus, StationStatus

router = APIRouter(prefix="/stations", tags=["Station Status"])

@router.get("/{station_id}/availability")
async def station_availability(
    station_id: int = Path(..., gt=0),
    session: AsyncSession = Depends(get_db_session),
):
    station = await session.get(Station, station_id)

    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    if station.status != StationStatus.active:
        return {
            "station_id": station.id,
            "availability": "UNAVAILABLE",
            "reason": station.status,
        }

    now = datetime.utcnow()
    window_end = now + timedelta(minutes=15)

    result = await session.execute(
        select(Booking)
        .where(
            and_(
                Booking.station_id == station.id,
                Booking.status == BookingStatus.confirmed,
                Booking.start_time < window_end,
                Booking.end_time > now,
            )
        )
        .limit(1)
    )

    occupied = result.scalar_one_or_none() is not None

    return {
        "station_id": station.id,
        "availability": "OCCUPIED" if occupied else "AVAILABLE",
    }
