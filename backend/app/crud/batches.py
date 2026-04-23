from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Batch, BatchTeacher, UserBatch


def create_batch(db: Session, batch: Batch) -> Batch:
    db.add(batch)
    db.flush()
    return batch


def create_user_batch(db: Session, user_batch: UserBatch) -> UserBatch:
    db.add(user_batch)
    db.flush()
    return user_batch


def create_batch_teacher(db: Session, batch_teacher: BatchTeacher) -> BatchTeacher:
    db.add(batch_teacher)
    db.flush()
    return batch_teacher


def get_batch(db: Session, batch_id: str, institute_id: str) -> Batch | None:
    stmt = select(Batch).where(Batch.batch_id == batch_id, Batch.institute_id == institute_id)
    return db.scalar(stmt)
