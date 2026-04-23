import uuid

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import courses as course_crud
from app.crud import roles as roles_crud
from app.crud import system_settings as settings_crud
from app.dependencies.tenant import TenantContext
from app.models import Content, Course, Module, SubCourse, User
from app.schemas.course import (
    ContentCreate,
    CourseCreate,
    CourseUpdate,
    ModuleCreate,
    ModuleRead,
    SubCourseCreate,
    SubCourseUpdate,
)


def _institute_id(payload_institute: str | None, tenant: TenantContext) -> str:
    if payload_institute and tenant.allow_multi_tenant:
        return payload_institute
    return tenant.institute_id


def _include_inactive_for_user(db: Session, current_user: User) -> bool:
    return "super_admin" in set(roles_crud.get_role_names_for_user(db, current_user.user_id))


def create_course(db: Session, payload: CourseCreate, tenant: TenantContext) -> Course:
    institute_id = _institute_id(payload.institute_id, tenant)
    course = Course(
        course_id=payload.course_id or str(uuid.uuid4()),
        institute_id=institute_id,
        course_name=payload.course_name,
        active=payload.active,
    )
    try:
        course_crud.create_course(db, course)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Course already exists for this institute.",
        ) from exc
    db.refresh(course)
    return course


def create_subcourse(db: Session, payload: SubCourseCreate, tenant: TenantContext) -> SubCourse:
    institute_id = _institute_id(payload.institute_id, tenant)
    course = course_crud.get_course(db, payload.course_id, institute_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
    subcourse = SubCourse(
        subcourse_id=payload.subcourse_id or str(uuid.uuid4()),
        course_id=payload.course_id,
        institute_id=institute_id,
        subcourse_name=payload.subcourse_name,
        active=payload.active,
    )
    try:
        course_crud.create_subcourse(db, subcourse)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subcourse already exists for this course.",
        ) from exc
    db.refresh(subcourse)
    return subcourse


def create_module(db: Session, payload: ModuleCreate, tenant: TenantContext) -> Module:
    institute_id = _institute_id(payload.institute_id, tenant)
    subcourse = course_crud.get_subcourse(db, payload.subcourse_id, institute_id)
    if subcourse is None or subcourse.course_id != payload.course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcourse not found.")
    module = Module(
        module_id=payload.module_id or str(uuid.uuid4()),
        course_id=payload.course_id,
        subcourse_id=payload.subcourse_id,
        institute_id=institute_id,
        module_name=payload.module_name,
        active=payload.active,
    )
    try:
        course_crud.create_module(db, module)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Module already exists for this subcourse.",
        ) from exc
    db.refresh(module)
    return module


def create_content(db: Session, payload: ContentCreate, tenant: TenantContext) -> Content:
    institute_id = _institute_id(payload.institute_id, tenant)
    module = db.get(Module, payload.module_id)
    if module is None or module.institute_id != institute_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found.")
    content = Content(
        content_id=payload.content_id or str(uuid.uuid4()),
        institute_id=institute_id,
        module_id=payload.module_id,
        title=payload.title,
        type=payload.type,
        url=payload.url,
        duration=payload.duration,
    )
    try:
        course_crud.create_content(db, content)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Content could not be created with the provided identifiers.",
        ) from exc
    db.refresh(content)
    return content


def list_courses(db: Session, tenant: TenantContext, current_user: User) -> list[Course]:
    return course_crud.list_courses(
        db, tenant.institute_id, include_inactive=_include_inactive_for_user(db, current_user)
    )


def list_subcourses(
    db: Session, tenant: TenantContext, current_user: User, course_id: str | None = None
) -> list[SubCourse]:
    return course_crud.list_subcourses(
        db,
        tenant.institute_id,
        course_id,
        include_inactive=_include_inactive_for_user(db, current_user),
    )


def list_modules(
    db: Session,
    tenant: TenantContext,
    current_user: User,
    course_id: str | None = None,
    subcourse_id: str | None = None,
) -> list[Module]:
    return course_crud.list_modules(
        db,
        tenant.institute_id,
        course_id,
        subcourse_id,
        include_inactive=_include_inactive_for_user(db, current_user),
    )


def update_course(db: Session, course_id: str, payload: CourseUpdate, tenant: TenantContext) -> Course:
    course = course_crud.get_course(db, course_id, tenant.institute_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    course.course_name = payload.course_name
    course.active = payload.active
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Course update conflicts with existing data.",
        ) from exc
    db.refresh(course)
    return course


def delete_course(db: Session, course_id: str, tenant: TenantContext) -> None:
    course = course_crud.get_course(db, course_id, tenant.institute_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
    try:
        course_crud.deactivate_course(db, course)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Course cannot be deactivated because it is still in use.",
        ) from exc


def update_subcourse(
    db: Session, subcourse_id: str, payload: SubCourseUpdate, tenant: TenantContext
) -> SubCourse:
    subcourse = course_crud.get_subcourse(db, subcourse_id, tenant.institute_id)
    if subcourse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcourse not found.")

    course = course_crud.get_course(db, payload.course_id, tenant.institute_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    subcourse.course_id = payload.course_id
    subcourse.subcourse_name = payload.subcourse_name
    subcourse.active = payload.active
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subcourse update conflicts with existing data.",
        ) from exc
    db.refresh(subcourse)
    return subcourse


def delete_subcourse(db: Session, subcourse_id: str, tenant: TenantContext) -> None:
    subcourse = course_crud.get_subcourse(db, subcourse_id, tenant.institute_id)
    if subcourse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcourse not found.")
    try:
        course_crud.deactivate_subcourse(db, subcourse)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subcourse cannot be deactivated because it is still in use.",
        ) from exc


def list_public_courses(db: Session) -> list[Course]:
    settings = settings_crud.get_system_settings(db)
    if settings is None or not settings.default_institute_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="System settings/default institute not configured.",
        )
    return course_crud.list_courses(db, settings.default_institute_id, include_inactive=False)


def list_public_subcourses(db: Session, course_id: str | None = None) -> list[SubCourse]:
    settings = settings_crud.get_system_settings(db)
    if settings is None or not settings.default_institute_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="System settings/default institute not configured.",
        )
    return course_crud.list_subcourses(
        db, settings.default_institute_id, course_id, include_inactive=False
    )
