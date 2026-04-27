from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Content


def create_content(db: Session, content: Content) -> Content:
    db.add(content)
    db.flush()
    return content


def get_content(db: Session, content_id: str) -> Content | None:
    stmt = (
        select(Content)
        .options(selectinload(Content.profile), selectinload(Content.module))
        .where(Content.content_id == content_id)
    )
    return db.scalar(stmt)


def list_module_contents(
    db: Session,
    module_id: str,
    institute_id: str,
    include_inactive_module: bool = True,
) -> list[Content]:
    stmt = (
        select(Content)
        .options(selectinload(Content.profile), selectinload(Content.module))
        .join(Content.module)
        .where(Content.module_id == module_id, Content.institute_id == institute_id)
        .order_by(Content.order_index, Content.created_at, Content.content_id)
    )
    if not include_inactive_module:
        stmt = stmt.where(Content.module.has(active=True))
    return list(db.scalars(stmt).all())


def delete_content(db: Session, content: Content) -> None:
    db.delete(content)
    db.flush()
