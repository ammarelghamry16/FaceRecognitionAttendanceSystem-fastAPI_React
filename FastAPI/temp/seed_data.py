"""
Database Seed Script - Populates the database with realistic test data.
Run this after create_tables.py to have a working system with real data.

Usage: python temp/seed_data.py
       python temp/seed_data.py --force  # Clear existing data and reseed
"""
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta, time
import random

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.database.connection import DatabaseConnection
from shared.models.user import User
from services.schedule_service.models.course import Course
from services.schedule_service.models.class_model import Class
from services.schedule_service.models.enrollment import Enrollment
from services.attendance_service.models.attendance_session import AttendanceSession
from services.attendance_service.models.attendance_record import AttendanceRecord
from services.auth_service.services.password_service import PasswordService


def seed_database(force: bool = False):
    """Seed the database with realistic test data."""
    print("=" * 70)
    print("SEEDING DATABASE WITH TEST DATA")
    print("=" * 70)
    
    db_conn = DatabaseConnection()
    session = db_conn.create_session()
    password_service = PasswordService()
    
    try:
        # Clear existing data if force flag is set
        if force:
            print("\n[Step 0] Clearing existing data...")
            from sqlalchemy import text
            tables_to_clear = [
                "attendance_records",
                "attendance_sessions", 
                "enrollments",
                "classes",
                "courses",
                "face_encodings",
                "notifications",
                "api_keys",
                "user_centroids",
                "users"
            ]
            for table in tables_to_clear:
                try:
                    session.execute(text(f"DELETE FROM {table}"))
                except Exception:
                    pass
            session.commit()
            print("  [OK] Existing data cleared")
        else:
            existing_users = session.query(User).count()
            if existing_users > 0:
                print(f"\n[!] Database already has {existing_users} users.")
                print("Use --force flag to clear existing data and reseed.")
                print("Example: python temp/seed_data.py --force")
                return
        
        # ==================== USERS ====================
        print("\n[Step 1] Creating users...")
        
        default_password = password_service.hash_password("Test123!")
        
        users = []
        
        admin = User(
            email="admin@school.edu",
            password_hash=default_password,
            full_name="System Administrator",
            role="admin",
            is_active=True
        )
        users.append(admin)
        print("  [OK] Admin: admin@school.edu")
        
        mentor_names = [
            ("Dr. Sarah Chen", "mentor1@school.edu"),
            ("Prof. Michael Johnson", "mentor2@school.edu"),
            ("Dr. Emily Williams", "mentor3@school.edu"),
        ]
        mentors = []
        for name, email in mentor_names:
            mentor = User(
                email=email,
                password_hash=default_password,
                full_name=name,
                role="mentor",
                is_active=True
            )
            users.append(mentor)
            mentors.append(mentor)
            print(f"  [OK] Mentor: {email}")
        
        student_names = [
            "Alice Anderson", "Bob Brown", "Charlie Clark", "Diana Davis",
            "Edward Evans", "Fiona Foster", "George Garcia", "Hannah Hill",
            "Ivan Ivanov", "Julia Jones", "Kevin Kim", "Laura Lee",
            "Michael Martinez", "Nancy Nguyen", "Oscar Ortiz", "Patricia Park",
            "Quinn Quinn", "Rachel Robinson", "Samuel Smith", "Tina Taylor"
        ]
        students = []
        for i, name in enumerate(student_names, 1):
            student = User(
                email=f"student{i}@school.edu",
                password_hash=default_password,
                full_name=name,
                role="student",
                student_id=f"STU{i:03d}",
                is_active=True
            )
            users.append(student)
            students.append(student)
        print(f"  [OK] Created {len(students)} students")
        
        session.add_all(users)
        session.flush()
        
        # ==================== COURSES ====================
        print("\n[Step 2] Creating courses...")
        
        course_data = [
            ("CS101", "Introduction to Programming", "Learn the fundamentals of programming."),
            ("CS201", "Data Structures", "Study of fundamental data structures."),
            ("CS301", "Database Systems", "Introduction to database design."),
            ("MATH101", "Calculus I", "Differential and integral calculus."),
            ("MATH201", "Linear Algebra", "Vectors, matrices, and transformations."),
            ("PHY101", "Physics I", "Mechanics, thermodynamics, and waves."),
        ]
        
        courses = []
        for code, name, desc in course_data:
            course = Course(code=code, name=name, description=desc)
            courses.append(course)
            print(f"  [OK] {code}: {name}")
        
        session.add_all(courses)
        session.flush()
        
        # ==================== CLASSES ====================
        print("\n[Step 3] Creating classes...")
        
        days = ["monday", "tuesday", "wednesday", "thursday", "friday"]
        times = [time(9, 0), time(11, 0), time(14, 0), time(16, 0)]
        rooms = ["A101", "A102", "B201", "B202", "C301", "C302"]
        
        classes = []
        for course in courses:
            for section in ["A", "B"]:
                day = random.choice(days)
                schedule_time = random.choice(times)
                room = random.choice(rooms)
                mentor = random.choice(mentors)
                
                cls = Class(
                    course_id=course.id,
                    mentor_id=mentor.id,
                    name=f"{course.code} - Section {section}",
                    room_number=room,
                    day_of_week=day,
                    schedule_time=schedule_time
                )
                classes.append(cls)
        
        session.add_all(classes)
        session.flush()
        print(f"  [OK] Created {len(classes)} classes")
        
        # ==================== ENROLLMENTS ====================
        print("\n[Step 4] Creating enrollments...")
        
        enrollments = []
        for student in students:
            num_classes = random.randint(3, 4)
            enrolled_classes = random.sample(classes, num_classes)
            
            for cls in enrolled_classes:
                enrollment = Enrollment(
                    student_id=student.id,
                    class_id=cls.id
                )
                enrollments.append(enrollment)
        
        session.add_all(enrollments)
        session.flush()
        print(f"  [OK] Created {len(enrollments)} enrollments")
        
        # ==================== ATTENDANCE ====================
        print("\n[Step 5] Creating attendance history...")
        
        sessions_created = 0
        records_created = 0
        
        for cls in classes:
            enrolled_students = [e.student_id for e in enrollments if e.class_id == cls.id]
            
            if not enrolled_students:
                continue
            
            for week in range(10):
                session_date = datetime.now(timezone.utc) - timedelta(weeks=week+1)
                
                att_session = AttendanceSession(
                    class_id=cls.id,
                    started_by=cls.mentor_id,
                    start_time=session_date,
                    end_time=session_date + timedelta(hours=1, minutes=30),
                    state="completed",
                    late_threshold_minutes=15
                )
                session.add(att_session)
                session.flush()
                sessions_created += 1
                
                for student_id in enrolled_students:
                    rand = random.random()
                    if rand < 0.85:
                        status = "present"
                        confidence = random.uniform(0.85, 0.99)
                    elif rand < 0.93:
                        status = "late"
                        confidence = random.uniform(0.80, 0.95)
                    elif rand < 0.98:
                        status = "absent"
                        confidence = None
                    else:
                        status = "excused"
                        confidence = None
                    
                    record = AttendanceRecord(
                        session_id=att_session.id,
                        student_id=student_id,
                        status=status,
                        marked_at=session_date + timedelta(minutes=random.randint(0, 20)) if status != "absent" else None,
                        confidence_score=confidence,
                        verification_method="face_recognition" if status in ["present", "late"] else "manual"
                    )
                    session.add(record)
                    records_created += 1
        
        session.flush()
        print(f"  [OK] Created {sessions_created} sessions, {records_created} records")
        
        session.commit()
        
        print("\n" + "=" * 70)
        print("DATABASE SEEDING COMPLETE!")
        print("=" * 70)
        print(f"\nSummary:")
        print(f"  - Users: {len(users)} (1 admin, {len(mentors)} mentors, {len(students)} students)")
        print(f"  - Courses: {len(courses)}")
        print(f"  - Classes: {len(classes)}")
        print(f"  - Enrollments: {len(enrollments)}")
        print(f"  - Attendance: {sessions_created} sessions, {records_created} records")
        print("\nCredentials (Password: Test123!):")
        print("  - Admin: admin@school.edu")
        print("  - Mentors: mentor1@school.edu, mentor2@school.edu, mentor3@school.edu")
        print("  - Students: student1@school.edu ... student20@school.edu")
        
    except Exception as e:
        session.rollback()
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    force = "--force" in sys.argv or "-f" in sys.argv
    seed_database(force=force)
