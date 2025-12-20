"""
Migration script for new attendance session fields.

This script adds:
- auto_recognition_window_minutes
- max_duration_minutes
- auto_ended
- ended_reason
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/attendance_db")


def run_migration():
    """Run the session fields migration."""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Starting session fields migration...")
        
        # Add new columns
        columns = [
            ("auto_recognition_window_minutes", "INTEGER DEFAULT 20"),
            ("max_duration_minutes", "INTEGER DEFAULT 120"),
            ("auto_ended", "BOOLEAN DEFAULT FALSE"),
            ("ended_reason", "VARCHAR(100)"),
        ]
        
        for col_name, col_type in columns:
            print(f"Adding column {col_name}...")
            try:
                session.execute(text(f"""
                    ALTER TABLE attendance_sessions 
                    ADD COLUMN IF NOT EXISTS {col_name} {col_type};
                """))
                session.commit()
                print(f"✓ {col_name} added")
            except Exception as e:
                if "already exists" in str(e):
                    print(f"✓ {col_name} already exists")
                    session.rollback()
                else:
                    raise
        
        print("\n=== Migration Complete ===")
        
    except Exception as e:
        session.rollback()
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run_migration()
