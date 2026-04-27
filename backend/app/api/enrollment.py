from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import TenantContext, get_current_user, get_db, require_roles, resolve_tenant_context
from app.models import User
from app.schemas.enrollment import AssignBatchRequest, EnrollUserRequest, UserBatchRead, UserCourseRead
from app.services.batch_service import assign_user_to_batch
from app.services.enrollment_service import assign_user_to_course

router = APIRouter(tags=["Enrollment"])


@router.post(
    "/enroll",
    response_model=UserCourseRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("super_admin", "institute_admin"))],
)
def enroll_user(
    payload: EnrollUserRequest,
    db: Session = Depends(get_db),
    tenant: TenantContext = Depends(resolve_tenant_context),
    current_user: User = Depends(get_current_user),
) -> UserCourseRead:
    return assign_user_to_course(db, payload, tenant, current_user)


@router.post(
    "/assign-batch",
    response_model=UserBatchRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("super_admin", "institute_admin"))],
)
def assign_batch(
    payload: AssignBatchRequest,
    db: Session = Depends(get_db),
    tenant: TenantContext = Depends(resolve_tenant_context),
    current_user: User = Depends(get_current_user),
) -> UserBatchRead:
    return assign_user_to_batch(db, payload, tenant, current_user)
