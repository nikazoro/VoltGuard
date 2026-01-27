from pydantic import BaseModel, Field
from enum import Enum


class StationStatus(str, Enum):
    active = "active"
    maintenance = "maintenance"
    offline = "offline"


class StationCreate(BaseModel):
    name: str
    location_lat: float
    location_lng: float
    status: StationStatus
    price_per_hour: float = Field(gt=0)


class StationRead(BaseModel):
    id: int
    owner_id: int
    name: str
    location_lat: float
    location_lng: float
    status: StationStatus
    price_per_hour: float
    version: int

    model_config = {"from_attributes": True}
