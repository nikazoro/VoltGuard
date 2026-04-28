"""add is active to users

Revision ID: 46eec1a6dd40
Revises: 1c98bf5528ab
Create Date: 2026-01-24 15:15:08.965140

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '46eec1a6dd40'
down_revision: Union[str, None] = '1c98bf5528ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    # remove default after backfill
    op.alter_column("users", "is_active", server_default=None)


def downgrade():
    op.drop_column("users", "is_active")