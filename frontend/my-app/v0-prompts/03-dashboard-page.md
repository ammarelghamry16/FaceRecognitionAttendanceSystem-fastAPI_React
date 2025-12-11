# v0 Prompt: Dashboard Page

Create a professional dashboard page for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Requirements

### Layout
- Uses existing Layout component (sidebar already exists)
- Main content area with responsive grid
- Header with page title and notification bell

### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│ Welcome back, {userName}! 👋                            │
├─────────────────────────────────────────────────────────┤
│ [Stats Card] [Stats Card] [Stats Card] [Stats Card]     │
├─────────────────────────────────────────────────────────┤
│ [Upcoming Classes Card]    │ [Recent Attendance Card]   │
├─────────────────────────────────────────────────────────┤
│ [Quick Actions Card]       │ [Notifications Preview]    │
└─────────────────────────────────────────────────────────┘
```

### Components to Build

#### 1. Stats Cards (4 cards in a row)
Each card shows:
- Icon (colored background circle)
- Value (large number)
- Label
- Trend indicator (optional)

| Card | Icon | Color | Value Example |
|------|------|-------|---------------|
| Total Classes | BookOpen | Blue | 12 |
| Attendance Rate | TrendingUp | Green | 94% |
| Today's Classes | Calendar | Purple | 3 |
| Notifications | Bell | Orange | 5 |

```tsx
// Stats card design
<Card>
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Total Classes</p>
        <p className="text-3xl font-bold">12</p>
      </div>
      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
        <BookOpen className="h-6 w-6 text-blue-600" />
      </div>
    </div>
  </CardContent>
</Card>
```

#### 2. Upcoming Classes Card
- Card with header "Upcoming Classes" and "View All" link
- List of next 5 classes
- Each item shows: Course name, time, room, status badge

```tsx
// List item design
<div className="flex items-center justify-between py-3 border-b last:border-0">
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <BookOpen className="h-5 w-5 text-primary" />
    </div>
    <div>
      <p className="font-medium">CS101 - Intro to Programming</p>
      <p className="text-sm text-muted-foreground">Room 101 • 9:00 AM</p>
    </div>
  </div>
  <Badge variant="outline">In 30 min</Badge>
</div>
```

#### 3. Recent Attendance Card
- Card with header "Recent Attendance"
- List of last 5 attendance records
- Each shows: Class name, date, status badge (Present/Late/Absent)

Status badges:
- Present: Green badge with CheckCircle icon
- Late: Yellow badge with Clock icon
- Absent: Red badge with XCircle icon

#### 4. Quick Actions Card (Role-specific)

**For Students:**
- View My Schedule
- Check Attendance History
- Update Face Enrollment

**For Mentors:**
- Start Attendance Session (prominent button)
- View My Classes
- Mark Manual Attendance

**For Admins:**
- Manage Courses
- Manage Users
- View All Sessions

#### 5. Notifications Preview
- Shows last 3 unread notifications
- Each with icon, title, time ago
- "View All" link to notifications page

### States to Handle
1. **Loading**: Skeleton cards for all sections
2. **Empty**: Friendly empty states with illustrations
3. **Error**: Error alert with retry button
4. **Loaded**: Full data display

### Skeleton Loading
```tsx
// Skeleton for stats card
<Card>
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  </CardContent>
</Card>
```

### Code Structure
```tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks';
import { 
  BookOpen, TrendingUp, Calendar, Bell, 
  CheckCircle, Clock, XCircle, ArrowRight,
  Play, Users, Settings
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// API calls (comments)
// import { classApi, attendanceApi } from '@/services';
// const classes = await classApi.getByStudent(userId);
// const stats = await attendanceApi.getStudentStats(userId);
```

### Responsive Design
- 4 stats cards: 4 cols desktop, 2 cols tablet, 1 col mobile
- Two-column sections: side by side desktop, stacked mobile
- Cards have consistent padding and spacing

### Visual Polish
- Subtle hover effects on cards
- Smooth transitions
- Consistent icon sizes and colors
- Clear visual hierarchy with typography

### Accessibility
- Semantic headings (h1 for page title, h2 for card titles)
- Cards are not interactive (links inside are)
- Color is not the only indicator (icons + text for status)

Generate a complete, production-ready dashboard component with role-based content, loading states, and responsive design.
