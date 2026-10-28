from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db import get_db
from app.models import Action, Event, Project
from app.schemas import ActionCreate, ActionTransition
from app.services.action_workflow import transition_action

router = APIRouter(prefix="/api/actions", tags=["actions"])


@router.get("")
def list_actions(db: Session = Depends(get_db)):
    return db.scalars(select(Action).order_by(Action.due_date)).all()


@router.post("", dependencies=[Depends(require_admin)], status_code=201)
def create_action(payload: ActionCreate, db: Session = Depends(get_db)):
    if db.get(Action, payload.id):
        raise HTTPException(status_code=409, detail="Action ID already exists")
    if not payload.event_id and not payload.project_id:
        raise HTTPException(status_code=422, detail="An event or improvement project must own this action")
    if payload.event_id and not db.get(Event, payload.event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    if payload.project_id and not db.get(Project, payload.project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    action = Action(**payload.model_dump(), state="proposed")
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


@router.patch("/{action_id}", dependencies=[Depends(require_admin)])
def update_action(action_id: str, payload: ActionTransition, db: Session = Depends(get_db)):
    action = db.get(Action, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    transition_action(action, payload)
    db.commit()
    db.refresh(action)
    return action