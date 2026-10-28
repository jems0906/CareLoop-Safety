from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.db import get_db
from app.models import PDSACycle, Project
from app.schemas import PDSACreate, PDSAUpdate, ProjectUpdate
from app.services.pdsa_cycles import add_cycle

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("")
def list_projects(db: Session = Depends(get_db)):
    return db.scalars(select(Project).options(selectinload(Project.pdsa_cycles))).unique().all()


@router.patch("/{project_id}", dependencies=[Depends(require_admin)])
def update_project(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.status = payload.status
    db.commit()
    db.refresh(project)
    return project


@router.post("/{project_id}/pdsa", dependencies=[Depends(require_admin)], status_code=201)
def create_pdsa(project_id: str, payload: PDSACreate, db: Session = Depends(get_db)):
    if not db.get(Project, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    cycle, created = add_cycle(db, project_id, payload)
    if not created:
        raise HTTPException(status_code=409, detail="A PDSA cycle with this number already exists")
    return cycle


@router.patch("/{project_id}/pdsa/{cycle_id}", dependencies=[Depends(require_admin)])
def update_pdsa(project_id: str, cycle_id: str, payload: PDSAUpdate, db: Session = Depends(get_db)):
    cycle = db.scalar(select(PDSACycle).where(PDSACycle.project_id == project_id, PDSACycle.id == cycle_id))
    if not cycle:
        raise HTTPException(status_code=404, detail="PDSA cycle not found")
    cycle.observed_result = payload.observed_result
    cycle.learning = payload.learning
    cycle.decision = payload.decision
    db.commit()
    db.refresh(cycle)
    return cycle