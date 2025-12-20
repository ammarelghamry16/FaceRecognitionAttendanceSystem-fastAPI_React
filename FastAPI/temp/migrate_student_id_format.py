"""
Migration script for human-readable student ID format (YYYY/NNNNN).

This script:
1. Creates the student_id_sequences table
2. Adds enrollment_year column to users table
3. Migrates existing student_ids to the new format
"""
import os
import sys
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/attendance_db")


def run_migration():
    """Run the student ID format migration."""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Starting student ID format migration...")
        
        # Step 1: Create student_id_sequences table
        print("Creating student_id_sequences table...")
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS student_id_sequences (
                year INTEGER PRIMARY KEY,
                last_sequence INTEGER NOT NULL DEFAULT 0
            );
        """))
        session.commit()
        print("✓ student_id_sequences table created")
        
        # Step 2: Add enrollment_year column to users if not exists
        print("Adding enrollment_year column to users table...")
        session.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS enrollment_year INTEGER;
        """))
        session.commit()
        print("✓ enrollment_year column added")
        
        # Step 3: Get all students with UUID-style student_ids
        print("Fetching students to migrate...")
        result = session.execute(text("""
            SELECT id, student_id, created_at 
            FROM users 
            WHERE role = 'student' 
            AND (student_id IS NULL OR LENGTH(student_id) > 10)
            ORDER BY created_at ASC;
        """))
        students = result.fetchall()
        print(f"Found {len(students)} students to migrate")
        
        # Step 4: Migrate each student
        current_year = datetime.now().year
        migrated_count = 0
        
        for student in students:
            student_id, old_student_id, created_at = student
            
            # Determine enrollment year from created_at or use current year
            enrollment_year = created_at.year if created_at else current_year
            
            # Get next sequence for this year
            seq_result = session.execute(text("""
                INSERT INTO student_id_sequences (year, last_sequence)
                VALUES (:year, 1)
                ON CONFLICT (year) DO UPDATE 
                SET last_sequence = student_id_sequences.last_sequence + 1
                RETURNING last_sequence;
            """), {"year": enrollment_year})
            sequence = seq_result.fetchone()[0]
            
            # Generate new student ID
            new_student_id = f"{enrollment_year}/{sequence:05d}"
            
            # Update user
            session.execute(text("""
                UPDATE users 
                SET student_id = :new_id, enrollment_year = :year
                WHERE id = :user_id;
            """), {
                "new_id": new_student_id,
                "year": enrollment_year,
                "user_id": student_id
            })
            
            migrated_count += 1
            print(f"  Migrated: {old_student_id or 'NULL'} -> {new_student_id}")
        
        session.commit()
        print(f"\n✓ Migration complete! Migrated {migrated_count} students.")
        
        # Step 5: Add unique constraint on student_id if not exists
        print("Adding unique constraint on student_id...")
        try:
            session.execute(text("""
                ALTER TABLE users 
                ADD CONSTRAINT users_student_id_unique UNIQUE (student_id);
            """))
            session.commit()
            print("✓ Unique constraint added")
        except Exception as e:
            if "already exists" in str(e):
                print("✓ Unique constraint already exists")
                session.rollback()
            else:
                raise
        
        print("\n=== Migration Summary ===")
        print(f"Students migrated: {migrated_count}")
        print("New format: YYYY/NNNNN (e.g., 2025/00001)")
        
    except Exception as e:
        session.rollback()
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run_migration()
