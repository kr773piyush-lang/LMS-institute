from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crud import courses as course_crud
from app.crud import enrollment as enrollment_crud
from app.dependencies.tenant import TenantContext
from app.models import Content, Course, Module, SubCourse, User


def get_enrolled_courses(db: Session, current_user: User, tenant: TenantContext) -> list[dict]:
    enrollments = enrollment_crud.list_user_courses(db, current_user.user_id, tenant.institute_id)
    result: list[dict] = []
    for item in enrollments:
        course = db.scalar(
            select(Course).where(
                Course.course_id == item.course_id,
                Course.institute_id == tenant.institute_id,
                Course.active.is_(True),
            )
        )
        subcourse = db.scalar(
            select(SubCourse).where(
                SubCourse.subcourse_id == item.subcourse_id,
                SubCourse.institute_id == tenant.institute_id,
                SubCourse.active.is_(True),
            )
        )
        if course and subcourse:
            result.append(
                {
                    "course_id": course.course_id,
                    "course_name": course.course_name,
                    "subcourse_id": subcourse.subcourse_id,
                    "subcourse_name": subcourse.subcourse_name,
                }
            )
    return result


def get_my_modules_with_content(db: Session, current_user: User, tenant: TenantContext) -> list[dict]:
    user_modules = enrollment_crud.list_user_modules(db, current_user.user_id, tenant.institute_id)
    output: list[dict] = []
    for user_module in user_modules:
        module = db.scalar(
            select(Module).where(
                Module.module_id == user_module.module_id,
                Module.institute_id == tenant.institute_id,
                Module.active.is_(True),
            )
        )
        if module is None:
            continue
        contents = db.scalars(
            select(Content).where(
                Content.module_id == module.module_id,
                Content.institute_id == tenant.institute_id,
            )
        ).all()
        output.append(
            {
                "module_id": module.module_id,
                "module_name": module.module_name,
                "content": [
                    {
                        "content_id": content.content_id,
                        "title": content.title,
                        "type": content.type,
                        "url": content.url,
                        "duration": content.duration,
                    }
                    for content in contents
                ],
            }
        )
    return output
