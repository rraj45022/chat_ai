"""Add title column to chat_sessions

Revision ID: 76978cd92dc5
Revises: 
Create Date: 2025-07-23 23:51:57.175969

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '76978cd92dc5'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('chat_sessions', sa.Column('title', sa.String(), nullable=True))

def downgrade():
    op.drop_column('chat_sessions', 'title')
