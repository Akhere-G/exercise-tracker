"""added_user_id_to_workouts

Revision ID: 0d14ca0a70b0
Revises: 93ed72c1ecbd
Create Date: 2026-06-07 19:30:33.184903

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0d14ca0a70b0"
down_revision: Union[str, Sequence[str], None] = "93ed72c1ecbd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Step 1: Add user_id to workouts as nullable first
    with op.batch_alter_table("workouts", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))

    # Step 2: Backfill user_id. Use COALESCE to fall back to the first user if an orphaned workout is found
    op.execute(
        "UPDATE workouts SET user_id = COALESCE("
        "  (SELECT user_id FROM routines WHERE routines.id = workouts.routine_id),"
        "  (SELECT id FROM users LIMIT 1)"
        ")"
    )

    # Step 3: Enforce nullable=False and add the named FK now that data is safe
    with op.batch_alter_table("workouts", schema=None) as batch_op:
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=False)
        batch_op.create_foreign_key(
            "fk_workouts_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE"
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("workouts", schema=None) as batch_op:
        batch_op.drop_constraint("fk_workouts_user_id", type_="foreignkey")
        batch_op.drop_column("user_id")
