"""store personal record values as floats

Revision ID: 5c1b5290f63e
Revises: 3f9a7df24886
Create Date: 2026-10-23 00:18:00.664640

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5c1b5290f63e'
down_revision: Union[str, Sequence[str], None] = '3f9a7df24886'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('user_achievements', schema=None) as batch_op:
        batch_op.alter_column('value', existing_type=sa.Integer(), type_=sa.Float(), existing_nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('user_achievements', schema=None) as batch_op:
        batch_op.alter_column('value', existing_type=sa.Float(), type_=sa.Integer(), existing_nullable=True)
