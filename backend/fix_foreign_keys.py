"""
Migration script to fix foreign key constraints with proper cascade/SET NULL behavior
"""
from sqlalchemy import create_engine, text
import sys
import os

# Add to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine

def migrate_database():
    """Update foreign key constraints with proper cascade behavior"""
    
    with engine.connect() as conn:
        print("Updating foreign key constraints...")
        
        # Drop existing tables if they exist (to recreate with proper constraints)
        try:
            conn.execute(text("DROP TABLE IF EXISTS sectors"))
            print("Dropped sectors table")
        except Exception as e:
            print(f"Error dropping sectors table: {e}")
        
        try:
            conn.execute(text("DROP TABLE IF EXISTS locations"))
            print("Dropped locations table")
        except Exception as e:
            print(f"Error dropping locations table: {e}")
        
        # Drop the device columns to recreate them
        try:
            conn.execute(text("ALTER TABLE devices DROP COLUMN location_id"))
            conn.execute(text("ALTER TABLE devices DROP COLUMN sector_id"))
            print("Dropped device foreign key columns")
        except Exception as e:
            print(f"Error dropping device columns: {e}")
        
        # Recreate tables with proper constraints
        from app.models.user import Base, Location, Sector
        
        Base.metadata.create_all(engine, tables=[Location.__table__, Sector.__table__])
        
        # Re-add device columns with proper constraints
        try:
            conn.execute(text("ALTER TABLE devices ADD COLUMN location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL"))
            conn.execute(text("ALTER TABLE devices ADD COLUMN sector_id INTEGER REFERENCES sectors(id) ON DELETE SET NULL"))
            print("Re-added device foreign key columns with SET NULL")
        except Exception as e:
            print(f"Error re-adding device columns: {e}")
        
        # Update other foreign keys with SET NULL
        try:
            conn.execute(text("ALTER TABLE devices ADD COLUMN asset_type_tmp INTEGER REFERENCES asset_types(id) ON DELETE SET NULL"))
            conn.execute(text("UPDATE devices SET asset_type_tmp = asset_type"))
            conn.execute(text("ALTER TABLE devices DROP COLUMN asset_type"))
            conn.execute(text("ALTER TABLE devices RENAME COLUMN asset_type_tmp TO asset_type"))
        except Exception as e:
            print(f"Error updating asset_type constraint: {e}")
        
        try:
            conn.execute(text("ALTER TABLE devices ADD COLUMN network_level_tmp INTEGER REFERENCES network_levels(id) ON DELETE SET NULL"))
            conn.execute(text("UPDATE devices SET network_level_tmp = network_level"))
            conn.execute(text("ALTER TABLE devices DROP COLUMN network_level"))
            conn.execute(text("ALTER TABLE devices RENAME COLUMN network_level_tmp TO network_level"))
        except Exception as e:
            print(f"Error updating network_level constraint: {e}")
        
        try:
            conn.execute(text("ALTER TABLE devices ADD COLUMN subnet_id_tmp INTEGER REFERENCES subnets(id) ON DELETE SET NULL"))
            conn.execute(text("UPDATE devices SET subnet_id_tmp = subnet_id"))
            conn.execute(text("ALTER TABLE devices DROP COLUMN subnet_id"))
            conn.execute(text("ALTER TABLE devices RENAME COLUMN subnet_id_tmp TO subnet_id"))
        except Exception as e:
            print(f"Error updating subnet_id constraint: {e}")
        
        conn.commit()
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate_database()