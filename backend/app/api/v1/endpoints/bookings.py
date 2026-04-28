from fastapi import Path, APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from sqlalchemy.engine import CursorResult

from ....db.session import get_db_session
from ....models.models import Booking, Station, BookingStatus, User
from ....schemas.booking import BookingCreate, BookingDetailRead, BookingRead
from ....api.dependencies.auth import get_current_user
from ....api.dependencies.auth import get_current_user
from ....models.models import Booking
from sqlalchemy import select, desc

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """
    Optimistic locking algorithm:
    1. Check overlapping bookings.
    2. Lock station using version compare-and-swap.
    3. Insert booking only if version update succeeds.
    """

    # 1. Overlap check (SELECT → Result[Booking])
    overlap_stmt = select(Booking).where(
        and_(
            Booking.station_id == payload.station_id,
            Booking.status == BookingStatus.confirmed,
            Booking.start_time < payload.end_time,
            Booking.end_time > payload.start_time,
        )
    )

    overlap_result = await session.execute(overlap_stmt)
    existing_booking = overlap_result.scalars().first()

    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time slot already booked",
        )

    # 2. Fetch station (SELECT → Result[Station])
    station_stmt = select(Station).where(Station.id == payload.station_id)
    station_result = await session.execute(station_stmt)
    station = station_result.scalar_one_or_none()

    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    current_version = station.version

    # 3. Atomic version update (UPDATE → CursorResult)
    update_stmt = (
        update(Station)
        .where(
            Station.id == payload.station_id,
            Station.version == current_version,
        )
        .values(version=Station.version + 1)
    )

    update_result: CursorResult = await session.execute(update_stmt)

    if update_result.rowcount == 0:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Slot already reserved by another user",
        )

    duration_hours = (
        (payload.end_time - payload.start_time).total_seconds() / 3600
    )

    cost = round(duration_hours * station.price_per_hour, 2)

    booking = Booking(
        user_id=current_user.id,
        station_id=payload.station_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        total_cost=cost,
        status=BookingStatus.confirmed,
        version=1,
    )

    session.add(booking)
    await session.commit()
    await session.refresh(booking)

    return booking

@router.get("/my", response_model=list[BookingDetailRead])
async def my_bookings(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(
        select(Booking)
        .where(Booking.user_id == current_user.id)
        .order_by(desc(Booking.start_time))
    )
    return result.scalars().all()


@router.get("/{booking_id}", response_model=BookingDetailRead)
async def get_booking(
    booking_id: int = Path(..., gt=0),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    booking = await session.get(Booking, booking_id)

    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    return booking


@router.patch("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int = Path(..., gt=0),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    booking = await session.get(Booking, booking_id)

    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.confirmed:
        raise HTTPException(
            status_code=409,
            detail="Only confirmed bookings can be cancelled",
        )

    booking.status = BookingStatus.cancelled
    await session.commit()

    return {
        "booking_id": booking.id,
        "status": "cancelled",
    }
