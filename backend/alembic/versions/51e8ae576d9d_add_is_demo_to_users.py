"""add is_demo to users

Revision ID: 51e8ae576d9d
Revises: 0854434c69c3
Create Date: 2026-10-21 15:03:37.962545

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51e8ae576d9d'
down_revision: Union[str, Sequence[str], None] = '0854434c69c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_demo', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.create_index('uq_users_single_demo', ['is_demo'], unique=True, postgresql_where=sa.text('is_demo'), sqlite_where=sa.text('is_demo'))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index('uq_users_single_demo', postgresql_where=sa.text('is_demo'), sqlite_where=sa.text('is_demo'))
        batch_op.drop_column('is_demo')
