# Tasks Document

## Overview
This document outlines the implementation tasks for the Face Recognition Attendance System, organized by phases and priority.

## Phase 1: Core Foundation (Week 1-2)

### Task 1.1: Shared Module Setup
- [ ] Create shared module directory structure
- [ ] Implement DatabaseConnection singleton (`shared/database/connection.py`)
- [ ] Implement SQLAlchemy Base class (`shared/database/base.py`)
- [ ] Implement database session management (`shared/database/session.py`)
- [ ] Implement CacheManager singleton (`shared/cache/cache_manager.py`)
- [ ] Implement cache decorators (`shared/cache/decorators.py`)
- [ ] Implement Settings configuration (`shared/config/settings.py`)
- [ ] Create shared Pydantic models (`shared/models/`)
- [ ] Create custom exception classes (`shared/exceptions/`)
- [ ] Create utility functions (`shared/utils/`)
- [ ] Write unit tests for shared module

**Requirements**: NFR-5.1, NFR-5.2, NFR-5.4

### Task 1.2: Authentication Service
- [ ] Create auth service directory structure
- [ ] Implement User SQLAlchemy model (`services/auth_service/models/user.py`)
- [ ] Implement APIKey SQLAlchemy model (`services/auth_service/models/api_key.py`)
- [ ] Implement UserRepository (`services/auth_service/repositories/user_repository.py`)
- [ ] Implement APIKeyRepository (`services/auth_service/repositories/api_key_repository.py`)
- [ ] Implement IAuthStrategy interface (`services/auth_service/strategies/auth_strategy.py`)
- [ ] Implement JWTAuthStrategy (`services/auth_service/strategies/jwt_strategy.py`)
- [ ] Implement APIKeyAuthStrategy (`services/auth_service/strategies/api_key_strategy.py`)
- [ ] Implement TokenService for JWT generation/validation
- [ ] Implement PasswordService for bcrypt hashing
- [ ] Implement AuthService orchestrator
- [ ] Create request/response schemas
- [ ] Create API routes (login, refresh, validate)
- [ ] Write unit tests for auth service

**Requirements**: FR-1.1, FR-1.2, FR-1.3, FR-1.4, FR-1.5, FR-1.6, NFR-3.2, NFR-3.3, NFR-3.4

### Task 1.3: Basic API Gateway
- [ ] Create API gateway directory structure
- [ ] Implement AuthMiddleware with Strategy pattern
- [ ] Implement RateLimitMiddleware with token bucket algorithm
- [ ] Implement LoggingMiddleware
- [ ] Implement CORSMiddleware
- [ ] Create route configuration
- [ ] Integrate auth strategies (JWT, API Key)
- [ ] Configure rate limit storage with Redis
- [ ] Write unit tests for middleware

**Requirements**: FR-1.6, NFR-3.5, NFR-1.1

---

## Phase 2: Core Features (Week 3-4)

### Task 2.1: Schedule Service
- [ ] Create schedule service directory structure
- [ ] Implement Course SQLAlchemy model
- [ ] Implement Class SQLAlchemy model
- [ ] Implement Enrollment SQLAlchemy model
- [ ] Implement CourseRepository
- [ ] Implement ClassRepository
- [ ] Implement EnrollmentRepository
- [ ] Implement ScheduleCache with cache-aside pattern
- [ ] Implement ScheduleService with role-based filtering methods:
  - `get_schedule_for_student(student_id)`
  - `get_schedule_for_mentor(mentor_id)`
  - `get_full_schedule()`
- [ ] Implement EnrollmentService
- [ ] Create request/response schemas
- [ ] Create API routes (CRUD for classes, courses, enrollments)
- [ ] Implement cache invalidation on updates
- [ ] Write unit tests for schedule service

**Requirements**: FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5, FR-2.6, NFR-2.3

### Task 2.2: Attendance Service - State Machine
- [ ] Create attendance service directory structure
- [ ] Implement AttendanceSession SQLAlchemy model
- [ ] Implement AttendanceRecord SQLAlchemy model
- [ ] Implement SessionRepository
- [ ] Implement AttendanceRepository
- [ ] Implement ClassState abstract base class
- [ ] Implement InactiveState class
- [ ] Implement ActiveState class
- [ ] Implement CompletedState class
- [ ] Implement state transition validation
- [ ] Implement AttendanceService:
  - `start_attendance_session(class_id)`
  - `end_attendance_session(session_id)`
  - `mark_attendance_manually(session_id, student_id, status)`
  - `process_ai_results(session_id, results)`
  - `get_attendance_history(user_id, role, filters)`
- [ ] Implement SessionService
- [ ] Create request/response schemas
- [ ] Create API routes
- [ ] Write unit tests for state machine
- [ ] Write unit tests for attendance service

**Requirements**: FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-3.5, FR-3.6, FR-4.1, FR-4.2, FR-4.3, FR-4.4, FR-4.5, FR-4.6, FR-4.7, FR-4.8

### Task 2.3: Basic Notification Service
- [ ] Create notification service directory structure
- [ ] Implement Notification SQLAlchemy model
- [ ] Implement NotificationRepository
- [ ] Implement NotificationFactory:
  - `create_class_started_notification()`
  - `create_attendance_confirmed_notification()`
  - `create_attendance_absent_notification()`
  - `create_attendance_late_notification()`
  - `create_class_cancelled_notification()`
  - `create_schedule_updated_notification()`
- [ ] Implement NotificationService
- [ ] Create request/response schemas
- [ ] Create API routes (get notifications, mark as read)
- [ ] Write unit tests for notification factory

**Requirements**: FR-6.5, FR-6.6, FR-6.7

---

## Phase 3: AI Integration (Week 5-6)

### Task 3.1: Edge Agent
- [ ] Create edge agent directory structure
- [ ] Implement ICameraAdapter interface
- [ ] Implement OpenCVAdapter for camera capture
- [ ] Implement USBCameraAdapter (optional)
- [ ] Implement FaceDetector (Haar Cascade/MTCNN)
- [ ] Implement FrameProcessor (resize, normalize)
- [ ] Implement JPEGEncoder
- [ ] Implement APIClient for gateway communication
- [ ] Implement RetryHandler with exponential backoff
- [ ] Implement configuration management
- [ ] Implement main capture loop
- [ ] Write unit tests for edge agent components

**Requirements**: FR-7.1, FR-7.2, FR-7.3, FR-7.4, FR-7.5, FR-5.1, FR-5.2

### Task 3.2: Message Broker Setup
- [ ] Configure RabbitMQ/Kafka
- [ ] Create face_recognition_exchange
- [ ] Create face_recognition_queue
- [ ] Configure dead letter queue
- [ ] Configure message TTL
- [ ] Implement message publisher in API Gateway
- [ ] Write integration tests for message broker

**Requirements**: NFR-2.2, NFR-4.1

### Task 3.3: AI Recognition Service
- [ ] Create AI service directory structure
- [ ] Implement FaceEncoding SQLAlchemy model
- [ ] Implement FaceEncodingRepository
- [ ] Implement IFaceRecognitionAdapter interface
- [ ] Implement FaceRecognitionAdapter (face_recognition library)
- [ ] Implement DeepFaceAdapter (optional)
- [ ] Implement MessageConsumer for RabbitMQ
- [ ] Implement RecognitionService:
  - `process_frame(frame_data, session_id)`
  - `load_student_encodings()`
  - `add_student_encoding(student_id, image)`
- [ ] Implement EncodingService
- [ ] Implement confidence threshold filtering
- [ ] Create internal API for sending results to Attendance Service
- [ ] Write unit tests for AI service

**Requirements**: FR-5.3, FR-5.4, FR-5.5, FR-5.6, FR-5.7, NFR-1.2

---

## Phase 4: Real-time & Polish (Week 7-8)

### Task 4.1: WebSocket Notifications
- [ ] Implement NotificationSubject (Observer pattern)
- [ ] Implement INotificationObserver interface
- [ ] Implement WebSocketObserver
- [ ] Implement WebSocket endpoint
- [ ] Implement WebSocket connection management
- [ ] Implement user-specific notification routing
- [ ] Integrate Observer pattern with NotificationService
- [ ] Write integration tests for WebSocket

**Requirements**: FR-6.1, FR-6.2, FR-6.3, FR-6.4, NFR-1.3, NFR-1.5

### Task 4.2: Frontend Development
- [ ] Set up React project with Vite
- [ ] Configure React Router
- [ ] Implement AuthContext
- [ ] Implement NotificationContext
- [ ] Implement useAuth hook
- [ ] Implement useWebSocket hook
- [ ] Implement useNotifications hook
- [ ] Create common UI components (buttons, inputs, cards)
- [ ] Create layout components (sidebar, header)
- [ ] Implement Login page
- [ ] Implement Dashboard pages (role-based)
- [ ] Implement Schedule page
- [ ] Implement Attendance page
- [ ] Implement Notifications page
- [ ] Implement API service layer (Axios)
- [ ] Implement WebSocket service
- [ ] Style with TailwindCSS
- [ ] Write component tests

**Requirements**: NFR-6.1, NFR-6.2, NFR-6.3, NFR-6.4

### Task 4.3: Integration & Testing
- [ ] Set up Docker Compose for all services
- [ ] Configure environment variables
- [ ] Write integration tests for end-to-end flows:
  - Login flow
  - Schedule CRUD flow
  - Class activation flow
  - Face recognition flow
  - Notification delivery flow
- [ ] Perform load testing with Locust
- [ ] Perform security testing
- [ ] Fix bugs and optimize performance
- [ ] Write API documentation

**Requirements**: NFR-1.1, NFR-1.2, NFR-1.3, NFR-1.4, NFR-3.6, NFR-3.7, NFR-5.3

---

## Database Migration Tasks

### Task DB-1: Initial Schema
- [ ] Create users table
- [ ] Create api_keys table
- [ ] Create courses table
- [ ] Create classes table
- [ ] Create class_enrollments table
- [ ] Create attendance_sessions table
- [ ] Create attendance_records table
- [ ] Create face_encodings table
- [ ] Create notifications table
- [ ] Create indexes for performance
- [ ] Write migration scripts

---

## DevOps Tasks

### Task DevOps-1: Containerization
- [ ] Create Dockerfile for FastAPI application
- [ ] Create Dockerfile for Edge Agent
- [ ] Create Dockerfile for Frontend
- [ ] Create docker-compose.yml
- [ ] Configure PostgreSQL container
- [ ] Configure Redis container
- [ ] Configure RabbitMQ container
- [ ] Configure Nginx reverse proxy (optional)
- [ ] Create .env.example template

### Task DevOps-2: CI/CD (Optional)
- [ ] Set up GitHub Actions workflow
- [ ] Configure automated testing
- [ ] Configure automated linting
- [ ] Configure Docker image building

---

## Task Priority Matrix

| Priority | Task | Dependencies | Estimated Hours |
|----------|------|--------------|-----------------|
| P0 | Task 1.1: Shared Module | None | 8-12 |
| P0 | Task 1.2: Auth Service | Task 1.1 | 12-16 |
| P0 | Task 1.3: API Gateway | Task 1.2 | 8-12 |
| P1 | Task 2.1: Schedule Service | Task 1.1 | 12-16 |
| P1 | Task 2.2: Attendance Service | Task 1.1, Task 2.1 | 16-20 |
| P1 | Task 2.3: Notification Service | Task 1.1 | 8-12 |
| P2 | Task 3.1: Edge Agent | Task 1.3 | 12-16 |
| P2 | Task 3.2: Message Broker | None | 4-6 |
| P2 | Task 3.3: AI Service | Task 3.2 | 16-20 |
| P3 | Task 4.1: WebSocket | Task 2.3 | 8-12 |
| P3 | Task 4.2: Frontend | Task 1.3 | 24-32 |
| P3 | Task 4.3: Integration | All above | 16-24 |

**Total Estimated Hours: 144-196 hours (6-8 weeks)**

---

## Definition of Done

A task is considered complete when:
1. ✅ Code is implemented and follows project patterns
2. ✅ Unit tests are written and passing
3. ✅ Code is reviewed (if applicable)
4. ✅ Documentation is updated
5. ✅ No critical bugs or security issues
6. ✅ Integration with dependent services verified
