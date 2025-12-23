# Use Cases

## 10.1 Overview

This section provides formal use case specifications following the standard template format.

---

## 10.2 Use Case Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Face Recognition Attendance System                    │
│                                                                          │
│  ┌─────────┐                                           ┌─────────┐      │
│  │         │                                           │         │      │
│  │ Student │                                           │  Admin  │      │
│  │         │                                           │         │      │
│  └────┬────┘                                           └────┬────┘      │
│       │                                                     │           │
│       │    ┌──────────────────────────────────────┐        │           │
│       ├───►│         UC01: Login                  │◄───────┤           │
│       │    └──────────────────────────────────────┘        │           │
│       │                                                     │           │
│       │    ┌──────────────────────────────────────┐        │           │
│       ├───►│      UC02: Enroll Face               │        │           │
│       │    └──────────────────────────────────────┘        │           │
│       │                                                     │           │
│       │    ┌──────────────────────────────────────┐        │           │
│       ├───►│   UC03: View Attendance History      │        │           │
│       │    └──────────────────────────────────────┘        │           │
│       │                                                     │           │
│       │    ┌──────────────────────────────────────┐        │           │
│       ├───►│      UC04: View Schedule             │◄───────┤           │
│       │    └──────────────────────────────────────┘        │           │
│       │                                                     │           │
│       │    ┌──────────────────────────────────────┐        │           │
│       │    │   UC05: Start Attendance Session     │◄───┐   │           │
│       │    └──────────────────────────────────────┘    │   │           │
│       │                                                 │   │           │
│       │    ┌──────────────────────────────────────┐    │   │           │
│       │    │    UC06: Mark Attendance Manually    │◄───┤   │           │
│       │    └──────────────────────────────────────┘    │   │           │
│       │                                                 │   │           │
│       │    ┌──────────────────────────────────────┐    │   │           │
│       │    │    UC07: End Attendance Session      │◄───┤   │           │
│       │    └──────────────────────────────────────┘    │   │           │
│       │                                                 │   │           │
│  ┌────┴────┐                                      ┌────┴───┴┐          │
│  │         │                                      │         │          │
│  │ Mentor  │                                      │  Edge   │          │
│  │         │                                      │  Agent  │          │
│  └────┬────┘                                      └────┬────┘          │
│       │                                                │               │
│       │    ┌──────────────────────────────────────┐   │               │
│       │    │   UC08: Recognize Face (Auto)        │◄──┘               │
│       │    └──────────────────────────────────────┘                   │
│       │                                                                │
│       │    ┌──────────────────────────────────────┐                   │
│       ├───►│      UC09: Manage Courses            │◄──────────────────┤
│       │    └──────────────────────────────────────┘                   │
│       │                                                                │
│       │    ┌──────────────────────────────────────┐                   │
│       └───►│      UC10: Manage Users              │◄──────────────────┘
│            └──────────────────────────────────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---
 
## 10.3 Use Case Specifications

### UC01: User Login

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC01 |
| **Use Case Name** | User Login |
| **Actor(s)** | Student, Mentor, Admin |
| **Description** | User authenticates to access the system |
| **Preconditions** | User has a registered account |
| **Postconditions** | User is authenticated and redirected to dashboard |

**Main Flow:**
1. User navigates to login page
2. User enters email and password
3. User clicks "Login" button
4. System validates credentials
5. System generates JWT tokens
6. System sets authentication cookies
7. System redirects to dashboard

**Alternative Flows:**
- 4a. Invalid credentials: System displays error message, user remains on login page
- 4b. Account locked: System displays "Account locked" message

**Exceptions:**
- E1. Server unavailable: Display "Service unavailable" message

---

### UC02: Enroll Face

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC02 |
| **Use Case Name** | Enroll Face |
| **Actor(s)** | Student |
| **Description** | Student enrolls their face for recognition |
| **Preconditions** | User is logged in, has webcam access |
| **Postconditions** | Face encodings stored in database |

**Main Flow:**
1. User navigates to Face Enrollment page
2. System requests camera permission
3. User grants permission
4. System displays camera preview with face guide
5. User positions face within guide
6. System provides position feedback
7. System auto-captures when position is good
8. System prompts for different poses
9. User completes all required poses
10. System displays success message

**Alternative Flows:**
- 3a. Permission denied: Display "Camera access required" message
- 6a. Poor quality: Display specific feedback (lighting, distance)
- 9a. Enrollment limit reached: Display "Maximum enrollments reached"

**Exceptions:**
- E1. Camera error: Display "Camera not available" message

---

### UC03: View Attendance History

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC03 |
| **Use Case Name** | View Attendance History |
| **Actor(s)** | Student |
| **Description** | Student views their attendance records |
| **Preconditions** | User is logged in |
| **Postconditions** | Attendance history displayed |

**Main Flow:**
1. User navigates to Attendance page
2. System retrieves user's attendance records
3. System displays attendance list
4. User optionally filters by course/date
5. System updates displayed records
6. User optionally exports to CSV/PDF

**Alternative Flows:**
- 3a. No records: Display "No attendance records found"

---

### UC04: View Schedule

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC04 |
| **Use Case Name** | View Schedule |
| **Actor(s)** | Student, Mentor, Admin |
| **Description** | User views class schedule |
| **Preconditions** | User is logged in |
| **Postconditions** | Schedule displayed |

**Main Flow:**
1. User navigates to Schedule page
2. System retrieves schedule based on user role
3. System displays classes grouped by day
4. User views class details (time, room, course)

**Alternative Flows:**
- 3a. No classes: Display "No classes scheduled"

---

### UC05: Start Attendance Session

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC05 |
| **Use Case Name** | Start Attendance Session |
| **Actor(s)** | Mentor |
| **Description** | Mentor starts attendance tracking for a class |
| **Preconditions** | Mentor is logged in, assigned to class |
| **Postconditions** | Session is active, students notified |

**Main Flow:**
1. Mentor navigates to Attendance page
2. Mentor selects class from dropdown
3. Mentor clicks "Start Session"
4. System creates session with "active" state
5. System initializes all students as "absent"
6. System sends notifications to enrolled students
7. System displays live attendance feed

**Alternative Flows:**
- 3a. Session already active: Display "Session already in progress"

**Business Rules:**
- Only one active session per class at a time
- Only assigned mentor can start session

---

### UC06: Mark Attendance Manually

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC06 |
| **Use Case Name** | Mark Attendance Manually |
| **Actor(s)** | Mentor |
| **Description** | Mentor manually marks or overrides attendance |
| **Preconditions** | Session is active |
| **Postconditions** | Student attendance updated |

**Main Flow:**
1. Mentor views student list in active session
2. Mentor locates student to update
3. Mentor selects new status (Present/Absent/Late/Excused)
4. System updates attendance record
5. System records verification method as "manual"
6. Student receives notification

**Alternative Flows:**
- 3a. Session ended: Display "Cannot modify completed session"

---

### UC07: End Attendance Session

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC07 |
| **Use Case Name** | End Attendance Session |
| **Actor(s)** | Mentor |
| **Description** | Mentor ends the attendance session |
| **Preconditions** | Session is active |
| **Postconditions** | Session completed, no more changes allowed |

**Main Flow:**
1. Mentor clicks "End Session" button
2. System displays confirmation dialog
3. Mentor confirms action
4. System changes session state to "completed"
5. System sends notifications to all students
6. System displays session summary

**Alternative Flows:**
- 3a. Mentor cancels: Return to active session view

---

### UC08: Recognize Face (Automatic)

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC08 |
| **Use Case Name** | Recognize Face |
| **Actor(s)** | Edge Agent (System) |
| **Description** | System automatically recognizes student face |
| **Preconditions** | Session active, recognition window open |
| **Postconditions** | Student marked present if recognized |

**Main Flow:**
1. Edge Agent captures frame from camera
2. Edge Agent detects face in frame
3. Edge Agent sends frame to API
4. System extracts face encoding
5. System compares against enrolled faces
6. System finds match above threshold
7. System marks student as "present"
8. System sends notification to student

**Alternative Flows:**
- 3a. No face detected: Discard frame
- 6a. No match found: Log attempt, no action
- 6b. Below threshold: Log attempt, no action
- 7a. Recognition window closed: Reject, require manual

---

### UC09: Manage Courses

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC09 |
| **Use Case Name** | Manage Courses |
| **Actor(s)** | Admin |
| **Description** | Admin creates, updates, or deletes courses |
| **Preconditions** | Admin is logged in |
| **Postconditions** | Course data updated |

**Main Flow (Create):**
1. Admin navigates to Courses page
2. Admin clicks "Add Course"
3. Admin enters course details
4. Admin clicks "Create"
5. System validates input
6. System creates course
7. System displays success message

**Alternative Flows:**
- 5a. Duplicate code: Display "Course code already exists"
- 5b. Invalid input: Display validation errors

---

### UC10: Manage Users

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC10 |
| **Use Case Name** | Manage Users |
| **Actor(s)** | Admin |
| **Description** | Admin manages user accounts |
| **Preconditions** | Admin is logged in |
| **Postconditions** | User data updated |

**Main Flow (Create):**
1. Admin navigates to Users page
2. Admin clicks "Add User"
3. Admin enters user details and role
4. Admin clicks "Create"
5. System validates input
6. System creates user
7. System sends welcome email
8. System displays success message

**Alternative Flows:**
- 5a. Duplicate email: Display "Email already registered"
- 5b. Invalid input: Display validation errors

---

## 10.4 Use Case Summary

| UC ID | Name | Primary Actor | Priority |
|-------|------|---------------|----------|
| UC01 | User Login | All Users | High |
| UC02 | Enroll Face | Student | High |
| UC03 | View Attendance History | Student | Medium |
| UC04 | View Schedule | All Users | Medium |
| UC05 | Start Attendance Session | Mentor | High |
| UC06 | Mark Attendance Manually | Mentor | High |
| UC07 | End Attendance Session | Mentor | High |
| UC08 | Recognize Face | Edge Agent | High |
| UC09 | Manage Courses | Admin | High |
| UC10 | Manage Users | Admin | High |
