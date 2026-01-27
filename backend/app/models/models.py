import enum
from datetime import datetime
from typing import List

from sqlalchemy import (
    Boolean,
    String,
    Integer,
    Float,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    BigInteger,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from ..db.session import Base


# -------------------------
# ENUM DEFINITIONS
# -------------------------

class UserRole(str, enum.Enum):
    admin = "admin"
    station_owner = "station_owner"
    driver = "driver"


class StationStatus(str, enum.Enum):
    active = "active"
    maintenance = "maintenance"
    offline = "offline"


class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"


# -------------------------
# USERS TABLE
# -------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        nullable=False,
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    stations: Mapped[List["Station"]] = relationship(
        back_populates="owner"
    )
    bookings: Mapped[List["Booking"]] = relationship(
        back_populates="user"
    )


# -------------------------
# STATIONS TABLE
# -------------------------

class Station(Base):
    __tablename__ = "stations"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    owner_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    location_lat: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    location_lng: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    
    price_per_hour: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    price_per_kwh: Mapped[float] = mapped_column(
        Float,
        nullable=True,
    )


    status: Mapped[StationStatus] = mapped_column(
        Enum(StationStatus),
        nullable=False,
        index=True,
    )

    # Optimistic locking field
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    # Relationships
    owner: Mapped["User"] = relationship(
        back_populates="stations"
    )
    bookings: Mapped[List["Booking"]] = relationship(
        back_populates="station"
    )
    telemetry: Mapped[List["StationTelemetry"]] = relationship(
        back_populates="station"
    )


# -------------------------
# BOOKINGS TABLE
# -------------------------

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    station_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("stations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    
    total_cost: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus),
        nullable=False,
        index=True,
    )

    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        back_populates="bookings"
    )
    station: Mapped["Station"] = relationship(
        back_populates="bookings"
    )

    __table_args__ = (
        Index(
            "idx_booking_station_time",
            "station_id",
            "start_time",
            "end_time",
        ),
    )


# -------------------------
# STATION TELEMETRY TABLE
# -------------------------

class StationTelemetry(Base):
    __tablename__ = "station_telemetry"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    station_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("stations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    voltage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    current: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    temperature: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    station: Mapped["Station"] = relationship(
        back_populates="telemetry"
    )
