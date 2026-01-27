"""add station pricing and booking cost

Revision ID: 15d9a42f31dc
Revises: 8f3c2a9b41d7
Create Date: 2026-01-24 01:04:15.615692

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "8f3c2a9b41d7"
down_revision = "4a5b4b581a47"
branch_labels = None
depends_on = None


def upgrade():
    # -----------------------------
    # STATIONS: PRICING PER STATION
    # -----------------------------
    op.add_column(
        "stations",
        sa.Column(
            "price_per_hour",
            sa.Float(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "stations",
        sa.Column(
            "price_per_kwh",
            sa.Float(),
            nullable=True,
        ),
    )

    # -----------------------------
    # BOOKINGS: IMMUTABLE COST
    # -----------------------------
    op.add_column(
        "bookings",
        sa.Column(
            "total_cost",
            sa.Float(),
            nullable=False,
            server_default="0",
        ),
    )

    # Remove server defaults after backfill safety
    op.alter_column(
        "stations",
        "price_per_hour",
        server_default=None,
    )

    op.alter_column(
        "bookings",
        "total_cost",
        server_default=None,
    )


def downgrade():
    # Reverse order matters (FK safety)
    op.drop_column("bookings", "total_cost")
    op.drop_column("stations", "price_per_kwh")
    op.drop_column("stations", "price_per_hour")
