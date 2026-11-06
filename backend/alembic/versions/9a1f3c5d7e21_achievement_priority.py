"""achievement priority

Revision ID: 9a1f3c5d7e21
Revises: 4c672ba77dd6
Create Date: 2026-11-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a1f3c5d7e21'
down_revision: Union[str, Sequence[str], None] = '4c672ba77dd6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('achievements', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('priority', sa.Integer(), server_default='0', nullable=False)
        )

    # 0 = milestone (the default), 1 = streak, 2 = personal record.
    op.execute("UPDATE achievements SET priority = 1 WHERE type LIKE 'freq_streak_%'")
    op.execute("UPDATE achievements SET priority = 2 WHERE type LIKE 'pr_%'")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('achievements', schema=None) as batch_op:
        batch_op.drop_column('priority')
