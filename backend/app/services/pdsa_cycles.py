from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PDSACycle


def add_cycle(db: Session, project_id: str, payload):
    existing = db.scalar(select(PDSACycle).where(PDSACycle.project_id == project_id, PDSACycle.cycle_number == payload.cycle_number))
    if existing:
        return existing, False
    cycle = PDSACycle(project_id=project_id, **payload.model_dump())
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle, True