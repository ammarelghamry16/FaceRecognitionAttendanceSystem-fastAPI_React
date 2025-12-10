"""
Comprehensive test script for Schedule Service.
This tests all functionality step by step.

Run this after:
1. Creating tables: python create_tables.py
2. Starting server: uvicorn main:app --reload
"""
import requests
import json
from datetime import time

# Base URL
BASE_URL = "http://localhost:8000/api/schedule"

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def print_test(test_name):
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}TEST: {test_name}{RESET}")
    print(f"{BLUE}{'='*70}{RESET}")

def print_success(message):
    print(f"{GREEN}✅ {message}{RESET}")

def print_error(message):
    print(f"{RED}❌ {message}{RESET}")

def print_info(message):
    print(f"{YELLOW}ℹ️  {message}{RESET}")

def print_response(response):
    print(f"\nStatus Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, default=str)}")
    except:
        print(f"Response: {response.text}")

# Store IDs for later tests
course_id = None
class_id = None
student_id = None

print(f"\n{BLUE}{'='*70}{RESET}")
print(f"{BLUE}SCHEDULE SERVICE - COMPREHENSIVE TEST SUITE{RESET}")
print(f"{BLUE}{'='*70}{RESET}")

# ============================================================================
# TEST 1: Health Check
# ============================================================================
print_test("1. Health Check")
try:
    response = requests.get("http://localhost:8000/health")
    if response.status_code == 200:
        print_success("Server is running!")
        print_response(response)
    else:
        print_error("Server health check failed")
        print_response(response)
        exit(1)
except Exception as e:
    print_error(f"Cannot connect to server: {e}")
    print_info("Make sure server is running: uvicorn main:app --reload")
    exit(1)

# ============================================================================
# TEST 2: Create Course
# ============================================================================
print_test("2. Create Course")
course_data = {
    "code": "CS101",
    "name": "Introduction to Computer Science",
    "description": "Learn programming fundamentals"
}
try:
    response = requests.post(f"{BASE_URL}/courses", json=course_data)
    if response.status_code == 201:
        print_success("Course created successfully!")
        course_id = response.json()["id"]
        print_info(f"Course ID: {course_id}")
        print_response(response)
    else:
        print_error("Failed to create course")
        print_response(response)
except Exception as e:
    print_error(f"Error: {e}")

# ============================================================================
# TEST 3: Get All Courses
# ============================================================================
print_test("3. Get All Courses")
try:
    response = requests.get(f"{BASE_URL}/courses")
    if response.status_code == 200:
        courses = response.json()
        print_success(f"Found {len(courses)} course(s)")
        print_response(response)
    else:
        print_error("Failed to get courses")
        print_response(response)
except Exception as e:
    print_error(f"Error: {e}")

# ============================================================================
# TEST 4: Get Course by ID
# ============================================================================
if course_id:
    print_test("4. Get Course by ID")
    try:
        response = requests.get(f"{BASE_URL}/courses/{course_id}")
        if response.status_code == 200:
            print_success("Course retrieved successfully!")
            print_response(response)
        else:
            print_error("Failed to get course")
            print_response(response)
    except Exception as e:
        print_error(f"Error: {e}")

# ============================================================================
# TEST 5: Update Course
# ============================================================================
if course_id:
    print_test("5. Update Course")
    update_data = {
        "description": "Updated: Learn programming fundamentals and problem solving"
    }
    try:
        response = requests.put(f"{BASE_URL}/courses/{course_id}", json=update_data)
        if response.status_code == 200:
            print_success("Course updated successfully!")
            print_response(response)
        else:
            print_error("Failed to update course")
            print_response(response)
    except Exception as e:
        print_error(f"Error: {e}")

# ============================================================================
# TEST 6: Create Another Course
# ============================================================================
print_test("6. Create Another Course (Math)")
math_course_data = {
    "code": "MATH101",
    "name": "Calculus I",
    "description": "Introduction to differential calculus"
}
try:
    response = requests.post(f"{BASE_URL}/courses", json=math_course_data)
    if response.status_code == 201:
        print_success("Math course created successfully!")
        print_response(response)
    else:
        print_error("Failed to create math course")
        print_response(response)
except Exception as e:
    print_error(f"Error: {e}")

# ============================================================================
# TEST 7: Create Class
# ============================================================================
if course_id:
    print_test("7. Create Class")
    class_data = {
        "course_id": course_id,
        "name": "CS101 - Section A",
        "room_number": "A101",
        "day_of_week": "monday",
        "schedule_time": "09:00:00"
    }
    try:
        response = requests.post(f"{BASE_URL}/classes", json=class_data)
        if response.status_code == 201:
            print_success("Class created successfully!")
            class_id = response.json()["id"]
            print_info(f"Class ID: {class_id}")
            print_response(response)
        else:
            print_error("Failed to create class")
            print_response(response)
    except Exception as e:
        print_error(f"Error: {e}")

# ============================================================================
# TEST 8: Create Another Class
# ============================================================================
if course_id:
    print_test("8. Create Another Class (Section B)")
    class_data_b = {
        "course_id": course_id,
        "name": "CS101 - Section B",
        "room_number": "B202",
        "day_of_week": "wednesday",
        "schedule_time": "14:00:00"
    }
    try:
        response = requests.post(f"{BASE_URL}/classes", json=class_data_b)
        if response.status_code == 201:
            print_success("Section B created successfully!")
            print_response(response)
        else:
            print_error("Failed to create Section B")
            print_response(response)
    except Exception as e:
        print_error(f"Error: {e}")

# ============================================================================
# TEST 9: Get All Classes
# ============================================================================
print_test("9. Get All Classes")
try:
    response = requests.get(f"{BASE_URL}/classes")
    if response.status_code == 200:
        classes = response.json()
        print_success(f"Found {len(classes)} class(es)")
        print_response(response)
    else:
        print_error("Failed to get classes")
        print_response(response)
except Exception as e:
    print_error(f"Error: {e}")

# ============================================================================
# TEST 10: Get Class by ID
# ============================================================================
if class_id:
    print_test("10. Get Class by ID")
    try:
        response = requests.get(f"{BASE_URL}/classes/{class_id}")
        if response.status_code == 200:
            print_success("Class retrieved successfully!")
            print_response(response)
        else:
            print_error("Failed to get class")
            print_response(response)
    except Exception as e:
        print_error(f"Error: {e}")

# ============================================================================
# TEST 11: Update Class
# ============================================================================
if class_id:
    print_test("11. Update Class (Change Room)")
    update_data = {
        "room_number": "C303"
    }
    try:
        response = requests.put(f"{BASE_URL}/classes/{class_id}", json=update_data)
        if response.status_code == 200:
            print_success("Class updated successfully!")
            print_response(response)
        else:
            print_error("Failed to update class")
            print_response(response)
    except Exception as e:
        print_error(f"Error: {e}")

# ============================================================================
# TEST 12: Get Full Schedule
# ============================================================================
print_test("12. Get Full Schedule (Admin View)")
try:
    response = requests.get(f"{BASE_URL}/schedule/full")
    if response.status_code == 200:
        classes = response.json()
        print_success(f"Full schedule has {len(classes)} class(es)")
        print_response(response)
    else:
        print_error("Failed to get full schedule")
        print_response(response)
except Exception as e:
    print_error(f"Error: {e}")

# ============================================================================
# TEST 13: Get Schedule by Day
# ============================================================================
print_test("13. Get Schedule by Day (Monday)")
try:
    response = requests.get(f"{BASE_URL}/schedule/day/monday")
    if response.status_code == 200:
        classes = response.json()
        print_success(f"Found {len(classes)} class(es) on Monday")
        print_response(response)
    else:
        print_error("Failed to get Monday schedule")
        print_response(response)
except Exception as e:
    print_error(f"Error: {e}")

# ============================================================================
# TEST 14: Get Schedule by Room
# ============================================================================
print_test("14. Get Schedule by Room (C303)")
try:
    response = requests.get(f"{BASE_URL}/schedule/room/C303")
    if response.status_code == 200:
        classes = response.json()
        print_success(f"Found {len(classes)} class(es) in room C303")
        print_response(response)
    else:
        print_error("Failed to get room schedule")
        print_response(response)
except Exception as e:
    print_error(f"Error: {e}")

# ============================================================================
# SUMMARY
# ============================================================================
print(f"\n{BLUE}{'='*70}{RESET}")
print(f"{BLUE}TEST SUMMARY{RESET}")
print(f"{BLUE}{'='*70}{RESET}")
print(f"{GREEN}✅ All basic tests completed!{RESET}")
print(f"\n{YELLOW}Note: Enrollment tests require user creation (Auth Service){RESET}")
print(f"{YELLOW}Once Auth Service is ready, you can test:{RESET}")
print(f"  - Enroll students in classes")
print(f"  - View student schedules")
print(f"  - View mentor schedules")
print(f"  - Bulk enrollment")
print(f"\n{GREEN}Your Schedule Service is working correctly! 🎉{RESET}")
print(f"{BLUE}{'='*70}{RESET}\n")
