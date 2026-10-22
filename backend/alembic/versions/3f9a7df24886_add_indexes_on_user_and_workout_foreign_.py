"""add indexes on user and workout foreign keys

PostgreSQL does not index foreign keys, so lookups by user, workout and
exercise were full scans. Only indexes are added; no data changes.

Revision ID: 3f9a7df24886
Revises: 51e8ae576d9d
Create Date: 2026-10-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '3f9a7df24886'
down_revision: Union[str, Sequence[str], None] = '51e8ae576d9d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (index name, table, columns)
INDEXES = [
    ('ix_workouts_user_id_completed_at', 'workouts', ['user_id', 'completed_at']),
    ('ix_workouts_routine_id', 'workouts', ['routine_id']),
    ('ix_workout_sets_workout_id', 'workout_sets', ['workout_id']),
    ('ix_workout_sets_exercise_id', 'workout_sets', ['exercise_id']),
    ('ix_routines_user_id', 'routines', ['user_id']),
    ('ix_user_achievements_user_id', 'user_achievements', ['user_id']),
    ('ix_notifications_user_id', 'notifications', ['user_id']),
    ('ix_notification_subscriptions_user_id', 'notification_subscriptions', ['user_id']),
]


def upgrade() -> None:
    """Upgrade schema."""
    for name, table, columns in INDEXES:
        op.create_index(name, table, columns, unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    for name, table, _ in reversed(INDEXES):
        op.drop_index(name, table_name=table)
