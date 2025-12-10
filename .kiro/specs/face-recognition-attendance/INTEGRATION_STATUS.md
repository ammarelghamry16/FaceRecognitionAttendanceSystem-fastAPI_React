# Integration Status Document

> **Last Updated:** December 10, 2024
> **Purpose:** Single source of truth for implementation status, API contracts, and integration requirements.
> **Audience:** Team members, AI assistants, future developers

---

## Table of Contents
1. [Implementation Status](#1-implementation-status)
2. [API Contracts](#2-api-contracts)
3. [Integration Points](#3-integration-points)
4. [Mock Data & Placeholders](#4-mock-data--placeholders)
5. [Database Schema](#5-database-schema)
6. [Setup Instructions](#6-setup-instructions)
7. [Team Tasks](#7-team-tasks)

---

## 1. Implementation Status

### Legend
- ✅ **Complete** - Fully implemented and tested
- 🔶 **Partial** - Structure exists, needs completion
- ❌ **Not Started** - Only placeholder files exist
- 🔗 **Depends On** - Blocked by another component

### Services Overview

| Service | Status | Owner | Notes |
|---------|--------|-------|-------|
| Shared Module | ✅ Complete | - | Database, Cache, Models |
| Schedule Service | ✅ Complete | - | Full CRUD + filtering |
| Notification Service | ✅ Complete | - | Factory + Observer + WebSocket |
| Auth Service | ❌ Not Started | Team Member | Blocking protected endpoints |
| Attendance Service | ❌ Not Started | Team Member | Blocking AI integration |
| AI Service | ❌ Not Started | Team Member | Depends on Attendance |
| Edge Agent | ❌ Not Started | Team Member | Standalone app |
| API Gateway Middleware | 🔶 Partial | - | Auth middleware pending |
| Frontend | 🔶 Partial | - | Core structure + pages done, uses mock auth |

### Detailed Component Status

#### Shared Module (`shared/`)
```
shared/
├── database/
│   ├── connection.py      ✅ Singleton pattern, connection pooling
│   ├── base.py            ✅ SQLAlchemy Base class
│   └── migrations.py      ✅ Migration utilities
├── cache/
│   └── cache_manager.py   ✅ Redis Singleton, full CRUD operations
├── models/
│   ├── user.py            ✅ User SQLAlchemy model
│   └── enums.py           ✅ UserRole, WeekDay, ClassState enums
└── config/
    └── __init__.py        🔶 Placeholder (using .env directly)
```

#### Schedule Service (`services/schedule_service/`)
```
schedule_service/
├── models/
│   ├── course.py          ✅ Course model
│   ├── class_model.py     ✅ Class model with state
│   └── enrollment.py      ✅ Enrollment model
├── repositories/
│   ├── base_repository.py ✅ Generic repository pattern
│   ├── course_repository.py ✅ Course data access
│   ├── class_repository.py  ✅ Class data access + filtering
│   └── enrollment_repository.py ✅ Enrollment data access
├── services/
│   ├── schedule_service.py  ✅ Business logic + role filtering
│   └── enrollment_service.py ✅ Enrollment management
├── schemas/
│   ├── request.py         ✅ Pydantic request models
│   └── response.py        ✅ Pydantic response models
├── cache/
│   └── schedule_cache.py  ✅ Cache-aside pattern
└── api/
    └── routes.py          ✅ Full REST API (no auth protection yet)
```

#### Notification Service (`services/notification_service/`) - ✅ COMPLETE
```
notification_service/
├── __init__.py            ✅ Module exports and documentation
├── models/
│   ├── __init__.py        ✅ Model exports
│   └── notification.py    ✅ Notification SQLAlchemy model
├── repositories/
│   ├── __init__.py        ✅ Repository exports
│   └── notification_repository.py ✅ Full CRUD + queries
├── factory/
│   ├── __init__.py        ✅ Factory exports
│   └── notification_factory.py ✅ 11 notification types supported
├── observer/
│   ├── __init__.py        ✅ Observer exports
│   ├── subject.py         ✅ NotificationSubject (Singleton)
│   ├── observer.py        ✅ INotificationObserver interface
│   └── websocket_observer.py ✅ WebSocket delivery implementation
├── services/
│   ├── __init__.py        ✅ Service exports
│   └── notification_service.py ✅ Full business logic
├── schemas/
│   ├── __init__.py        ✅ Schema exports
│   ├── request.py         ✅ NotificationCreate, BroadcastNotification
│   └── response.py        ✅ NotificationResponse, WebSocketMessage
└── api/
    ├── __init__.py        ✅ API exports
    ├── routes.py          ✅ Full REST API (12 endpoints)
    └── websocket.py       ✅ WebSocket endpoint with ping/pong
```

#### Auth Service (`services/auth_service/`) - ❌ NOT IMPLEMENTED
```
auth_service/
├── models/
│   ├── user.py            ❌ Need: password_hash field, timestamps
│   └── api_key.py         ❌ Need: API key model for Edge Agents
├── repositories/
│   ├── user_repository.py ❌ Need: find_by_email, create user
│   └── api_key_repository.py ❌ Need: validate API key
├── strategies/
│   ├── auth_strategy.py   ❌ Need: IAuthStrategy interface
│   ├── jwt_strategy.py    ❌ Need: JWT generation/validation
│   └── api_key_strategy.py ❌ Need: API key validation
├── services/
│   ├── auth_service.py    ❌ Need: login, register, validate
│   ├── token_service.py   ❌ Need: JWT operations
│   └── password_service.py ❌ Need: bcrypt hashing
└── api/
    └── routes.py          ❌ Need: /login, /register, /refresh, /validate
```

#### Attendance Service (`services/attendance_service/`) - ❌ NOT IMPLEMENTED
```
attendance_service/
├── models/
│   ├── attendance_session.py ❌ Need: session tracking
│   └── attendance_record.py  ❌ Need: student attendance records
├── repositories/
│   ├── session_repository.py    ❌ Need: session CRUD
│   └── attendance_repository.py ❌ Need: record CRUD
├── state_machine/
│   ├── class_state.py     ❌ Need: Abstract base state
│   ├── inactive_state.py  ❌ Need: Inactive state behavior
│   ├── active_state.py    ❌ Need: Active state behavior
│   └── completed_state.py ❌ Need: Completed state behavior
├── services/
│   ├── attendance_service.py ❌ Need: session management, marking
│   └── session_service.py    ❌ Need: session lifecycle
└── api/
    └── routes.py          ❌ Need: activate, deactivate, mark, history
```

#### AI Service (`services/ai_service/`) - ❌ NOT IMPLEMENTED
```
ai_service/
├── adapters/
│   ├── base_adapter.py           ❌ Need: IFaceRecognitionAdapter
│   ├── face_recognition_adapter.py ❌ Need: face_recognition lib wrapper
│   └── deepface_adapter.py       ❌ Need: DeepFace lib wrapper (optional)
├── consumer/
│   └── message_consumer.py       ❌ Need: RabbitMQ consumer
├── repositories/
│   └── face_encoding_repository.py ❌ Need: encoding storage
└── services/
    ├── recognition_service.py    ❌ Need: face matching logic
    └── encoding_service.py       ❌ Need: encoding management
```

#### Edge Agent (`edge_agent/`) - ❌ NOT IMPLEMENTED
```
edge_agent/
├── camera/
│   ├── camera_adapter.py  ❌ Need: ICameraAdapter interface
│   └── opencv_adapter.py  ❌ Need: OpenCV implementation
├── preprocessing/
│   ├── face_detector.py   ❌ Need: face detection
│   └── frame_processor.py ❌ Need: resize, normalize
├── api_client/
│   ├── client.py          ❌ Need: API Gateway communication
│   └── retry_handler.py   ❌ Need: exponential backoff
└── main.py                ❌ Need: capture loop
```

---

## 2. API Contracts

### Currently Available Endpoints (Schedule Service)

Base URL: `http://localhost:8000/api/schedule`

#### Courses
| Method | Endpoint | Request Body | Response | Status |
|--------|----------|--------------|----------|--------|
| POST | `/courses` | `CourseCreate` | `CourseResponse` | ✅ |
| GET | `/courses` | - | `List[CourseResponse]` | ✅ |
| GET | `/courses/{id}` | - | `CourseResponse` | ✅ |
| PUT | `/courses/{id}` | `CourseUpdate` | `CourseResponse` | ✅ |
| DELETE | `/courses/{id}` | - | 204 No Content | ✅ |

#### Classes
| Method | Endpoint | Request Body | Response | Status |
|--------|----------|--------------|----------|--------|
| POST | `/classes` | `ClassCreate` | `ClassResponse` | ✅ |
| GET | `/classes` | - | `List[ClassResponse]` | ✅ |
| GET | `/classes/{id}` | - | `ClassResponse` | ✅ |
| PUT | `/classes/{id}` | `ClassUpdate` | `ClassResponse` | ✅ |
| DELETE | `/classes/{id}` | - | 204 No Content | ✅ |

#### Schedule Filtering
| Method | Endpoint | Response | Status |
|--------|----------|----------|--------|
| GET | `/schedule/student/{student_id}` | `List[ClassResponse]` | ✅ |
| GET | `/schedule/mentor/{mentor_id}` | `List[ClassResponse]` | ✅ |
| GET | `/schedule/full` | `List[ClassResponse]` | ✅ |
| GET | `/schedule/day/{day}` | `List[ClassResponse]` | ✅ |
| GET | `/schedule/room/{room}` | `List[ClassResponse]` | ✅ |

#### Enrollments
| Method | Endpoint | Request Body | Response | Status |
|--------|----------|--------------|----------|--------|
| POST | `/enrollments` | `EnrollmentCreate` | `EnrollmentResponse` | ✅ |
| DELETE | `/enrollments/{student_id}/{class_id}` | - | 204 No Content | ✅ |
| GET | `/enrollments/student/{student_id}` | - | `List[EnrollmentResponse]` | ✅ |
| GET | `/enrollments/class/{class_id}` | - | `List[EnrollmentResponse]` | ✅ |

### Notification Service Endpoints (NEW)

Base URL: `http://localhost:8000/api/notifications`

| Method | Endpoint | Request Body | Response | Status |
|--------|----------|--------------|----------|--------|
| GET | `/` | - | `List[NotificationResponse]` | ✅ |
| GET | `/{id}` | - | `NotificationResponse` | ✅ |
| GET | `/user/{user_id}` | - | `List[NotificationResponse]` | ✅ |
| GET | `/user/{user_id}/unread` | - | `List[NotificationResponse]` | ✅ |
| PUT | `/{id}/read` | - | `NotificationResponse` | ✅ |
| PUT | `/user/{user_id}/read-all` | - | `{"marked_count": int}` | ✅ |
| DELETE | `/{id}` | - | 204 No Content | ✅ |
| WS | `/ws/{user_id}` | - | WebSocket connection | ✅ |

### Required Endpoints (Auth Service) - ❌ NOT IMPLEMENTED

Base URL: `http://localhost:8000/api/auth`

| Method | Endpoint | Request Body | Response | Owner |
|--------|----------|--------------|----------|-------|
| POST | `/login` | `{"email": str, "password": str}` | `{"access_token": str, "refresh_token": str, "user": User}` | Auth Team |
| POST | `/register` | `UserCreate` | `UserResponse` | Auth Team |
| POST | `/refresh` | `{"refresh_token": str}` | `{"access_token": str}` | Auth Team |
| GET | `/me` | - (JWT header) | `UserResponse` | Auth Team |
| POST | `/validate-api-key` | `{"api_key": str}` | `{"valid": bool, "agent_id": str}` | Auth Team |

### Required Endpoints (Attendance Service) - ❌ NOT IMPLEMENTED

Base URL: `http://localhost:8000/api/attendance`

| Method | Endpoint | Request Body | Response | Owner |
|--------|----------|--------------|----------|-------|
| POST | `/sessions/start/{class_id}` | - | `AttendanceSessionResponse` | Attendance Team |
| POST | `/sessions/{session_id}/end` | - | `AttendanceSessionResponse` | Attendance Team |
| POST | `/mark` | `{"session_id": UUID, "student_id": UUID, "status": str}` | `AttendanceRecordResponse` | Attendance Team |
| GET | `/history/student/{student_id}` | - | `List[AttendanceRecordResponse]` | Attendance Team |
| GET | `/history/class/{class_id}` | - | `List[AttendanceRecordResponse]` | Attendance Team |
| GET | `/sessions/{session_id}` | - | `AttendanceSessionResponse` | Attendance Team |
| POST | `/internal/recognize` | `RecognitionResult` | `AttendanceRecordResponse` | Attendance Team |

---

## 3. Integration Points

### Service Communication Map

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│ API Gateway │────▶│   Services  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │   Auth   │  │  Rate    │
              │Middleware│  │ Limiter  │
              └──────────┘  └──────────┘
```

### Integration Requirements

#### 1. Auth → All Services
**What's needed:** JWT validation middleware
**Contract:**
```python
# All protected endpoints need this dependency
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # Validate JWT, return user
    pass

# Usage in routes:
@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    pass
```

**Integration steps when Auth is ready:**
1. Import `get_current_user` from auth service
2. Add as dependency to protected routes
3. Remove mock user IDs from requests

#### 2. Schedule → Notification
**What's needed:** Trigger notifications on schedule changes
**Contract:**
```python
# When schedule changes, call:
notification_service.create_and_broadcast(
    notification_type="schedule_updated",
    user_ids=[...],  # affected users
    data={"class_id": ..., "change_type": "created|updated|deleted"}
)
```

**Current status:** ✅ Notification service ready, Schedule service needs to call it

#### 3. Attendance → Notification
**What's needed:** Trigger notifications on attendance events
**Contract:**
```python
# When class activated:
notification_service.create_and_broadcast(
    notification_type="class_started",
    user_ids=[...],  # enrolled students
    data={"class_id": ..., "class_name": ...}
)

# When attendance marked:
notification_service.create_and_broadcast(
    notification_type="attendance_confirmed",
    user_ids=[student_id],
    data={"class_name": ..., "status": "present|late"}
)
```

**Current status:** ✅ Notification service ready, waiting for Attendance service

#### 4. AI Service → Attendance
**What's needed:** Send recognition results
**Contract:**
```python
# AI Service calls this internal endpoint:
POST /api/attendance/internal/recognize
{
    "session_id": "uuid",
    "student_id": "uuid",
    "confidence": 0.85,
    "timestamp": "iso8601"
}
```

**Current status:** ❌ Both services not implemented

#### 5. Edge Agent → API Gateway
**What's needed:** Frame upload endpoint
**Contract:**
```python
# Edge Agent sends frames:
POST /api/face/upload
Headers: X-API-Key: <edge_agent_api_key>
Body: {
    "session_id": "uuid",
    "frame_data": "base64_encoded",
    "timestamp": "iso8601",
    "metadata": {...}
}
```

**Current status:** ❌ Endpoint not implemented, needs Auth service for API key validation

---

## 4. Mock Data & Placeholders

### Current Mocks in Use

#### Mock User IDs (for testing without Auth)
```python
# Use these UUIDs for testing:
MOCK_STUDENT_ID = "550e8400-e29b-41d4-a716-446655440001"
MOCK_MENTOR_ID = "550e8400-e29b-41d4-a716-446655440002"
MOCK_ADMIN_ID = "550e8400-e29b-41d4-a716-446655440003"
```

#### Mock Authentication (Frontend)
```javascript
// frontend/src/services/mockAuth.js
export const mockLogin = async (email, password) => {
  return {
    access_token: "mock-jwt-token",
    user: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      email: email,
      role: "student",
      first_name: "Test",
      last_name: "User"
    }
  };
};
```

### How to Replace Mocks

When Auth service is ready:
1. **Backend:** Add `Depends(get_current_user)` to routes
2. **Frontend:** Replace `mockAuth.js` calls with real API calls
3. **Tests:** Update test fixtures to use real auth flow

---

## 5. Database Schema

### Implemented Tables

```sql
-- Users (shared/models/user.py)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    schedule_time TIME NOT NULL,
    state VARCHAR(20) DEFAULT 'inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id)
);

-- Notifications (NEW)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Required Tables (Not Implemented)

```sql
-- Auth Team: Add password_hash to users
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- Auth Team: API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    edge_agent_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Attendance Team: Sessions
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    state VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Team: Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    marked_at TIMESTAMP,
    recognition_confidence FLOAT,
    marked_manually BOOLEAN DEFAULT FALSE,
    UNIQUE(session_id, student_id)
);

-- AI Team: Face Encodings
CREATE TABLE face_encodings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encoding BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Setup Instructions

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Redis 7+
- Node.js 18+ (for frontend)

### Backend Setup

```bash
# 1. Navigate to FastAPI directory
cd FastAPI

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 5. Create database tables
python temp/create_tables.py

# 6. Run the server
python main.py
# Or: uvicorn main:app --reload

# 7. Access API docs
# http://localhost:8000/docs
```

### Environment Variables (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/attendance_db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
DB_ECHO=false

# Auth Service (when implemented)
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30
```

### Running Tests
```bash
# Run all tests
pytest

# Run specific service tests
pytest tests/test_schedule_service.py -v
```

---

## 7. Team Tasks

### Auth Team Tasks

**Priority: HIGH (Blocking other features)**

- [ ] Add `password_hash` column to User model
- [ ] Create `APIKey` model
- [ ] Implement `UserRepository` with `find_by_email`
- [ ] Implement `APIKeyRepository`
- [ ] Implement `JWTAuthStrategy` (generate, validate tokens)
- [ ] Implement `APIKeyAuthStrategy`
- [ ] Implement `PasswordService` (bcrypt hashing)
- [ ] Create auth routes (`/login`, `/register`, `/refresh`)
- [ ] Create `get_current_user` dependency for protected routes
- [ ] Write unit tests

**Deliverables:**
1. Working login/register endpoints
2. JWT token generation and validation
3. `get_current_user` dependency that other services can import

### Attendance Team Tasks

**Priority: HIGH (Core feature)**

- [ ] Create `AttendanceSession` model
- [ ] Create `AttendanceRecord` model
- [ ] Implement State Machine (Inactive → Active → Completed)
- [ ] Implement `SessionRepository`
- [ ] Implement `AttendanceRepository`
- [ ] Implement `AttendanceService`
- [ ] Create routes for session management
- [ ] Create internal endpoint for AI service results
- [ ] Integrate with Notification Service
- [ ] Write unit tests

**Deliverables:**
1. Class activation/deactivation with state machine
2. Manual attendance marking
3. Attendance history endpoints
4. Integration with notifications

### AI Team Tasks

**Priority: MEDIUM (Depends on Attendance)**

- [ ] Implement `IFaceRecognitionAdapter` interface
- [ ] Implement `FaceRecognitionAdapter` (face_recognition library)
- [ ] Create `FaceEncoding` model
- [ ] Implement `FaceEncodingRepository`
- [ ] Implement `MessageConsumer` for RabbitMQ
- [ ] Implement `RecognitionService`
- [ ] Create endpoint for adding student face encodings
- [ ] Write unit tests

**Deliverables:**
1. Face encoding storage and retrieval
2. Face matching with confidence scores
3. Message queue consumer for frame processing

### Edge Agent Team Tasks

**Priority: LOW (Standalone, can be done last)**

- [ ] Implement `ICameraAdapter` interface
- [ ] Implement `OpenCVAdapter`
- [ ] Implement `FaceDetector`
- [ ] Implement `FrameProcessor`
- [ ] Implement `APIClient` with retry logic
- [ ] Create main capture loop
- [ ] Configuration management
- [ ] Write unit tests

**Deliverables:**
1. Standalone Python application
2. Camera capture and preprocessing
3. Frame upload to API Gateway

---

## 8. Frontend Status

### Current Implementation (`frontend/my-app/`)

| Component | Status | Mock/Real | Integration Notes |
|-----------|--------|-----------|-------------------|
| **Auth** | 🔶 Mock | Mock | Uses `authService.ts` with hardcoded users. Replace with real API when Auth Service ready |
| **Schedule API** | ✅ Real | Real | Calls real backend endpoints |
| **Notification API** | ✅ Real | Real | Calls real backend endpoints |
| **WebSocket** | ❌ Not Connected | - | Service ready, hook not implemented yet |

### Mock Data in Frontend

**Location:** `frontend/my-app/src/services/authService.ts`

```typescript
// Mock users - replace when Auth Service is ready
const MOCK_USERS = {
  'student@test.com': { id: '550e8400-...001', role: 'student' },
  'mentor@test.com': { id: '550e8400-...002', role: 'mentor' },
  'admin@test.com': { id: '550e8400-...003', role: 'admin' },
};
```

### Integration Steps When Auth Service Ready

1. **Update `authService.ts`:**
   - Replace `mockLogin()` with real API call to `/api/auth/login`
   - Add real token refresh logic
   - Remove `MOCK_USERS` object

2. **Update `api.ts`:**
   - Token interceptor already configured, will work automatically

3. **No changes needed in:**
   - Pages (they use AuthContext)
   - Components (they use useAuth hook)

### Frontend File Structure
```
frontend/my-app/src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx       ✅ Protected route wrapper
│   │   └── Sidebar.tsx      ✅ Role-based navigation
│   └── ui/                  ✅ shadcn components
├── context/
│   └── AuthContext.tsx      🔶 Uses mock auth
├── pages/
│   ├── Login.tsx            ✅ Works with mock auth
│   ├── Dashboard.tsx        ✅ Role-based content
│   ├── Courses.tsx          ✅ Real API (admin only)
│   ├── Classes.tsx          ✅ Real API (admin/mentor)
│   ├── Schedule.tsx         ✅ Real API (all roles)
│   └── Notifications.tsx    ✅ Real API (all roles)
├── services/
│   ├── api.ts               ✅ Axios with interceptors
│   ├── authService.ts       🔶 MOCK - needs replacement
│   ├── scheduleService.ts   ✅ Real API calls
│   └── notificationService.ts ✅ Real API calls
└── types/
    └── index.ts             ✅ TypeScript types
```

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-10 | Initial document creation | - |
| 2024-12-10 | Notification Service fully implemented | - |
| 2024-12-10 | Added WebSocket support for real-time notifications | - |
| 2024-12-10 | Frontend core structure implemented (React + shadcn/ui) | - |
| 2024-12-10 | Frontend pages: Login, Dashboard, Courses, Classes, Schedule, Notifications | - |
| 2024-12-10 | Frontend uses mock auth, real Schedule/Notification APIs | - |

---

## Questions / Contact

For integration questions:
- Check this document first
- Review API contracts in section 2
- Check the `.kiro/specs/` folder for detailed design docs
