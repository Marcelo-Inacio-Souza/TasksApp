"""add_username_to_users

Revision ID: bf922b62b55c
Revises: 20260602_0002
Create Date: 2026-06-19
"""
import re
import unicodedata

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "bf922b62b55c"
down_revision = "20260602_0002"
branch_labels = None
depends_on = None


def _slugify_username(name: str) -> str:
    first_name = name.strip().split(" ")[0]
    normalized = unicodedata.normalize("NFKD", first_name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]", "", ascii_name.lower()) or "user"


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(length=80), nullable=True))

    connection = op.get_bind()
    result = connection.execute(sa.text("SELECT id, name FROM users"))
    existing_usernames: set[str] = set()

    for row in result:
        base_username = _slugify_username(row.name)
        candidate = base_username
        suffix = 2
        while candidate in existing_usernames:
            candidate = f"{base_username}{suffix}"
            suffix += 1
        existing_usernames.add(candidate)
        connection.execute(
            sa.text("UPDATE users SET username = :username WHERE id = :id"),
            {"username": candidate, "id": row.id},
        )

    op.alter_column("users", "username", nullable=False)
    op.create_unique_constraint("uq_users_username", "users", ["username"])
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_column("users", "username")