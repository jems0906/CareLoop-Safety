from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


Setting = Literal["assisted living", "group home", "independent living"]
AccessBarrier = Literal["none recorded", "handoff timing", "document access", "task duplication"]
CommunicationPreference = Literal["verbal update", "large-print written update", "phone call with support person", "accessible email summary"]
ScenarioSummary = Literal[
    "Checklist ownership unclear after a synthetic transition",
    "Medication-list versions differed across synthetic transition records",
    "Duplicate checklist task detected before synthetic review",
]
ShortEntry = Annotated[str, Field(min_length=1, max_length=240)]


class EventCreate(BaseModel):
    id: str = Field(min_length=3, max_length=48)
    setting: Setting
    event_type: Literal["transition handoff", "medication-list discrepancy", "near miss"]
    occurred_on: date
    reported_on: date
    summary: ScenarioSummary
    communication_preference: CommunicationPreference = "verbal update"
    access_barrier: AccessBarrier = "none recorded"

    @model_validator(mode="after")
    def validate_scenario(self):
        expected = {
            "transition handoff": "Checklist ownership unclear after a synthetic transition",
            "medication-list discrepancy": "Medication-list versions differed across synthetic transition records",
            "near miss": "Duplicate checklist task detected before synthetic review",
        }
        if self.summary != expected[self.event_type]:
            raise ValueError("Event category and controlled scenario summary must match")
        if self.reported_on < self.occurred_on:
            raise ValueError("Report date cannot precede event date")
        return self


class ActionCreate(BaseModel):
    id: str = Field(min_length=3, max_length=48)
    event_id: str | None = None
    project_id: str | None = None
    title: str = Field(min_length=3, max_length=180)
    action_type: Literal["standardize", "simplify", "involve", "inform", "other"]
    owner: str = Field(min_length=2, max_length=80)
    due_date: date


class ActionTransition(BaseModel):
    state: Literal["approved", "in_progress", "implemented", "effectiveness_pending", "effective", "ineffective"]
    implementation_evidence: str | None = Field(default=None, max_length=240)
    effectiveness_due: date | None = None
    effectiveness_result: Literal["effective", "ineffective", "inconclusive"] | None = None


class PDSACreate(BaseModel):
    id: str = Field(min_length=3, max_length=48)
    cycle_number: int = Field(ge=1)
    prediction: str = Field(min_length=3, max_length=240)
    test_scope: str = Field(min_length=3, max_length=180)
    observed_result: str = Field(default="Not yet observed", max_length=240)
    learning: str = Field(default="Pending", max_length=240)
    decision: Literal["pending", "adopt", "adapt", "abandon"] = "pending"


class InvestigationUpdate(BaseModel):
    established_facts: list[ShortEntry] = Field(default_factory=list, max_length=12)
    hypotheses: list[ShortEntry] = Field(default_factory=list, max_length=12)
    open_questions: list[ShortEntry] = Field(default_factory=list, max_length=12)
    five_whys: list[ShortEntry] = Field(default_factory=list, max_length=5)
    cause_categories: dict[str, list[ShortEntry]] = Field(default_factory=dict)
    findings: list[ShortEntry] = Field(default_factory=list, max_length=12)


class ReviewerSignoff(BaseModel):
    reviewer: str = Field(min_length=2, max_length=80)


class ProjectUpdate(BaseModel):
    status: Literal["planning", "testing", "review", "sustaining", "closed"]


class PDSAUpdate(BaseModel):
    observed_result: str = Field(min_length=3, max_length=240)
    learning: str = Field(min_length=3, max_length=240)
    decision: Literal["adopt", "adapt", "abandon"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MetricInput(BaseModel):
    week_start: date
    setting: Setting
    access_barrier: AccessBarrier
    eligible_transitions: int = Field(ge=0)
    timely_checklists: int = Field(ge=0)
    missing_record_count: int = Field(ge=0)
    unresolved_discrepancies: int = Field(ge=0)
    reviewed_transitions: int = Field(ge=0)
    documentation_minutes: float = Field(ge=0)
    duplicate_tasks: int = Field(ge=0)
    workflow_burden_score: float = Field(ge=0, le=10)
    intervention: str | None = Field(default=None, max_length=160)

    @model_validator(mode="after")
    def validate_counts(self):
        if self.timely_checklists > self.eligible_transitions:
            raise ValueError("Timely checklists cannot exceed eligible transitions")
        if self.missing_record_count > self.eligible_transitions:
            raise ValueError("Missing record count cannot exceed eligible transitions")
        if self.unresolved_discrepancies > self.reviewed_transitions:
            raise ValueError("Unresolved discrepancies cannot exceed reviewed transitions")
        return self