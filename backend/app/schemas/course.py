from pydantic import BaseModel

from app.schemas.common import ORMBase


class CourseCreate(BaseModel):
    course_name: str
    course_id: str | None = None
    institute_id: str | None = None
    active: bool = True


class CourseRead(ORMBase):
    course_id: str
    institute_id: str
    course_name: str
    active: bool


class CourseUpdate(BaseModel):
    course_name: str
    institute_id: str | None = None
    active: bool = True


class SubCourseCreate(BaseModel):
    course_id: str
    subcourse_name: str
    subcourse_id: str | None = None
    institute_id: str | None = None
    active: bool = True


class SubCourseRead(ORMBase):
    subcourse_id: str
    course_id: str
    institute_id: str
    subcourse_name: str
    active: bool


class SubCourseUpdate(BaseModel):
    course_id: str
    subcourse_name: str
    institute_id: str | None = None
    active: bool = True


class ModuleCreate(BaseModel):
    course_id: str
    subcourse_id: str
    module_name: str
    module_id: str | None = None
    institute_id: str | None = None
    active: bool = True


class ModuleRead(ORMBase):
    module_id: str
    course_id: str
    subcourse_id: str
    institute_id: str
    module_name: str
    active: bool
