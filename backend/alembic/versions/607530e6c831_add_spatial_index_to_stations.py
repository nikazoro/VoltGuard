"""add spatial index to stations

Revision ID: 607530e6c831
Revises: 46eec1a6dd40
Create Date: 2026-01-27 17:49:12.717984

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
# revision identifiers, used by Alembic.
revision = "607530e6c831_add_spatial_index_stations"
down_revision = "46eec1a6dd40"
branch_labels = None
depends_on = None
def upgrade():
    conn = op.get_bind()

    # 1. Ensure InnoDB
    conn.execute(sa.text("""
        ALTER TABLE stations ENGINE=InnoDB;
    """))

    # 2. Validate coordinates BEFORE adding geometry
    invalid_rows_result = conn.execute(sa.text("""
        SELECT COUNT(*) FROM stations
        WHERE location_lat IS NULL
           OR location_lng IS NULL
           OR location_lat NOT BETWEEN -90 AND 90
           OR location_lng NOT BETWEEN -180 AND 180;
    """)).scalar()

    invalid_rows = int(invalid_rows_result or 0)

    if invalid_rows > 0:
        raise RuntimeError(
            f"Spatial migration aborted: {invalid_rows} stations have invalid coordinates."
        )

    # 3. Add POINT column
    conn.execute(sa.text("""
        ALTER TABLE stations
        ADD COLUMN location POINT SRID 4326 NULL;
    """))

    # 4. Backfill geometry
    conn.execute(sa.text("""
        UPDATE stations
        SET location = ST_SRID(POINT(location_lng, location_lat), 4326)
        WHERE location IS NULL;
    """))

    # 5. Verify SRID correctness
    srid_mismatch_result = conn.execute(sa.text("""
        SELECT COUNT(*) FROM stations
        WHERE ST_SRID(location) != 4326;
    """)).scalar()

    srid_mismatch = int(srid_mismatch_result or 0)

    if srid_mismatch > 0:
        raise RuntimeError(
            "Spatial migration aborted: SRID mismatch detected."
        )

    # 6. Add spatial index
    conn.execute(sa.text("""
        ALTER TABLE stations
        ADD SPATIAL INDEX idx_stations_location (location);
    """))


def downgrade():
    conn = op.get_bind()

    # Remove spatial index
    conn.execute(sa.text("""
        ALTER TABLE stations
        DROP INDEX idx_stations_location;
    """))

    # Remove geometry column
    conn.execute(sa.text("""
        ALTER TABLE stations
        DROP COLUMN location;
    """))
