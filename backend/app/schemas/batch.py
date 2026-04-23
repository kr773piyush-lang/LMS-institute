import uuid

from pydantic import BaseModel

from app.schemas.common import ORMBase


class BatchCreate(BaseModel):
    course_id: str
    subcourse_id: str
    batch_name: str
    batch_id: str | None = None
    institute_id: str | None = None
    active: bool = True


class BatchRead(ORMBase):
    batch_id: str
    institute_id: str
    course_id: str
    subcourse_id: str
    batch_name: str
    active: bool


class AssignTeacherRequest(BaseModel):
    batch_id: str
    user_id: str
    institute_id: str | None = None


class BatchTeacherRead(ORMBase):
    id: str
    institute_id: str
    batch_id: str
    user_id: str


def batch_id_or_new(value: str | None) -> str:
    return value or str(uuid.uuid4())
