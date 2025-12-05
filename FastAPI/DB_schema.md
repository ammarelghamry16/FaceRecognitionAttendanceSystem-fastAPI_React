-- ==========================================
-- EXTENSIONS & ENUMS
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM Types
CREATE TYPE user_role AS ENUM ('student', 'mentor', 'admin');
CREATE TYPE class_state AS ENUM ('inactive', 'active', 'completed');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE notification_type AS ENUM ('class_started', 'attendance_marked', 'announcement');
CREATE TYPE week_day AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- ==========================================
-- CORE TABLES
-- ==========================================

-- USERS (Best of Design 1: has student_id and is_active)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    student_id VARCHAR(50), -- From Design 1
    is_active BOOLEAN DEFAULT TRUE, -- From Design 1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API_KEYS (Best of Design 2: links to user, Best of Design 1: has name)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- From Design 2
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL, -- From Design 1
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- SCHEDULE SERVICE
-- ==========================================

-- COURSES (Same in both, using Design 1 structure)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CLASSES (Best of Design 2: structured schedule, Best of Design 1: name and updated_at)
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL, -- From Design 1
    room_number VARCHAR(50) NOT NULL, -- Combined field
    day_of_week week_day NOT NULL, -- From Design 2 (better than string)
    schedule_time TIME NOT NULL, -- From Design 2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- From Design 1
);

-- ENROLLMENTS (Same in both, using Design 1 structure)
CREATE TABLE enrollments (
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, class_id)
);

-- ==========================================
-- AI SERVICE
-- ==========================================

-- FACE_ENCODINGS (Best of Design 2: FLOAT[] for performance, Best of Design 1: version field)
CREATE TABLE face_encodings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encoding FLOAT[] NOT NULL, -- From Design 2 (better than JSONB)
    version VARCHAR(50) DEFAULT 'dlib_v1', -- From Design 1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ATTENDANCE SERVICE
-- ==========================================

-- ATTENDANCE_SESSIONS (Best of Design 1: state field for state pattern)
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    state class_state NOT NULL DEFAULT 'inactive', -- From Design 1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ATTENDANCE_RECORDS (Best of Design 1: verification_method and confidence_score)
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'absent',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confidence_score FLOAT, -- From Design 1
    verification_method VARCHAR(50) DEFAULT 'face_recognition', -- From Design 1
    UNIQUE(session_id, student_id)
);

-- ==========================================
-- NOTIFICATION SERVICE
-- ==========================================

-- NOTIFICATIONS (Best of Design 1: ENUM type, Best of Design 2: partial index for unread)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, -- From Design 1
    message TEXT NOT NULL, -- From Design 1
    type notification_type NOT NULL, -- ENUM from Design 1
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES (Combined best from both)
-- ==========================================

-- From Design 1
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_classes_mentor ON classes(mentor_id);
CREATE INDEX idx_attendance_session_class ON attendance_sessions(class_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_face_encodings_user ON face_encodings(user_id);

-- From Design 2
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_encodings_student ON face_encodings(user_id); -- Same as above, keep one
CREATE INDEX idx_records_student ON attendance_records(student_id); -- Same as above
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE; -- Best from Design 2

-- Additional useful indexes
CREATE INDEX idx_classes_course ON classes(course_id);
CREATE INDEX idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);

-- ==========================================
-- TRIGGERS (From Design 1)
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_classes_modtime BEFORE UPDATE ON classes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- CONSTRAINTS (Missing from both, but essential)
-- ==========================================
ALTER TABLE api_keys ADD CONSTRAINT unique_key_hash UNIQUE (key_hash);
ALTER TABLE attendance_records ADD CONSTRAINT chk_confidence_score CHECK (confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0));