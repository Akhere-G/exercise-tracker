"""make routine start time timezone aware

Revision ID: 1dba82530e69
Revises: 5c1b5290f63e
Create Date: 2026-10-23 00:18:40.819523

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1dba82530e69'
down_revision: Union[str, Sequence[str], None] = '5c1b5290f63e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('routines', schema=None) as batch_op:
        batch_op.alter_column(
            'start_time',
            existing_type=sa.Time(),
            type_=sa.Time(timezone=True),
            existing_nullable=True,
            postgresql_using="(start_time::text || '+00')::timetz",
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('routines', schema=None) as batch_op:
        batch_op.alter_column(
            'start_time',
            existing_type=sa.Time(timezone=True),
            type_=sa.Time(),
            existing_nullable=True,
            postgresql_using="start_time::time",
        )
