from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import require_admin
from app.db import get_db
from app.models import Event, Investigation
from app.schemas import EventCreate

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("")
def list_events(db: Session = Depends(get_db)):
    events = db.scalars(select(Event).options(joinedload(Event.investigation)).order_by(Event.occurred_on.desc())).unique().all()
    return [{**{column.name: getattr(event, column.name) for column in Event.__table__.columns}, "investigation": event.investigation} for event in events]


@router.get("/{event_id}")
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("", dependencies=[Depends(require_admin)], status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    if db.get(Event, payload.id):
        raise HTTPException(status_code=409, detail="Event ID already exists")
    event = Event(**payload.model_dump(), synthetic=True, status="reported")
    event.investigation = Investigation()
    db.add(event)
    db.commit()
    db.refresh(event)
    return event