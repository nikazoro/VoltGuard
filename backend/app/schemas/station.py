from pydantic import BaseModel, Field
from ..models.models import StationStatus   

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


class StationStatusUpdate(BaseModel):
    """
    Request body for updating station operational status.
    Used by admin and owner endpoints.
    """
    status: StationStatus = Field(
        ...,
        description="New station status (active, maintenance, offline)"
    )

    class Config:
        use_enum_values = True
