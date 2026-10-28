from datetime import date
from types import SimpleNamespace

from app.db import get_db
from app.main import app
from app.models import Project
from app.services.action_workflow import transition_action
from app.services.run_chart_data import summarize_rows


def create_event(client, event_id="evt-test-001"):
    return client.post("/api/events", headers={"X-Admin-Key": "test-admin-key"}, json={
        "id": event_id,
        "setting": "assisted living",
        "event_type": "transition handoff",
        "occurred_on": "2026-03-01",
        "reported_on": "2026-03-02",
        "summary": "Checklist ownership unclear after a synthetic transition",
    })


def test_health_and_write_access_control(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["synthetic_only"] is True
    payload = {"id": "evt-no-key", "setting": "group home", "event_type": "near miss", "occurred_on": "2026-03-01", "reported_on": "2026-03-01", "summary": "Synthetic summary"}
    assert client.post("/api/events", json=payload).status_code == 403


def test_event_duplicate_and_investigation_signoff_invalidation(client):
    assert create_event(client).status_code == 201
    assert create_event(client).status_code == 409
    narrative_attempt = client.post("/api/events", headers={"X-Admin-Key": "test-admin-key"}, json={
        "id": "evt-narrative-001",
        "setting": "group home",
        "event_type": "near miss",
        "occurred_on": "2026-03-01",
        "reported_on": "2026-03-02",
        "summary": "A free-form safety narrative is not accepted",
    })
    assert narrative_attempt.status_code == 422
    empty_signoff = client.post("/api/investigations/evt-test-001/signoff", headers={"X-Admin-Key": "test-admin-key"}, json={"reviewer": "Synthetic reviewer"})
    assert empty_signoff.status_code == 409

    headers = {"X-Admin-Key": "test-admin-key"}
    investigation = {"established_facts": ["Synthetic fact"], "hypotheses": ["Synthetic hypothesis"], "open_questions": [], "five_whys": [], "cause_categories": {}, "findings": ["Human-authored working finding"]}
    assert client.put("/api/investigations/evt-test-001", headers=headers, json=investigation).status_code == 200
    partial_update = client.put("/api/investigations/evt-test-001", headers=headers, json={"findings": ["Updated human-authored finding"]})
    assert partial_update.status_code == 200
    assert partial_update.json()["established_facts"] == ["Synthetic fact"]
    signed = client.post("/api/investigations/evt-test-001/signoff", headers=headers, json={"reviewer": "Synthetic reviewer"})
    assert signed.status_code == 200
    assert signed.json()["reviewer_signed_by"] == "Synthetic reviewer"
    changed = client.put("/api/investigations/evt-test-001", headers=headers, json={"findings": ["Revised after review"]})
    assert changed.json()["reviewer_signed_by"] is None
    assert changed.json()["established_facts"] == ["Synthetic fact"]


def test_action_transitions_require_evidence_and_effectiveness_schedule(client):
    assert create_event(client).status_code == 201
    headers = {"X-Admin-Key": "test-admin-key"}
    created = client.post("/api/actions", headers=headers, json={
        "id": "action-test-001", "event_id": "evt-test-001", "title": "Test a role handoff", "action_type": "standardize", "owner": "Fictional owner", "due_date": "2026-04-01",
    })
    assert created.status_code == 201
    action_url = "/api/actions/action-test-001"
    assert client.patch(action_url, headers=headers, json={"state": "implemented"}).status_code == 409
    assert client.patch(action_url, headers=headers, json={"state": "approved"}).status_code == 200
    assert client.patch(action_url, headers=headers, json={"state": "in_progress"}).status_code == 200
    missing_evidence = client.patch(action_url, headers=headers, json={"state": "implemented"})
    assert missing_evidence.status_code == 422
    implemented = client.patch(action_url, headers=headers, json={"state": "implemented", "implementation_evidence": "Synthetic checklist version 2"})
    assert implemented.status_code == 200
    assert client.patch(action_url, headers=headers, json={"state": "effectiveness_pending"}).status_code == 422
    assert client.patch(action_url, headers=headers, json={"state": "effectiveness_pending", "effectiveness_due": "2026-05-01"}).status_code == 200


def test_pdsas_reject_duplicates_and_metric_counts_obey_boundaries(client):
    database = app.dependency_overrides[get_db]()
    db = next(database)
    db.add(Project(id="test-project", title="Synthetic test project", aim="Test aim", scope="Test scope", baseline=10, target=20, intervention="Test intervention", status="testing", measures=[], milestones=[], risks=[], raci=[], decisions=[], sustainment_owner="Test owner", monitoring_cadence="Weekly", reopen_trigger="Test trigger"))
    db.commit()
    database.close()
    headers = {"X-Admin-Key": "test-admin-key"}
    cycle = {"id": "cycle-001", "cycle_number": 1, "prediction": "Synthetic prediction", "test_scope": "One synthetic transition"}
    assert client.post("/api/projects/test-project/pdsa", headers=headers, json=cycle).status_code == 201
    duplicate_cycle = {**cycle, "id": "cycle-002"}
    assert client.post("/api/projects/test-project/pdsa", headers=headers, json=duplicate_cycle).status_code == 409
    invalid_metric = {"week_start": "2026-03-02", "setting": "group home", "access_barrier": "document access", "eligible_transitions": 2, "timely_checklists": 3, "missing_record_count": 0, "unresolved_discrepancies": 0, "reviewed_transitions": 1, "documentation_minutes": 15, "duplicate_tasks": 0, "workflow_burden_score": 2}
    assert client.post("/api/measurement", headers=headers, json=invalid_metric).status_code == 422
    valid_metric = {**invalid_metric, "timely_checklists": 1}
    assert client.post("/api/measurement", headers=headers, json=valid_metric).status_code == 201
    assert client.post("/api/measurement", headers=headers, json=valid_metric).status_code == 409
    rows = [SimpleNamespace(week_start=date(2026, 3, 2), eligible_transitions=0, timely_checklists=0, unresolved_discrepancies=0, reviewed_transitions=0, documentation_minutes=0, duplicate_tasks=0, workflow_burden_score=0)]
    result = summarize_rows(rows)[0]
    assert result["process_rate"] is None
    assert result["outcome_rate"] is None


def test_export_contains_aggregate_fields_only(client):
    response = client.get("/api/measurement/export.csv")
    assert response.status_code == 200
    assert "week_start,eligible,timely,process_rate" in response.text
    assert "resident" not in response.text.lower()


def test_equity_summary_aggregates_barriers_and_suppresses_small_denominators(client):
    headers = {"X-Admin-Key": "test-admin-key"}
    base = {
        "week_start": "2026-03-02",
        "setting": "group home",
        "access_barrier": "document access",
        "eligible_transitions": 31,
        "timely_checklists": 20,
        "missing_record_count": 2,
        "unresolved_discrepancies": 1,
        "reviewed_transitions": 25,
        "documentation_minutes": 15,
        "duplicate_tasks": 0,
        "workflow_burden_score": 4,
    }
    assert client.post("/api/measurement", headers=headers, json=base).status_code == 201
    same_week_other_barrier = {
        **base,
        "access_barrier": "task duplication",
        "eligible_transitions": 2,
        "timely_checklists": 1,
        "missing_record_count": 0,
        "reviewed_transitions": 2,
    }
    assert client.post("/api/measurement", headers=headers, json=same_week_other_barrier).status_code == 201
    response = client.get("/api/measurement/equity")
    group_home = next(item for item in response.json() if item["setting"] == "group home")
    document_access = next(item for item in group_home["barriers"] if item["access_barrier"] == "document access")
    task_duplication = next(item for item in group_home["barriers"] if item["access_barrier"] == "task duplication")
    assert group_home["eligible"] == 33
    assert group_home["completion_rate"] == 63.6
    assert group_home["missingness_rate"] == 6.1
    assert document_access["eligible"] == 31
    assert document_access["completion_rate"] == 64.5
    assert task_duplication["suppressed"] is True
    assert task_duplication["eligible"] is None


def test_production_settings_require_postgres_private_key_and_exact_https_origin():
    import pytest

    from app.config import Settings

    with pytest.raises(ValueError, match="ADMIN_API_KEY"):
        Settings(app_env="production", database_url="postgresql://db/careloop", cors_origins="https://careloop.example").validate_production()

    with pytest.raises(ValueError, match="exact HTTPS origins"):
        Settings(app_env="production", database_url="postgresql://db/careloop", admin_api_key="private-demo-key", cors_origins="*").validate_production()

    valid = Settings(app_env="production", database_url="postgres://db/careloop", admin_api_key="private-demo-key", cors_origins="https://careloop.example")
    valid.validate_production()
    assert valid.sqlalchemy_database_url == "postgresql+psycopg://db/careloop"