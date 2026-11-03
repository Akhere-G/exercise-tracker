"""logging depth set types profile

Revision ID: 415c63646d4b
Revises: 1dba82530e69
Create Date: 2026-11-02 12:31:33.821270

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '415c63646d4b'
down_revision: Union[str, Sequence[str], None] = '1dba82530e69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('user_exercise_settings',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('exercise_id', sa.Integer(), nullable=False),
    sa.Column('rest_secs', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'exercise_id')
    )
    op.create_table('user_profiles',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('weight_unit', sa.String(length=2), server_default='kg', nullable=False),
    sa.Column('effort_metric', sa.String(length=3), server_default='off', nullable=False),
    sa.Column('sex', sa.String(length=10), nullable=True),
    sa.Column('experience', sa.String(length=20), nullable=True),
    sa.Column('goal', sa.String(length=20), nullable=True),
    sa.Column('workouts_per_week_target', sa.Integer(), nullable=True),
    sa.Column('target_body_weight_kg', sa.Float(), nullable=True),
    sa.Column('target_lift_exercise_id', sa.Integer(), nullable=True),
    sa.Column('target_lift_kg', sa.Float(), nullable=True),
    sa.Column('coach_persona', sa.String(length=20), server_default='hype', nullable=False),
    sa.Column('wrapped_theme', sa.String(length=20), nullable=True),
    sa.Column('timezone', sa.String(length=64), nullable=True),
    sa.Column('onboarded_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['target_lift_exercise_id'], ['exercises.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id')
    )
    with op.batch_alter_table('routine_items', schema=None) as batch_op:
        batch_op.add_column(sa.Column('rest_secs', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('superset_group', sa.Integer(), nullable=True))

    with op.batch_alter_table('workout_sets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('set_type', sa.String(length=10), server_default='normal', nullable=False))
        batch_op.add_column(sa.Column('rpe', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('rir', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('superset_group', sa.Integer(), nullable=True))



def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('workout_sets', schema=None) as batch_op:
        batch_op.drop_column('superset_group')
        batch_op.drop_column('rir')
        batch_op.drop_column('rpe')
        batch_op.drop_column('set_type')

    with op.batch_alter_table('routine_items', schema=None) as batch_op:
        batch_op.drop_column('superset_group')
        batch_op.drop_column('rest_secs')

    op.drop_table('user_profiles')
    op.drop_table('user_exercise_settings')
