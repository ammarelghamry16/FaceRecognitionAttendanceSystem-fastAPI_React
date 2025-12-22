# Scenarios

## 9.1 Overview

This section describes typical user workflows and scenarios that demonstrate how users interact with the system to accomplish their goals.

---

## 9.2 Student Scenarios

### Scenario S1: First-Time Face Enrollment

**Actor:** New Student (Sarah)

**Preconditions:**
- Sarah has a registered account
- Sarah has not enrolled her face yet
- Sarah has a working webcam

**Flow:**
1. Sarah logs into the system with her credentials
2. System displays dashboard with a prompt to enroll face
3. Sarah clicks "Enroll Face" button
4. System opens camera and displays face guide overlay
5. Sarah positions her face within the oval guide
6. System provides real-time feedback: "Move closer", "Good position"
7. When position is good, system auto-captures (1.5s hold)
8. System prompts Sarah to turn head slightly left
9. Sarah adjusts position, system captures left pose
10. Process repeats for right, up, and down poses
11. System displays success message: "Face enrollment complete!"
12. Sarah is redirected to dashboard

**Postconditions:**
- Sarah's face encodings are stored in the database
- Sarah can now be recognized for attendance

**Alternative Flows:**
- 5a. If lighting is poor, system shows "Improve lighting" message
- 7a. If quality is low, system rejects and asks to retry

---

### Scenario S2: Automatic Attendance Marking

**Actor:** Student (John)

**Preconditions:**
- John has enrolled his face
- John is enrolled in "Math 101" class
- Mentor has started an attendance session

**Flow:**
1. John enters the classroom
2. Edge Agent camera detects John's face
3. System recognizes John with 95% confidence
4. System marks John as "Present" in the session
5. John receives a notification: "Attendance marked for Math 101"
6. John sees the notification toast on his phone/laptop

**Postconditions:**
- John's attendance record shows "Present"
- Timestamp is recorded

---

### Scenario S3: Viewing Attendance History

**Actor:** Student (Emily)

**Preconditions:**
- Emily is logged in
- Emily has attendance records

**Flow:**
1. Emily clicks "Attendance" in the sidebar
2. System displays her attendance history
3. Emily sees a list of all her attendance records
4. Emily filters by "Computer Science 201" course
5. System shows only CS201 attendance records
6. Emily clicks "Export to PDF"
7. System generates and downloads PDF report

**Postconditions:**
- Emily has a PDF of her attendance history

---

## 9.3 Mentor Scenarios

### Scenario M1: Starting an Attendance Session

**Actor:** Mentor (Dr. Smith)

**Preconditions:**
- Dr. Smith is logged in
- Dr. Smith is assigned to "Physics 101" class
- Class is scheduled for current time

**Flow:**
1. Dr. Smith navigates to Attendance page
2. Dr. Smith selects "Physics 101" from class dropdown
3. Dr. Smith clicks "Start Session" button
4. System creates new attendance session
5. System initializes all enrolled students as "Absent"
6. System sends notifications to all enrolled students
7. Dr. Smith sees live attendance feed
8. As students are recognized, feed updates in real-time
9. After 20 minutes, Dr. Smith clicks "End Session"
10. System prompts for confirmation
11. Dr. Smith confirms, session ends
12. System sends "Session ended" notifications

**Postconditions:**
- Session state is "Completed"
- All attendance records are finalized

---

### Scenario M2: Manual Attendance Override

**Actor:** Mentor (Prof. Johnson)

**Preconditions:**
- Attendance session is active
- Student "Alex" was marked absent by system

**Flow:**
1. Prof. Johnson sees Alex in class but not recognized
2. Prof. Johnson finds Alex in the student list
3. Prof. Johnson clicks on Alex's status dropdown
4. Prof. Johnson selects "Present" from options
5. System updates Alex's status to "Present"
6. System records verification method as "Manual"
7. Alex receives notification of attendance update

**Postconditions:**
- Alex's attendance is marked as "Present"
- Override is logged for audit

---

### Scenario M3: Viewing Class Attendance Report

**Actor:** Mentor (Dr. Lee)

**Preconditions:**
- Dr. Lee has completed multiple sessions
- Dr. Lee wants to review attendance patterns

**Flow:**
1. Dr. Lee navigates to Attendance page
2. Dr. Lee selects "Database Systems" class
3. Dr. Lee clicks "View History" tab
4. System displays all past sessions
5. Dr. Lee selects date range filter
6. System shows sessions within range
7. Dr. Lee clicks on a specific session
8. System shows detailed attendance for that session
9. Dr. Lee clicks "Export to CSV"
10. System downloads attendance data

**Postconditions:**
- Dr. Lee has attendance data for analysis

---

## 9.4 Administrator Scenarios

### Scenario A1: Creating a New Course

**Actor:** Administrator (Admin Alice)

**Preconditions:**
- Admin Alice is logged in
- New semester is starting

**Flow:**
1. Admin Alice navigates to Courses page
2. Admin Alice clicks "Add Course" button
3. System displays course creation form
4. Admin Alice enters:
   - Code: "CS301"
   - Name: "Software Engineering"
   - Description: "Introduction to software development practices"
5. Admin Alice clicks "Create"
6. System validates input
7. System creates course
8. System displays success message
9. New course appears in course list

**Postconditions:**
- Course "CS301" exists in system
- Course can be assigned to mentors

---

### Scenario A2: Managing User Accounts

**Actor:** Administrator (Admin Bob)

**Preconditions:**
- Admin Bob is logged in
- New mentor needs to be added

**Flow:**
1. Admin Bob navigates to Users page
2. Admin Bob clicks "Add User" button
3. System displays user creation form
4. Admin Bob enters mentor details:
   - Name: "Dr. Sarah Wilson"
   - Email: "s.wilson@school.edu"
   - Role: "Mentor"
5. Admin Bob clicks "Create"
6. System creates user with temporary password
7. System sends welcome email to mentor
8. New mentor appears in user list

**Postconditions:**
- Mentor account is created
- Mentor can log in and access system

---

### Scenario A3: Monitoring Active Sessions

**Actor:** Administrator (Admin Carol)

**Preconditions:**
- Multiple attendance sessions are active
- Admin Carol wants to monitor operations

**Flow:**
1. Admin Carol navigates to Attendance page
2. System displays grid of all active sessions
3. Each card shows:
   - Class name
   - Mentor name
   - Start time
   - Students present count
4. Admin Carol clicks on "Math 101" session card
5. System expands to show session details
6. Admin Carol sees live attendance feed (spectate mode)
7. Admin Carol cannot modify attendance (view only)

**Postconditions:**
- Admin Carol has visibility into all operations
- No changes made to sessions

---

## 9.5 System Scenarios

### Scenario SYS1: Session Auto-End

**Actor:** System

**Preconditions:**
- Attendance session has been active for 2+ hours
- Mentor has not manually ended session

**Flow:**
1. Background task checks for expired sessions
2. System finds session exceeding max duration
3. System automatically ends the session
4. System sets ended_reason to "auto_timeout"
5. System sends notifications to mentor and students
6. Notification includes: "Session auto-ended after 2 hours"

**Postconditions:**
- Session state is "Completed"
- All parties are notified

---

### Scenario SYS2: Recognition Window Expiry

**Actor:** System

**Preconditions:**
- Attendance session started 25 minutes ago
- Recognition window is 20 minutes

**Flow:**
1. Student arrives late (25 min after start)
2. Edge Agent captures student's face
3. System recognizes student
4. System checks recognition window
5. Window has expired (25 > 20 minutes)
6. System rejects automatic attendance
7. Mentor must mark attendance manually

**Postconditions:**
- Student not auto-marked
- Manual intervention required

---

## 9.6 Error Scenarios

### Scenario E1: Face Not Recognized

**Actor:** Student (Mike)

**Preconditions:**
- Mike has enrolled face
- Lighting conditions are poor

**Flow:**
1. Mike enters classroom
2. Edge Agent captures Mike's face
3. System attempts recognition
4. Confidence score is 0.35 (below threshold 0.40)
5. System does not mark attendance
6. Mike is not notified (no false positives)
7. Mentor sees Mike in class
8. Mentor manually marks Mike as "Present"

**Postconditions:**
- Mike is marked present via manual override

---

### Scenario E2: Network Failure During Session

**Actor:** System

**Preconditions:**
- Attendance session is active
- Network connection is lost

**Flow:**
1. Edge Agent captures face
2. API request fails due to network error
3. Edge Agent retries with exponential backoff
4. After 3 retries, Edge Agent queues request
5. Network is restored
6. Edge Agent sends queued requests
7. System processes delayed recognitions

**Postconditions:**
- Attendance is eventually recorded
- No data is lost

---

## 9.7 Scenario Summary

| ID | Scenario | Actor | Priority |
|----|----------|-------|----------|
| S1 | First-Time Face Enrollment | Student | High |
| S2 | Automatic Attendance Marking | Student | High |
| S3 | Viewing Attendance History | Student | Medium |
| M1 | Starting Attendance Session | Mentor | High |
| M2 | Manual Attendance Override | Mentor | High |
| M3 | Viewing Class Report | Mentor | Medium |
| A1 | Creating New Course | Admin | High |
| A2 | Managing User Accounts | Admin | High |
| A3 | Monitoring Active Sessions | Admin | Medium |
| SYS1 | Session Auto-End | System | Medium |
| SYS2 | Recognition Window Expiry | System | Medium |
| E1 | Face Not Recognized | Student | High |
| E2 | Network Failure | System | Medium |
