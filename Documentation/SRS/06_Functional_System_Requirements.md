# Functional System Requirements

## 6.1 Overview

This section describes the functional requirements from the system's perspective using structured language (EARS patterns) to ensure precise, testable specifications.

---

## 6.2 Authentication Service Requirements

### FSR-AUTH-01: User Login
WHEN a user submits valid credentials, THE System SHALL authenticate the user and return access and refresh tokens.

### FSR-AUTH-02: Invalid Credentials
WHEN a user submits invalid credentials, THE System SHALL return an error message without revealing which field is incorrect.

### FSR-AUTH-03: Token Refresh
WHEN a user's access token expires and a valid refresh token is provided, THE System SHALL issue new access and refresh tokens.

### FSR-AUTH-04: Password Hashing
THE System SHALL hash all passwords using bcrypt with a minimum cost factor of 12 before storage.

### FSR-AUTH-05: Role-Based Access
WHEN a user attempts to access a resource, THE System SHALL verify the user's role has permission for that resource.

### FSR-AUTH-06: Session Management
WHEN a user logs out, THE System SHALL invalidate all associated tokens and clear authentication cookies.

### FSR-AUTH-07: Cookie Authentication
THE System SHALL store authentication tokens in HTTP-only, secure cookies to prevent XSS attacks.

---

## 6.3 Schedule Service Requirements

### FSR-SCH-01: Course Creation
WHEN an administrator creates a course, THE System SHALL validate the course code is unique and store the course.

### FSR-SCH-02: Class Creation
WHEN an administrator creates a class, THE System SHALL validate no scheduling conflicts exist for the room and time.

### FSR-SCH-03: Student Schedule
WHEN a student requests their schedule, THE System SHALL return only classes in which the student is enrolled.

### FSR-SCH-04: Mentor Schedule
WHEN a mentor requests their schedule, THE System SHALL return only classes assigned to that mentor.

### FSR-SCH-05: Enrollment Creation
WHEN a student is enrolled in a class, THE System SHALL verify the student is not already enrolled and create the enrollment record.

### FSR-SCH-06: Enrollment Deletion
WHEN a student is removed from a class, THE System SHALL delete the enrollment record and update related caches.

---

## 6.4 Attendance Service Requirements

### FSR-ATT-01: Session Start
WHEN a mentor starts an attendance session, THE System SHALL:
- Create a new session with state "active"
- Initialize attendance records for all enrolled students as "absent"
- Notify all enrolled students of session start

### FSR-ATT-02: Session End
WHEN a mentor ends an attendance session, THE System SHALL:
- Change session state to "completed"
- Prevent further attendance modifications
- Notify all enrolled students of session end

### FSR-ATT-03: Manual Attendance
WHEN a mentor marks attendance manually, THE System SHALL update the student's attendance record with the specified status.

### FSR-ATT-04: AI Attendance
WHEN the AI service recognizes a student, THE System SHALL:
- Verify the session is active
- Verify the recognition window is open
- Update the student's attendance to "present" with confidence score

### FSR-ATT-05: Session Auto-End
WHILE an attendance session has exceeded its maximum duration, THE System SHALL automatically end the session and notify participants.

### FSR-ATT-06: Recognition Window
THE System SHALL only accept AI-based attendance within the configured recognition window (default 20 minutes from session start).

### FSR-ATT-07: Concurrent Sessions
THE System SHALL support multiple active attendance sessions simultaneously without interference.

### FSR-ATT-08: Attendance History
WHEN a user requests attendance history, THE System SHALL return records filtered by the user's role and permissions.

---

## 6.5 AI Service Requirements

### FSR-AI-01: Face Enrollment
WHEN a user enrolls a face image, THE System SHALL:
- Detect exactly one face in the image
- Compute quality score (sharpness, lighting, size)
- Classify pose category
- Check for duplicate encodings
- Store the face encoding if all validations pass

### FSR-AI-02: Quality Validation
THE System SHALL reject face enrollments with:
- Quality score below 0.4
- Face size less than 10% of image
- Multiple faces detected
- No face detected

### FSR-AI-03: Multi-Angle Enrollment
THE System SHALL require face enrollments from at least 3 different pose categories for complete enrollment.

### FSR-AI-04: Face Recognition
WHEN a face image is submitted for recognition, THE System SHALL:
- Detect faces in the image
- Compare against enrolled face encodings
- Return matches above the confidence threshold

### FSR-AI-05: Centroid Matching
THE System SHALL compute and maintain a centroid (average) of all face encodings per user for efficient matching.

### FSR-AI-06: Adaptive Thresholds
THE System SHALL use adaptive recognition thresholds based on enrollment quality:
- 0.35 for users with 5+ high-quality enrollments
- 0.40 for standard cases
- 0.45 for users with fewer than 3 enrollments

### FSR-AI-07: Liveness Detection
WHERE liveness detection is enabled, THE System SHALL verify the face is from a live person using LBP texture analysis and moiré pattern detection.

### FSR-AI-08: Duplicate Prevention
THE System SHALL reject face enrollments that are too similar (cosine distance < 0.15) to existing enrollments.

### FSR-AI-09: Enrollment Limit
THE System SHALL limit face enrollments to a maximum of 10 per user.

---

## 6.6 Notification Service Requirements

### FSR-NOT-01: Notification Creation
WHEN a system event occurs, THE System SHALL create appropriate notifications using the Notification Factory.

### FSR-NOT-02: Real-time Delivery
THE System SHALL deliver notifications to connected users via WebSocket within 1 second of creation.

### FSR-NOT-03: Notification Types
THE System SHALL support the following notification types:
- Class started
- Attendance marked
- Session ended
- Schedule updated
- Announcement

### FSR-NOT-04: Mark as Read
WHEN a user marks a notification as read, THE System SHALL update the notification status and not show it as unread again.

### FSR-NOT-05: Notification Persistence
THE System SHALL persist all notifications in the database for historical access.

---

## 6.7 Edge Agent Requirements

### FSR-EDGE-01: Camera Capture
THE Edge Agent SHALL capture frames from the connected camera at a configurable rate (default 1 FPS).

### FSR-EDGE-02: Face Detection
THE Edge Agent SHALL detect faces in captured frames before sending to the server.

### FSR-EDGE-03: Frame Transmission
WHEN a face is detected, THE Edge Agent SHALL encode the frame as JPEG and send to the API gateway.

### FSR-EDGE-04: Retry Logic
IF the API request fails, THE Edge Agent SHALL retry with exponential backoff up to 3 times.

### FSR-EDGE-05: Session Association
THE Edge Agent SHALL associate all captured frames with the specified attendance session ID.

---

## 6.8 Requirements Traceability Matrix

| Requirement | Service | Design Pattern | Test Coverage |
|-------------|---------|----------------|---------------|
| FSR-AUTH-01 | Auth | Strategy | Unit + E2E |
| FSR-AUTH-02 | Auth | Strategy | Unit + E2E |
| FSR-AUTH-03 | Auth | Strategy | Unit |
| FSR-AUTH-04 | Auth | - | Unit |
| FSR-AUTH-05 | Auth | Strategy | Unit + E2E |
| FSR-AUTH-06 | Auth | - | Unit + E2E |
| FSR-AUTH-07 | Auth | - | Unit |
| FSR-SCH-01 | Schedule | Repository | Unit |
| FSR-SCH-02 | Schedule | Repository | Unit |
| FSR-SCH-03 | Schedule | Strategy | Unit + E2E |
| FSR-SCH-04 | Schedule | Strategy | Unit + E2E |
| FSR-SCH-05 | Schedule | Repository | Unit |
| FSR-SCH-06 | Schedule | Repository | Unit |
| FSR-ATT-01 | Attendance | State | Unit + E2E |
| FSR-ATT-02 | Attendance | State | Unit + E2E |
| FSR-ATT-03 | Attendance | State | Unit |
| FSR-ATT-04 | Attendance | State | Unit |
| FSR-ATT-05 | Attendance | State | Unit |
| FSR-ATT-06 | Attendance | State | Unit |
| FSR-ATT-07 | Attendance | State | Unit |
| FSR-ATT-08 | Attendance | Repository | Unit + E2E |
| FSR-AI-01 | AI | Adapter | Unit |
| FSR-AI-02 | AI | - | Unit |
| FSR-AI-03 | AI | - | Unit |
| FSR-AI-04 | AI | Adapter | Unit |
| FSR-AI-05 | AI | - | Unit |
| FSR-AI-06 | AI | - | Unit |
| FSR-AI-07 | AI | - | Unit |
| FSR-AI-08 | AI | - | Unit |
| FSR-AI-09 | AI | - | Unit |
| FSR-NOT-01 | Notification | Factory | Unit |
| FSR-NOT-02 | Notification | Observer | Unit |
| FSR-NOT-03 | Notification | Factory | Unit |
| FSR-NOT-04 | Notification | Repository | Unit |
| FSR-NOT-05 | Notification | Repository | Unit |
| FSR-EDGE-01 | Edge Agent | Adapter | Unit |
| FSR-EDGE-02 | Edge Agent | - | Unit |
| FSR-EDGE-03 | Edge Agent | - | Unit |
| FSR-EDGE-04 | Edge Agent | - | Unit |
| FSR-EDGE-05 | Edge Agent | - | Unit |
