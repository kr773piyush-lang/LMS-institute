import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import batches as batch_crud
from app.crud import content as content_crud
from app.dependencies.access import get_user_role_names, resolve_institute_scope
from app.dependencies.tenant import TenantContext
from app.models import Content, ContentProfile, Module, User
from app.schemas.content import ContentCreate, ContentUpdate
from app.services.storage_service import build_storage_key, delete_learning_asset, upload_learning_asset


def _role_names(db: Session, current_user: User) -> set[str]:
    return get_user_role_names(db, current_user)


def _teacher_scope(
    db: Session, current_user: User, institute_id: str
) -> set[tuple[str, str]]:
    assignments = batch_crud.list_batch_teachers_for_user(db, current_user.user_id, institute_id)
    batches = {
        batch.batch_id: batch
        for batch in batch_crud.list_batches(db, institute_id)
        if batch.batch_id in {assignment.batch_id for assignment in assignments}
    }
    return {(batch.course_id, batch.subcourse_id) for batch in batches.values()}


def _student_scope(
    db: Session, current_user: User, institute_id: str
) -> set[tuple[str, str]]:
    assignments = batch_crud.list_user_batches_for_user(db, current_user.user_id, institute_id)
    batches = {
        batch.batch_id: batch
        for batch in batch_crud.list_batches(db, institute_id)
        if batch.batch_id in {assignment.batch_id for assignment in assignments if assignment.active}
    }
    return {(batch.course_id, batch.subcourse_id) for batch in batches.values() if batch.active}


def _get_module_or_404(db: Session, module_id: str) -> Module:
    module = db.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found.")
    return module


def _assert_module_access(
    db: Session,
    *,
    current_user: User,
    institute_id: str,
    module: Module,
    for_write: bool,
) -> None:
    role_names = _role_names(db, current_user)
    if "super_admin" in role_names:
        return

    if module.institute_id != institute_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found.")

    if "institute_admin" in role_names:
        return

    module_scope = (module.course_id, module.subcourse_id)
    if "teacher" in role_names:
        if module_scope not in _teacher_scope(db, current_user, institute_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teachers can only access content for assigned courses.",
            )
        return

    if not for_write and "student" in role_names:
        if module_scope not in _student_scope(db, current_user, institute_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only access content for enrolled courses.",
            )
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges.")


def _assert_content_write_access(db: Session, current_user: User, content: Content) -> None:
    role_names = _role_names(db, current_user)
    if "super_admin" in role_names or "institute_admin" in role_names:
        return
    if "teacher" in role_names and content.created_by == current_user.user_id:
        _assert_module_access(
            db,
            current_user=current_user,
            institute_id=content.institute_id,
            module=content.module,
            for_write=True,
        )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only admins or the creating teacher can modify this content.",
    )


def _apply_profile_fields(content: Content, payload: ContentCreate | ContentUpdate) -> None:
    profile = content.profile
    if profile is None:
        profile = ContentProfile(content_id=content.content_id)
        content.profile = profile

    if isinstance(payload, ContentCreate) or payload.category is not None:
        profile.category = payload.category if payload.category is not None else profile.category
    if isinstance(payload, ContentCreate) or payload.instructions is not None:
        profile.instructions = payload.instructions
    if isinstance(payload, ContentCreate) or payload.downloadable is not None:
        profile.downloadable = bool(payload.downloadable)
    if isinstance(payload, ContentCreate) or payload.response_type is not None:
        profile.response_type = payload.response_type
    profile.body_text = content.description


def _validate_content_state(
    *,
    content_type: str,
    description: str | None,
    file_url: str | None,
    external_url: str | None,
) -> None:
    if content_type in {"text", "quiz"} and file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text and quiz content cannot include uploaded files.",
        )
    if content_type in {"video", "audio", "pdf", "document"} and not (file_url or external_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content requires either an uploaded file or an external URL.",
        )
    if content_type in {"text", "quiz"} and not ((description or "").strip() or external_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text and quiz content require a description or an external URL.",
        )


def create_content(
    db: Session,
    payload: ContentCreate,
    tenant: TenantContext,
    current_user: User,
    file: UploadFile | None = None,
) -> Content:
    role_names = _role_names(db, current_user)
    institute_id = resolve_institute_scope(db, current_user, tenant, payload.institute_id)
    module = _get_module_or_404(db, payload.module_id)
    _assert_module_access(
        db, current_user=current_user, institute_id=institute_id, module=module, for_write=True
    )

    file_url = payload.file_url
    storage_key = None
    if file is not None:
        uploaded = upload_learning_asset(file, institute_id=institute_id, module_id=module.module_id)
        file_url = uploaded.secure_url
        storage_key = build_storage_key(uploaded.public_id, uploaded.resource_type)

    _validate_content_state(
        content_type=payload.type,
        description=payload.description,
        file_url=file_url,
        external_url=payload.external_url,
    )

    content = Content(
        content_id=str(uuid.uuid4()),
        institute_id=institute_id,
        module_id=module.module_id,
        created_by=current_user.user_id,
        title=payload.title,
        type=payload.type,
        description=payload.description,
        file_url=file_url,
        external_url=payload.external_url,
        storage_key=storage_key,
        order_index=payload.order_index,
        url=file_url or payload.external_url,
        duration=payload.duration,
    )
    _apply_profile_fields(content, payload)

    try:
        content_crud.create_content(db, content)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Content could not be created with the provided data.",
        ) from exc

    db.refresh(content)
    return content


def list_module_contents(
    db: Session,
    module_id: str,
    tenant: TenantContext,
    current_user: User,
) -> list[Content]:
    module = _get_module_or_404(db, module_id)
    _assert_module_access(
        db, current_user=current_user, institute_id=tenant.institute_id, module=module, for_write=False
    )
    return content_crud.list_module_contents(
        db, module_id=module.module_id, institute_id=module.institute_id, include_inactive_module=False
    )


def update_content(
    db: Session,
    content_id: str,
    payload: ContentUpdate,
    tenant: TenantContext,
    current_user: User,
    file: UploadFile | None = None,
) -> Content:
    content = content_crud.get_content(db, content_id)
    if content is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")

    institute_id = resolve_institute_scope(db, current_user, tenant, payload.institute_id)
    if content.institute_id != institute_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")

    _assert_content_write_access(db, current_user, content)

    if payload.title is not None:
        content.title = payload.title
    if payload.type is not None:
        content.type = payload.type
    if payload.description is not None:
        content.description = payload.description
    if payload.external_url is not None:
        content.external_url = payload.external_url or None
    if payload.order_index is not None:
        content.order_index = payload.order_index
    if payload.duration is not None:
        content.duration = payload.duration

    if file is not None:
        delete_learning_asset(content.storage_key)
        uploaded = upload_learning_asset(file, institute_id=content.institute_id, module_id=content.module_id)
        content.file_url = uploaded.secure_url
        content.storage_key = build_storage_key(uploaded.public_id, uploaded.resource_type)
    elif payload.replace_file:
        delete_learning_asset(content.storage_key)
        content.file_url = None
        content.storage_key = None

    _validate_content_state(
        content_type=content.type,
        description=content.description,
        file_url=content.file_url,
        external_url=content.external_url,
    )
    content.url = content.file_url or content.external_url
    _apply_profile_fields(content, payload)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Content update conflicts with existing data.",
        ) from exc

    db.refresh(content)
    return content


def delete_content(
    db: Session,
    content_id: str,
    tenant: TenantContext,
    current_user: User,
) -> None:
    content = content_crud.get_content(db, content_id)
    if content is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")

    if "super_admin" not in _role_names(db, current_user) and content.institute_id != tenant.institute_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found.")

    _assert_content_write_access(db, current_user, content)
    delete_learning_asset(content.storage_key)
    content_crud.delete_content(db, content)
    db.commit()
