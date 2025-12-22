# Data Design

## 4.1 Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                                                                                      │
│    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐                  │
│    │   USERS     │         │   COURSES   │         │   CLASSES   │                  │
│    ├─────────────┤         ├─────────────┤         ├─────────────┤                  │
│    │ PK id       │         │ PK id       │         │ PK id       │                  │
│    │    email    │         │    code     │         │ FK course_id│──────┐           │
│    │    password │         │    name     │         │ FK mentor_id│──┐   │           │
│    │    full_name│◄────────│    desc     │◄────────│    name     │  │   │           │
│    │    role     │   1:N   │    created  │   1:N   │    day      │  │   │           │
│    │    student_id         └─────────────┘         │    time     │  │   │           │
│    │    is_active│                                 │    room     │  │   │           │
│    │    created  │                                 └──────┬──────┘  │   │           │
│    └──────┬──────┘                                        │         │   │           │
│           │                                               │         │   │           │
│           │                                               │ 1:N     │   │           │
│           │ 1:N                                           │         │   │           │
│           │                                               ▼         │   │           │
│           │                                    ┌─────────────────┐  │   │           │
│           │                                    │  ENROLLMENTS    │  │   │           │
│           │                                    ├─────────────────┤  │   │           │
│           │                                    │ PK,FK student_id│◄─┼───┘           │
│           │                                    │ PK,FK class_id  │◄─┘               │
│           │                                    │     enrolled_at │                  │
│           │                                    └─────────────────┘                  │
│           │                                                                         │
│           │                                    ┌─────────────────┐                  │
│           │                                    │ATTENDANCE_SESSION                  │
│           │                                    ├─────────────────┤                  │
│           │                                    │ PK id           │                  │
│           │                                    │ FK class_id     │◄─────────────────┤
│           │                                    │    start_time   │                  │
│           │                                    │    end_time     │                  │
│           │                                    │    state        │                  │
│           │                                    └────────┬────────┘                  │
│           │                                             │                           │
│           │                                             │ 1:N                       │
│           │                                             ▼                           │
│           │                                    ┌─────────────────┐                  │
│           │                                    │ATTENDANCE_RECORD│                  │
│           │                                    ├─────────────────┤                  │
│           ├───────────────────────────────────►│ PK id           │                  │
│           │                                    │ FK session_id   │                  │
│           │                                    │ FK student_id   │                  │
│           │                                    │    status       │                  │
│           │                                    │    timestamp    │                  │
│           │                                    │    confidence   │                  │
│           │                                    │    method       │                  │
│           │                                    └─────────────────┘                  │
│           │                                                                         │
│           │ 1:N                                                                     │
│           │                                                                         │
│           ▼                                                                         │
│    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐                  │
│    │FACE_ENCODING│         │NOTIFICATION │         │USER_CENTROID│                  │
│    ├─────────────┤         ├─────────────┤         ├─────────────┤                  │
│    │ PK id       │         │ PK id       │         │ PK user_id  │                  │
│    │ FK user_id  │         │ FK user_id  │         │    centroid │                  │
│    │    encoding │         │    type     │         │    count    │                  │
│    │    quality  │         │    title    │         │    quality  │                  │
│    │    pose     │         │    message  │         │    coverage │                  │
│    │    created  │         │    is_read  │         └─────────────┘                  │
│    └─────────────┘         │    created  │                                          │
│                            └─────────────┘                                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Database Tables

### 4.2.1 Users Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| full_name | VARCHAR(100) | NOT NULL | User's full name |
| role | ENUM | NOT NULL, DEFAULT 'student' | student/mentor/admin |
| student_id | VARCHAR(50) | NULLABLE | Format: YYYY/NNNNN |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

### 4.2.2 Courses Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| code | VARCHAR(20) | UNIQUE, NOT NULL | Course code (e.g., CS101) |
| name | VARCHAR(100) | NOT NULL | Course name |
| description | TEXT | NULLABLE | Course description |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### 4.2.3 Classes Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| course_id | UUID | FK → courses(id) | Parent course |
| mentor_id | UUID | FK → users(id) | Assigned mentor |
| name | VARCHAR(100) | NOT NULL | Class name |
| room_number | VARCHAR(50) | NOT NULL | Room location |
| day_of_week | ENUM | NOT NULL | monday-sunday |
| schedule_time | TIME | NOT NULL | Class time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

### 4.2.4 Enrollments Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| student_id | UUID | PK, FK → users(id) | Student reference |
| class_id | UUID | PK, FK → classes(id) | Class reference |
| enrolled_at | TIMESTAMP | DEFAULT NOW() | Enrollment date |

### 4.2.5 Attendance Sessions Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| class_id | UUID | FK → classes(id) | Class reference |
| start_time | TIMESTAMP | DEFAULT NOW() | Session start |
| end_time | TIMESTAMP | NULLABLE | Session end |
| state | ENUM | NOT NULL, DEFAULT 'inactive' | inactive/active/completed |
| max_duration_minutes | INTEGER | DEFAULT 120 | Auto-end duration |
| auto_ended | BOOLEAN | DEFAULT FALSE | Was auto-ended |
| ended_reason | VARCHAR(50) | NULLABLE | End reason |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### 4.2.6 Attendance Records Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| session_id | UUID | FK → attendance_sessions(id) | Session reference |
| student_id | UUID | FK → users(id) | Student reference |
| status | ENUM | NOT NULL, DEFAULT 'absent' | present/absent/late/excused |
| timestamp | TIMESTAMP | DEFAULT NOW() | Marking time |
| confidence_score | FLOAT | CHECK (0-1) | Recognition confidence |
| verification_method | VARCHAR(50) | DEFAULT 'face_recognition' | face_recognition/manual |

### 4.2.7 Face Encodings Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users(id) | User reference |
| encoding | FLOAT[] | NOT NULL | 512-dim face vector |
| quality_score | FLOAT | NOT NULL, DEFAULT 0.0 | Image quality |
| pose_category | VARCHAR(20) | NULLABLE | front/left/right/up/down |
| is_adaptive | BOOLEAN | DEFAULT FALSE | Adaptive enrollment |
| version | VARCHAR(50) | DEFAULT 'insightface_v1' | Model version |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### 4.2.8 Notifications Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users(id) | Recipient |
| type | ENUM | NOT NULL | class_started/attendance_marked/etc |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### 4.2.9 User Centroids Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK, FK → users(id) | User reference |
| centroid | FLOAT[] | NOT NULL | Average embedding |
| embedding_count | INTEGER | NOT NULL | Number of encodings |
| avg_quality_score | FLOAT | NOT NULL | Average quality |
| pose_coverage | VARCHAR(100) | NOT NULL | Covered poses |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

## 4.3 Indexes

| Table | Index Name | Columns | Type |
|-------|------------|---------|------|
| users | idx_users_email | email | UNIQUE |
| users | idx_users_role | role | BTREE |
| classes | idx_classes_mentor | mentor_id | BTREE |
| classes | idx_classes_course | course_id | BTREE |
| enrollments | idx_enrollments_class | class_id | BTREE |
| attendance_sessions | idx_sessions_class | class_id | BTREE |
| attendance_records | idx_records_session | session_id | BTREE |
| attendance_records | idx_records_student | student_id | BTREE |
| face_encodings | idx_encodings_user | user_id | BTREE |
| notifications | idx_notif_user_unread | user_id WHERE is_read=FALSE | PARTIAL |

## 4.4 Data Validation Rules

| Entity | Field | Validation |
|--------|-------|------------|
| User | email | Valid email format, unique |
| User | password | Min 8 chars, 1 upper, 1 lower, 1 number |
| User | student_id | Format: YYYY/NNNNN |
| Course | code | 2-20 chars, alphanumeric, unique |
| Class | schedule_time | Valid time format |
| Attendance | confidence_score | 0.0 - 1.0 |
| FaceEncoding | encoding | 512 float values |
| FaceEncoding | quality_score | 0.0 - 1.0 |
