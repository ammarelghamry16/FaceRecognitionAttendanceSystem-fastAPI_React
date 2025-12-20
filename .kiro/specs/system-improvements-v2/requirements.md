# Requirements Document

## Introduction

This document specifies a comprehensive set of system improvements for the Face Recognition Attendance System. The improvements span UI/UX enhancements, session management changes, student ID format updates, face enrollment redesign, and concurrent session support. These changes aim to improve usability, align with real-world academic workflows, and provide a more polished user experience.

## Glossary

- **Session**: An attendance tracking period for a class, started by a mentor
- **Mentor**: A teacher/professor who manages classes and attendance
- **Admin**: System administrator who can view but not control class sessions
- **Student ID**: A human-readable identifier in format YYYY/NNNNN (e.g., 2025/03897)
- **Face Enrollment**: The process of capturing facial data for recognition
- **Toast Notification**: A temporary UI message that appears and can be dismissed
- **Late Threshold**: The time window (20 minutes) after session start when automatic attendance is active

## Requirements

### Requirement 1: Login Error Handling

**User Story:** As a user, I want to see clear error feedback when login fails, so that I understand what went wrong without the page reloading.

#### Acceptance Criteria

1. WHEN a user submits invalid credentials THEN the Login_Page SHALL display an error toast notification without reloading the page
2. WHEN login fails THEN the Login_Page SHALL preserve the entered email address in the input field
3. WHEN an error notification is displayed THEN the Login_Page SHALL allow the user to dismiss it manually

---

### Requirement 2: Scrollable Content Areas

**User Story:** As a user, I want content areas to scroll independently from the sidebar, so that I can navigate large data sets without losing context.

#### Acceptance Criteria

1. WHEN displaying content that exceeds viewport height THEN the Content_Area SHALL scroll independently from the Sidebar
2. WHILE the user scrolls content THEN the Sidebar SHALL remain fixed in position
3. WHEN viewing the Schedule tab THEN the day-of-week headers SHALL remain visible while class lists scroll
4. WHEN viewing any tab with tabular data THEN the Content_Area SHALL contain scrolling within its boundaries

---

### Requirement 3: Enrollment Management Improvements

**User Story:** As a mentor, I want to see student names alongside IDs and search by name when enrolling, so that I can manage enrollments efficiently.

#### Acceptance Criteria

1. WHEN displaying enrolled students THEN the Enrollments_Page SHALL show both student name and student ID
2. WHEN adding a new enrollment THEN the Enrollments_Page SHALL provide a searchable dropdown that filters by student name
3. WHEN typing in the student search field THEN the Enrollments_Page SHALL suggest matching students from the class roster
4. WHEN a student is selected from suggestions THEN the Enrollments_Page SHALL auto-populate the enrollment form

---

### Requirement 4: Human-Readable Student ID Format

**User Story:** As an administrator, I want student IDs in a readable format (YYYY/NNNNN), so that they can be easily communicated and entered manually.

#### Acceptance Criteria

1. WHEN creating a new student THEN the System SHALL generate a student ID in format YYYY/NNNNN where YYYY is the enrollment year
2. WHEN displaying student information THEN the System SHALL show the human-readable student ID format
3. WHEN searching for students THEN the System SHALL accept the human-readable student ID format
4. WHEN migrating existing data THEN the System SHALL convert UUID-based student IDs to the new format while preserving uniqueness

---

### Requirement 5: Dismissable Notifications with Timestamps

**User Story:** As a user, I want to dismiss notifications and see when they were sent, so that I can manage my notification queue effectively.

#### Acceptance Criteria

1. WHEN a notification is displayed THEN the Notification_Component SHALL include a dismiss button
2. WHEN the user clicks dismiss THEN the Notification_Component SHALL remove the notification immediately
3. WHEN displaying a notification THEN the Notification_Component SHALL show relative time since sent (e.g., "2 minutes ago")
4. WHEN time passes THEN the Notification_Component SHALL update the relative timestamp dynamically

---

### Requirement 6: Session Persistence Independent of User Login

**User Story:** As a mentor, I want attendance sessions to continue running even after I log out, so that attendance tracking is not interrupted.

#### Acceptance Criteria

1. WHEN a mentor logs out during an active session THEN the Attendance_Session SHALL continue running
2. WHEN a session is active THEN the Session SHALL run until explicitly ended by the mentor or admin, or until the scheduled duration expires
3. WHEN a session ends THEN the System SHALL notify all enrolled students of the session end and who ended it
4. WHEN the scheduled class duration (1.5-2 hours) expires THEN the System SHALL automatically end the session

---

### Requirement 7: Automatic Attendance Time Window

**User Story:** As a mentor, I want automatic face recognition attendance to be active only for the first 20 minutes, so that system resources are used efficiently.

#### Acceptance Criteria

1. WHEN a session starts THEN the Attendance_System SHALL activate camera-based face recognition for 20 minutes
2. WHEN 20 minutes have elapsed THEN the Attendance_System SHALL deactivate automatic face recognition
3. WHILE automatic recognition is inactive THEN the Mentor SHALL still be able to mark attendance manually
4. WHEN automatic recognition period ends THEN the System SHALL switch to a lightweight spectating mode

---

### Requirement 8: Mentor-Only Session Control

**User Story:** As a mentor, I want exclusive control over starting and ending my class sessions, so that my lecture timing is not affected by others.

#### Acceptance Criteria

1. WHEN an admin views a class THEN the Admin_Interface SHALL hide session start/end controls
2. WHEN a mentor accesses their class THEN the Mentor_Interface SHALL display session start/end controls
3. WHEN an admin views an active session THEN the Admin_Interface SHALL provide spectate-only access
4. IF an admin attempts to start/end a session via API THEN the System SHALL reject the request with an authorization error

---

### Requirement 9: Concurrent Session Support

**User Story:** As a system administrator, I want multiple classes to run attendance sessions simultaneously, so that the system supports real academic schedules.

#### Acceptance Criteria

1. WHEN multiple mentors start sessions THEN the System SHALL handle all sessions concurrently without interference
2. WHEN sessions run in parallel THEN each Session SHALL maintain independent state and data
3. WHEN querying active sessions THEN the System SHALL return all currently active sessions across all classes

---

### Requirement 10: Admin Multi-Session Spectating

**User Story:** As an admin, I want to view multiple active sessions at once, so that I can monitor overall attendance activity.

#### Acceptance Criteria

1. WHEN an admin views the Attendance tab THEN the Admin_Dashboard SHALL display a grid of all active sessions
2. WHEN multiple sessions are active THEN the Admin_Dashboard SHALL show real-time status for each session
3. WHEN clicking on a session card THEN the Admin_Dashboard SHALL expand to show detailed session information

---

### Requirement 11: iPhone-Style Face Enrollment

**User Story:** As a student, I want a guided face enrollment experience similar to iPhone Face ID, so that I can easily position myself for optimal photo capture.

#### Acceptance Criteria

1. WHEN starting face enrollment THEN the Face_Enrollment_Page SHALL display a live camera preview with face positioning guide
2. WHEN a face is detected THEN the Face_Enrollment_Page SHALL show visual feedback indicating face position quality
3. WHEN the face is properly positioned THEN the Face_Enrollment_Page SHALL automatically capture photos at different angles
4. WHEN enrollment is complete THEN the Face_Enrollment_Page SHALL display success confirmation with captured image count
5. IF no face is detected THEN the Face_Enrollment_Page SHALL display guidance text to help the user position correctly

---

### Requirement 12: Sign-Out Confirmation

**User Story:** As a user, I want to confirm before signing out, so that I don't accidentally lose my session.

#### Acceptance Criteria

1. WHEN the user clicks sign out THEN the System SHALL display a confirmation dialog
2. WHEN the confirmation dialog is shown THEN the Dialog SHALL include "Cancel" and "Sign Out" options
3. WHEN the user confirms sign out THEN the System SHALL proceed with logout
4. WHEN the user cancels THEN the System SHALL close the dialog and maintain the session

