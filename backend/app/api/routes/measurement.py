import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from collections import defaultdict

from app.api.dependencies import require_admin
from app.db import get_db
from app.models import WeeklyMetric
from app.schemas import MetricInput
from app.services.run_chart_data import summarize_rows

router = APIRouter(prefix="/api/measurement", tags=["measurement"])
MINIMUM_EQUITY_DENOMINATOR = 30


@router.get("")
def list_measurements(setting: str | None = None, db: Session = Depends(get_db)):
    query = select(WeeklyMetric).order_by(WeeklyMetric.week_start)
    if setting:
        if setting not in {"assisted living", "group home", "independent living"}:
            raise HTTPException(status_code=422, detail="Unknown setting")
        query = query.where(WeeklyMetric.setting == setting)
    return summarize_rows(db.scalars(query).all())


@router.get("/equity")
def equity_summary(db: Session = Depends(get_db)):
    settings = {"assisted living", "group home", "independent living"}
    barriers = {"none recorded", "handoff timing", "document access", "task duplication"}
    totals = defaultdict(lambda: {"eligible": 0, "timely": 0, "missing": 0})
    groups = defaultdict(lambda: {"eligible": 0, "timely": 0, "missing": 0})
    rows = db.scalars(select(WeeklyMetric)).all()
    for row in rows:
        total = totals[row.setting]
        total["eligible"] += row.eligible_transitions
        total["timely"] += row.timely_checklists
        total["missing"] += row.missing_record_count
        group = groups[(row.setting, row.access_barrier)]
        group["eligible"] += row.eligible_transitions
        group["timely"] += row.timely_checklists
        group["missing"] += row.missing_record_count

    def rates(counts):
        publish = counts["eligible"] >= MINIMUM_EQUITY_DENOMINATOR
        return {
            "eligible": counts["eligible"] if publish else None,
            "timely": counts["timely"] if publish else None,
            "missing": counts["missing"] if publish else None,
            "completion_rate": round(100 * counts["timely"] / counts["eligible"], 1) if publish else None,
            "missingness_rate": round(100 * counts["missing"] / counts["eligible"], 1) if publish else None,
            "suppressed": not publish,
        }

    return [{
        "setting": setting,
        **rates(totals[setting]),
        "barriers": [{"access_barrier": barrier, **rates(groups[(setting, barrier)])} for barrier in sorted(barriers)],
    } for setting in sorted(settings)]


@router.post("", dependencies=[Depends(require_admin)], status_code=201)
def add_measurement(payload: MetricInput, db: Session = Depends(get_db)):
    existing = db.scalar(select(WeeklyMetric).where(
        WeeklyMetric.week_start == payload.week_start,
        WeeklyMetric.setting == payload.setting,
        WeeklyMetric.access_barrier == payload.access_barrier,
    ))
    if existing:
        raise HTTPException(status_code=409, detail="A metric row already exists for this week and setting")
    metric = WeeklyMetric(**payload.model_dump())
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


@router.get("/export.csv")
def export_measurements(db: Session = Depends(get_db)):
    rows = summarize_rows(db.scalars(select(WeeklyMetric).order_by(WeeklyMetric.week_start, WeeklyMetric.setting)).all())
    output = io.StringIO()
    fields = ["week_start", "eligible", "timely", "process_rate", "reviewed", "unresolved", "outcome_rate", "documentation_minutes", "duplicate_tasks", "workflow_burden_score"]
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=careloop-synthetic-measurements.csv"})