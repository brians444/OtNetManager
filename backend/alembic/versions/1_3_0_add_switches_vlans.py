"""add switches vlans and switch_ports tables

Revision ID: 1_3_0
Revises: 1_2_0
Create Date: 2026-02-04 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '1_3_0'
down_revision = '1_2_0'
branch_labels = None
depends_on = None

def upgrade():
    # Switches table
    op.create_table('switches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('model', sa.String(100), nullable=True),
        sa.Column('location_id', sa.Integer(), sa.ForeignKey('locations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_switches_id'), 'switches', ['id'], unique=False)
    op.create_index(op.f('ix_switches_ip_address'), 'switches', ['ip_address'], unique=False)

    # VLANs table
    op.create_table('vlans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vlan_number', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('subnet_id', sa.Integer(), sa.ForeignKey('subnets.id', ondelete='SET NULL'), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vlans_id'), 'vlans', ['id'], unique=False)

    # Switch Ports table
    op.create_table('switch_ports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('switch_id', sa.Integer(), sa.ForeignKey('switches.id', ondelete='CASCADE'), nullable=False),
        sa.Column('port_number', sa.String(50), nullable=False),
        sa.Column('vlan_id', sa.Integer(), sa.ForeignKey('vlans.id', ondelete='SET NULL'), nullable=True),
        sa.Column('device_id', sa.Integer(), sa.ForeignKey('devices.id', ondelete='SET NULL'), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_switch_ports_id'), 'switch_ports', ['id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_switch_ports_id'), table_name='switch_ports')
    op.drop_table('switch_ports')
    op.drop_index(op.f('ix_vlans_id'), table_name='vlans')
    op.drop_table('vlans')
    op.drop_index(op.f('ix_switches_ip_address'), table_name='switches')
    op.drop_index(op.f('ix_switches_id'), table_name='switches')
    op.drop_table('switches')
