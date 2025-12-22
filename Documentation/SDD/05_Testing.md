# Testing Strategy

## 5.1 Overview

The system employs a comprehensive testing strategy including unit tests, integration tests, end-to-end tests, and property-based tests.

## 5.2 Test Coverage Summary

| Test Category | Framework | Count | Coverage |
|---------------|-----------|-------|----------|
| Backend Unit Tests | Pytest | 166+ | Services, Repositories |
| Property-Based Tests | Hypothesis | 14 | Core algorithms |
| E2E Tests | Playwright | 83 | User workflows |
| API Integration | Pytest | 13 | Endpoint verification |

## 5.3 Unit Test Structure

### 5.3.1 Auth Service Tests (65 tests)

```
tests/
├── test_auth_service.py
│   ├── test_password_hashing
│   ├── test_password_verification
│   ├── test_jwt_token_generation
│   ├── test_jwt_token_validation
│   ├── test_jwt_token_expiry
│   ├── test_refresh_token
│   └── test_api_key_validation
└── test_auth_api.py
    ├── test_login_success
    ├── test_login_invalid_credentials
    ├── test_register_new_user
    ├── test_register_duplicate_email
    └── test_protected_route_access
```

### 5.3.2 Schedule Service Tests (23 tests)

```
tests/
└── test_schedule_service.py
    ├── test_create_course
    ├── test_create_class
    ├── test_enroll_student
    ├── test_get_student_schedule
    ├── test_get_mentor_schedule
    └── test_enrollment_validation
```

### 5.3.3 Attendance Service Tests (20 tests)

```
tests/
└── test_attendance_service.py
    ├── test_start_session
    ├── test_end_session
    ├── test_state_transitions
    ├── test_mark_attendance_manual
    ├── test_mark_attendance_ai
    └── test_session_auto_end
```

### 5.3.4 AI Service Tests (19 tests)

```
tests/
└── test_ai_service.py
    ├── test_face_detection
    ├── test_face_enrollment
    ├── test_quality_analysis
    ├── test_pose_classification
    ├── test_duplicate_detection
    ├── test_centroid_computation
    └── test_face_recognition
```

## 5.4 Property-Based Tests

| Property | Description | Validates |
|----------|-------------|-----------|
| Quality Score Bounds | Score always 0.0-1.0 | Quality analyzer |
| Quality Rejection | Low quality always rejected | Enrollment validation |
| Face Size Rejection | Small faces rejected | Size validation |
| Multi-Face Rejection | Multiple faces rejected | Detection validation |
| Centroid Computation | Centroid is normalized | Centroid manager |
| Centroid Match | Best match selected | Recognition |
| Duplicate Detection | Similar faces detected | Duplicate checker |
| Enrollment Limit | Max 10 enrollments | Limit enforcement |
| Adaptive Threshold | Correct threshold selected | Threshold logic |
| Enrollment Completion | 3+ poses required | Pose coverage |
| Adaptive Learning | Toggle works correctly | Feature flag |
| Re-enrollment Flag | Correct flagging | Metrics |
| Liveness Toggle | Toggle works correctly | Feature flag |
| Liveness Rejection | Spoofs rejected | Liveness detection |

## 5.5 E2E Test Structure

```
e2e-tests/
├── tests/
│   ├── auth.spec.ts (10 tests)
│   │   ├── login success for all roles
│   │   ├── login failure handling
│   │   └── logout flow
│   ├── navigation.spec.ts (14 tests)
│   │   ├── sidebar navigation
│   │   ├── protected routes
│   │   └── role-specific menus
│   ├── dashboard.spec.ts (8 tests)
│   │   ├── student dashboard
│   │   ├── mentor dashboard
│   │   └── admin dashboard
│   ├── courses.spec.ts (8 tests)
│   ├── schedule.spec.ts (6 tests)
│   ├── attendance.spec.ts (10 tests)
│   ├── enrollments.spec.ts (8 tests)
│   ├── notifications.spec.ts (6 tests)
│   ├── profile.spec.ts (6 tests)
│   └── error-handling.spec.ts (7 tests)
├── pages/
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   ├── sidebar.page.ts
│   └── ...
└── fixtures/
    └── auth.fixture.ts
```

## 5.6 Test Commands

```bash
# Run all backend tests
cd FastAPI && python -m pytest tests/ -v

# Run with coverage
cd FastAPI && python -m pytest tests/ --cov=services --cov-report=html

# Run specific test file
cd FastAPI && python -m pytest tests/test_auth_service.py -v

# Run E2E tests
cd Others/e2e-tests && npx playwright test

# Run E2E tests with UI
cd Others/e2e-tests && npx playwright test --ui

# Run specific E2E test
cd Others/e2e-tests && npx playwright test auth.spec.ts
```

## 5.7 Test Data

### Test Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.edu | Test123! |
| Mentor | mentor1@school.edu | Test123! |
| Student | student1@school.edu | Test123! |

### Seeded Data

- 24 users (1 admin, 3 mentors, 20 students)
- 6 courses
- 12 classes
- 71 enrollments
- 120 attendance sessions
- 710 attendance records

## 5.8 Continuous Integration

```yaml
# GitHub Actions workflow
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r FastAPI/requirements.txt
      - name: Run tests
        run: cd FastAPI && pytest tests/ -v

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Playwright
        run: cd Others/e2e-tests && npm ci && npx playwright install
      - name: Run E2E tests
        run: cd Others/e2e-tests && npx playwright test
```
