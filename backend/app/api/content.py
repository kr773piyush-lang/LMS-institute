from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.dependencies import TenantContext, get_current_user, get_db, require_roles, resolve_tenant_context
from app.models import User
from app.schemas.content import ContentCreate, ContentDeleteResponse, ContentRead, ContentUpdate
from app.services.content_service import create_content, delete_content, list_module_contents, update_content

router = APIRouter(tags=["Content"])


def parse_content_create(
    module_id: Annotated[str, Form(...)],
    type: Annotated[str, Form(...)],
    title: Annotated[str, Form(...)],
    description: Annotated[str | None, Form()] = None,
    external_url: Annotated[str | None, Form()] = None,
    order_index: Annotated[int, Form()] = 0,
    category: Annotated[str, Form()] = "reading",
    instructions: Annotated[str | None, Form()] = None,
    downloadable: Annotated[bool, Form()] = False,
    response_type: Annotated[str | None, Form()] = None,
    duration: Annotated[int, Form()] = 0,
    institute_id: Annotated[str | None, Form()] = None,
) -> ContentCreate:
    return ContentCreate(
        module_id=module_id,
        type=type,
        title=title,
        description=description,
        external_url=external_url,
        order_index=order_index,
        category=category,
        instructions=instructions,
        downloadable=downloadable,
        response_type=response_type,
        duration=duration,
        institute_id=institute_id,
    )


def parse_content_update(
    title: Annotated[str | None, Form()] = None,
    type: Annotated[str | None, Form()] = None,
    description: Annotated[str | None, Form()] = None,
    external_url: Annotated[str | None, Form()] = None,
    order_index: Annotated[int | None, Form()] = None,
    category: Annotated[str | None, Form()] = None,
    instructions: Annotated[str | None, Form()] = None,
    downloadable: Annotated[bool | None, Form()] = None,
    response_type: Annotated[str | None, Form()] = None,
    duration: Annotated[int | None, Form()] = None,
    institute_id: Annotated[str | None, Form()] = None,
    replace_file: Annotated[bool, Form()] = False,
) -> ContentUpdate:
    return ContentUpdate(
        title=title,
        type=type,
        description=description,
        external_url=external_url,
        order_index=order_index,
        category=category,
        instructions=instructions,
        downloadable=downloadable,
        response_type=response_type,
        duration=duration,
        institute_id=institute_id,
        replace_file=replace_file,
    )


@router.post(
    "/content",
    response_model=ContentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("super_admin", "institute_admin", "teacher"))],
)
def add_content(
    payload: ContentCreate = Depends(parse_content_create),
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    tenant: TenantContext = Depends(resolve_tenant_context),
    current_user: User = Depends(get_current_user),
) -> ContentRead:
    return create_content(db, payload, tenant, current_user, file=file)


@router.options("/content", include_in_schema=False)
def content_preflight() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/modules/{module_id}/contents",
    response_model=list[ContentRead],
    dependencies=[Depends(require_roles("super_admin", "institute_admin", "teacher", "student"))],
)
def get_module_contents(
    module_id: str,
    db: Session = Depends(get_db),
    tenant: TenantContext = Depends(resolve_tenant_context),
    current_user: User = Depends(get_current_user),
) -> list[ContentRead]:
    return list_module_contents(db, module_id, tenant, current_user)


@router.put(
    "/content/{content_id}",
    response_model=ContentRead,
    dependencies=[Depends(require_roles("super_admin", "institute_admin", "teacher"))],
)
def edit_content(
    content_id: str,
    payload: ContentUpdate = Depends(parse_content_update),
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    tenant: TenantContext = Depends(resolve_tenant_context),
    current_user: User = Depends(get_current_user),
) -> ContentRead:
    return update_content(db, content_id, payload, tenant, current_user, file=file)


@router.options("/content/{content_id}", include_in_schema=False)
def content_update_preflight(content_id: str) -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/content/{content_id}",
    response_model=ContentDeleteResponse,
    dependencies=[Depends(require_roles("super_admin", "institute_admin", "teacher"))],
)
def remove_content(
    content_id: str,
    db: Session = Depends(get_db),
    tenant: TenantContext = Depends(resolve_tenant_context),
    current_user: User = Depends(get_current_user),
) -> ContentDeleteResponse:
    delete_content(db, content_id, tenant, current_user)
    return ContentDeleteResponse(message="Content deleted successfully.")
