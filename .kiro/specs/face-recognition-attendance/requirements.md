# Requirements Document

## Overview
This document outlines the functional and non-functional requirements for the Face Recognition Attendance System - an AI-powered automated attendance tracking solution using microservices architecture.

## Functional Requirements

### FR-1: User Authentication & Authorization
- **FR-1.1**: System shall support three user roles: Student, Mentor, and Supervisor
- **FR-1.2**: Users shall authenticate using email and password credentials
- **FR-1.3**: System shall issue JWT tokens upon successful authentication
- **FR-1.4**: Edge Agents shall authenticate using API keys
- **FR-1.5**: System shall support token refresh without re-authentication
- **FR-1.6**: System shall enforce role-based access control (RBAC) on all endpoints

### FR-2: Schedule Management
- **FR-2.1**: Supervisors shall be able to create, update, and delete class schedules
- **FR-2.2**: Mentors shall view their assigned classes only
- **FR-2.3**: Students shall view classes they are enrolled in only
- **FR-2.4**: Supervisors shall view all classes across the system
- **FR-2.5**: System shall support course management (create, update, delete courses)
- **FR-2.6**: System shall support student enrollment in classes
- **FR-2.7**: Schedule changes shall trigger notifications to affected users

### FR-3: Class State Management
- **FR-3.1**: Classes shall have three states: Inactive, Active, Completed
- **FR-3.2**: Mentors shall be able to activate their assigned classes
- **FR-3.3**: Mentors shall be able to deactivate/complete active classes
- **FR-3.4**: System shall prevent invalid state transitions
- **FR-3.5**: Class activation shall automatically start an attendance session
- **FR-3.6**: Class deactivation shall automatically end the attendance session

### FR-4: Attendance Tracking
- **FR-4.1**: System shall automatically mark attendance using face recognition
- **FR-4.2**: Mentors shall be able to manually mark/override attendance
- **FR-4.3**: System shall support attendance statuses: Present, Absent, Late
- **FR-4.4**: System shall record recognition confidence scores
- **FR-4.5**: System shall track whether attendance was marked manually or automatically
- **FR-4.6**: Students shall view their own attendance history
- **FR-4.7**: Mentors shall view attendance for their classes
- **FR-4.8**: Supervisors shall view all attendance records

### FR-5: Face Recognition
- **FR-5.1**: Edge Agent shall capture frames from camera at configurable FPS
- **FR-5.2**: System shall detect faces in captured frames
- **FR-5.3**: System shall generate face encodings for detected faces
- **FR-5.4**: System shall match face encodings against enrolled student database
- **FR-5.5**: System shall filter matches by confidence threshold (default: 0.6)
- **FR-5.6**: System shall support multiple face recognition libraries (face_recognition, DeepFace)
- **FR-5.7**: System shall store face encodings for enrolled students

### FR-6: Real-time Notifications
- **FR-6.1**: System shall deliver real-time notifications via WebSocket
- **FR-6.2**: Students shall receive notification when their class starts
- **FR-6.3**: Students shall receive notification when their attendance is confirmed
- **FR-6.4**: Users shall receive notifications for schedule changes
- **FR-6.5**: System shall store notifications for offline users
- **FR-6.6**: Users shall be able to mark notifications as read
- **FR-6.7**: System shall support notification types: class_started, attendance_confirmed, attendance_absent, attendance_late, class_cancelled, class_rescheduled, schedule_updated

### FR-7: Edge Agent
- **FR-7.1**: Edge Agent shall connect to camera hardware
- **FR-7.2**: Edge Agent shall preprocess frames (face detection, resize, normalize)
- **FR-7.3**: Edge Agent shall send frames to API Gateway with API key authentication
- **FR-7.4**: Edge Agent shall implement retry logic with exponential backoff
- **FR-7.5**: Edge Agent shall handle camera disconnection gracefully

## Non-Functional Requirements

### NFR-1: Performance
- **NFR-1.1**: API response time shall be < 200ms (p95)
- **NFR-1.2**: Face recognition latency shall be < 2 seconds per frame
- **NFR-1.3**: WebSocket message delivery shall be < 100ms
- **NFR-1.4**: Database query time shall be < 50ms (p95)
- **NFR-1.5**: System shall support 1000 concurrent WebSocket connections

### NFR-2: Scalability
- **NFR-2.1**: Services shall be independently scalable
- **NFR-2.2**: System shall use message broker for async processing
- **NFR-2.3**: System shall implement caching for frequently accessed data
- **NFR-2.4**: Database shall use connection pooling

### NFR-3: Security
- **NFR-3.1**: All API communication shall use HTTPS
- **NFR-3.2**: Passwords shall be hashed using bcrypt
- **NFR-3.3**: JWT tokens shall expire after configurable duration
- **NFR-3.4**: API keys shall be hashed before storage
- **NFR-3.5**: System shall implement rate limiting per client
- **NFR-3.6**: System shall prevent SQL injection attacks
- **NFR-3.7**: System shall prevent XSS attacks in frontend

### NFR-4: Reliability
- **NFR-4.1**: Message broker shall persist messages for reliability
- **NFR-4.2**: System shall implement retry logic for failed operations
- **NFR-4.3**: System shall handle service failures gracefully
- **NFR-4.4**: Database operations shall use transactions where appropriate

### NFR-5: Maintainability
- **NFR-5.1**: Code shall follow design patterns for maintainability
- **NFR-5.2**: Services shall have clear separation of concerns
- **NFR-5.3**: Code shall achieve 80% unit test coverage
- **NFR-5.4**: System shall use repository pattern for data access

### NFR-6: Usability
- **NFR-6.1**: Frontend shall be responsive across devices
- **NFR-6.2**: UI shall provide clear feedback for user actions
- **NFR-6.3**: Error messages shall be user-friendly
- **NFR-6.4**: System shall support real-time updates without page refresh

## User Stories

### US-1: Authentication
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-1.1 | As a user, I want to log in with my email and password so that I can access the system | Given valid credentials, when I submit login form, then I receive a JWT token and am redirected to dashboard |
| US-1.2 | As a user, I want my session to persist so that I don't have to log in repeatedly | Given a valid refresh token, when my access token expires, then the system automatically refreshes it |
| US-1.3 | As an Edge Agent, I want to authenticate with an API key so that I can send frames securely | Given a valid API key, when I send a request, then the system accepts and processes it |

### US-2: Schedule Management
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-2.1 | As a supervisor, I want to create class schedules so that classes are organized | Given class details, when I submit the form, then the class is created and visible to relevant users |
| US-2.2 | As a student, I want to view my enrolled classes so that I know my schedule | Given I am logged in as a student, when I view schedule, then I see only classes I am enrolled in |
| US-2.3 | As a mentor, I want to view my assigned classes so that I know what to teach | Given I am logged in as a mentor, when I view schedule, then I see only classes assigned to me |

### US-3: Attendance
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-3.1 | As a mentor, I want to activate my class so that attendance tracking begins | Given I have an inactive class, when I click activate, then the class becomes active and camera starts capturing |
| US-3.2 | As a student, I want my attendance marked automatically so that I don't have to sign in manually | Given the class is active and I am present, when the camera captures my face, then my attendance is marked as present |
| US-3.3 | As a mentor, I want to manually mark attendance so that I can correct errors | Given an active session, when I mark a student's attendance, then the record is updated with manual flag |
| US-3.4 | As a student, I want to view my attendance history so that I can track my record | Given I am logged in, when I view attendance history, then I see all my attendance records with dates and statuses |

### US-4: Notifications
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-4.1 | As a student, I want to receive notification when my class starts so that I don't miss it | Given my class is activated, when the mentor activates it, then I receive a real-time notification |
| US-4.2 | As a student, I want to receive confirmation when my attendance is marked so that I know I'm recorded | Given my face is recognized, when attendance is marked, then I receive a notification with confirmation |
| US-4.3 | As a user, I want to see my notification history so that I can review past notifications | Given I have notifications, when I view notification page, then I see all notifications with read/unread status |

### US-5: Face Recognition
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-5.1 | As an admin, I want to register student face encodings so that they can be recognized | Given a student photo, when I upload it, then the face encoding is stored in the database |
| US-5.2 | As the system, I want to process frames asynchronously so that the Edge Agent isn't blocked | Given a frame is uploaded, when it's sent to the queue, then the Edge Agent receives immediate acknowledgment |

## Constraints

### Technical Constraints
- Backend must use FastAPI (Python)
- Frontend must use React
- Database must be PostgreSQL
- Cache must be Redis
- Message broker must be RabbitMQ or Kafka
- System must be containerized with Docker

### Business Constraints
- System must support offline notification storage
- Face recognition confidence threshold must be configurable
- Rate limits must be configurable per client type

## Dependencies

### External Dependencies
- PostgreSQL database server
- Redis cache server
- RabbitMQ/Kafka message broker
- Camera hardware for Edge Agent
- Face recognition library (face_recognition or DeepFace)

### Internal Dependencies
- All services depend on shared module
- Attendance Service depends on Notification Service
- AI Service depends on Message Broker
- Frontend depends on API Gateway
