"""add last_deload_recommended_at to user_profiles

Revision ID: 7b2e9c41d0a5
Revises: 4c672ba77dd6
Create Date: 2026-11-06 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b2e9c41d0a5'
down_revision: Union[str, Sequence[str], None] = '4c672ba77dd6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('user_profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_deload_recommended_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('user_profiles', schema=None) as batch_op:
        batch_op.drop_column('last_deload_recommended_at')
