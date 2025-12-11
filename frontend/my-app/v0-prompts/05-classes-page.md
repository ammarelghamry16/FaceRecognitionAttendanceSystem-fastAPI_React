# v0 Prompt: Classes Management Page

Create a professional classes management page for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Requirements

### User Roles & Permissions
- **Admin**: Full CRUD, see all classes
- **Mentor**: View assigned classes, start attendance sessions
- **Student**: View enrolled classes only

### Layout
- Page header with filters and action button
- Filter bar (course, day, status)
- Toggle between grid and table view
- Class cards or table rows

### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│ Classes                              [+ Add Class]      │
├─────────────────────────────────────────────────────────┤
│ Course: [All ▼]  Day: [All ▼]  Status: [All ▼]  [≡][⊞] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ CS101       │ │ MATH201     │ │ PHY101      │        │
│ │ Lecture 1   │ │ Tutorial    │ │ Lab         │        │
│ │ Room 101    │ │ Room 205    │ │ Lab 3       │        │
│ │ Mon 9:00 AM │ │ Tue 2:00 PM │ │ Wed 10:00AM │        │
│ │ Dr. Smith   │ │ Prof. Jones │ │ Dr. Lee     │        │
│ │ [🟢 Active] │ │ [⚪ Inactive]│ │ [⚪ Inactive]│        │
│ │ [Actions]   │ │ [Actions]   │ │ [Actions]   │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Components to Build

#### 1. Page Header
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-3xl font-bold">Classes</h1>
    <p className="text-muted-foreground">
      {user.role === 'student' ? 'Your enrolled classes' : 
       user.role === 'mentor' ? 'Classes you teach' : 
       'Manage all classes'}
    </p>
  </div>
  {user.role === 'admin' && (
    <Button onClick={() => setIsAddDialogOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Add Class
    </Button>
  )}
</div>
```

#### 2. Filter Bar
```tsx
<div className="flex flex-wrap items-center gap-4 mb-6">
  {/* Course Filter */}
  <Select value={courseFilter} onValueChange={setCourseFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="All Courses" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Courses</SelectItem>
      {courses.map(course => (
        <SelectItem key={course.id} value={course.id}>
          {course.code} - {course.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  
  {/* Day Filter */}
  <Select value={dayFilter} onValueChange={setDayFilter}>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="All Days" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Days</SelectItem>
      <SelectItem value="monday">Monday</SelectItem>
      <SelectItem value="tuesday">Tuesday</SelectItem>
      {/* ... other days */}
    </SelectContent>
  </Select>
  
  {/* Status Filter */}
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="All Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Status</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
  
  {/* View Toggle */}
  <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
    <Button 
      variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
      size="sm"
      onClick={() => setViewMode('grid')}
    >
      <LayoutGrid className="h-4 w-4" />
    </Button>
    <Button 
      variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
      size="sm"
      onClick={() => setViewMode('table')}
    >
      <List className="h-4 w-4" />
    </Button>
  </div>
</div>
```

#### 3. Class Card (Grid View)
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader className="pb-3">
    <div className="flex items-start justify-between">
      <div>
        <Badge variant="outline" className="mb-2">{class.course.code}</Badge>
        <CardTitle className="text-lg">{class.name}</CardTitle>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Role-specific actions */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </CardHeader>
  <CardContent className="space-y-2">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <MapPin className="h-4 w-4" />
      <span>{class.room_number}</span>
    </div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Calendar className="h-4 w-4" />
      <span>{formatDay(class.day_of_week)}, {formatTime(class.schedule_time)}</span>
    </div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <User className="h-4 w-4" />
      <span>{class.mentor?.full_name || 'Unassigned'}</span>
    </div>
  </CardContent>
  <CardFooter className="flex items-center justify-between pt-3 border-t">
    <Badge variant={class.state === 'active' ? 'default' : 'secondary'}>
      {class.state === 'active' ? (
        <><span className="h-2 w-2 rounded-full bg-green-500 mr-2" />Active</>
      ) : (
        <><span className="h-2 w-2 rounded-full bg-gray-400 mr-2" />Inactive</>
      )}
    </Badge>
    
    {/* Mentor: Start Session button */}
    {user.role === 'mentor' && class.state === 'inactive' && (
      <Button size="sm" onClick={() => handleStartSession(class.id)}>
        <Play className="h-4 w-4 mr-1" />
        Start Session
      </Button>
    )}
  </CardFooter>
</Card>
```

#### 4. Add/Edit Class Dialog
Form fields:
| Field | Type | Validation |
|-------|------|------------|
| course_id | Select | Required |
| mentor_id | Select | Required |
| name | Input | Required, 3-100 chars |
| room_number | Input | Required |
| day_of_week | Select | Required (Mon-Sun) |
| schedule_time | Time picker | Required |

#### 5. Start Session Dialog (Mentor)
```tsx
<Dialog open={isStartSessionOpen} onOpenChange={setIsStartSessionOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Start Attendance Session</DialogTitle>
      <DialogDescription>
        Start taking attendance for {selectedClass?.name}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Late Threshold (minutes)</Label>
        <Input 
          type="number" 
          value={lateThreshold} 
          onChange={(e) => setLateThreshold(Number(e.target.value))}
          min={5}
          max={60}
        />
        <p className="text-xs text-muted-foreground">
          Students arriving after this time will be marked as late
        </p>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsStartSessionOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirmStartSession}>
        <Play className="h-4 w-4 mr-2" />
        Start Session
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Role-Specific Actions

**Admin Actions:**
- Edit class
- Delete class
- View enrollments
- Assign mentor

**Mentor Actions:**
- Start attendance session (if inactive)
- View active session (if active)
- View class details

**Student Actions:**
- View class details
- View my attendance for this class

### States to Handle
1. **Loading**: Skeleton cards/rows
2. **Empty**: "No classes found" with appropriate message
3. **Filtered Empty**: "No classes match your filters"
4. **Error**: Error alert with retry

### Code Structure
```tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAttendance } from '@/hooks';
import {
  Plus, MoreHorizontal, MapPin, Calendar, User,
  Play, LayoutGrid, List, Pencil, Trash, Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Types
interface Class {
  id: string;
  course_id: string;
  course: { code: string; name: string };
  mentor_id: string;
  mentor?: { full_name: string };
  name: string;
  room_number: string;
  day_of_week: string;
  schedule_time: string;
  state: 'active' | 'inactive';
}

// API integration
// import { classApi, courseApi } from '@/services';
// const classes = await classApi.getAll();
// const myClasses = await classApi.getByMentor(mentorId);
// const enrolledClasses = await classApi.getByStudent(studentId);
```

### Responsive Design
- Grid: 3 cols desktop, 2 cols tablet, 1 col mobile
- Filters wrap on mobile
- Cards stack vertically on mobile

Generate a complete classes management page with role-based content, filtering, grid/table views, and session management.
