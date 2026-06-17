"""auth user hierarchy

Revision ID: 20260602_0002
Revises: 20260520_0001
Create Date: 2026-06-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260602_0002"
down_revision: str | None = "20260520_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "roles",
        sa.Column("hierarchy_level", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("must_change_password", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_created_by_id_users",
        "users",
        "users",
        ["created_by_id"],
        ["id"],
    )

    role_levels = {
        "master": 100,
        "diretor": 90,
        "gerente": 80,
        "engenharia": 70,
        "analista": 60,
        "assistente": 50,
        "producao": 40,
    }
    for code, level in role_levels.items():
        op.execute(
            sa.text("UPDATE roles SET hierarchy_level = :level WHERE code = :code").bindparams(
                level=level,
                code=code,
            )
        )

    op.alter_column("roles", "hierarchy_level", server_default=None)
    op.alter_column("users", "must_change_password", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_users_created_by_id_users", "users", type_="foreignkey")
    op.drop_column("users", "created_by_id")
    op.drop_column("users", "must_change_password")
    op.drop_column("roles", "hierarchy_level")
