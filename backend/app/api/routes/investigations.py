from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db import get_db
from app.models import Event, Investigation
from app.schemas import InvestigationUpdate, ReviewerSignoff

router = APIRouter(prefix="/api/investigations", tags=["investigations"])


@router.get("/{event_id}")
def get_investigation(event_id: str, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter_by(event_id=event_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return investigation


@router.put("/{event_id}", dependencies=[Depends(require_admin)])
def update_investigation(event_id: str, payload: InvestigationUpdate, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event.investigation:
        event.investigation = Investigation()
    for key in payload.model_fields_set:
        setattr(event.investigation, key, getattr(payload, key))
    event.investigation.reviewer_signed_by = None
    event.investigation.reviewer_signed_at = None
    db.commit()
    db.refresh(event.investigation)
    return event.investigation


@router.post("/{event_id}/signoff", dependencies=[Depends(require_admin)])
def signoff_investigation(event_id: str, payload: ReviewerSignoff, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event or not event.investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    if not event.investigation.findings:
        raise HTTPException(status_code=409, detail="At least one human-authored finding is required before review sign-off")
    event.investigation.reviewer_signed_by = payload.reviewer
    event.investigation.reviewer_signed_at = datetime.now(timezone.utc)
    event.status = "reviewed"
    db.commit()
    db.refresh(event.investigation)
    return event.investigation