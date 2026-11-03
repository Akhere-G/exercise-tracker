"""body weights

Revision ID: 4c672ba77dd6
Revises: 415c63646d4b
Create Date: 2026-11-02 13:36:39.177710

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4c672ba77dd6'
down_revision: Union[str, Sequence[str], None] = '415c63646d4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('body_weights',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('measured_on', sa.Date(), nullable=False),
    sa.Column('weight_kg', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'measured_on', name='uq_body_weights_user_day')
    )
    with op.batch_alter_table('body_weights', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_body_weights_user_id'), ['user_id'], unique=False)



def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('body_weights', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_body_weights_user_id'))

    op.drop_table('body_weights')
