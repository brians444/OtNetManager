"""
Migration script to add locations and sectors tables
"""
from sqlalchemy import create_engine, text
import sys
import os

# Add the app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base
from app.models.user import Location, Sector, Device

def migrate_database():
    """Create new tables and add columns to existing tables"""
    
    # Create engine
    engine = create_engine("sqlite:///ipcontroller.db")
    
    with engine.connect() as conn:
        # Create new tables
        Base.metadata.create_all(engine, tables=[Location.__table__, Sector.__table__])
        
        # Add new columns to devices table if they don't exist
        try:
            conn.execute(text("ALTER TABLE devices ADD COLUMN location_id INTEGER"))
            print("Added location_id column to devices table")
        except Exception as e:
            if "duplicate column name" not in str(e):
                print(f"Error adding location_id column: {e}")
        
        try:
            conn.execute(text("ALTER TABLE devices ADD COLUMN sector_id INTEGER"))
            print("Added sector_id column to devices table")
        except Exception as e:
            if "duplicate column name" not in str(e):
                print(f"Error adding sector_id column: {e}")
        
        conn.commit()
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate_database()