"""Replace streak achievements with frequency-based streaks

Revision ID: 54554881c8de
Revises: 0854434c69c3
Create Date: 2026-10-16 12:04:10.078170

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '54554881c8de'
down_revision: Union[str, Sequence[str], None] = '0854434c69c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    from sqlalchemy import text

    # Delete old streak achievements
    op.execute(text("DELETE FROM achievements WHERE type IN ('streak_1', 'streak_2', 'streak_3', 'streak_4', 'streak_5')"))

    # Insert new frequency-based streak achievements
    op.execute(text("""
        INSERT INTO achievements (name, description, type, icon, criteria, created_at, updated_at)
        VALUES
            ('1x/week Streak', 'Max consecutive weeks with at least 1 workout per week', 'freq_streak_1', 'flame', 'Max consecutive weeks with at least 1 workout per week', datetime('now'), datetime('now')),
            ('2x/week Streak', 'Max consecutive weeks with at least 2 workouts per week', 'freq_streak_2', 'calendar', 'Max consecutive weeks with at least 2 workouts per week', datetime('now'), datetime('now')),
            ('3x/week Streak', 'Max consecutive weeks with at least 3 workouts per week', 'freq_streak_3', 'award', 'Max consecutive weeks with at least 3 workouts per week', datetime('now'), datetime('now')),
            ('4x/week Streak', 'Max consecutive weeks with at least 4 workouts per week', 'freq_streak_4', 'medal', 'Max consecutive weeks with at least 4 workouts per week', datetime('now'), datetime('now')),
            ('5x/week Streak', 'Max consecutive weeks with at least 5 workouts per week', 'freq_streak_5', 'crown', 'Max consecutive weeks with at least 5 workouts per week', datetime('now'), datetime('now'))
    """))


def downgrade() -> None:
    """Downgrade schema."""
    from sqlalchemy import text

    # Delete new frequency-based streak achievements
    op.execute(text("DELETE FROM achievements WHERE type IN ('freq_streak_1', 'freq_streak_2', 'freq_streak_3', 'freq_streak_4', 'freq_streak_5')"))

    # Restore old streak achievements
    op.execute(text("""
        INSERT INTO achievements (name, description, type, icon, criteria, created_at, updated_at)
        VALUES
            ('1 Day Streak', 'Workout 1 day in a week', 'streak_1', 'flame', '1 consecutive week with workouts', datetime('now'), datetime('now')),
            ('2 Day Streak', 'Workout 2 days in a week', 'streak_2', 'calendar', '2 consecutive weeks with workouts', datetime('now'), datetime('now')),
            ('3 Day Streak', 'Workout 3 days in a week', 'streak_3', 'award', '3 consecutive weeks with workouts', datetime('now'), datetime('now')),
            ('4 Day Streak', 'Workout 4 days in a week', 'streak_4', 'medal', '4 consecutive weeks with workouts', datetime('now'), datetime('now')),
            ('5 Day Streak', 'Workout 5 days in a week', 'streak_5', 'crown', '5 consecutive weeks with workouts', datetime('now'), datetime('now'))
    """))
