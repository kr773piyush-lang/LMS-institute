from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import TenantContext, get_current_user, get_db, resolve_tenant_context
from app.models import User
from app.services.student_service import get_enrolled_courses, get_my_modules_with_content

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/enrolled-courses")
def enrolled_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: TenantContext = Depends(resolve_tenant_context),
) -> list[dict]:
    return get_enrolled_courses(db, current_user, tenant)


@router.get("/modules-content")
def modules_content(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: TenantContext = Depends(resolve_tenant_context),
) -> list[dict]:
    return get_my_modules_with_content(db, current_user, tenant)
