from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from enum import Enum


class BookingStatus(str, Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"


class BookingCreate(BaseModel):
    station_id: int
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def validate_time_window(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class BookingRead(BaseModel):
    id: int
    user_id: int
    station_id: int
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    version: int

    model_config = {
        "from_attributes": True
    }

class BookingDetailRead(BaseModel):
    id: int
    user_id: int
    station_id: int
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    total_cost: float
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
