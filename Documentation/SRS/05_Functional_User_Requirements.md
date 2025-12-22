# Functional User Requirements

## 5.1 Overview

This section describes the functional requirements from the user's perspective, written in natural language to capture what users need to accomplish with the system.

---

## 5.2 Student Requirements

### FUR-S01: View Personal Dashboard
As a student, I want to see my attendance summary on the dashboard so that I can quickly understand my attendance status.

**Acceptance Criteria:**
- Dashboard displays total classes attended
- Dashboard shows attendance percentage
- Dashboard displays today's schedule
- Recent notifications are visible

### FUR-S02: View Attendance History
As a student, I want to view my complete attendance history so that I can track my attendance across all classes.

**Acceptance Criteria:**
- List of all attendance records with date and status
- Filter by course or date range
- Export attendance history to CSV/PDF
- Show attendance statistics per course

### FUR-S03: View Class Schedule
As a student, I want to see my class schedule organized by day so that I can plan my week.

**Acceptance Criteria:**
- Schedule displays classes grouped by day of week
- Each class shows time, room, course name, and mentor
- Current day is highlighted
- Schedule updates when enrollments change

### FUR-S04: Enroll Face for Recognition
As a student, I want to enroll my face in the system so that my attendance can be marked automatically.

**Acceptance Criteria:**
- Guided face enrollment with position feedback
- Multiple angles captured (front, left, right, up, down)
- Quality feedback during capture
- Success confirmation after enrollment

### FUR-S05: Receive Attendance Notifications
As a student, I want to receive notifications when my attendance is marked so that I have confirmation of my presence.

**Acceptance Criteria:**
- Real-time notification when attendance is marked
- Notification shows class name and status
- Notifications accessible from notification center
- Ability to mark notifications as read

### FUR-S06: View Profile Information
As a student, I want to view and update my profile information so that my details are accurate.

**Acceptance Criteria:**
- Display name, email, student ID
- Ability to change password
- View face enrollment status
- Update profile picture (optional)

---

## 5.3 Mentor Requirements

### FUR-M01: Start Attendance Session
As a mentor, I want to start an attendance session for my class so that students can be marked present.

**Acceptance Criteria:**
- Select class from assigned classes
- Session starts immediately upon confirmation
- All enrolled students notified of session start
- Session appears as "Active" in the system

### FUR-M02: End Attendance Session
As a mentor, I want to end an attendance session so that no more attendance changes can be made.

**Acceptance Criteria:**
- End session with one click
- Confirmation dialog before ending
- All enrolled students notified of session end
- Session state changes to "Completed"

### FUR-M03: Mark Attendance Manually
As a mentor, I want to manually mark or override student attendance so that I can handle exceptions.

**Acceptance Criteria:**
- View list of enrolled students
- Mark individual students as Present/Absent/Late/Excused
- Override AI-marked attendance
- Changes reflected immediately

### FUR-M04: View Class Attendance Report
As a mentor, I want to view attendance reports for my classes so that I can track student participation.

**Acceptance Criteria:**
- View attendance by session
- See attendance statistics per student
- Export reports to CSV/PDF
- Filter by date range

### FUR-M05: View Live Attendance Feed
As a mentor, I want to see real-time attendance updates during a session so that I know who has arrived.

**Acceptance Criteria:**
- Live feed shows students as they are recognized
- Display confidence score for each recognition
- Show timestamp of attendance marking
- Auto-refresh every few seconds

### FUR-M06: Manage Class Enrollments
As a mentor, I want to view students enrolled in my classes so that I know who should attend.

**Acceptance Criteria:**
- List of enrolled students per class
- Search students by name or ID
- View student enrollment status
- See face enrollment status

---

## 5.4 Administrator Requirements

### FUR-A01: Manage Users
As an administrator, I want to manage all users in the system so that I can control access.

**Acceptance Criteria:**
- View list of all users
- Create new users (students, mentors, admins)
- Edit user information
- Deactivate/activate users
- Reset user passwords

### FUR-A02: Manage Courses
As an administrator, I want to manage courses so that the academic structure is maintained.

**Acceptance Criteria:**
- Create new courses with code and name
- Edit course information
- Assign mentors to courses
- Delete courses (with confirmation)

### FUR-A03: Manage Classes
As an administrator, I want to manage class schedules so that classes are properly organized.

**Acceptance Criteria:**
- Create classes with day, time, room
- Assign mentor to class
- Edit class details
- Delete classes (with confirmation)

### FUR-A04: Manage Enrollments
As an administrator, I want to manage student enrollments so that students are in correct classes.

**Acceptance Criteria:**
- Enroll students in classes
- Remove students from classes
- Bulk enrollment support
- View enrollment history

### FUR-A05: View System Statistics
As an administrator, I want to view system-wide statistics so that I can monitor overall attendance.

**Acceptance Criteria:**
- Total users by role
- Overall attendance rate
- Active sessions count
- Recent activity log

### FUR-A06: Monitor Active Sessions
As an administrator, I want to monitor all active attendance sessions so that I can oversee operations.

**Acceptance Criteria:**
- View all currently active sessions
- See session details (class, mentor, start time)
- View attendance count per session
- Spectate mode (view without control)

### FUR-A07: Configure System Settings
As an administrator, I want to configure system settings so that the system operates according to institutional policies.

**Acceptance Criteria:**
- Set recognition confidence threshold
- Enable/disable liveness detection
- Configure session auto-end duration
- Set auto-recognition window time

---

## 5.5 Requirements Traceability

| Requirement ID | User Role | Feature Area | Priority |
|----------------|-----------|--------------|----------|
| FUR-S01 | Student | Dashboard | High |
| FUR-S02 | Student | Attendance | High |
| FUR-S03 | Student | Schedule | High |
| FUR-S04 | Student | Face Enrollment | High |
| FUR-S05 | Student | Notifications | Medium |
| FUR-S06 | Student | Profile | Medium |
| FUR-M01 | Mentor | Session Management | High |
| FUR-M02 | Mentor | Session Management | High |
| FUR-M03 | Mentor | Attendance | High |
| FUR-M04 | Mentor | Reporting | Medium |
| FUR-M05 | Mentor | Real-time | Medium |
| FUR-M06 | Mentor | Enrollment | Medium |
| FUR-A01 | Admin | User Management | High |
| FUR-A02 | Admin | Course Management | High |
| FUR-A03 | Admin | Class Management | High |
| FUR-A04 | Admin | Enrollment | High |
| FUR-A05 | Admin | Statistics | Medium |
| FUR-A06 | Admin | Monitoring | Medium |
| FUR-A07 | Admin | Configuration | Low |
