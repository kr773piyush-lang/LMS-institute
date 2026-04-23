import uuid

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import institutes as institute_crud
from app.crud import roles as roles_crud
from app.models import User
from app.models import Institute
from app.schemas.institute import InstituteCreate, InstituteUpdate


def create_institute(db: Session, payload: InstituteCreate) -> Institute:
    institute = Institute(
        institute_id=payload.institute_id or str(uuid.uuid4()),
        name=payload.name,
        email=payload.email,
        mob_no=payload.mob_no,
        country=payload.country,
        state=payload.state,
        place=payload.place,
        pincode=payload.pincode,
        active=payload.active,
    )
    try:
        institute_crud.create_institute(db, institute)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Institute already exists with this email or identifier.",
        ) from exc
    db.refresh(institute)
    return institute


def list_institutes(db: Session, current_user: User) -> list[Institute]:
    current_roles = set(roles_crud.get_role_names_for_user(db, current_user.user_id))
    if "super_admin" in current_roles:
        return institute_crud.get_all_institutes(db, include_inactive=True)
    return (
        [current_user.institute]
        if current_user.institute is not None and current_user.institute.active
        else []
    )


def update_institute(db: Session, institute_id: str, payload: InstituteUpdate) -> Institute:
    institute = institute_crud.get_institute_by_id(db, institute_id)
    if institute is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institute not found.")

    institute.name = payload.name
    institute.email = payload.email
    institute.mob_no = payload.mob_no
    institute.country = payload.country
    institute.state = payload.state
    institute.place = payload.place
    institute.pincode = payload.pincode
    institute.active = payload.active

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Institute update conflicts with existing data.",
        ) from exc
    db.refresh(institute)
    return institute


def delete_institute(db: Session, institute_id: str) -> None:
    institute = institute_crud.get_institute_by_id(db, institute_id)
    if institute is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institute not found.")

    try:
        institute_crud.deactivate_institute(db, institute)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Institute cannot be deactivated because it is still in use.",
        ) from exc
