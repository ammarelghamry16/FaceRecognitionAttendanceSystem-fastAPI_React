"""
Database Seed Script - Test Data for Concurrent Classes and Students
Run: python seed_data.py
"""
import os
import sys
from datetime import datetime, timezone, time
from uuid import uuid4
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import models
from shared.database.base import Base
from shared.models.user import User
from services.schedule_service.models.course import Course
from services.schedule_service.models.class_model import Class
from services.schedule_service.models.enrollment import Enrollment
from services.schedule_service.models.course_mentor import CourseMentor


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt (same as auth service)"""
    import bcrypt
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def seed_database():
    """Seed the database with test data"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL not set in .env file")
        sys.exit(1)
    
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("🌱 Starting database seed...")
        
        # Clear existing data in correct order (respecting foreign keys)
        print("  Clearing existing data...")
        session.execute(text("DELETE FROM attendance_records"))
        session.execute(text("DELETE FROM attendance_sessions"))
        session.execute(text("DELETE FROM enrollments"))
        session.execute(text("DELETE FROM classes"))
        session.execute(text("DELETE FROM course_mentors"))
        session.execute(text("DELETE FROM courses"))
        session.execute(text("DELETE FROM face_encodings"))
        session.execute(text("DELETE FROM notifications"))
        session.execute(text("DELETE FROM api_keys"))
        session.execute(text("DELETE FROM users"))
        session.commit()
        
        # ==========================================
        # CREATE ADMIN
        # ==========================================
        print("  Creating admin user...")
        admin = User(
            id=uuid4(),
            email="admin@attendance.com",
            password_hash=get_password_hash("admin123"),
            full_name="System Admin",
            role="admin",
            is_active=True
        )
        session.add(admin)
        
        # ==========================================
        # CREATE MENTORS (3 mentors)
        # ==========================================
        print("  Creating mentors...")
        mentors = []
        mentor_data = [
            ("Dr. Ahmed Hassan", "ahmed.hassan@university.edu"),
            ("Prof. Sara Ali", "sara.ali@university.edu"),
            ("Dr. Mohamed Youssef", "mohamed.youssef@university.edu"),
        ]
        
        for name, email in mentor_data:
            mentor = User(
                id=uuid4(),
                email=email,
                password_hash=get_password_hash("mentor123"),
                full_name=name,
                role="mentor",
                is_active=True
            )
            session.add(mentor)
            mentors.append(mentor)
        
        session.flush()
        
        # ==========================================
        # CREATE STUDENTS (10 students)
        # ==========================================
        print("  Creating students...")
        students = []
        student_data = [
            ("Ali Mohamed", "ali.mohamed@student.edu", "2024/00001", "Computer Science - CS-101"),
            ("Fatima Ahmed", "fatima.ahmed@student.edu", "2024/00002", "Computer Science - CS-101"),
            ("Omar Hassan", "omar.hassan@student.edu", "2024/00003", "Computer Science - CS-102"),
            ("Nour Ibrahim", "nour.ibrahim@student.edu", "2024/00004", "Information Technology - IT-101"),
            ("Youssef Mahmoud", "youssef.mahmoud@student.edu", "2024/00005", "Information Technology - IT-101"),
            ("Mona Khaled", "mona.khaled@student.edu", "2024/00006", "Software Engineering - SE-101"),
            ("Karim Samir", "karim.samir@student.edu", "2024/00007", "Software Engineering - SE-101"),
            ("Layla Mostafa", "layla.mostafa@student.edu", "2024/00008", "Data Science - DS-101"),
            ("Tarek Adel", "tarek.adel@student.edu", "2024/00009", "Cybersecurity - CY-101"),
            ("Hana Sherif", "hana.sherif@student.edu", "2024/00010", "Artificial Intelligence - AI-101"),
        ]
        
        for name, email, student_id, group in student_data:
            student = User(
                id=uuid4(),
                email=email,
                password_hash=get_password_hash("student123"),
                full_name=name,
                role="student",
                student_id=student_id,
                group=group,
                is_active=True
            )
            session.add(student)
            students.append(student)
        
        session.flush()

        # ==========================================
        # CREATE COURSES (3 courses)
        # ==========================================
        print("  Creating courses...")
        courses = []
        course_data = [
            ("CS101", "Introduction to Programming", "Fundamentals of programming using Python"),
            ("CS201", "Data Structures", "Arrays, linked lists, trees, and graphs"),
            ("CS301", "Database Systems", "SQL, normalization, and database design"),
        ]
        
        for code, name, description in course_data:
            course = Course(
                id=uuid4(),
                code=code,
                name=name,
                description=description
            )
            session.add(course)
            courses.append(course)
        
        session.flush()
        
        # ==========================================
        # ASSIGN MENTORS TO COURSES
        # ==========================================
        print("  Assigning mentors to courses...")
        # Mentor 0 teaches CS101 and CS201
        # Mentor 1 teaches CS201 and CS301
        # Mentor 2 teaches CS101 and CS301
        course_mentor_assignments = [
            (courses[0].id, mentors[0].id),  # CS101 - Dr. Ahmed
            (courses[0].id, mentors[2].id),  # CS101 - Dr. Mohamed
            (courses[1].id, mentors[0].id),  # CS201 - Dr. Ahmed
            (courses[1].id, mentors[1].id),  # CS201 - Prof. Sara
            (courses[2].id, mentors[1].id),  # CS301 - Prof. Sara
            (courses[2].id, mentors[2].id),  # CS301 - Dr. Mohamed
        ]
        
        for course_id, mentor_id in course_mentor_assignments:
            cm = CourseMentor(course_id=course_id, mentor_id=mentor_id)
            session.add(cm)
        
        session.flush()
        
        # ==========================================
        # CREATE CLASSES (6 classes - some concurrent)
        # ==========================================
        print("  Creating classes (with concurrent schedules)...")
        classes = []
        
        # Monday 9:00 AM - Two concurrent classes!
        class1 = Class(
            id=uuid4(),
            course_id=courses[0].id,  # CS101
            mentor_id=mentors[0].id,  # Dr. Ahmed
            name="CS101 - Section A",
            room_number="101",
            day_of_week="monday",
            schedule_time=time(9, 0)
        )
        
        class2 = Class(
            id=uuid4(),
            course_id=courses[1].id,  # CS201
            mentor_id=mentors[1].id,  # Prof. Sara
            name="CS201 - Section A",
            room_number="201",
            day_of_week="monday",
            schedule_time=time(9, 0)  # Same time as class1!
        )
        
        # Monday 11:00 AM
        class3 = Class(
            id=uuid4(),
            course_id=courses[2].id,  # CS301
            mentor_id=mentors[2].id,  # Dr. Mohamed
            name="CS301 - Section A",
            room_number="301",
            day_of_week="monday",
            schedule_time=time(11, 0)
        )
        
        # Wednesday 9:00 AM - Two more concurrent classes!
        class4 = Class(
            id=uuid4(),
            course_id=courses[0].id,  # CS101
            mentor_id=mentors[2].id,  # Dr. Mohamed
            name="CS101 - Section B",
            room_number="102",
            day_of_week="wednesday",
            schedule_time=time(9, 0)
        )
        
        class5 = Class(
            id=uuid4(),
            course_id=courses[2].id,  # CS301
            mentor_id=mentors[1].id,  # Prof. Sara
            name="CS301 - Section B",
            room_number="302",
            day_of_week="wednesday",
            schedule_time=time(9, 0)  # Same time as class4!
        )
        
        # Friday 10:00 AM
        class6 = Class(
            id=uuid4(),
            course_id=courses[1].id,  # CS201
            mentor_id=mentors[0].id,  # Dr. Ahmed
            name="CS201 - Section B",
            room_number="202",
            day_of_week="friday",
            schedule_time=time(10, 0)
        )
        
        classes = [class1, class2, class3, class4, class5, class6]
        for c in classes:
            session.add(c)
        
        session.flush()
        
        # ==========================================
        # ENROLL STUDENTS IN CLASSES
        # ==========================================
        print("  Enrolling students in classes...")
        
        # Group A students (indices 0, 1, 2, 6, 8) -> classes 1, 3, 4
        # Group B students (indices 3, 4, 5, 7, 9) -> classes 2, 5, 6
        group_a_students = [students[i] for i in [0, 1, 2, 6, 8]]
        group_b_students = [students[i] for i in [3, 4, 5, 7, 9]]
        
        # Enroll Group A in CS101-A (Mon 9AM), CS301-A (Mon 11AM), CS101-B (Wed 9AM)
        for student in group_a_students:
            for cls in [class1, class3, class4]:
                enrollment = Enrollment(student_id=student.id, class_id=cls.id)
                session.add(enrollment)
        
        # Enroll Group B in CS201-A (Mon 9AM), CS301-B (Wed 9AM), CS201-B (Fri 10AM)
        for student in group_b_students:
            for cls in [class2, class5, class6]:
                enrollment = Enrollment(student_id=student.id, class_id=cls.id)
                session.add(enrollment)
        
        session.commit()
        
        # ==========================================
        # PRINT SUMMARY
        # ==========================================
        print("\n✅ Database seeded successfully!")
        print("\n📊 Summary:")
        print(f"   - Admin: 1 (admin@attendance.com / admin123)")
        print(f"   - Mentors: {len(mentors)} (password: mentor123)")
        print(f"   - Students: {len(students)} (password: student123)")
        print(f"   - Courses: {len(courses)}")
        print(f"   - Classes: {len(classes)}")
        
        print("\n🕐 Concurrent Classes:")
        print("   - Monday 9:00 AM: CS101-A (Room 101) & CS201-A (Room 201)")
        print("   - Wednesday 9:00 AM: CS101-B (Room 102) & CS301-B (Room 302)")
        
        print("\n👥 Test Accounts:")
        print("   Admin:   admin@attendance.com / admin123")
        print("   Mentor:  ahmed.hassan@university.edu / mentor123")
        print("   Student: ali.mohamed@student.edu / student123")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error seeding database: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
