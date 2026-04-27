from dataclasses import dataclass
from logging import getLogger
import re

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

logger = getLogger(__name__)


@dataclass
class UploadedAsset:
    secure_url: str
    public_id: str | None = None
    resource_type: str | None = None


def _safe_folder_segment(value: str) -> str:
    sanitized = re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-")
    return sanitized or "unknown"


def build_storage_key(public_id: str | None, resource_type: str | None) -> str | None:
    if not public_id:
        return None
    return f"{resource_type or 'raw'}::{public_id}"


def _parse_storage_key(storage_key: str) -> tuple[str, str]:
    if "::" in storage_key:
        resource_type, public_id = storage_key.split("::", 1)
        return resource_type or "raw", public_id
    return "raw", storage_key


def _cloudinary_enabled() -> bool:
    settings = get_settings()
    return bool(
        settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret
    )


def _validate_upload_file(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded files must include a filename.",
        )


def upload_learning_asset(file: UploadFile, *, institute_id: str, module_id: str) -> UploadedAsset:
    _validate_upload_file(file)
    if not _cloudinary_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary storage is not configured on the server.",
        )

    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary SDK is not installed on the backend.",
        ) from exc

    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )

    file.file.seek(0)
    institute_folder = _safe_folder_segment(institute_id)
    module_folder = _safe_folder_segment(module_id)
    try:
        upload_result = cloudinary.uploader.upload(
            file.file,
            resource_type="auto",
            folder=f"{settings.cloudinary_folder}/institutes/{institute_folder}/modules/{module_folder}",
            use_filename=True,
            unique_filename=True,
        )
    except Exception as exc:
        logger.exception("Cloudinary upload failed for module %s.", module_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="File upload failed. Please try again or use an external URL.",
        ) from exc
    return UploadedAsset(
        secure_url=str(upload_result.get("secure_url")),
        public_id=upload_result.get("public_id"),
        resource_type=upload_result.get("resource_type"),
    )


def delete_learning_asset(storage_key: str | None) -> None:
    if not storage_key or not _cloudinary_enabled():
        return

    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError:
        return

    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    resource_type, public_id = _parse_storage_key(storage_key)
    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type, invalidate=True)
    except Exception:
        logger.exception("Cloudinary delete failed for asset %s.", public_id)
