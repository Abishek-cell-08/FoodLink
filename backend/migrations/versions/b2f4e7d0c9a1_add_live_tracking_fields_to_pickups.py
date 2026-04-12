"""add live tracking fields to pickups

Revision ID: b2f4e7d0c9a1
Revises: 6c16ee5ad3a3
Create Date: 2026-04-02 23:55:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "b2f4e7d0c9a1"
down_revision = "6c16ee5ad3a3"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("pickups", schema=None) as batch_op:
        batch_op.add_column(sa.Column("ngo_live_lat", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("ngo_live_lng", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("ngo_location_updated_at", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("donor_live_lat", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("donor_live_lng", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("donor_location_updated_at", sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table("pickups", schema=None) as batch_op:
        batch_op.drop_column("donor_location_updated_at")
        batch_op.drop_column("donor_live_lng")
        batch_op.drop_column("donor_live_lat")
        batch_op.drop_column("ngo_location_updated_at")
        batch_op.drop_column("ngo_live_lng")
        batch_op.drop_column("ngo_live_lat")
