# Prototypes - UI Pages Description

## 8.1 Overview

This section describes all user interface pages implemented in the system, including their purpose, components, and functionality.

---

## 8.2 Public Pages

### 8.2.1 Landing Page
**URL:** `/`

**Purpose:** Welcome page for unauthenticated users

**Components:**
- Hero section with system title and description
- Feature highlights (Face Recognition, Real-time Updates, Role-based Access)
- Call-to-action buttons (Login, Register)
- Theme toggle (Light/Dark)
- Animated visual elements

**Screenshot Description:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Face Recognition Attendance    [Theme] [Login]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌─────────────────────────────────────────────┐        │
│     │                                             │        │
│     │         HERO VISUAL / ANIMATION             │        │
│     │                                             │        │
│     └─────────────────────────────────────────────┘        │
│                                                             │
│     Automated Attendance with Face Recognition              │
│     Modern, secure, and efficient attendance tracking       │
│                                                             │
│     [Get Started]  [Learn More]                            │
│                                                             │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│     │ Feature 1│  │ Feature 2│  │ Feature 3│              │
│     │ AI-Based │  │ Real-time│  │ Role-    │              │
│     │ Recognition│ │ Updates  │  │ Based    │              │
│     └──────────┘  └──────────┘  └──────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2.2 Login Page
**URL:** `/login`

**Purpose:** User authentication

**Components:**
- Email input field
- Password input field
- Remember me checkbox (User server only)
- Login button
- Link to registration page
- Theme toggle
- Error toast notifications

**Form Fields:**
| Field | Type | Validation |
|-------|------|------------|
| Email | email | Required, valid email format |
| Password | password | Required, min 8 characters |
| Remember Me | checkbox | Optional |

### 8.2.3 Register Page
**URL:** `/register`

**Purpose:** New user registration

**Components:**
- Full name input
- Email input
- Password input
- Confirm password input
- Role selection (Student only for self-registration)
- Register button
- Link to login page

---

## 8.3 Authenticated Pages

### 8.3.1 Dashboard
**URL:** `/dashboard`

**Purpose:** Overview of user-specific information

**Role-specific Content:**

**Student Dashboard:**
- Attendance rate percentage
- Classes attended count
- Today's schedule
- Recent notifications

**Mentor Dashboard:**
- Active sessions count
- Total students count
- Today's classes
- Quick action buttons

**Admin Dashboard:**
- Total users by role
- Active sessions count
- System statistics
- Recent activity

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Dashboard                                    │
│             │                                               │
│  Dashboard  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  Schedule   │  │ Stat 1  │ │ Stat 2  │ │ Stat 3  │        │
│  Courses    │  │  85%    │ │   12    │ │    3    │        │
│  Classes    │  │Attendance│ │ Classes │ │ Today   │        │
│  Attendance │  └─────────┘ └─────────┘ └─────────┘        │
│  ...        │                                               │
│             │  Today's Schedule                             │
│             │  ┌─────────────────────────────────┐         │
│             │  │ 9:00 AM - Math 101 - Room 201  │         │
│             │  │ 11:00 AM - Physics - Room 305  │         │
│             │  └─────────────────────────────────┘         │
│             │                                               │
│  [Logout]   │  Recent Notifications                        │
│             │  ┌─────────────────────────────────┐         │
│             │  │ Attendance marked - Math 101   │         │
│             │  └─────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 8.3.2 Schedule Page
**URL:** `/schedule`

**Purpose:** View class schedule organized by day

**Components:**
- Day-of-week headers (sticky)
- Class cards with time, room, course, mentor
- Current day highlight
- Empty state for days without classes

### 8.3.3 Courses Page
**URL:** `/courses`

**Purpose:** View and manage courses

**Components:**
- Course list/grid
- Search/filter functionality
- Course cards (code, name, description)
- Add course button (Admin only)
- Edit/Delete actions (Admin only)

### 8.3.4 Classes Page
**URL:** `/classes`

**Purpose:** View and manage classes

**Components:**
- Class list with day, time, room
- Filter by course or mentor
- Add class button (Admin only)
- Edit/Delete actions (Admin only)

### 8.3.5 Enrollments Page
**URL:** `/enrollments`

**Purpose:** Manage student enrollments in classes

**Components:**
- Class selector dropdown
- Enrolled students list
- Student search with autocomplete
- Add enrollment button
- Remove enrollment button
- Student details (name, ID, face enrollment status)

### 8.3.6 Attendance Page
**URL:** `/attendance`

**Purpose:** Manage attendance sessions and view history

**Role-specific Views:**

**Student View:**
- Personal attendance history
- Filter by course/date
- Attendance statistics

**Mentor View:**
- Class selector
- Start/End session buttons
- Live attendance feed
- Manual marking controls
- Student list with status

**Admin View:**
- All active sessions grid
- Session cards with details
- Spectate mode (view only)

### 8.3.7 Face Enrollment Page
**URL:** `/face-enrollment`

**Purpose:** Enroll user's face for recognition

**Components:**
- Camera preview with mirror effect
- Oval face guide overlay
- Position feedback (color-coded)
- Guidance text ("Move closer", "Center your face")
- Quality indicator bar
- Progress indicator (captures completed)
- Auto-capture on good position
- Success animation on completion

**Enrollment Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Face Enrollment                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌─────────────────────────────────────────┐            │
│     │                                         │            │
│     │     ┌───────────────────────┐          │            │
│     │     │                       │          │            │
│     │     │    CAMERA PREVIEW     │          │            │
│     │     │    with face guide    │          │            │
│     │     │         ⬭            │          │            │
│     │     │                       │          │            │
│     │     └───────────────────────┘          │            │
│     │                                         │            │
│     └─────────────────────────────────────────┘            │
│                                                             │
│     Position: [████████░░] Good                            │
│                                                             │
│     "Hold still... capturing"                              │
│                                                             │
│     Progress: 3/5 captures                                 │
│     ● ● ● ○ ○                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3.8 Notifications Page
**URL:** `/notifications`

**Purpose:** View and manage notifications

**Components:**
- Notification list
- Unread indicator
- Mark as read button
- Relative timestamps ("5 min ago")
- Notification type icons
- Empty state

### 8.3.9 Profile Page
**URL:** `/profile`

**Purpose:** View and edit user profile

**Components:**
- User information display
- Edit profile form
- Change password form
- Face enrollment status
- Re-enroll face button

### 8.3.10 Users Page (Admin Only)
**URL:** `/users`

**Purpose:** Manage system users

**Components:**
- User list with search
- Filter by role
- Add user button
- Edit user modal
- Deactivate/Activate toggle
- Reset password action

---

## 8.4 Common Components

### 8.4.1 Sidebar Navigation
- Collapsible sidebar
- Role-based menu items
- Active page indicator
- User info display
- Logout button with confirmation

### 8.4.2 Header
- Page title
- Breadcrumbs (optional)
- Notification bell with count
- User avatar/menu

### 8.4.3 Toast Notifications
- Success/Error/Warning/Info variants
- Auto-dismiss with timer
- Manual dismiss button
- Stack multiple toasts

### 8.4.4 Loading States
- Skeleton loaders for content
- Spinner for actions
- Progress bars for uploads

### 8.4.5 Empty States
- Descriptive message
- Illustration (optional)
- Action button when applicable

---

## 8.5 Theme Variants

### Light Theme
- Background: White (#FFFFFF)
- Text: Dark gray (#1F2937)
- Primary: Blue (#3B82F6)
- Accent: Indigo (#6366F1)

### Dark Theme
- Background: Dark gray (#111827)
- Text: Light gray (#F9FAFB)
- Primary: Blue (#60A5FA)
- Accent: Indigo (#818CF8)

### Admin Theme (Server Mode)
- Accent: Red/Orange (#EF4444)
- Badge: "Admin Portal"
- Distinct visual identity
