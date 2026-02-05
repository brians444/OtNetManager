"""hierarchy and subnet restructure

Revision ID: 1_4_0
Revises: 1_3_0
Create Date: 2026-02-04 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '1_4_0'
down_revision = '1_3_0'
branch_labels = None
depends_on = None


def upgrade() -> None:
  # 1. Create instalaciones table
  op.create_table(
    'instalaciones',
    sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column('name', sa.String(100), nullable=False),
    sa.Column('locacion_id', sa.Integer(), sa.ForeignKey('sectors.id', ondelete='CASCADE'), nullable=True),
    sa.Column('description', sa.String(500), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
  )

  # 2. Add location_id and network_level_id to subnets
  with op.batch_alter_table('subnets') as batch_op:
    batch_op.add_column(sa.Column('location_id', sa.Integer(), nullable=True))
    batch_op.add_column(sa.Column('network_level_id', sa.Integer(), nullable=True))
    batch_op.create_foreign_key(
      'fk_subnets_location_id', 'locations',
      ['location_id'], ['id'], ondelete='SET NULL'
    )
    batch_op.create_foreign_key(
      'fk_subnets_network_level_id', 'network_levels',
      ['network_level_id'], ['id'], ondelete='SET NULL'
    )

  # 3. Data migration: populate subnets.location_id from subnets.location string
  connection = op.get_bind()
  locations = connection.execute(sa.text("SELECT id, name FROM locations")).fetchall()
  for loc_id, loc_name in locations:
    connection.execute(
      sa.text("UPDATE subnets SET location_id = :loc_id WHERE location = :loc_name"),
      {"loc_id": loc_id, "loc_name": loc_name}
    )

  # 4. Add instalacion_id and detail to devices
  with op.batch_alter_table('devices') as batch_op:
    batch_op.add_column(sa.Column('instalacion_id', sa.Integer(), nullable=True))
    batch_op.add_column(sa.Column('detail', sa.Text(), nullable=True))
    batch_op.create_foreign_key(
      'fk_devices_instalacion_id', 'instalaciones',
      ['instalacion_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
  with op.batch_alter_table('devices') as batch_op:
    batch_op.drop_constraint('fk_devices_instalacion_id', type_='foreignkey')
    batch_op.drop_column('instalacion_id')
    batch_op.drop_column('detail')

  with op.batch_alter_table('subnets') as batch_op:
    batch_op.drop_constraint('fk_subnets_network_level_id', type_='foreignkey')
    batch_op.drop_constraint('fk_subnets_location_id', type_='foreignkey')
    batch_op.drop_column('network_level_id')
    batch_op.drop_column('location_id')

  op.drop_table('instalaciones')
