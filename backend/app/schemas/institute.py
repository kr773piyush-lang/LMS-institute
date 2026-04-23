import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.common import ORMBase


class InstituteBase(BaseModel):
    name: str
    email: EmailStr
    mob_no: str
    country: str
    state: str
    place: str
    pincode: str
    active: bool = True


class InstituteCreate(InstituteBase):
    institute_id: str | None = None


class InstituteUpdate(InstituteBase):
    pass


class InstituteRead(InstituteBase, ORMBase):
    institute_id: str
    email: str
    created_at: datetime
    updated_at: datetime


def institute_id_or_new(value: str | None) -> str:
    return value or str(uuid.uuid4())
