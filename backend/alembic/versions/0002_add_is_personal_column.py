"""Add is_personal column to chat_sessions table

Revision ID: 0002_add_is_personal_column
Revises: 0001_initial
Create Date: 2024-06-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_add_is_personal_column'
down_revision = '0001_initial'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('chat_sessions', sa.Column('is_personal', sa.Boolean(), nullable=False, server_default=sa.false()))

def downgrade():
    op.drop_column('chat_sessions', 'is_personal')
