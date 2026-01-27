from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, exists

from ....db.session import get_db_session
from ....models.models import Station
from ....models.models import Booking
from ....models.models import BookingStatus, StationStatus, UserRole
from ....api.dependencies.roles import require_role
from ....services.ai_singleton import ai_service 

router = APIRouter(prefix="/driver", tags=["Driver"])


@router.get(
    "/stations/map",
    dependencies=[Depends(require_role(UserRole.driver))],
)
async def driver_station_map(
    user_lat: float = Query(..., description="Driver latitude"),
    user_lng: float = Query(..., description="Driver longitude"),
    radius_km: float = Query(50.0, gt=0),
    session: AsyncSession = Depends(get_db_session),
):
    """
    Driver map view:
    - Spatially filtered & distance-sorted stations (DB-side)
    - Availability window (15 min)
    - AI health status
    """

    now = datetime.utcnow()
    window_end = now + timedelta(minutes=15)

    # Spatial distance (meters)
    user_point = func.ST_SRID(func.POINT(user_lng, user_lat), 4326)
    distance_m = func.ST_Distance_Sphere(Station.location, user_point)

    # Fetch nearby active stations
    stmt = (
        select(
            Station,
            (distance_m / 1000).label("distance_km"),
        )
        .where(Station.status == StationStatus.active)
        .where(distance_m <= radius_km * 1000)
        .order_by(distance_m.asc())
    )

    rows = (await session.execute(stmt)).all()

    response = []

    for station, distance_km in rows:
        # Availability check
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

        ai_result = await ai_service.analyze_station(session, station.id)
        health = "CRITICAL" if ai_result["risk_level"] == "HIGH" else "OK"

        response.append(
            {
                "station_id": station.id,
                "lat": station.location_lat,
                "lng": station.location_lng,
                "distance_km": round(distance_km, 2),
                "availability": availability,
                "health": health,
                "price_per_hour": station.price_per_hour,
            }
        )

    return response
