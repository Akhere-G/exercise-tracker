"""made_routine_id_nullable

Revision ID: 1bcc2ef1d6cc
Revises: 0d14ca0a70b0
Create Date: 2026-06-07 20:22:10.689090
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "1bcc2ef1d6cc"
down_revision: Union[str, Sequence[str], None] = "0d14ca0a70b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use an explicit name for the routine user_id FK
    with op.batch_alter_table("routines", schema=None) as batch_op:
        batch_op.create_foreign_key(
            "fk_routines_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE"
        )

    with op.batch_alter_table("workouts", schema=None) as batch_op:
        # Make routine_id nullable
        batch_op.alter_column("routine_id", existing_type=sa.INTEGER(), nullable=True)
        # Drop the old CASCADE constraint
        batch_op.drop_constraint("fk_workouts_routine_id", type_="foreignkey")
        # Create new SET NULL constraint with an explicit name
        batch_op.create_foreign_key(
            "fk_workouts_routine_id_set_null",
            "routines",
            ["routine_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("workouts", schema=None) as batch_op:
        # Drop the named constraint
        batch_op.drop_constraint("fk_workouts_routine_id_set_null", type_="foreignkey")
        # Recreate the old CASCADE constraint
        batch_op.create_foreign_key(
            "fk_workouts_routine_id",
            "routines",
            ["routine_id"],
            ["id"],
            ondelete="CASCADE",
        )
        # Revert nullability
        batch_op.alter_column("routine_id", existing_type=sa.INTEGER(), nullable=False)

    with op.batch_alter_table("routines", schema=None) as batch_op:
        batch_op.drop_constraint("fk_routines_user_id", type_="foreignkey")
