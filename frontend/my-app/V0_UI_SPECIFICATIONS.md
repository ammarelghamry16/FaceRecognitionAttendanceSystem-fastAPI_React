# Face Recognition Attendance System - UI Specifications for v0

## Design System Guidelines

### Core Principles
1. **Clarity** - Every element should have a clear purpose
2. **Consistency** - Use the same patterns throughout
3. **Feedback** - Always show loading, success, and error states
4. **Accessibility** - WCAG 2.1 AA compliant, keyboard navigable
5. **Responsiveness** - Mobile-first, works on all screen sizes

### Technology Stack
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Charts**: Recharts (for dashboard)
- **Forms**: React Hook Form + Zod validation

### Color Palette (Use shadcn/ui CSS variables)
```css
--background: 0 0% 100%
--foreground: 222.2 84% 4.9%
--primary: 222.2 47.4% 11.2%
--secondary: 210 40% 96.1%
--accent: 210 40% 96.1%
--destructive: 0 84.2% 60.2%
--success: 142 76% 36%
--warning: 38 92% 50%
```

### Typography
- **Headings**: Inter/Geist Sans, font-semibold
- **Body**: Inter/Geist Sans, font-normal
- **Monospace**: Geist Mono (for IDs, codes)

### Spacing System
- Use Tailwind spacing: 4, 6, 8, 12, 16, 24, 32
- Card padding: p-6
- Section gaps: space-y-6
- Grid gaps: gap-4 or gap-6

### Component Patterns
- Cards with subtle shadows: `shadow-sm border rounded-lg`
- Buttons: Primary (solid), Secondary (outline), Ghost
- Tables: Striped rows, hover states, sortable headers
- Forms: Labels above inputs, inline validation errors

---

## Page 1: Login Page

### Purpose
Authentication entry point for all users (students, mentors, admins).

### Route
`/login`

### User Roles
All users (public page)

### Layout
- Centered card on gradient/pattern background
- No sidebar, full-page layout
- Logo at top of card

### Components Needed
```
- Card (centered, max-w-md)
- Logo/Brand
- Form with:
  - Email input (with icon)
  - Password input (with show/hide toggle)
  - "Remember me" checkbox
  - Submit button (full width)
- Link to register page
- Error alert (for failed login)
```

### Form Fields
| Field | Type | Validation | Placeholder |
|-------|------|------------|-------------|
| email | email | Required, valid email | "Enter your email" |
| password | password | Required, min 8 chars | "Enter your password" |

### States
1. **Default** - Empty form
2. **Loading** - Button shows spinner, inputs disabled
3. **Error** - Red alert with message, shake animation
4. **Success** - Redirect to /dashboard

### API Integration
```typescript
// On submit:
import { authApi } from '@/services';
const response = await authApi.login({ email, password });
// Store tokens automatically, redirect to /dashboard
```

### UI Mockup Description
```
┌─────────────────────────────────────┐
│         [Logo]                      │
│    Face Recognition Attendance      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📧 Email                     │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🔒 Password            👁   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ☐ Remember me                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Sign In              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Don't have an account? Register    │
└─────────────────────────────────────┘
```

---

## Page 2: Register Page

### Purpose
New user registration (primarily for students).

### Route
`/register`

### Layout
Same as login - centered card

### Components Needed
```
- Card (centered, max-w-md)
- Form with:
  - Full name input
  - Email input
  - Password input (with strength indicator)
  - Confirm password input
  - Role selector (dropdown: student/mentor)
  - Student ID input (conditional, only for students)
  - Submit button
- Link back to login
```

### Form Fields
| Field | Type | Validation | Conditional |
|-------|------|------------|-------------|
| full_name | text | Required, min 2 chars | Always |
| email | email | Required, valid email | Always |
| password | password | Required, min 8, uppercase, number | Always |
| confirm_password | password | Must match password | Always |
| role | select | Required (student/mentor) | Always |
| student_id | text | Required if role=student | role === 'student' |

### Password Strength Indicator
- Weak (red): < 8 chars
- Medium (yellow): 8+ chars, missing uppercase or number
- Strong (green): 8+ chars, uppercase, number, special char

### API Integration
```typescript
import { authApi } from '@/services';
await authApi.register({
  email, password, full_name, role, student_id
});
```

---

## Page 3: Dashboard

### Purpose
Overview of user's attendance, upcoming classes, and quick stats.

### Route
`/dashboard`

### User Roles
All authenticated users (content varies by role)

### Layout
- Sidebar + main content
- Grid layout for stats cards
- Recent activity list

### Components Needed
```
- Stats Cards (4 in a row on desktop, 2x2 on tablet, stack on mobile)
  - Total Classes
  - Attendance Rate (with progress ring)
  - Upcoming Classes Today
  - Unread Notifications
- Upcoming Classes Card (list of next 5 classes)
- Recent Attendance Card (last 5 attendance records)
- Quick Actions Card (role-specific)
- Notifications Preview (last 3 unread)
```

### Stats Cards Data
| Card | Icon | Value Source | Color |
|------|------|--------------|-------|
| Total Classes | BookOpen | enrollments count | blue |
| Attendance Rate | TrendingUp | studentStats.attendance_rate | green/yellow/red |
| Today's Classes | Calendar | filtered by today | purple |
| Notifications | Bell | unreadCount | orange |

### Role-Specific Content

**Student Dashboard:**
- My attendance rate
- Upcoming classes I'm enrolled in
- Recent attendance records
- Face enrollment status

**Mentor Dashboard:**
- Classes I teach
- Active sessions (if any)
- Quick start session button
- Today's class schedule

**Admin Dashboard:**
- System overview stats
- All active sessions
- Recent registrations
- Quick links to management

### API Integration
```typescript
import { useAuth } from '@/context/AuthContext';
import { useNotifications, useAttendance } from '@/hooks';
import { classApi, enrollmentApi } from '@/services';

// Fetch based on role
const { user } = useAuth();
const { unreadCount } = useNotifications();
const { fetchStudentStats, studentStats } = useAttendance();
```

### UI Mockup Description
```
┌──────────────────────────────────────────────────────┐
│ Dashboard                              [Bell 🔴3]    │
├──────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ 📚 12    │ │ 📈 94%   │ │ 📅 3     │ │ 🔔 5     │ │
│ │ Classes  │ │ Rate     │ │ Today    │ │ Notifs   │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                      │
│ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │ Upcoming Classes    │ │ Recent Attendance       │ │
│ │ ─────────────────── │ │ ─────────────────────── │ │
│ │ CS101 - 9:00 AM    │ │ ✅ CS101 - Present      │ │
│ │ Math - 11:00 AM    │ │ ✅ Math - Present       │ │
│ │ Physics - 2:00 PM  │ │ ⚠️ Physics - Late       │ │
│ └─────────────────────┘ └─────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## Page 4: Courses Management (Admin Only)

### Purpose
CRUD operations for courses.

### Route
`/courses`

### User Roles
Admin only (show 403 for others)

### Layout
- Header with title + "Add Course" button
- Search/filter bar
- Data table with courses

### Components Needed
```
- Page header with action button
- Search input
- Data table with columns:
  - Code
  - Name
  - Description (truncated)
  - Classes count
  - Actions (Edit, Delete)
- Add/Edit Course Dialog (modal)
- Delete confirmation dialog
- Empty state (no courses)
- Loading skeleton
```

### Table Columns
| Column | Sortable | Width |
|--------|----------|-------|
| Code | Yes | 100px |
| Name | Yes | 200px |
| Description | No | flex |
| Classes | Yes | 80px |
| Actions | No | 100px |

### Add/Edit Course Form
| Field | Type | Validation |
|-------|------|------------|
| code | text | Required, unique, uppercase |
| name | text | Required, min 3 chars |
| description | textarea | Optional, max 500 chars |

### API Integration
```typescript
import { courseApi } from '@/services';

// List
const courses = await courseApi.getAll();

// Create
await courseApi.create({ code, name, description });

// Update
await courseApi.update(id, { name, description });

// Delete
await courseApi.delete(id);
```

### UI Mockup Description
```
┌──────────────────────────────────────────────────────┐
│ Courses                           [+ Add Course]     │
├──────────────────────────────────────────────────────┤
│ 🔍 Search courses...                    [Filter ▼]   │
├──────────────────────────────────────────────────────┤
│ Code    │ Name                  │ Classes │ Actions  │
│─────────┼───────────────────────┼─────────┼──────────│
│ CS101   │ Intro to Programming  │ 3       │ ✏️ 🗑️    │
│ MATH201 │ Calculus II           │ 2       │ ✏️ 🗑️    │
│ PHY101  │ Physics I             │ 4       │ ✏️ 🗑️    │
└──────────────────────────────────────────────────────┘
```

---

## Page 5: Classes Management

### Purpose
View and manage classes, start attendance sessions.

### Route
`/classes`

### User Roles
- **Admin**: Full CRUD
- **Mentor**: View assigned classes, start sessions
- **Student**: View enrolled classes

### Layout
- Header with filters and action button (admin/mentor)
- Filter bar (by course, day, status)
- Card grid or table view toggle
- Class cards with session status

### Components Needed
```
- Page header
- Filter bar:
  - Course dropdown
  - Day of week dropdown
  - Status filter (active/inactive)
  - View toggle (grid/table)
- Class cards (grid view):
  - Course name & code
  - Class name
  - Room number
  - Schedule (day + time)
  - Mentor name
  - Status badge
  - Action buttons
- Add/Edit Class Dialog
- Start Session Dialog (for mentors)
```

### Class Card Design
```
┌─────────────────────────────┐
│ CS101 - Intro to Programming│
│ ─────────────────────────── │
│ 📍 Room 101                 │
│ 📅 Monday, 9:00 AM          │
│ 👤 Dr. Smith                │
│                             │
│ [🟢 Active] or [⚪ Inactive]│
│                             │
│ [Start Session] [Edit] [...]│
└─────────────────────────────┘
```

### Add/Edit Class Form
| Field | Type | Validation |
|-------|------|------------|
| course_id | select | Required |
| mentor_id | select | Required |
| name | text | Required |
| room_number | text | Required |
| day_of_week | select | Required (mon-sun) |
| schedule_time | time | Required |

### API Integration
```typescript
import { classApi, courseApi } from '@/services';
import { useAttendance } from '@/hooks';

// List classes
const classes = await classApi.getAll();

// Filter by mentor (for mentors)
const myClasses = await classApi.getByMentor(mentorId);

// Start attendance session
const { startSession } = useAttendance();
await startSession(classId);
```

---

## Page 6: Attendance Management

### Purpose
Manage attendance sessions, view records, mark attendance manually.

### Route
`/attendance`

### User Roles
- **Mentor**: Start/end sessions, mark attendance
- **Admin**: View all sessions, override attendance
- **Student**: View own attendance history

### Layout (Mentor/Admin View)
- Active session panel (if any)
- Session history table
- Student attendance list (when session selected)

### Layout (Student View)
- Attendance stats card
- Attendance history table
- Calendar view (optional)

### Components Needed
```
- Active Session Card:
  - Class name
  - Start time
  - Duration timer
  - Present/Absent/Late counts
  - End Session button
- Session selector dropdown
- Attendance records table:
  - Student name
  - Status (badge: present/absent/late)
  - Time marked
  - Method (auto/manual)
  - Actions (override)
- Mark Attendance Dialog
- Session Stats Card
- Attendance History Table (for students)
```

### Active Session Card Design
```
┌─────────────────────────────────────────┐
│ 🟢 Active Session: CS101 - Lecture 1    │
│ ─────────────────────────────────────── │
│ Started: 9:00 AM    Duration: 00:15:32  │
│                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ ✅ 18   │ │ ❌ 2    │ │ ⚠️ 3    │    │
│ │ Present │ │ Absent  │ │ Late    │    │
│ └─────────┘ └─────────┘ └─────────┘    │
│                                         │
│ [Mark Attendance] [View Records] [End]  │
└─────────────────────────────────────────┘
```

### Attendance Records Table
| Column | Type |
|--------|------|
| Student | Name + ID |
| Status | Badge (color-coded) |
| Marked At | Time |
| Method | Icon (camera/hand) |
| Confidence | % (if auto) |
| Actions | Override button |

### Mark Attendance Dialog
| Field | Type | Options |
|-------|------|---------|
| student | searchable select | Enrolled students |
| status | radio group | Present, Absent, Late, Excused |
| reason | textarea | Optional (required for excused) |

### API Integration
```typescript
import { useAttendance } from '@/hooks';

const {
  activeSession,
  startSession,
  endSession,
  sessionRecords,
  fetchSessionRecords,
  markManualAttendance,
  sessionStats,
} = useAttendance();
```

---

## Page 7: Face Enrollment

### Purpose
Register student faces for automatic attendance recognition.

### Route
`/enrollment` or `/face-enrollment`

### User Roles
- **Admin**: Enroll any student
- **Student**: Enroll own face (if allowed)

### Layout
- Student selector (admin) or current user info
- Enrollment status card
- Camera capture section
- File upload section
- Enrolled images preview

### Components Needed
```
- Student selector (admin only)
- Enrollment Status Card:
  - Is enrolled badge
  - Number of face encodings
  - Last updated
- Camera Section:
  - Live camera preview
  - Capture button
  - Captured images preview (up to 5)
- File Upload Section:
  - Drag & drop zone
  - File list with previews
- Submit button
- Success/Error alerts
- Guidelines card (tips for good photos)
```

### Camera Capture UI
```
┌─────────────────────────────────────────┐
│ 📷 Capture Face Images                  │
│ ─────────────────────────────────────── │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │         [Camera Preview]            │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Captured: 3/5 images                    │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐         │
│ │ 1 │ │ 2 │ │ 3 │ │   │ │   │         │
│ └───┘ └───┘ └───┘ └───┘ └───┘         │
│                                         │
│ [📸 Capture]              [Submit All]  │
└─────────────────────────────────────────┘
```

### Guidelines Card
```
Tips for best results:
✓ Good lighting on your face
✓ Look directly at the camera
✓ Remove glasses if possible
✓ Capture from slightly different angles
✓ Neutral expression works best
```

### API Integration
```typescript
import { useFaceEnrollment } from '@/hooks';

const {
  enrollmentStatus,
  checkEnrollmentStatus,
  enrollFace,
  enrollMultipleFaces,
  enrollFaceFromCamera,
  deleteEnrollment,
  isLoading,
  error,
  success,
} = useFaceEnrollment();
```

---

## Page 8: Notifications

### Purpose
View and manage all notifications.

### Route
`/notifications`

### User Roles
All authenticated users

### Layout
- Header with "Mark all read" button
- Filter tabs (All, Unread, Read)
- Notification list
- Empty state

### Components Needed
```
- Page header with actions
- Filter tabs
- Notification cards:
  - Icon (based on type)
  - Title
  - Message
  - Timestamp (relative)
  - Unread indicator (dot)
  - Actions (mark read, delete)
- Empty state illustration
- Load more / infinite scroll
```

### Notification Card Design
```
┌─────────────────────────────────────────┐
│ 🔵 ✅ Attendance Confirmed              │
│    Your attendance for CS101 has been   │
│    marked as present.                   │
│                                    2m ago│
│                          [Mark Read] [×] │
└─────────────────────────────────────────┘
```

### Notification Types & Icons
| Type | Icon | Color |
|------|------|-------|
| attendance_marked | CheckCircle | green |
| attendance_late | Clock | yellow |
| attendance_absent | XCircle | red |
| session_started | Play | blue |
| class_cancelled | Ban | red |
| schedule_updated | Calendar | purple |

### API Integration
```typescript
import { useNotifications } from '@/hooks';

const {
  notifications,
  unreadCount,
  isLoading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = useNotifications();
```

---

## Page 9: Profile / Settings

### Purpose
View and edit user profile, change password.

### Route
`/profile` or `/settings`

### User Roles
All authenticated users

### Layout
- Profile card with avatar
- Edit profile form
- Change password section
- Face enrollment status (for students)
- Danger zone (delete account - optional)

### Components Needed
```
- Profile header card:
  - Avatar (initials or image)
  - Name
  - Email
  - Role badge
  - Student ID (if student)
- Edit Profile Form:
  - Full name
  - Email (read-only or editable)
- Change Password Card:
  - Current password
  - New password
  - Confirm new password
- Face Enrollment Status Card (students)
- Save button
```

### Profile Header Design
```
┌─────────────────────────────────────────┐
│ ┌────┐                                  │
│ │ JS │  John Smith                      │
│ └────┘  john.smith@university.edu       │
│         🎓 Student • ID: STU001         │
│                                         │
│ Member since: January 2024              │
└─────────────────────────────────────────┘
```

### API Integration
```typescript
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services';

// Update profile
await authApi.updateProfile({ full_name });

// Change password
await authApi.changePassword({
  current_password,
  new_password,
});
```

---

## Shared Components

### Sidebar Navigation
```
┌─────────────────────┐
│ [Logo] Attendance   │
├─────────────────────┤
│ 📊 Dashboard        │
│ 📚 Courses *        │
│ 🏫 Classes          │
│ ✅ Attendance       │
│ 📷 Face Enrollment *│
│ 🔔 Notifications    │
├─────────────────────┤
│ ⚙️ Settings         │
│ 🚪 Logout           │
├─────────────────────┤
│ ┌────┐              │
│ │ JS │ John Smith   │
│ └────┘ Student      │
└─────────────────────┘

* = Role-specific items
```

### Navigation Items by Role
| Item | Student | Mentor | Admin |
|------|---------|--------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Courses | ❌ | ❌ | ✅ |
| Classes | ✅ | ✅ | ✅ |
| Attendance | ✅ | ✅ | ✅ |
| Face Enrollment | ✅ | ❌ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ |

### Header Component
```
┌──────────────────────────────────────────────────────┐
│ Page Title                    🔍  🔔(3)  [Avatar ▼] │
└──────────────────────────────────────────────────────┘
```

### Loading States
- **Page loading**: Full-page spinner or skeleton
- **Table loading**: Skeleton rows
- **Button loading**: Spinner inside button, disabled
- **Card loading**: Pulse animation skeleton

### Empty States
Each page should have a friendly empty state:
- Illustration or icon
- Descriptive message
- Action button (if applicable)

### Error States
- **Form errors**: Inline below field, red text
- **API errors**: Toast notification or alert banner
- **404**: Custom not found page
- **403**: Access denied page

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Stack everything, hamburger menu |
| Tablet | 640-1024px | 2-column grids, collapsible sidebar |
| Desktop | > 1024px | Full layout, expanded sidebar |

### Mobile Considerations
- Sidebar becomes drawer (hamburger menu)
- Tables become cards on mobile
- Forms stack vertically
- Touch-friendly tap targets (min 44px)

---

## Animation Guidelines

- **Page transitions**: Fade in (150ms)
- **Modal open**: Scale up + fade (200ms)
- **Hover states**: 150ms ease
- **Loading spinners**: Smooth rotation
- **Skeleton pulse**: 1.5s infinite
- **Toast notifications**: Slide in from top-right

---

## Accessibility Checklist

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Screen reader announcements for dynamic content
- [ ] Error messages linked to inputs
- [ ] Skip to main content link

---

## File Structure for Pages

```
src/pages/
├── Login.tsx
├── Register.tsx
├── Dashboard.tsx
├── Courses.tsx
├── Classes.tsx
├── Attendance.tsx
├── FaceEnrollment.tsx
├── Notifications.tsx
├── Profile.tsx
└── index.ts (barrel export)
```

Each page should:
1. Import necessary hooks and services
2. Handle loading/error/empty states
3. Be wrapped in appropriate layout
4. Have proper TypeScript types
5. Be responsive

---

## Summary for v0

When generating each page, ensure:

1. **Use shadcn/ui components** (Button, Card, Input, Table, Dialog, etc.)
2. **Follow the color scheme** using CSS variables
3. **Include all states** (loading, error, empty, success)
4. **Make it responsive** (mobile-first)
5. **Add proper TypeScript types**
6. **Include the API integration code** as comments
7. **Follow accessibility guidelines**
8. **Use Lucide icons** consistently
9. **Add subtle animations** for polish
10. **Include form validation** with helpful error messages
