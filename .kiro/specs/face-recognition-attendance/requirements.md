# Requirements Document

## Introduction

The Face Recognition Attendance System is an automated attendance management solution that uses AI-powered face recognition to track student attendance in real-time. The system serves three primary user roles: students who attend classes, mentors who conduct classes, and supervisors who oversee the entire system. The system integrates camera hardware with edge computing, AI models, and a centralized backend to provide seamless, automated attendance tracking with manual override capabilities.

## Glossary

- **System**: The Face Recognition Attendance System
- **Class**: A scheduled learning session that can be in active or inactive state
- **Student**: A learner who attends classes and receives attendance notifications
- **Mentor**: An instructor who conducts classes and manages attendance
- **Supervisor**: An administrator who manages schedules and oversees all system operations
- **Edge Agent**: A software component that preprocesses camera frames before sending to the AI Model
- **AI Model**: The face recognition service that identifies students from camera frames
- **API Gateway**: The single entry point that handles authentication, routing, and rate limiting for all external requests
- **Message Broker**: An asynchronous queue system that buffers face recognition requests between Edge Agent and AI Model
- **Schedule**: A collection of classes with their dates, times, and details
- **Attendance Process**: The automated workflow triggered when a class becomes active

## Requirements

### Requirement 1

**User Story:** As a mentor, I want to activate a class session, so that the attendance system automatically starts capturing and processing student attendance

#### Acceptance Criteria

1. WHEN a mentor activates a class, THE System SHALL transition the class state from inactive to active
2. WHEN a class transitions to active state, THE System SHALL initiate the Attendance Process
3. WHEN the Attendance Process initiates, THE System SHALL activate the camera and Edge Agent
4. THE System SHALL allow only mentors with authorization for a specific class to activate that class
5. WHEN a class is activated, THE System SHALL send notifications to all enrolled students indicating class has started

### Requirement 2

**User Story:** As a mentor, I want to manually mark attendance and end class sessions, so that I have control over the attendance process when needed

#### Acceptance Criteria

1. WHILE a class is in active state, THE System SHALL provide the mentor with manual attendance marking capabilities
2. THE System SHALL display all enrolled students with their current attendance state to the mentor
3. WHEN a mentor manually marks a student's attendance, THE System SHALL update the attendance record in the database
4. WHEN a mentor ends a class session, THE System SHALL transition the class from active to inactive state
5. WHEN a class session ends, THE System SHALL finalize all attendance records for that session

### Requirement 3

**User Story:** As a student, I want to receive real-time notifications about my class and attendance status, so that I stay informed about my academic participation

#### Acceptance Criteria

1. WHEN a class that a student is enrolled in becomes active, THE System SHALL send a notification to that student
2. WHEN the AI Model successfully recognizes a student's face, THE System SHALL send an attendance confirmation notification to that student
3. IF a student is not recognized by the end of the attendance window, THEN THE System SHALL send an absence notification to that student
4. WHEN a student arrives after the attendance deadline, THE System SHALL send a late arrival notification to that student
5. WHEN a class is cancelled or rescheduled, THE System SHALL send an update notification to all enrolled students

### Requirement 4

**User Story:** As a supervisor, I want to manage the main schedule by adding, editing, and deleting classes, so that I can coordinate all learning activities

#### Acceptance Criteria

1. THE System SHALL allow supervisors to create new class entries with room, time, content, and course details
2. THE System SHALL allow supervisors to modify existing class details including date, time, and location
3. THE System SHALL allow supervisors to delete classes from the schedule
4. WHEN a supervisor modifies or deletes a class, THE System SHALL synchronize the change across all affected student and mentor schedules
5. WHEN a schedule change occurs, THE System SHALL send notifications to all affected students and mentors

### Requirement 5

**User Story:** As a supervisor, I want to spectate live class sessions and view all system information, so that I can monitor system operations and class activities

#### Acceptance Criteria

1. WHILE a class is in active state, THE System SHALL allow supervisors to view the live session details
2. THE System SHALL display all students in an active class with their attendance states to the supervisor
3. THE System SHALL provide supervisors with access to the complete schedule showing all classes
4. THE System SHALL display class content and course information to supervisors
5. THE System SHALL allow supervisors to view attendance history across all classes

### Requirement 6

**User Story:** As a student, I want to view my personalized schedule showing only my classes, so that I can track my upcoming sessions

#### Acceptance Criteria

1. THE System SHALL display only classes that a student is enrolled in on their schedule view
2. THE System SHALL show class details including room, time, content, and course for each scheduled class
3. WHEN the main schedule is updated by a supervisor, THE System SHALL reflect changes in the student's personalized schedule within 5 seconds
4. THE System SHALL display the current state of each class (active or inactive) in the student's schedule
5. THE System SHALL organize classes chronologically in the student's schedule view

### Requirement 7

**User Story:** As a mentor, I want to view my teaching schedule showing only classes I conduct, so that I can prepare for my sessions

#### Acceptance Criteria

1. THE System SHALL display only classes that a mentor is assigned to conduct on their schedule view
2. THE System SHALL show class details including room, time, content, and course for each scheduled class
3. WHEN the main schedule is updated by a supervisor, THE System SHALL reflect changes in the mentor's personalized schedule within 5 seconds
4. THE System SHALL display the current state of each class (active or inactive) in the mentor's schedule view
5. THE System SHALL organize classes chronologically in the mentor's schedule view

### Requirement 8

**User Story:** As an edge agent, I want to capture and preprocess camera frames when attendance is being taken, so that the AI Model receives optimized data for face recognition

#### Acceptance Criteria

1. WHEN the Attendance Process activates the camera, THE Edge Agent SHALL begin capturing frames from the camera
2. THE Edge Agent SHALL preprocess captured frames before transmission to the AI Model
3. WHEN frames are preprocessed, THE Edge Agent SHALL send the frames to the Message Broker
4. WHEN the Attendance Process completes, THE Edge Agent SHALL stop capturing frames
5. IF the camera fails to capture frames, THEN THE Edge Agent SHALL log the error and notify the System

### Requirement 9

**User Story:** As the AI Model, I want to receive preprocessed frames and perform face recognition, so that I can identify students for attendance tracking

#### Acceptance Criteria

1. WHEN the Message Broker delivers frames to the AI Model, THE AI Model SHALL process the frames for face recognition
2. THE AI Model SHALL query the database to match recognized faces with student records
3. WHEN face recognition completes, THE AI Model SHALL send recognition results to the backend
4. THE AI Model SHALL include student identifiers and confidence scores in the recognition results
5. IF face recognition fails for a frame, THEN THE AI Model SHALL log the failure and continue processing remaining frames

### Requirement 10

**User Story:** As the API Gateway, I want to authenticate and route all incoming requests, so that the system remains secure and requests reach the correct services

#### Acceptance Criteria

1. WHEN a request arrives at the API Gateway, THE API Gateway SHALL verify the authentication credentials
2. THE API Gateway SHALL validate JSON Web Tokens for user requests from the UI
3. THE API Gateway SHALL validate API Keys for requests from Edge Agents
4. WHEN authentication succeeds, THE API Gateway SHALL route the request to the appropriate backend service based on the URL path
5. IF authentication fails, THEN THE API Gateway SHALL reject the request with an unauthorized error response

### Requirement 11

**User Story:** As the API Gateway, I want to implement rate limiting, so that the system is protected from request floods and malicious traffic

#### Acceptance Criteria

1. THE API Gateway SHALL track the number of requests from each client within a time window
2. WHEN a client exceeds the configured request limit, THE API Gateway SHALL reject subsequent requests from that client
3. THE API Gateway SHALL return a rate limit exceeded error to clients that are throttled
4. THE API Gateway SHALL reset rate limit counters after the time window expires
5. THE API Gateway SHALL allow configuration of different rate limits for different client types

### Requirement 12

**User Story:** As the Message Broker, I want to queue face recognition requests asynchronously, so that the Edge Agent can continue operating without waiting for AI processing

#### Acceptance Criteria

1. WHEN the Edge Agent sends face data to the Message Broker, THE Message Broker SHALL accept the data and return immediately
2. THE Message Broker SHALL store pending face recognition requests in a queue
3. WHEN the AI Model is ready, THE Message Broker SHALL deliver queued requests to the AI Model
4. IF the AI Model is unavailable, THEN THE Message Broker SHALL retain queued requests until the AI Model becomes available
5. THE Message Broker SHALL process requests in the order they were received

### Requirement 13

**User Story:** As a user of any role, I want to authenticate securely to access the system, so that my data and actions are protected

#### Acceptance Criteria

1. THE System SHALL provide a login page for all user roles
2. WHEN a user submits valid credentials, THE System SHALL generate a JSON Web Token for that user
3. THE System SHALL include the user's role and permissions in the JSON Web Token
4. WHEN a user's session expires, THE System SHALL require re-authentication
5. THE System SHALL encrypt all authentication credentials during transmission

### Requirement 14

**User Story:** As a student, I want to view my attendance history, so that I can track my participation across all classes

#### Acceptance Criteria

1. THE System SHALL display all past classes that a student was enrolled in
2. THE System SHALL show the attendance status (present, absent, late) for each past class
3. THE System SHALL display the date and time for each attendance record
4. THE System SHALL calculate and display attendance statistics for the student
5. THE System SHALL allow students to filter attendance history by date range or course

### Requirement 15

**User Story:** As a mentor, I want to view attendance history for my classes, so that I can track student participation patterns

#### Acceptance Criteria

1. THE System SHALL display attendance records for all classes conducted by the mentor
2. THE System SHALL show which students were present, absent, or late for each class
3. THE System SHALL allow the mentor to filter attendance records by class, date, or student
4. THE System SHALL calculate and display attendance statistics per student and per class
5. THE System SHALL allow the mentor to export attendance data for reporting purposes

### Requirement 16

**User Story:** As the database, I want to store all system data without duplication, so that data integrity is maintained and queries are efficient

#### Acceptance Criteria

1. THE System SHALL store user profiles with role information in the database
2. THE System SHALL store class definitions with schedule, room, and content details in the database
3. THE System SHALL store attendance records linking students to classes with timestamps in the database
4. THE System SHALL store face recognition data for student identification in the database
5. THE System SHALL enforce referential integrity constraints to prevent orphaned records
