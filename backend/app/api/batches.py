from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import TenantContext, get_db, require_roles, resolve_tenant_context
from app.schemas.batch import AssignTeacherRequest, BatchCreate, BatchRead, BatchTeacherRead
from app.services.batch_service import assign_teacher_to_batch, create_batch

router = APIRouter(tags=["Batches"])


@router.post(
    "/batches",
    response_model=BatchRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("super_admin", "institute_admin"))],
)
def add_batch(
    payload: BatchCreate,
    db: Session = Depends(get_db),
    tenant: TenantContext = Depends(resolve_tenant_context),
) -> BatchRead:
    return create_batch(db, payload, tenant)


@router.post(
    "/assign-teacher",
    response_model=BatchTeacherRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("super_admin", "institute_admin"))],
)
def assign_teacher(
    payload: AssignTeacherRequest,
    db: Session = Depends(get_db),
    tenant: TenantContext = Depends(resolve_tenant_context),
) -> BatchTeacherRead:
    return assign_teacher_to_batch(db, payload, tenant)
