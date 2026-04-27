"""expand content cms schema

Revision ID: c3f9a61d8a7e
Revises: 6a4d9c7f2e11
Create Date: 2026-04-25 21:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3f9a61d8a7e"
down_revision = "6a4d9c7f2e11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("contents", sa.Column("created_by", sa.String(length=36), nullable=True))
    op.add_column("contents", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("contents", sa.Column("file_url", sa.String(length=1024), nullable=True))
    op.add_column("contents", sa.Column("external_url", sa.String(length=1024), nullable=True))
    op.add_column("contents", sa.Column("storage_key", sa.String(length=255), nullable=True))
    op.add_column("contents", sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("contents", sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")))
    op.add_column("contents", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")))

    op.create_index(op.f("ix_contents_created_by"), "contents", ["created_by"], unique=False)
    op.create_foreign_key(
        "fk_contents_created_by_users",
        "contents",
        "users",
        ["created_by"],
        ["user_id"],
    )

    op.execute(
        """
        UPDATE contents
        SET description = content_profiles.body_text
        FROM content_profiles
        WHERE content_profiles.content_id = contents.content_id
          AND contents.description IS NULL
          AND content_profiles.body_text IS NOT NULL
        """
    )
    op.execute("UPDATE contents SET external_url = url WHERE url IS NOT NULL AND external_url IS NULL")
    op.alter_column("contents", "url", existing_type=sa.String(length=1024), nullable=True)
    op.alter_column("contents", "order_index", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_contents_created_by_users", "contents", type_="foreignkey")
    op.drop_index(op.f("ix_contents_created_by"), table_name="contents")
    op.drop_column("contents", "updated_at")
    op.drop_column("contents", "created_at")
    op.drop_column("contents", "order_index")
    op.drop_column("contents", "storage_key")
    op.drop_column("contents", "external_url")
    op.drop_column("contents", "file_url")
    op.drop_column("contents", "description")
    op.drop_column("contents", "created_by")
