"""Initial CareLoop synthetic program schema."""
import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "events",
        sa.Column("id", sa.String(48), primary_key=True),
        sa.Column("setting", sa.String(32), nullable=False),
        sa.Column("event_type", sa.String(48), nullable=False),
        sa.Column("occurred_on", sa.Date(), nullable=False),
        sa.Column("reported_on", sa.Date(), nullable=False),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("summary", sa.String(240), nullable=False),
        sa.Column("synthetic", sa.Boolean(), nullable=False),
        sa.Column("communication_preference", sa.String(64), nullable=False),
        sa.Column("access_barrier", sa.String(64), nullable=False),
    )
    op.create_table(
        "investigations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.String(48), sa.ForeignKey("events.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("established_facts", sa.JSON(), nullable=False),
        sa.Column("hypotheses", sa.JSON(), nullable=False),
        sa.Column("open_questions", sa.JSON(), nullable=False),
        sa.Column("five_whys", sa.JSON(), nullable=False),
        sa.Column("cause_categories", sa.JSON(), nullable=False),
        sa.Column("findings", sa.JSON(), nullable=False),
        sa.Column("reviewer_signed_by", sa.String(80)),
        sa.Column("reviewer_signed_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "projects",
        sa.Column("id", sa.String(48), primary_key=True),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("aim", sa.String(240), nullable=False),
        sa.Column("scope", sa.String(240), nullable=False),
        sa.Column("baseline", sa.Float(), nullable=False),
        sa.Column("target", sa.Float(), nullable=False),
        sa.Column("intervention", sa.String(240), nullable=False),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("measures", sa.JSON(), nullable=False),
        sa.Column("milestones", sa.JSON(), nullable=False),
        sa.Column("risks", sa.JSON(), nullable=False),
        sa.Column("raci", sa.JSON(), nullable=False),
        sa.Column("decisions", sa.JSON(), nullable=False),
        sa.Column("sustainment_owner", sa.String(80), nullable=False),
        sa.Column("monitoring_cadence", sa.String(80), nullable=False),
        sa.Column("reopen_trigger", sa.String(240), nullable=False),
    )
    op.create_table(
        "actions",
        sa.Column("id", sa.String(48), primary_key=True),
        sa.Column("event_id", sa.String(48), sa.ForeignKey("events.id", ondelete="SET NULL")),
        sa.Column("project_id", sa.String(48), sa.ForeignKey("projects.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("action_type", sa.String(40), nullable=False),
        sa.Column("owner", sa.String(80), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("state", sa.String(40), nullable=False),
        sa.Column("implementation_evidence", sa.String(240)),
        sa.Column("effectiveness_due", sa.Date()),
        sa.Column("effectiveness_result", sa.String(40)),
    )
    op.create_table(
        "pdsa_cycles",
        sa.Column("id", sa.String(48), primary_key=True),
        sa.Column("project_id", sa.String(48), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cycle_number", sa.Integer(), nullable=False),
        sa.Column("prediction", sa.String(240), nullable=False),
        sa.Column("test_scope", sa.String(180), nullable=False),
        sa.Column("observed_result", sa.String(240), nullable=False),
        sa.Column("learning", sa.String(240), nullable=False),
        sa.Column("decision", sa.String(24), nullable=False),
        sa.UniqueConstraint("project_id", "cycle_number", name="uq_pdsa_project_cycle"),
    )
    op.create_table(
        "weekly_metrics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("setting", sa.String(32), nullable=False),
        sa.Column("eligible_transitions", sa.Integer(), nullable=False),
        sa.Column("timely_checklists", sa.Integer(), nullable=False),
        sa.Column("unresolved_discrepancies", sa.Integer(), nullable=False),
        sa.Column("reviewed_transitions", sa.Integer(), nullable=False),
        sa.Column("documentation_minutes", sa.Float(), nullable=False),
        sa.Column("duplicate_tasks", sa.Integer(), nullable=False),
        sa.Column("workflow_burden_score", sa.Float(), nullable=False),
        sa.Column("intervention", sa.String(160)),
        sa.UniqueConstraint("week_start", "setting", name="uq_metric_week_setting"),
    )


def downgrade():
    op.drop_table("weekly_metrics")
    op.drop_table("pdsa_cycles")
    op.drop_table("actions")
    op.drop_table("projects")
    op.drop_table("investigations")
    op.drop_table("events")