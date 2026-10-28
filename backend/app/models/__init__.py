from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    setting: Mapped[str] = mapped_column(String(32), nullable=False)
    event_type: Mapped[str] = mapped_column(String(48), nullable=False)
    occurred_on: Mapped[date] = mapped_column(Date, nullable=False)
    reported_on: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="reported")
    summary: Mapped[str] = mapped_column(String(240), nullable=False)
    synthetic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    communication_preference: Mapped[str] = mapped_column(String(64), nullable=False, default="verbal update")
    access_barrier: Mapped[str] = mapped_column(String(64), nullable=False, default="none recorded")
    investigation: Mapped["Investigation"] = relationship(back_populates="event", uselist=False, cascade="all, delete-orphan")
    actions: Mapped[list["Action"]] = relationship(back_populates="event", cascade="all, delete-orphan")


class Investigation(Base):
    __tablename__ = "investigations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), unique=True, nullable=False)
    established_facts: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    hypotheses: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    open_questions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    five_whys: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    cause_categories: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    findings: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    reviewer_signed_by: Mapped[str | None] = mapped_column(String(80))
    reviewer_signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    event: Mapped[Event] = relationship(back_populates="investigation")


class Action(Base):
    __tablename__ = "actions"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    event_id: Mapped[str | None] = mapped_column(ForeignKey("events.id", ondelete="SET NULL"))
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    action_type: Mapped[str] = mapped_column(String(40), nullable=False)
    owner: Mapped[str] = mapped_column(String(80), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    state: Mapped[str] = mapped_column(String(40), nullable=False, default="proposed")
    implementation_evidence: Mapped[str | None] = mapped_column(String(240))
    effectiveness_due: Mapped[date | None] = mapped_column(Date)
    effectiveness_result: Mapped[str | None] = mapped_column(String(40))
    event: Mapped[Event | None] = relationship(back_populates="actions")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    aim: Mapped[str] = mapped_column(String(240), nullable=False)
    scope: Mapped[str] = mapped_column(String(240), nullable=False)
    baseline: Mapped[float] = mapped_column(Float, nullable=False)
    target: Mapped[float] = mapped_column(Float, nullable=False)
    intervention: Mapped[str] = mapped_column(String(240), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="planning")
    measures: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    milestones: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    risks: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    raci: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    decisions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    sustainment_owner: Mapped[str] = mapped_column(String(80), nullable=False)
    monitoring_cadence: Mapped[str] = mapped_column(String(80), nullable=False)
    reopen_trigger: Mapped[str] = mapped_column(String(240), nullable=False)
    pdsa_cycles: Mapped[list["PDSACycle"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class PDSACycle(Base):
    __tablename__ = "pdsa_cycles"
    __table_args__ = (UniqueConstraint("project_id", "cycle_number", name="uq_pdsa_project_cycle"),)

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    cycle_number: Mapped[int] = mapped_column(Integer, nullable=False)
    prediction: Mapped[str] = mapped_column(String(240), nullable=False)
    test_scope: Mapped[str] = mapped_column(String(180), nullable=False)
    observed_result: Mapped[str] = mapped_column(String(240), nullable=False, default="Not yet observed")
    learning: Mapped[str] = mapped_column(String(240), nullable=False, default="Pending")
    decision: Mapped[str] = mapped_column(String(24), nullable=False, default="pending")
    project: Mapped[Project] = relationship(back_populates="pdsa_cycles")


class WeeklyMetric(Base):
    __tablename__ = "weekly_metrics"
    __table_args__ = (UniqueConstraint("week_start", "setting", "access_barrier", name="uq_metric_week_setting_barrier"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    setting: Mapped[str] = mapped_column(String(32), nullable=False)
    access_barrier: Mapped[str] = mapped_column(String(48), nullable=False, default="none recorded")
    eligible_transitions: Mapped[int] = mapped_column(Integer, nullable=False)
    timely_checklists: Mapped[int] = mapped_column(Integer, nullable=False)
    missing_record_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unresolved_discrepancies: Mapped[int] = mapped_column(Integer, nullable=False)
    reviewed_transitions: Mapped[int] = mapped_column(Integer, nullable=False)
    documentation_minutes: Mapped[float] = mapped_column(Float, nullable=False)
    duplicate_tasks: Mapped[int] = mapped_column(Integer, nullable=False)
    workflow_burden_score: Mapped[float] = mapped_column(Float, nullable=False)
    intervention: Mapped[str | None] = mapped_column(String(160))