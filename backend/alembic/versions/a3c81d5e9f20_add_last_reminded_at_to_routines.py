"""add last_reminded_at to routines

Revision ID: a3c81d5e9f20
Revises: 7adfc6e67748
Create Date: 2026-11-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3c81d5e9f20'
down_revision: Union[str, Sequence[str], None] = '7adfc6e67748'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('routines', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_reminded_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('routines', schema=None) as batch_op:
        batch_op.drop_column('last_reminded_at')
