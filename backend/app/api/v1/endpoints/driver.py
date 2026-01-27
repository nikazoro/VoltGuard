from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, exists
from datetime import datetime, timedelta

from ....db.session import get_db_session
from ....models.models import Station, Booking, BookingStatus
from ....services.ai_singleton import ai_service
from ....api.dependencies.roles import require_role
from ....models.models import UserRole

router = APIRouter(prefix="/driver", tags=["Driver"])


@router.get(
    "/stations/map",
    dependencies=[Depends(require_role(UserRole.driver))],
)
async def driver_station_map(
    session: AsyncSession = Depends(get_db_session),
):
    now = datetime.utcnow()
    window_end = now + timedelta(minutes=15)

    stations = (await session.execute(select(Station))).scalars().all()
    response = []

    for station in stations:
        overlap = await session.execute(
            select(
                exists().where(
                    and_(
                        Booking.station_id == station.id,
                        Booking.status == BookingStatus.confirmed,
                        Booking.start_time < window_end,
                        Booking.end_time > now,
                    )
                )
            )
        )

        availability = "OCCUPIED" if overlap.scalar() else "AVAILABLE"
        ai = await ai_service.analyze_station(session, station.id)
        health = "CRITICAL" if ai["risk_level"] == "HIGH" else "OK"

        response.append(
            {
                "station_id": station.id,
                "lat": station.location_lat,
                "lng": station.location_lng,
                "availability": availability,
                "health": health,
                "price_per_hour": station.price_per_hour,
            }
        )

    return response