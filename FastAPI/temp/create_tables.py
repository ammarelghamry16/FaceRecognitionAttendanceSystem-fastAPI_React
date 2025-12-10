"""
Script to create all database tables.
Run this once to set up your database schema.
"""
import sys
from pathlib import Path

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.database.connection import DatabaseConnection
from shared.database.base import Base

# Import all models so SQLAlchemy knows about them
from shared.models.user import User
from services.auth_service.models.api_key import APIKey
from services.schedule_service.models.course import Course
from services.schedule_service.models.class_model import Class
from services.schedule_service.models.enrollment import Enrollment
from services.notification_service.models.notification import Notification

def create_tables():
    """Create all database tables"""
    print("=" * 70)
    print("CREATING DATABASE TABLES")
    print("=" * 70)
    
    try:
        # Get database connection
        db_conn = DatabaseConnection()
        engine = db_conn.engine
        
        print("\n[Step 1] Dropping existing Schedule Service tables (if any)...")
        print("⚠️  Note: Other service tables (attendance, notifications, etc.) will remain")
        
        # Drop only the tables we're managing (Schedule Service)
        # Use raw SQL with CASCADE to handle dependencies
        from sqlalchemy import text
        
        with engine.connect() as conn:
            # Drop tables in reverse order with CASCADE
            conn.execute(text("DROP TABLE IF EXISTS notifications CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS enrollments CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS classes CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS courses CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS api_keys CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
            conn.commit()
        
        print("✅ Schedule Service tables dropped")
        
        print("\n[Step 2] Creating tables...")
        # Create all tables
        Base.metadata.create_all(engine)
        print("✅ Tables created successfully!")
        
        # List created tables
        print("\n[Step 3] Verifying tables...")
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            
            tables = result.fetchall()
            print(f"\n✅ Created {len(tables)} tables:")
            for table in tables:
                print(f"   - {table[0]}")
        
        print("\n" + "=" * 70)
        print("DATABASE SETUP COMPLETE!")
        print("=" * 70)
        print("\nTables created:")
        print("   - users (shared)")
        print("   - api_keys (auth service)")
        print("   - courses (schedule service)")
        print("   - classes (schedule service)")
        print("   - enrollments (schedule service)")
        print("   - notifications (notification service)")
        print("\nYou can now run the FastAPI server!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    create_tables()
