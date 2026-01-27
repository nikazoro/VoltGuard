import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import StationTelemetry
from ..core.config import settings


class AIAnomalyService:
    def __init__(self):
        self.model = None

    def train_and_save_dummy_model(self):
        """
        One-time training using synthetic baseline data.
        Runs offline or at startup if model missing.
        """
        data = np.random.normal(loc=[220, 32, 40], scale=[5, 2, 5], size=(1000, 3))
        model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
        )
        model.fit(data)
        joblib.dump(model, settings.MODEL_PATH)
        self.model = model

    def load_model(self):
        """
        Loads persisted model into memory.
        """
        self.model = joblib.load(settings.MODEL_PATH)

    async def analyze_station(self, session: AsyncSession, station_id: int):
        """
        Fetches last 50 telemetry rows and runs inference.
        Async because DB read is network I/O.
        """
        if self.model is None:
            raise RuntimeError("AI model not loaded")

        result = await session.execute(
            select(StationTelemetry)
            .where(StationTelemetry.station_id == station_id)
            .order_by(desc(StationTelemetry.timestamp))
            .limit(50)
        )
        rows = result.scalars().all()

        if not rows:
            return {
                "health_score": 100,
                "risk_level": "LOW",
                "anomalies_detected": 0,
            }

        data = np.array([[r.voltage, r.current, r.temperature] for r in rows])
        predictions = self.model.predict(data)  # -1 = anomaly

        anomalies = int((predictions == -1).sum())
        health_score = max(0, 100 - anomalies * 2)

        return {
            "health_score": health_score,
            "risk_level": "HIGH" if anomalies > 3 else "LOW",
            "anomalies_detected": anomalies,
        }
