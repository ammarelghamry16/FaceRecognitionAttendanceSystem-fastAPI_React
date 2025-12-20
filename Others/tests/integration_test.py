"""
Integration test for the complete attendance flow.
Tests the full pipeline from user creation to attendance marking.
"""
import sys
from pathlib import Path
import requests
import json
from uuid import uuid4
import time
import base64
import numpy as np
from PIL import Image
import io

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent.parent))

API_BASE = "http://localhost:8000"


class IntegrationTester:
    """Integration tester for the attendance system."""
    
    def __init__(self):
        self.admin_token = None
        self.mentor_token = None
        self.student_token = None
        self.course_id = None
        self.class_id = None
        self.session_id = None
        self.student_id = None
        self.mentor_id = None
    
    def test_health(self):
        """Test API health."""
        print("\n1. Testing API Health...")
        try:
            response = requests.get(f"{API_BASE}/health", timeout=5)
            if response.status_code == 200:
                print("✅ API is healthy")
                return True
            else:
                print(f"❌ API health check failed: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect to API. Make sure the server is running.")
            return False
    
    def create_users(self):
        """Create test users."""
        print("\n2. Creating test users...")
        
        # Create admin user
        admin_data = {
            "email": f"admin_{uuid4().hex[:8]}@test.com",
            "password": "AdminPass123!",
            "full_name": "Test Admin",
            "role": "admin"
        }
        response = requests.post(f"{API_BASE}/api/auth/register", json=admin_data)
        if response.status_code == 201:
            print("✅ Admin user created")
            self.admin_email = admin_data["email"]
            self.admin_password = admin_data["password"]
        else:
            print(f"❌ Admin user creation failed: {response.status_code} - {response.text}")
            return False
        
        # Create mentor user
        mentor_data = {
            "email": f"mentor_{uuid4().hex[:8]}@test.com",
            "password": "MentorPass123!",
            "full_name": "Test Mentor",
            "role": "mentor"
        }
        response = requests.post(f"{API_BASE}/api/auth/register", json=mentor_data)
        if response.status_code == 201:
            print("✅ Mentor user created")
            self.mentor_email = mentor_data["email"]
            self.mentor_password = mentor_data["password"]
        else:
            print(f"❌ Mentor user creation failed: {response.status_code} - {response.text}")
            return False
        
        # Create student user
        student_data = {
            "email": f"student_{uuid4().hex[:8]}@test.com",
            "password": "StudentPass123!",
            "full_name": "Test Student",
            "role": "student",
            "student_id": f"STU{uuid4().hex[:6].upper()}"
        }
        response = requests.post(f"{API_BASE}/api/auth/register", json=student_data)
        if response.status_code == 201:
            print("✅ Student user created")
            self.student_email = student_data["email"]
            self.student_password = student_data["password"]
        else:
            print(f"❌ Student user creation failed: {response.status_code} - {response.text}")
            return False
        
        return True
    
    def login_users(self):
        """Login all test users."""
        print("\n3. Logging in users...")
        
        # Login admin
        response = requests.post(f"{API_BASE}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        if response.status_code == 200:
            data = response.json()
            self.admin_token = data["access_token"]
            print("✅ Admin logged in")
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            return False
        
        # Login mentor
        response = requests.post(f"{API_BASE}/api/auth/login", json={
            "email": self.mentor_email,
            "password": self.mentor_password
        })
        if response.status_code == 200:
            data = response.json()
            self.mentor_token = data["access_token"]
            self.mentor_id = data["user"]["id"]
            print("✅ Mentor logged in")
        else:
            print(f"❌ Mentor login failed: {response.status_code}")
            return False
        
        # Login student
        response = requests.post(f"{API_BASE}/api/auth/login", json={
            "email": self.student_email,
            "password": self.student_password
        })
        if response.status_code == 200:
            data = response.json()
            self.student_token = data["access_token"]
            self.student_id = data["user"]["id"]
            print("✅ Student logged in")
        else:
            print(f"❌ Student login failed: {response.status_code}")
            return False
        
        return True

    def create_course_and_class(self):
        """Create a test course and class."""
        print("\n4. Creating course and class...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create course
        course_data = {
            "code": f"CS{uuid4().hex[:4].upper()}",
            "name": "Introduction to Computer Science",
            "description": "Basic computer science concepts"
        }
        response = requests.post(f"{API_BASE}/api/schedule/courses", json=course_data, headers=headers)
        if response.status_code == 201:
            self.course_id = response.json()["id"]
            print("✅ Course created")
        else:
            print(f"❌ Course creation failed: {response.status_code} - {response.text}")
            return False
        
        # Create class
        class_data = {
            "course_id": self.course_id,
            "mentor_id": self.mentor_id,
            "name": "CS101 - Lecture 1",
            "room_number": "Room 101",
            "day_of_week": "monday",
            "schedule_time": "09:00:00"
        }
        response = requests.post(f"{API_BASE}/api/schedule/classes", json=class_data, headers=headers)
        if response.status_code == 201:
            self.class_id = response.json()["id"]
            print("✅ Class created")
        else:
            print(f"❌ Class creation failed: {response.status_code} - {response.text}")
            return False
        
        # Enroll student in class
        enrollment_data = {
            "student_id": self.student_id,
            "class_id": self.class_id
        }
        response = requests.post(f"{API_BASE}/api/schedule/enrollments", json=enrollment_data, headers=headers)
        if response.status_code == 201:
            print("✅ Student enrolled in class")
        else:
            print(f"❌ Enrollment failed: {response.status_code} - {response.text}")
            return False
        
        return True
    
    def test_attendance_session(self):
        """Test attendance session management."""
        print("\n5. Testing attendance session...")
        
        headers = {"Authorization": f"Bearer {self.mentor_token}"}
        
        # Start session (correct endpoint: /sessions/start)
        session_data = {"class_id": self.class_id}
        response = requests.post(f"{API_BASE}/api/attendance/sessions/start", json=session_data, headers=headers)
        if response.status_code == 201:
            self.session_id = response.json()["id"]
            print("✅ Attendance session started")
        else:
            print(f"❌ Session start failed: {response.status_code} - {response.text}")
            return False
        
        # Get session status
        response = requests.get(f"{API_BASE}/api/attendance/sessions/{self.session_id}", headers=headers)
        if response.status_code == 200:
            session = response.json()
            print(f"✅ Session status: {session['state']}")
        else:
            print(f"❌ Get session failed: {response.status_code}")
            return False
        
        return True
    
    def test_manual_attendance(self):
        """Test manual attendance marking."""
        print("\n6. Testing manual attendance marking...")
        
        headers = {"Authorization": f"Bearer {self.mentor_token}"}
        
        # Mark attendance manually (correct endpoint: /mark/manual)
        attendance_data = {
            "session_id": self.session_id,
            "student_id": self.student_id,
            "status": "present"
        }
        response = requests.post(f"{API_BASE}/api/attendance/mark/manual", json=attendance_data, headers=headers)
        if response.status_code == 200:
            print("✅ Manual attendance marked")
        else:
            print(f"❌ Manual attendance failed: {response.status_code} - {response.text}")
            return False
        
        # Get attendance records
        response = requests.get(f"{API_BASE}/api/attendance/sessions/{self.session_id}/records", headers=headers)
        if response.status_code == 200:
            records = response.json()
            print(f"✅ Retrieved {len(records)} attendance records")
        else:
            print(f"❌ Get records failed: {response.status_code}")
            return False
        
        return True
    
    def test_ai_service(self):
        """Test AI service endpoints."""
        print("\n7. Testing AI service...")
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        # Check enrollment status (correct endpoint: /enrollment/status/{user_id})
        response = requests.get(f"{API_BASE}/api/ai/enrollment/status/{self.student_id}", headers=headers)
        if response.status_code == 200:
            status_data = response.json()
            print(f"✅ Enrollment status: enrolled={status_data.get('is_enrolled', False)}")
        else:
            print(f"⚠️ Enrollment status check: {response.status_code}")
        
        # Create a test image (simple colored rectangle)
        img = Image.new('RGB', (224, 224), color=(128, 128, 128))
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        image_bytes = buffer.getvalue()
        
        # Test face recognition (may fail without real face)
        files = {"image": ("test.jpg", image_bytes, "image/jpeg")}
        response = requests.post(f"{API_BASE}/api/ai/recognize", files=files)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Face recognition: recognized={result.get('recognized', False)}")
        else:
            print(f"⚠️ Face recognition: {response.status_code} (expected without real face)")
        
        return True
    
    def test_notification_service(self):
        """Test notification service."""
        print("\n8. Testing notification service...")
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        # Get notifications for the student (should have session start + attendance notifications)
        response = requests.get(f"{API_BASE}/api/notifications/user/{self.student_id}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            notifications = data.get("notifications", [])
            print(f"✅ Retrieved {len(notifications)} notifications")
            for n in notifications[:3]:  # Show first 3
                print(f"   - {n.get('type')}: {n.get('title')}")
        else:
            print(f"⚠️ Get notifications: {response.status_code}")
        
        # Get notification counts
        response = requests.get(f"{API_BASE}/api/notifications/user/{self.student_id}/count", headers=headers)
        if response.status_code == 200:
            counts = response.json()
            print(f"✅ Notification counts: total={counts.get('total', 0)}, unread={counts.get('unread', 0)}")
        else:
            print(f"⚠️ Get counts: {response.status_code}")
        
        return True
    
    def end_session(self):
        """End the attendance session."""
        print("\n9. Ending attendance session...")
        
        headers = {"Authorization": f"Bearer {self.mentor_token}"}
        
        # End session (correct endpoint: POST /sessions/{id}/end)
        response = requests.post(f"{API_BASE}/api/attendance/sessions/{self.session_id}/end", headers=headers)
        if response.status_code == 200:
            print("✅ Session ended")
        else:
            print(f"❌ End session failed: {response.status_code} - {response.text}")
            return False
        
        # Get session stats
        response = requests.get(f"{API_BASE}/api/attendance/sessions/{self.session_id}/stats", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Session stats: {stats}")
        else:
            print(f"⚠️ Get stats: {response.status_code}")
        
        return True
    
    def run_all_tests(self):
        """Run all integration tests."""
        print("=" * 60)
        print("INTEGRATION TEST - Face Recognition Attendance System")
        print("=" * 60)
        
        tests = [
            ("Health Check", self.test_health),
            ("Create Users", self.create_users),
            ("Login Users", self.login_users),
            ("Create Course & Class", self.create_course_and_class),
            ("Attendance Session", self.test_attendance_session),
            ("Manual Attendance", self.test_manual_attendance),
            ("AI Service", self.test_ai_service),
            ("Notification Service", self.test_notification_service),
            ("End Session", self.end_session),
        ]
        
        passed = 0
        failed = 0
        
        for name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
                    print(f"⚠️ Test '{name}' returned False")
            except Exception as e:
                failed += 1
                print(f"❌ Test '{name}' raised exception: {e}")
        
        print("\n" + "=" * 60)
        print(f"RESULTS: {passed} passed, {failed} failed")
        print("=" * 60)
        
        return failed == 0


if __name__ == "__main__":
    tester = IntegrationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
