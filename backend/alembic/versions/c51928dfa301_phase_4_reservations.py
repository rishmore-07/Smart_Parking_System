"""Phase 4 reservations and booking management

Revision ID: c51928dfa301
Revises: 4d310f96701f
Create Date: 2026-10-14 02:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c51928dfa301'
down_revision: Union[str, Sequence[str], None] = '4d310f96701f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.engine.name == 'postgresql':
        # Add NO_SHOW to enum reservationstatus if not present
        op.execute("ALTER TYPE reservationstatus ADD VALUE IF NOT EXISTS 'NO_SHOW';")

    with op.batch_alter_table('reservations', schema=None) as batch_op:
        batch_op.add_column(sa.Column('cancelled_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('cancellation_reason', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('currency', sa.String(length=10), server_default='INR', nullable=False))
        batch_op.add_column(sa.Column('rate_per_hour', sa.Float(), nullable=True))
        batch_op.create_index('ix_reservations_facility_times', ['facility_id', 'start_time', 'end_time'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('reservations', schema=None) as batch_op:
        batch_op.drop_index('ix_reservations_facility_times')
        batch_op.drop_column('rate_per_hour')
        batch_op.drop_column('currency')
        batch_op.drop_column('cancellation_reason')
        batch_op.drop_column('cancelled_at')
