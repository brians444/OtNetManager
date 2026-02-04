"""Initial migration - create all tables

Revision ID: 1_0_0
Revises:
Create Date: 2025-01-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '1_0_0'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('email', sa.String(100), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_admin', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_username', 'users', ['username'], unique=True)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Create asset_types table
    op.create_table('asset_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('description', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_asset_types_id', 'asset_types', ['id'])
    op.create_index('ix_asset_types_name', 'asset_types', ['name'], unique=True)

    # Create network_levels table
    op.create_table('network_levels',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('description', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_network_levels_id', 'network_levels', ['id'])
    op.create_index('ix_network_levels_name', 'network_levels', ['name'], unique=True)

    # Create locations table
    op.create_table('locations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_locations_id', 'locations', ['id'])
    op.create_index('ix_locations_name', 'locations', ['name'], unique=True)

    # Create sectors table
    op.create_table('sectors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_sectors_id', 'sectors', ['id'])
    op.create_index('ix_sectors_name', 'sectors', ['name'], unique=True)

    # Create subnets table
    op.create_table('subnets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('location', sa.String(100), nullable=True),
        sa.Column('subnet', sa.String(45), nullable=False),
        sa.Column('default_gateway', sa.String(45), nullable=True),
        sa.Column('netmask', sa.String(45), nullable=True),
        sa.Column('max_devices', sa.Integer(), nullable=False),
        sa.Column('current_devices', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_subnets_id', 'subnets', ['id'])

    # Create devices table
    op.create_table('devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('hostname', sa.String(100), nullable=True),
        sa.Column('location_id', sa.Integer(), nullable=True),
        sa.Column('sector_id', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), default=True),
        sa.Column('access_level', sa.String(20), default='basic'),
        sa.Column('model', sa.String(100), nullable=True),
        sa.Column('brand', sa.String(100), nullable=True),
        sa.Column('asset_type', sa.Integer(), nullable=True),
        sa.Column('network_level', sa.Integer(), nullable=True),
        sa.Column('subnet_id', sa.Integer(), nullable=True),
        sa.Column('mac_address', sa.String(17), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('default_gateway', sa.String(45), nullable=True),
        sa.Column('netmask', sa.String(45), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['sector_id'], ['sectors.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['asset_type'], ['asset_types.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['network_level'], ['network_levels.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['subnet_id'], ['subnets.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_devices_id', 'devices', ['id'])
    op.create_index('ix_devices_mac_address', 'devices', ['mac_address'])
    op.create_index('ix_devices_ip_address', 'devices', ['ip_address'])

    # Create credentials table
    op.create_table('credentials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.Text(), nullable=False),
        sa.Column('password', sa.Text(), nullable=False),
        sa.Column('description', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_credentials_id', 'credentials', ['id'])


def downgrade():
    op.drop_table('credentials')
    op.drop_table('devices')
    op.drop_table('subnets')
    op.drop_table('sectors')
    op.drop_table('locations')
    op.drop_table('network_levels')
    op.drop_table('asset_types')
    op.drop_table('users')
