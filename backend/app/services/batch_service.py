import uuid

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import batches as batch_crud
from app.crud import courses as course_crud
from app.crud.users import get_user_by_id
from app.dependencies.tenant import TenantContext
from app.models import Batch, BatchTeacher, UserBatch
from app.schemas.batch import AssignTeacherRequest, BatchCreate
from app.schemas.enrollment import AssignBatchRequest


def create_batch(db: Session, payload: BatchCreate, tenant: TenantContext) -> Batch:
    institute_id = payload.institute_id if (tenant.allow_multi_tenant and payload.institute_id) else tenant.institute_id
    course = course_crud.get_course(db, payload.course_id, institute_id)
    subcourse = course_crud.get_subcourse(db, payload.subcourse_id, institute_id)
    if course is None or subcourse is None or subcourse.course_id != payload.course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course or subcourse not found for this institute.",
        )

    batch = Batch(
        batch_id=payload.batch_id or str(uuid.uuid4()),
        institute_id=institute_id,
        course_id=payload.course_id,
        subcourse_id=payload.subcourse_id,
        batch_name=payload.batch_name,
        active=payload.active,
    )
    try:
        batch_crud.create_batch(db, batch)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Batch already exists for this institute.",
        ) from exc
    db.refresh(batch)
    return batch


def assign_user_to_batch(db: Session, payload: AssignBatchRequest, tenant: TenantContext) -> UserBatch:
    institute_id = payload.institute_id if (tenant.allow_multi_tenant and payload.institute_id) else tenant.institute_id
    batch = batch_crud.get_batch(db, payload.batch_id, institute_id)
    if batch is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    user = get_user_by_id(db, payload.user_id)
    if user is None or user.institute_id != institute_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user_batch = UserBatch(
        institute_id=institute_id, user_id=payload.user_id, batch_id=payload.batch_id, active=True
    )
    try:
        batch_crud.create_user_batch(db, user_batch)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User already assigned to batch."
        ) from exc
    db.refresh(user_batch)
    return user_batch


def assign_teacher_to_batch(
    db: Session, payload: AssignTeacherRequest, tenant: TenantContext
) -> BatchTeacher:
    institute_id = payload.institute_id if (tenant.allow_multi_tenant and payload.institute_id) else tenant.institute_id
    batch = batch_crud.get_batch(db, payload.batch_id, institute_id)
    if batch is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    teacher = get_user_by_id(db, payload.user_id)
    if teacher is None or teacher.institute_id != institute_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found.")

    teacher = BatchTeacher(
        institute_id=institute_id, batch_id=payload.batch_id, user_id=payload.user_id
    )
    try:
        batch_crud.create_batch_teacher(db, teacher)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Teacher already assigned to batch."
        ) from exc
    db.refresh(teacher)
    return teacher
