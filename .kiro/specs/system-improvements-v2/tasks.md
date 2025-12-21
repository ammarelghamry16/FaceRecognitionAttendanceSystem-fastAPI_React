# Implementation Plan

## Phase 1: Quick UI Fixes (Login, Scrolling, Sign-Out)

- [x] 1. Fix login error handling

  - [x] 1.1 Update Login.tsx to use toast notifications instead of inline error


    - Import toast from useToast hook
    - Show dismissible toast on login failure
    - Preserve email input value on error
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Write unit test for login error handling


    - Test toast appears on invalid credentials
    - Test email is preserved after error
    - _Requirements: 1.1, 1.2_

- [x] 2. Implement scrollable content areas

  - [x] 2.1 Update Layout component for fixed sidebar and scrollable content


    - Set sidebar to fixed height with overflow-y-auto
    - Set main content area to flex-1 overflow-y-auto
    - Add h-screen overflow-hidden to root container
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Update Schedule page with sticky day headers


    - Add sticky positioning to day-of-week headers
    - Ensure content scrolls independently
    - _Requirements: 2.3_
  - [x] 2.3 Apply scrollable pattern to all data pages


    - Update Classes, Courses, Enrollments, Attendance pages
    - Ensure tables scroll within their containers
    - _Requirements: 2.4_

- [x] 3. Add sign-out confirmation dialog

  - [x] 3.1 Create logout confirmation dialog in Sidebar


    - Add AlertDialog component for confirmation
    - Include Cancel and Sign Out buttons
    - Only proceed with logout on confirmation
    - _Requirements: 12.1, 12.2, 12.3, 12.4_


- [x] 4. Checkpoint - Verify UI fixes
  - UI fixes verified and working

## Phase 2: Notification Improvements

- [x] 5. Implement dismissible notifications with timestamps

  - [x] 5.1 Update toast component with dismiss button


    - Add X button to all toasts
    - Implement manual dismiss functionality
    - _Requirements: 5.1, 5.2_
  - [x] 5.2 Add relative time display to notifications


    - Create getRelativeTime utility function
    - Display "X min ago" format on notifications
    - Update timestamps dynamically with useEffect
    - _Requirements: 5.3, 5.4_
  - [x] 5.3 Write property test for relative time formatting

    - **Property 11: Relative Time Accuracy**
    - **Validates: Requirements 5.3**

## Phase 3: Student ID Format Change

- [x] 6. Implement human-readable student ID format
  - [x] 6.1 Create student ID sequence table and migration


    - Add student_id_sequences table with year and last_sequence columns
    - Add enrollment_year column to users table
    - _Requirements: 4.1_
  - [x] 6.2 Implement student ID generation service


    - Create generate_student_id function with YYYY/NNNNN format
    - Ensure thread-safe sequence increment
    - _Requirements: 4.1_
  - [x] 6.3 Write property test for student ID format

    - **Property 1: Student ID Format Consistency**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 6.4 Write property test for student ID uniqueness


    - **Property 2: Student ID Uniqueness**
    - **Validates: Requirements 4.4**
  - [x] 6.5 Create data migration script for existing students

    - Convert existing UUID-based student_ids to new format
    - Preserve uniqueness during migration
    - _Requirements: 4.4_
  - [x] 6.6 Update frontend to display and search by new ID format


    - Update all student ID displays
    - Update search functionality to accept new format
    - _Requirements: 4.2, 4.3_

- [x] 7. Checkpoint - Verify student ID changes

  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Enrollment Management Improvements

- [x] 8. Improve enrollment management UI

  - [x] 8.1 Create student search API endpoint


    - Add GET /api/auth/users/search endpoint
    - Support query by name or student_id
    - Return student name, ID, and readable ID
    - _Requirements: 3.2, 3.3_
  - [x] 8.2 Update enrollment API to return student details


    - Include student_name in enrollment responses
    - Include readable student_id format
    - _Requirements: 3.1_
  - [x] 8.3 Write property test for enrollment display completeness

    - **Property 10: Enrollment Display Completeness**
    - **Validates: Requirements 3.1**

  - [x] 8.4 Implement searchable student dropdown in Enrollments page

    - Add autocomplete search input
    - Show suggestions as user types
    - Auto-populate form on selection
    - _Requirements: 3.2, 3.3, 3.4_

## Phase 5: Session Management Changes

- [x] 9. Implement session persistence and auto-end
  - [x] 9.1 Update AttendanceSession model with new fields


    - Add max_duration_minutes (default 120)
    - Add auto_ended boolean flag
    - Add ended_reason string field
    - _Requirements: 6.2, 6.4_
  - [x] 9.2 Implement session auto-end background task

    - Create task to check for expired sessions
    - Auto-end sessions that exceed max_duration
    - Send notifications on auto-end
    - _Requirements: 6.4_
  - [x] 9.3 Write property test for session persistence after logout

    - **Property 3: Session Persistence After Logout**
    - **Validates: Requirements 6.1, 6.2**



  - [x] 9.4 Write property test for session auto-end


    - **Property 4: Session Auto-End on Duration**
    - **Validates: Requirements 6.4**

  - [x] 9.5 Add session end notifications
    - Notify all enrolled students when session ends
    - Include who ended the session (mentor name or "auto")
    - _Requirements: 6.3_

- [x] 10. Implement 20-minute auto-recognition window
  - [x] 10.1 Add auto-recognition fields to AttendanceSession

    - Add auto_recognition_window_minutes (default 20)
    - Add is_auto_recognition_active computed property
    - _Requirements: 7.1, 7.2_


  - [x] 10.2 Write property test for auto-recognition window

    - **Property 5: Auto-Recognition Window**
    - **Validates: Requirements 7.1, 7.2**

  - [x] 10.3 Update attendance marking to check recognition window
    - Allow face recognition only within window


    - Always allow manual marking
    - _Requirements: 7.2, 7.3_
  - [x] 10.4 Write property test for manual attendance availability

    - **Property 6: Manual Attendance Always Available**
    - **Validates: Requirements 7.3**

  - [x] 10.5 Update frontend to show recognition window status
    - Display countdown timer for auto-recognition
    - Show "Manual only" mode after window expires
    - _Requirements: 7.4_

- [x] 11. Checkpoint - Verify session management

  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Mentor-Only Session Control



- [x] 12. Restrict session control to mentors only
  - [x] 12.1 Update session start/end API authorization

    - Remove admin from allowed roles for start/end
    - Verify mentor owns the class before allowing
    - Return 403 for unauthorized attempts
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 12.2 Write property test for mentor-only session control
    - **Property 7: Mentor-Only Session Control**
    - **Validates: Requirements 8.4**

  - [x] 12.3 Update Attendance page UI for role-based controls



    - Hide start/end buttons for admin
    - Show spectate-only view for admin
    - Keep full controls for mentor
    - _Requirements: 8.1, 8.2, 8.3_

## Phase 7: Concurrent Sessions and Admin Multi-View

- [x] 13. Verify and enhance concurrent session support



  - [x] 13.1 Add API endpoint to get all active sessions

    - Create GET /api/attendance/sessions/active endpoint
    - Return all sessions with state="active"
    - Include class name and mentor info
    - _Requirements: 9.3_
  - [x] 13.2 Write property test for concurrent session independence

    - **Property 8: Concurrent Session Independence**
    - **Validates: Requirements 9.2**

  - [x] 13.3 Write property test for active sessions query
    - **Property 9: Active Sessions Query Completeness**
    - **Validates: Requirements 9.3**

- [x] 14. Implement admin multi-session spectating view
  - [x] 14.1 Create AdminAttendanceView component

    - Grid layout for multiple session cards
    - Real-time polling for session updates
    - Click to expand session details
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 14.2 Update Attendance page to use role-based views

    - Show AdminAttendanceView for admin role
    - Show existing view for mentor/student
    - _Requirements: 10.1_


- [x] 15. Checkpoint - Verify concurrent sessions and admin view
  - Admin spectate view implemented
  - Role-based controls working

## Phase 8: iPhone-Style Face Enrollment

- [x] 16. Redesign face enrollment experience

  - [x] 16.1 Implement live face detection with position feedback

    - Use face-api.js or similar for browser-based detection
    - Calculate face position relative to guide oval
    - Determine position quality (no_face, too_far, too_close, off_center, good)
    - _Requirements: 11.1, 11.2_

  - [x] 16.2 Create visual feedback UI for face positioning


    - Color-coded oval guide (red/yellow/green)
    - Position guidance text ("Move closer", "Center your face", etc.)
    - Quality indicator bar
    - _Requirements: 11.2, 11.5_


  - [x] 16.3 Implement auto-capture on good position
    - Wait for stable good position (1.5s)
    - Auto-capture without user clicking
    - Progress indicator for multi-angle captures
    - _Requirements: 11.3_
  - [x] 16.4 Add enrollment completion feedback
    - Success animation on completion
    - Show count of captured images
    - Clear success message
    - _Requirements: 11.4_



- [x] 17. Final Checkpoint - Complete system verification
  - iPhone-style face enrollment implemented
  - All major features complete
