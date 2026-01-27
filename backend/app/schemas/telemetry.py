from pydantic import BaseModel
from datetime import datetime


class TelemetryRead(BaseModel):
    id: int
    station_id: int
    voltage: float
    current: float
    temperature: float
    timestamp: datetime

    model_config = {
        "from_attributes": True
    }
