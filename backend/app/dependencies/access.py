from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.roles import get_role_names_for_user
from app.dependencies.tenant import TenantContext
from app.models import User


def get_user_role_names(db: Session, current_user: User) -> set[str]:
    return set(get_role_names_for_user(db, current_user.user_id))


def resolve_institute_scope(
    db: Session,
    current_user: User,
    tenant: TenantContext,
    requested_institute_id: str | None = None,
) -> str:
    if not requested_institute_id or requested_institute_id == tenant.institute_id:
        return tenant.institute_id

    role_names = get_user_role_names(db, current_user)
    if tenant.allow_multi_tenant and "super_admin" in role_names:
        return requested_institute_id

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You can only access data for your own institute.",
    )
