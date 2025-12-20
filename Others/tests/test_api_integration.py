"""
API Integration Tests - Verifies all backend endpoints work correctly.
Tests the complete API surface that the frontend depends on.

Usage: 
    cd FastAPI && python -m pytest tests/test_api_integration.py -v
    cd FastAPI && python -m pytest tests/test_api_integration.py -v -m integration
"""
import pytest
import requests
from uuid import UUID
from datetime import datetime

# Base URL for API
BASE_URL = "http://localhost:8000"

# Test credentials
TEST_ADMIN = {"email": "admin@school.edu", "password": "Test123!"}
TEST_MENTOR = {"email": "mentor1@school.edu", "password": "Test123!"}
TEST_STUDENT = {"email": "student1@school.edu", "password": "Test123!"}


class TestAuthEndpoints:
    """Test authentication endpoints."""
    
    @pytest.mark.integration
    def test_login_admin(self):
        """Test admin login."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_ADMIN)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
    
    @pytest.mark.integration
    def test_login_mentor(self):
        """Test mentor login."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_MENTOR)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "mentor"
    
    @pytest.mark.integration
    def test_login_student(self):
        """Test student login."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_STUDENT)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "student"
    
    @pytest.mark.integration
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 404]
    
    @pytest.mark.integration
    def test_get_current_user(self):
        """Test getting current user info."""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_STUDENT)
        token = login_resp.json()["access_token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_STUDENT["email"]


class TestStatsEndpoints:
    """Test stats endpoints (Dashboard data)."""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers for requests."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_ADMIN)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.integration
    def test_dashboard_stats(self, auth_headers):
        """Test dashboard stats endpoint."""
        response = requests.get(f"{BASE_URL}/api/stats/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields
        assert "total_courses" in data
        assert "total_classes" in data
        assert "total_students" in data
        assert "total_mentors" in data
        assert "overall_attendance_rate" in data
        assert "active_sessions" in data
        
        # Values should be non-negative
        assert data["total_courses"] >= 0
        assert data["total_students"] >= 0
    
    @pytest.mark.integration
    def test_user_count(self, auth_headers):
        """Test user count endpoint."""
        response = requests.get(f"{BASE_URL}/api/stats/users/count", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "students" in data
        assert "mentors" in data
        assert "admins" in data
        assert "total" in data


class TestCourseEndpoints:
    """Test course management endpoints."""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_ADMIN)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.integration
    def test_list_courses(self, admin_headers):
        """Test listing courses."""
        response = requests.get(f"{BASE_URL}/api/schedule/courses", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            course = data[0]
            assert "id" in course
            assert "code" in course
            assert "name" in course
    
    @pytest.mark.integration
    def test_get_course_by_id(self, admin_headers):
        """Test getting a specific course."""
        # First get list of courses
        list_resp = requests.get(f"{BASE_URL}/api/schedule/courses", headers=admin_headers)
        courses = list_resp.json()
        
        if len(courses) > 0:
            course_id = courses[0]["id"]
            response = requests.get(f"{BASE_URL}/api/schedule/courses/{course_id}", headers=admin_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == course_id


class TestClassEndpoints:
    """Test class management endpoints."""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_ADMIN)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.integration
    def test_list_classes(self, admin_headers):
        """Test listing classes."""
        response = requests.get(f"{BASE_URL}/api/schedule/classes", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            cls = data[0]
            assert "id" in cls
            assert "name" in cls
    
    @pytest.mark.integration
    def test_get_class_by_id(self, admin_headers):
        """Test getting a specific class."""
        list_resp = requests.get(f"{BASE_URL}/api/schedule/classes", headers=admin_headers)
        classes = list_resp.json()
        
        if len(classes) > 0:
            class_id = classes[0]["id"]
            response = requests.get(f"{BASE_URL}/api/schedule/classes/{class_id}", headers=admin_headers)
            assert response.status_code == 200


class TestEnrollmentEndpoints:
    """Test enrollment endpoints."""
    
    @pytest.fixture
    def student_headers(self):
        """Get student auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_STUDENT)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_ADMIN)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.integration
    def test_list_class_enrollments(self, admin_headers):
        """Test listing enrollments for a class."""
        # First get a class
        classes_resp = requests.get(f"{BASE_URL}/api/schedule/classes", headers=admin_headers)
        classes = classes_resp.json()
        
        if len(classes) > 0:
            class_id = classes[0]["id"]
            response = requests.get(f"{BASE_URL}/api/schedule/enrollments/class/{class_id}", headers=admin_headers)
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


class TestAttendanceEndpoints:
    """Test attendance endpoints."""
    
    @pytest.fixture
    def mentor_headers(self):
        """Get mentor auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_MENTOR)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def student_headers(self):
        """Get student auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_STUDENT)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_ADMIN)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.integration
    def test_get_class_sessions(self, admin_headers):
        """Test getting attendance sessions for a class."""
        # First get a class
        classes_resp = requests.get(f"{BASE_URL}/api/schedule/classes", headers=admin_headers)
        classes = classes_resp.json()
        
        if len(classes) > 0:
            class_id = classes[0]["id"]
            response = requests.get(f"{BASE_URL}/api/attendance/sessions/class/{class_id}", headers=admin_headers)
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
    
    @pytest.mark.integration
    def test_get_student_history(self, student_headers):
        """Test getting student's attendance history."""
        # Get current user to get student_id
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers=student_headers)
        user = me_resp.json()
        student_id = user["id"]
        
        response = requests.get(f"{BASE_URL}/api/attendance/history/student/{student_id}", headers=student_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestScheduleEndpoints:
    """Test schedule endpoints."""
    
    @pytest.fixture
    def student_headers(self):
        """Get student auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_STUDENT)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_ADMIN)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.integration
    def test_get_full_schedule(self, admin_headers):
        """Test getting full schedule."""
        response = requests.get(f"{BASE_URL}/api/schedule/schedule/full", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.integration
    def test_get_student_schedule(self, student_headers):
        """Test getting student schedule."""
        # Get current user to get student_id
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers=student_headers)
        user = me_resp.json()
        student_id = user["id"]
        
        response = requests.get(f"{BASE_URL}/api/schedule/schedule/student/{student_id}", headers=student_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestNotificationEndpoints:
    """Test notification endpoints."""
    
    @pytest.fixture
    def student_headers(self):
        """Get student auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_STUDENT)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.integration
    def test_list_notifications(self, student_headers):
        """Test listing notifications."""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=student_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestAIServiceEndpoints:
    """Test AI/Face Recognition endpoints."""
    
    @pytest.fixture
    def student_headers(self):
        """Get student auth headers."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_STUDENT)
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.mark.integration
    def test_face_enrollment_status(self, student_headers):
        """Test checking face enrollment status."""
        response = requests.get(f"{BASE_URL}/api/ai/enrollment/status", headers=student_headers)
        # May return 200 or 404 depending on enrollment status
        assert response.status_code in [200, 404]


class TestHealthEndpoints:
    """Test health check endpoints."""
    
    @pytest.mark.integration
    def test_health_check(self):
        """Test main health endpoint."""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
    
    @pytest.mark.integration
    def test_root_endpoint(self):
        """Test root endpoint."""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200


# ============== Quick Verification Script ==============

def run_quick_verification():
    """Run a quick verification of all critical endpoints."""
    print("=" * 60)
    print("API INTEGRATION VERIFICATION")
    print("=" * 60)
    
    results = []
    
    def check(name, func):
        try:
            func()
            results.append((name, "PASS", None))
            print(f"  [PASS] {name}")
        except Exception as e:
            results.append((name, "FAIL", str(e)))
            print(f"  [FAIL] {name}: {e}")
    
    # Health checks
    print("\n[Health Checks]")
    check("Root endpoint", lambda: assert_status(requests.get(f"{BASE_URL}/"), 200))
    check("Health endpoint", lambda: assert_status(requests.get(f"{BASE_URL}/health"), 200))
    
    # Auth
    print("\n[Authentication]")
    check("Admin login", lambda: assert_login(TEST_ADMIN))
    check("Mentor login", lambda: assert_login(TEST_MENTOR))
    check("Student login", lambda: assert_login(TEST_STUDENT))
    
    # Get tokens for authenticated requests
    admin_token = get_token(TEST_ADMIN)
    mentor_token = get_token(TEST_MENTOR)
    student_token = get_token(TEST_STUDENT)
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    mentor_headers = {"Authorization": f"Bearer {mentor_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    
    # Stats (Dashboard)
    print("\n[Dashboard Stats]")
    check("Dashboard stats", lambda: assert_status(
        requests.get(f"{BASE_URL}/api/stats/dashboard", headers=admin_headers), 200))
    check("User count", lambda: assert_status(
        requests.get(f"{BASE_URL}/api/stats/users/count", headers=admin_headers), 200))
    
    # Courses
    print("\n[Courses]")
    check("List courses", lambda: assert_status(
        requests.get(f"{BASE_URL}/api/schedule/courses", headers=admin_headers), 200))
    
    # Classes
    print("\n[Classes]")
    check("List classes", lambda: assert_status(
        requests.get(f"{BASE_URL}/api/schedule/classes", headers=admin_headers), 200))
    
    # Schedule
    print("\n[Schedule]")
    check("Full schedule", lambda: assert_status(
        requests.get(f"{BASE_URL}/api/schedule/schedule/full", headers=admin_headers), 200))
    
    # Get a class ID for enrollment/attendance tests
    classes_resp = requests.get(f"{BASE_URL}/api/schedule/classes", headers=admin_headers)
    class_id = classes_resp.json()[0]["id"] if classes_resp.json() else None
    
    # Enrollments
    print("\n[Enrollments]")
    if class_id:
        check("Class enrollments", lambda: assert_status(
            requests.get(f"{BASE_URL}/api/schedule/enrollments/class/{class_id}", headers=admin_headers), 200))
    else:
        print("  [SKIP] No classes found")
    
    # Attendance
    print("\n[Attendance]")
    if class_id:
        check("Class sessions", lambda: assert_status(
            requests.get(f"{BASE_URL}/api/attendance/sessions/class/{class_id}", headers=admin_headers), 200))
    
    # Notifications
    print("\n[Notifications]")
    check("List notifications", lambda: assert_status(
        requests.get(f"{BASE_URL}/api/notifications", headers=student_headers), 200))
    
    # Summary
    print("\n" + "=" * 60)
    passed = sum(1 for r in results if r[1] == "PASS")
    failed = sum(1 for r in results if r[1] == "FAIL")
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0


def assert_status(response, expected):
    """Assert response status code."""
    assert response.status_code == expected, f"Expected {expected}, got {response.status_code}"


def assert_login(credentials):
    """Assert login works and returns token."""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials)
    assert response.status_code == 200, f"Login failed: {response.status_code}"
    data = response.json()
    assert "access_token" in data, "No access_token in response"


def get_token(credentials):
    """Get auth token for credentials."""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials)
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


if __name__ == "__main__":
    import sys
    success = run_quick_verification()
    sys.exit(0 if success else 1)
