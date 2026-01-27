from logging.config import fileConfig
import sys
from pathlib import Path
import asyncio

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# -------------------------------------------------------------------
# Ensure backend/ is on PYTHONPATH so "app" can be imported
# -------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))

from app.core.config import settings
from app.db.base import Base
from app.models import models  # noqa: F401  (ensures models are imported)

# -------------------------------------------------------------------
# Alembic Config
# -------------------------------------------------------------------
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# THIS IS CRITICAL FOR AUTOGENERATE
target_metadata = Base.metadata


# -------------------------------------------------------------------
# Database URL from Pydantic settings
# -------------------------------------------------------------------
def get_database_url() -> str:
    return (
        f"mysql+aiomysql://{settings.DB_USER}:"
        f"{settings.DB_PASSWORD}@"
        f"{settings.DB_HOST}:{settings.DB_PORT}/"
        f"{settings.DB_NAME}"
    )


# -------------------------------------------------------------------
# Offline migrations
# -------------------------------------------------------------------
def run_migrations_offline() -> None:
    context.configure(
        url=get_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# -------------------------------------------------------------------
# Online migrations (ASYNC)
# -------------------------------------------------------------------
def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        {"sqlalchemy.url": get_database_url()},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async def run_async_migrations():
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)

    asyncio.run(run_async_migrations())


# -------------------------------------------------------------------
# Entry point
# -------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
