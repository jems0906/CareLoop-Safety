import csv
import json
from datetime import date
from pathlib import Path

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Action, Event, Investigation, PDSACycle, Project, WeeklyMetric

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"


def seed():
    events = json.loads((FIXTURES / "synthetic_events.json").read_text(encoding="utf-8"))
    with SessionLocal() as db:
        for item in events:
            if db.get(Event, item["id"]):
                continue
            investigation = item.pop("investigation")
            item["occurred_on"] = date.fromisoformat(item["occurred_on"])
            item["reported_on"] = date.fromisoformat(item["reported_on"])
            db.add(Event(**item, investigation=Investigation(**investigation)))

        project = db.get(Project, "demo-reconciliation")
        if not project:
            project = Project(
                id="demo-reconciliation",
                title="Post-discharge checklist reliability",
                aim="Raise timely checklist completion from 61% to 85% in the synthetic 12-week pilot without increasing duplicate documentation.",
                scope="Synthetic transitions across assisted living, group home, and independent living; no clinical-content protocol is defined here.",
                baseline=61.0,
                target=85.0,
                intervention="Structured handoff form with an assigned role and one task queue",
                status="testing",
                measures=[
                    {"name": "Timely checklist completion", "kind": "process", "definition": "Completed within 48 hours / eligible transitions", "unit": "%"},
                    {"name": "Unresolved discrepancies", "kind": "outcome", "definition": "Unresolved at the 72-hour review checkpoint / reviewed transitions", "unit": "%"},
                    {"name": "Documentation time", "kind": "balancing", "definition": "Mean minutes per transition", "unit": "minutes"},
                    {"name": "Duplicate tasks", "kind": "balancing", "definition": "Count of duplicate checklist tasks", "unit": "count"},
                    {"name": "Workflow burden", "kind": "balancing", "definition": "Synthetic staff burden score", "unit": "0-10"},
                ],
                milestones=["Define eligibility and window", "Map handoff steps", "Test role assignment", "Review process and balancing measures", "Prepare sustainment handoff"],
                risks=["Inconsistent denominator capture", "Role assignment may shift burden", "Small setting groups limit comparisons"],
                raci=[
                    {"role": "Program sponsor", "raci": "A", "commitment": "Decision owner; fictional role"},
                    {"role": "Workgroup facilitator", "raci": "R", "commitment": "Coordinates proposed tests; fictional role"},
                    {"role": "Frontline representative", "raci": "C", "commitment": "Workflow review needed; participation not claimed"},
                    {"role": "Quality analyst", "raci": "R", "commitment": "Metric definitions and synthetic run chart"},
                    {"role": "Resident/family partner", "raci": "C", "commitment": "Synthetic preference feedback only; no research conducted"},
                ],
                decisions=[{"decision": "Use 48-hour demonstration window", "status": "proposed", "owner": "Program sponsor", "note": "Illustrative only; not a clinician-approved protocol."}],
                sustainment_owner="Quality lead (fictional role)",
                monitoring_cadence="Weekly for 8 weeks, then monthly",
                reopen_trigger="Two consecutive weeks below 75% timely completion, or duplicate-task rate above 10%.",
            )
            db.add(project)
            db.flush()
            db.add(PDSACycle(id="demo-pdsa-01", project_id=project.id, cycle_number=1, prediction="A named role and single queue will reduce missed handoffs without adding duplicate tasks.", test_scope="Synthetic test: one transition record in each setting", observed_result="Synthetic dataset only; no live workflow test", learning="Illustrative signal is not evidence of adoption or causality", decision="pending"))
        db.flush()

        if not db.get(Action, "demo-action-01"):
            db.add(Action(id="demo-action-01", event_id="evt-transition-014", project_id=project.id, title="Map handoff role and single-queue ownership", action_type="standardize", owner="Quality lead (fictional)", due_date=date(2026, 11, 15), state="in_progress"))
        if not db.get(Action, "demo-action-02"):
            db.add(Action(id="demo-action-02", project_id=project.id, title="Review duplicate-task and documentation-time measures", action_type="simplify", owner="Operations lead (fictional)", due_date=date(2026, 11, 22), state="proposed"))

        with (FIXTURES / "synthetic_weekly_metrics.csv").open(newline="", encoding="utf-8") as source:
            for row in csv.DictReader(source):
                week = date.fromisoformat(row["week_start"])
                if db.scalar(select(WeeklyMetric).where(WeeklyMetric.week_start == week, WeeklyMetric.setting == row["setting"], WeeklyMetric.access_barrier == row["access_barrier"])):
                    continue
                db.add(WeeklyMetric(
                    week_start=week, setting=row["setting"], access_barrier=row["access_barrier"],
                    eligible_transitions=int(row["eligible_transitions"]), timely_checklists=int(row["timely_checklists"]),
                    missing_record_count=int(row["missing_record_count"]),
                    unresolved_discrepancies=int(row["unresolved_discrepancies"]), reviewed_transitions=int(row["reviewed_transitions"]),
                    documentation_minutes=float(row["documentation_minutes"]), duplicate_tasks=int(row["duplicate_tasks"]),
                    workflow_burden_score=float(row["workflow_burden_score"]), intervention=row["intervention"] or None,
                ))
        db.commit()
    print("Seeded synthetic demo records (idempotent; no production profile or real-person data).")


if __name__ == "__main__":
    seed()