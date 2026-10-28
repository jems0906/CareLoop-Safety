"""Add synthetic access-barrier and missingness dimensions."""
import sqlalchemy as sa
from alembic import op

revision = "0002_equity_strata"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("weekly_metrics")}
    unique_names = {constraint["name"] for constraint in inspector.get_unique_constraints("weekly_metrics")}
    with op.batch_alter_table("weekly_metrics") as batch:
        if "access_barrier" not in columns:
            batch.add_column(sa.Column("access_barrier", sa.String(48), nullable=False, server_default="none recorded"))
        if "missing_record_count" not in columns:
            batch.add_column(sa.Column("missing_record_count", sa.Integer(), nullable=False, server_default="0"))
        if "uq_metric_week_setting" in unique_names:
            batch.drop_constraint("uq_metric_week_setting", type_="unique")
        if "uq_metric_week_setting_barrier" not in unique_names:
            batch.create_unique_constraint("uq_metric_week_setting_barrier", ["week_start", "setting", "access_barrier"])
        batch.alter_column("access_barrier", server_default=None)
        batch.alter_column("missing_record_count", server_default=None)


def downgrade():
    with op.batch_alter_table("weekly_metrics") as batch:
        batch.drop_constraint("uq_metric_week_setting_barrier", type_="unique")
        batch.create_unique_constraint("uq_metric_week_setting", ["week_start", "setting"])
        batch.drop_column("missing_record_count")
        batch.drop_column("access_barrier")