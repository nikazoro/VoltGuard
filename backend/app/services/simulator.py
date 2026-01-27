import random
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..websockets import ws_manager
from ..services.ai_singleton import ai_service
from ..schemas import station
from ..models.models import Station, StationTelemetry, StationStatus


class IoTSimulatorService:
    def __init__(self, db_session_factory):
        """
        db_session_factory: callable returning AsyncSession
        Passed instead of session to avoid stale connections
        in long-running background jobs.
        """
        self.db_session_factory = db_session_factory
        self.scheduler = AsyncIOScheduler()

    async def _generate_and_store(self):
        """
        Core simulator loop.
        Async is mandatory because:
        • DB calls are network I/O
        • Blocking would freeze scheduler
        """
        async with self.db_session_factory() as session:  # AsyncSession
            try:
                result = await session.execute(
                    select(Station).where(Station.status == StationStatus.active)
                )
                stations = result.scalars().all()

                telemetry_rows = []

                for station in stations:
                    # Base normal operating values
                    voltage = random.gauss(220, 5)
                    current = random.gauss(32, 2)
                    temperature = random.gauss(40, 5)

                    # Fault injection: 5% probability
                    if random.random() < 0.05:
                        if random.choice([True, False]):
                            temperature = random.gauss(90, 3)  # Overheat
                        else:
                            voltage = random.gauss(160, 5)  # Undervoltage

                    telemetry_rows.append(
                        StationTelemetry(
                            station_id=station.id,
                            voltage=voltage,
                            current=current,
                            temperature=temperature,
                        )
                    )
                    
                    ai_result = await ai_service.analyze_station(session, station.id)

                    payload = {
                        "station_id": station.id,
                        "voltage": voltage,
                        "current": current,
                        "temperature": temperature,
                        "health": ai_result["risk_level"],
                        "alert": ai_result["risk_level"] == "HIGH",
                    }
                    await ws_manager.send(station.owner_id, payload)


                if telemetry_rows:
                    session.add_all(telemetry_rows)
                    await session.commit()

            except Exception:
                await session.rollback()
                raise

    def start(self):
        """
        Starts APScheduler.
        Runs every 5 seconds as specified.
        """
        self.scheduler.add_job(
            self._generate_and_store,
            trigger="interval",
            seconds=5,
            max_instances=1,
        )
        self.scheduler.start()
