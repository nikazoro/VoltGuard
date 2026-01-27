from pydantic import BaseModel, Field


class AnomalyDetectionResult(BaseModel):
    health_score: int = Field(ge=0, le=100)
    risk_level: str
    anomalies_detected: int = Field(ge=0)
