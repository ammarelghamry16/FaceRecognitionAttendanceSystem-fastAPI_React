"""
Script to create database tables WITHOUT dropping existing ones.
Use this if you want to keep existing data.
"""
import sys
from pathlib import Path

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent))

from shared.database.connection import DatabaseConnection
from shared.database.base import Base


# Import all models so SQLAlchemy knows about them
from shared.models.user import User
from services.schedule_service.models.course import Course
from services.schedule_service.models.class_model import Class
from services.schedule_service.models.enrollment import Enrollment

def create_tables():
    """Create database tables without dropping existing ones"""
    print("=" * 70)
    print("CREATING DATABASE TABLES (NO DROP)")
    print("=" * 70)
    
    try:
        # Get database connection
        db_conn = DatabaseConnection()
        engine = db_conn.engine
        
        print("\n[Step 1] Creating tables (if they don't exist)...")
        # Create all tables (will skip if they already exist)
        Base.metadata.create_all(engine)
        print("✅ Tables created/verified successfully!")
        
        # List created tables
        print("\n[Step 2] Verifying tables...")
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            
            tables = result.fetchall()
            print(f"\n✅ Found {len(tables)} tables in database:")
            for table in tables:
                print(f"   - {table[0]}")
        
        print("\n" + "=" * 70)
        print("DATABASE SETUP COMPLETE!")
        print("=" * 70)
        print("\nSchedule Service tables ready:")
        print("   - users (shared)")
        print("   - courses (schedule service)")
        print("   - classes (schedule service)")
        print("   - enrollments (schedule service)")
        print("\nYou can now run the FastAPI server!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    create_tables()
