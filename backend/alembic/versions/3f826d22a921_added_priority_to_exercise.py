"""added_priority_to_exercise

Revision ID: 3f826d22a921
Revises: 1bcc2ef1d6cc
Create Date: 2026-06-11 23:02:19.357462

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3f826d22a921"
down_revision: Union[str, Sequence[str], None] = "1bcc2ef1d6cc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add the column initially as nullable to prevent errors on existing rows
    with op.batch_alter_table("exercises", schema=None) as batch_op:
        batch_op.add_column(sa.Column("priority", sa.Integer(), nullable=True))

    # 2. Populate priority based on length, equipment, keywords, and muscle associations
    op.execute("""
        UPDATE exercises
    SET priority = LENGTH(name) * 10 + CASE
        equipment
        WHEN 'leveragemachine' THEN 25
        WHEN 'dumbbell' THEN 50
        WHEN 'resistanceband' THEN 75
        WHEN 'barbell' THEN 100
        WHEN 'kettlebell' THEN 125
        WHEN 'smithmachine' THEN 150
        WHEN 'cable' THEN 175
        ELSE 200
    END - CASE
        WHEN LOWER(name) LIKE '%bench%'
        OR LOWER(name) LIKE '%chest%'
        OR LOWER(name) LIKE '%press%' THEN 60
        WHEN LOWER(name) LIKE '%row%'
        OR LOWER(name) LIKE '%squat%'
        OR LOWER(name) LIKE '%pull%up%'
        OR LOWER(name) LIKE '%deadlift%'
        OR LOWER(name) LIKE '%press%' THEN 30
        WHEN LOWER(name) LIKE '%curl%'
        OR LOWER(name) LIKE '%extension%'
        OR LOWER(name) LIKE '%fly%' THEN 10
        ELSE 0
    END - COALESCE(
        (
        SELECT SUM(
            CASE
                LOWER(m.name)
                WHEN 'chest' THEN 60
                WHEN 'back' THEN 40
                WHEN 'quadriceps' THEN 30
                WHEN 'hamstrings' THEN 30
                WHEN 'biceps' THEN 20
                WHEN 'deltoids' THEN 20
                WHEN 'core' THEN 20
                ELSE 0
            END
            )
        FROM exercise_muscles em
            JOIN muscles m ON em.muscle_id = m.id
        WHERE em.exercise_id = exercises.id
        ),
        0
    )
    """)

    # 3. Apply the NOT NULL constraint and create the index
    with op.batch_alter_table("exercises", schema=None) as batch_op:
        batch_op.alter_column("priority", existing_type=sa.Integer(), nullable=False)
        batch_op.create_index(
            batch_op.f("ix_exercises_priority"), ["priority"], unique=False
        )


def downgrade() -> None:
    with op.batch_alter_table("exercises", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_exercises_priority"))
        batch_op.drop_column("priority")
