# Design Document: System Improvements V2

## Overview

This design document outlines the implementation of 12 major system improvements for the Face Recognition Attendance System. The changes span frontend UI/UX enhancements, backend session management, data model updates, and face enrollment redesign.

## Architecture

The improvements follow the existing modular monolith architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  Login │ Schedule │ Enrollments │ Attendance │ FaceEnrollment   │
│  Page  │   Page   │    Page     │    Page    │      Page        │
├─────────────────────────────────────────────────────────────────┤
│              Shared Components (Toast, Dialog, Layout)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (FastAPI)                         │
├─────────────────────────────────────────────────────────────────┤
│  Auth    │ Schedule  │ Attendance │ AI Service │ Notification   │
│ Service  │  Service  │  Service   │  Service   │   Service      │
├─────────────────────────────────────────────────────────────────┤
│                    Shared Models & Database                      │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Login Error Handling

**Current State:** Login errors show inline error message, page may reload on form submission.

**New Design:**
- Use toast notifications for login errors
- Prevent default form submission to avoid page reload
- Preserve email input on error

```typescript
// Login.tsx changes
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    await login({ email, password });
    navigate('/dashboard');
  } catch (err) {
    toast({
      title: 'Login Failed',
      description: err.message || 'Invalid credentials',
      variant: 'destructive',
      dismissible: true,
    });
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Scrollable Content Areas

**Current State:** Content scrolls with the entire page, sidebar scrolls too.

**New Design:**
- Layout component with fixed sidebar and scrollable main content
- Sticky headers for day-of-week in Schedule
- Contained overflow in all data tables

```typescript
// Layout.tsx structure
<div className="flex h-screen overflow-hidden">
  <Sidebar className="flex-shrink-0 h-screen overflow-y-auto" />
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>
</div>
```

### 3. Enrollment Management Improvements

**Current State:** Shows only student_id (UUID), manual ID entry for enrollment.

**New Design:**
- Fetch and display student names alongside IDs
- Searchable student dropdown with autocomplete
- API endpoint to search students by name

```typescript
// New API endpoint
GET /api/auth/users/search?q={query}&role=student

// EnrollmentResponse update
interface EnrollmentWithStudent {
  student_id: string;
  student_name: string;
  student_readable_id: string;
  class_id: string;
  enrolled_at: string;
}
```

### 4. Human-Readable Student ID Format

**Current State:** Uses UUID (e.g., `0c1aa010-9c41-44b4-9799-944900bf6db9`)

**New Design:**
- Format: `YYYY/NNNNN` (e.g., `2025/03897`)
- YYYY = enrollment year
- NNNNN = sequential number with leading zeros

```python
# User model update
class User(Base):
    id = Column(UUID, primary_key=True)  # Keep UUID as internal ID
    student_id = Column(String(10), unique=True)  # New format: 2025/00001
    
# ID generation
def generate_student_id(year: int = None) -> str:
    year = year or datetime.now().year
    # Get next sequence number from database
    next_num = get_next_student_sequence(year)
    return f"{year}/{next_num:05d}"
```

### 5. Dismissable Notifications with Timestamps

**Current State:** Notifications auto-dismiss after timeout, no relative time.

**New Design:**
- Add dismiss button to all toasts
- Show relative time ("2 min ago", "1 hour ago")
- Update timestamps dynamically

```typescript
// Toast component update
interface ToastProps {
  dismissible?: boolean;
  createdAt?: Date;
}

// Relative time utility
function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
```

### 6. Session Persistence Independent of User Login

**Current State:** Sessions may be affected by user logout.

**New Design:**
- Sessions are server-side entities, independent of client connections
- Add `max_duration_minutes` field to sessions
- Background task to auto-end expired sessions
- Notification on session end with who ended it

```python
# AttendanceSession model update
class AttendanceSession(Base):
    max_duration_minutes = Column(Integer, default=120)  # 2 hours
    auto_ended = Column(Boolean, default=False)
    ended_reason = Column(String(100), nullable=True)

# Background task
async def check_expired_sessions():
    expired = session_repo.find_expired_sessions()
    for session in expired:
        end_session(session.id, reason="Duration expired")
        notify_session_ended(session, "auto")
```

### 7. Automatic Attendance Time Window (20 Minutes)

**Current State:** Face recognition active for entire session.

**New Design:**
- `auto_recognition_active` flag on session
- 20-minute window from session start
- After window: manual-only mode with lightweight spectating

```python
# AttendanceSession model
class AttendanceSession(Base):
    auto_recognition_window_minutes = Column(Integer, default=20)
    
    @property
    def is_auto_recognition_active(self) -> bool:
        if self.state != "active":
            return False
        elapsed = (datetime.now(timezone.utc) - self.start_time).total_seconds() / 60
        return elapsed <= self.auto_recognition_window_minutes
```

### 8. Mentor-Only Session Control

**Current State:** Both admin and mentor can start/end sessions.

**New Design:**
- Remove session controls from admin UI
- API authorization: only mentor of the class can start/end
- Admin gets spectate-only view

```python
# Route authorization
@router.post("/sessions/start")
def start_session(
    request: StartSessionRequest,
    current_user: User = Depends(require_role(["mentor"])),  # Remove admin
    db: Session = Depends(get_db_session)
):
    # Verify mentor owns this class
    class_obj = class_repo.find_by_id(request.class_id)
    if class_obj.mentor_id != current_user.id:
        raise HTTPException(403, "Only the class mentor can start sessions")
```

### 9. Concurrent Session Support

**Current State:** System supports concurrent sessions but not explicitly tested.

**New Design:**
- Verify session isolation in database queries
- Add index on `class_id` + `state` for efficient queries
- Test concurrent session creation and management

```python
# Efficient query for active sessions
def find_all_active_sessions(self) -> List[AttendanceSession]:
    return self.db.query(AttendanceSession)\
        .filter(AttendanceSession.state == "active")\
        .all()
```

### 10. Admin Multi-Session Spectating

**Current State:** Admin sees single session view.

**New Design:**
- Grid view of all active sessions for admin
- Real-time status updates via polling
- Click to expand session details

```typescript
// Admin Attendance view
function AdminAttendanceView() {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  
  // Poll for active sessions
  useEffect(() => {
    const poll = setInterval(async () => {
      const sessions = await attendanceApi.getAllActiveSessions();
      setActiveSessions(sessions);
    }, 5000);
    return () => clearInterval(poll);
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeSessions.map(session => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}
```

### 11. iPhone-Style Face Enrollment

**Current State:** Manual capture with basic face guide.

**New Design:**
- Live face detection with position feedback
- Oval guide with color-coded feedback (red/yellow/green)
- Auto-capture when face is properly positioned
- Progress indicator for multi-angle captures

```typescript
// Face detection states
type FacePosition = 'no_face' | 'too_far' | 'too_close' | 'off_center' | 'good';

interface FaceDetectionResult {
  detected: boolean;
  position: FacePosition;
  boundingBox?: { x: number; y: number; width: number; height: number };
  quality: number; // 0-1
}

// Auto-capture logic
useEffect(() => {
  if (facePosition === 'good' && quality > 0.8) {
    // Wait 500ms of stable good position before capture
    const timer = setTimeout(() => captureImage(), 500);
    return () => clearTimeout(timer);
  }
}, [facePosition, quality]);
```

### 12. Sign-Out Confirmation

**Current State:** Immediate logout on click.

**New Design:**
- Confirmation dialog with Cancel/Sign Out buttons
- Clear messaging about session impact

```typescript
// Sidebar logout handler
const handleLogout = () => {
  setShowLogoutDialog(true);
};

const confirmLogout = () => {
  logout();
  navigate('/login');
};

// Dialog component
<AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Sign out?</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to sign out?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmLogout}>Sign Out</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Data Models

### Updated User Model

```python
class User(Base):
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default='student')
    student_id = Column(String(10), unique=True, nullable=True)  # Format: YYYY/NNNNN
    enrollment_year = Column(Integer, nullable=True)  # Year student was enrolled
    is_active = Column(Boolean, default=True)
```

### Updated AttendanceSession Model

```python
class AttendanceSession(Base):
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID, ForeignKey("classes.id"), nullable=False)
    started_by = Column(UUID, ForeignKey("users.id"), nullable=False)
    ended_by = Column(UUID, ForeignKey("users.id"), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    state = Column(String(20), default="active")
    late_threshold_minutes = Column(Integer, default=15)
    auto_recognition_window_minutes = Column(Integer, default=20)
    max_duration_minutes = Column(Integer, default=120)
    auto_ended = Column(Boolean, default=False)
    ended_reason = Column(String(100), nullable=True)
```

### New StudentIdSequence Model

```python
class StudentIdSequence(Base):
    __tablename__ = "student_id_sequences"
    
    year = Column(Integer, primary_key=True)
    last_sequence = Column(Integer, default=0)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Student ID Format Consistency
*For any* newly created student, the generated student_id SHALL match the pattern `YYYY/NNNNN` where YYYY is a valid year and NNNNN is a 5-digit number.
**Validates: Requirements 4.1, 4.2**

### Property 2: Student ID Uniqueness
*For any* two students in the system, their student_id values SHALL be unique.
**Validates: Requirements 4.4**

### Property 3: Session Persistence After Logout
*For any* active attendance session, if the session creator logs out, the session state SHALL remain "active" until explicitly ended or duration expires.
**Validates: Requirements 6.1, 6.2**

### Property 4: Session Auto-End on Duration
*For any* active session that has exceeded its max_duration_minutes, the system SHALL automatically transition the session to "completed" state.
**Validates: Requirements 6.4**

### Property 5: Auto-Recognition Window
*For any* active session, the is_auto_recognition_active property SHALL return true only within the first auto_recognition_window_minutes (default 20) after start_time.
**Validates: Requirements 7.1, 7.2**

### Property 6: Manual Attendance Always Available
*For any* active session (regardless of auto-recognition status), a mentor SHALL be able to mark attendance manually.
**Validates: Requirements 7.3**

### Property 7: Mentor-Only Session Control
*For any* API request to start or end a session, if the requester is an admin (not the class mentor), the request SHALL be rejected with 403 status.
**Validates: Requirements 8.4**

### Property 8: Concurrent Session Independence
*For any* two concurrent sessions, marking attendance in one session SHALL NOT affect the records of the other session.
**Validates: Requirements 9.2**

### Property 9: Active Sessions Query Completeness
*For any* query for active sessions, the result SHALL include all sessions where state equals "active".
**Validates: Requirements 9.3**

### Property 10: Enrollment Display Completeness
*For any* enrollment displayed in the UI, both student_name and student_id SHALL be present and non-empty.
**Validates: Requirements 3.1**

### Property 11: Relative Time Accuracy
*For any* notification timestamp, the displayed relative time SHALL accurately reflect the time difference from the current time.
**Validates: Requirements 5.3**

## Error Handling

### Login Errors
- Invalid credentials: Toast with "Invalid email or password"
- Network error: Toast with "Connection failed. Please try again."
- Server error: Toast with "Server error. Please try later."

### Session Errors
- Concurrent session conflict: "This class already has an active session"
- Unauthorized start: "Only the class mentor can start sessions"
- Session expired: "Session has ended due to time limit"

### Face Enrollment Errors
- No camera access: "Camera permission denied. Please enable camera access."
- No face detected: "No face detected. Please position your face in the guide."
- Poor quality: "Image quality too low. Please ensure good lighting."

## Testing Strategy

### Unit Tests
- Student ID generation and format validation
- Session state transitions
- Auto-recognition window calculations
- Relative time formatting

### Property-Based Tests (using Hypothesis)
- Student ID uniqueness across random generations
- Session state consistency under concurrent operations
- Enrollment data completeness

### Integration Tests
- Login flow with error handling
- Session lifecycle (start → auto-end)
- Multi-session concurrent operations
- Face enrollment auto-capture flow

### E2E Tests
- Complete login → dashboard flow
- Mentor session management
- Admin multi-session spectating
- Face enrollment guided capture
