# v0 Prompt: Attendance Management Page

Create a professional attendance management page for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Requirements

### User Roles & Views
- **Mentor/Admin**: Manage sessions, view records, mark attendance
- **Student**: View own attendance history and stats

### Layout Structure

#### Mentor/Admin View
```
┌─────────────────────────────────────────────────────────┐
│ Attendance                                              │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🟢 ACTIVE SESSION: CS101 - Lecture 1                │ │
│ │ Started: 9:00 AM | Duration: 00:15:32               │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐                │ │
│ │ │ ✅ 18   │ │ ❌ 2    │ │ ⚠️ 3    │                │ │
│ │ │ Present │ │ Absent  │ │ Late    │                │ │
│ │ └─────────┘ └─────────┘ └─────────┘                │ │
│ │ [Mark Attendance] [View Records] [End Session]      │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Session: [Select Session ▼]                             │
├─────────────────────────────────────────────────────────┤
│ Student        │ Status  │ Time    │ Method │ Actions  │
│────────────────┼─────────┼─────────┼────────┼──────────│
│ John Smith     │ ✅ Present│ 9:02 AM │ 📷 Auto│ Override │
│ Jane Doe       │ ⚠️ Late  │ 9:18 AM │ 📷 Auto│ Override │
│ Bob Wilson     │ ❌ Absent│ -       │ -      │ Mark     │
└─────────────────────────────────────────────────────────┘
```

#### Student View
```
┌─────────────────────────────────────────────────────────┐
│ My Attendance                                           │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ 📊 94%   │ │ ✅ 45    │ │ ⚠️ 3     │ │ ❌ 2     │    │
│ │ Rate     │ │ Present  │ │ Late     │ │ Absent   │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────────────────┤
│ Filter: [All Classes ▼] [All Status ▼] [Date Range]    │
├─────────────────────────────────────────────────────────┤
│ Date       │ Class           │ Status  │ Time          │
│────────────┼─────────────────┼─────────┼───────────────│
│ Dec 11     │ CS101 - Lec 1   │ ✅ Present│ 9:02 AM      │
│ Dec 10     │ MATH201 - Tut   │ ✅ Present│ 2:05 PM      │
│ Dec 9      │ PHY101 - Lab    │ ⚠️ Late  │ 10:18 AM     │
└─────────────────────────────────────────────────────────┘
```

### Components to Build

#### 1. Active Session Card (Mentor/Admin)
```tsx
<Card className="border-green-200 bg-green-50/50">
  <CardHeader className="pb-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
        <CardTitle className="text-lg">Active Session</CardTitle>
      </div>
      <Badge variant="outline" className="bg-green-100">
        {activeSession.class.course.code}
      </Badge>
    </div>
    <p className="text-sm text-muted-foreground">
      {activeSession.class.name}
    </p>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-4 text-sm mb-4">
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span>Started: {formatTime(activeSession.start_time)}</span>
      </div>
      <div className="flex items-center gap-1">
        <Timer className="h-4 w-4" />
        <span>Duration: {formatDuration(duration)}</span>
      </div>
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="text-center p-3 bg-green-100 rounded-lg">
        <p className="text-2xl font-bold text-green-700">{stats.present}</p>
        <p className="text-xs text-green-600">Present</p>
      </div>
      <div className="text-center p-3 bg-red-100 rounded-lg">
        <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
        <p className="text-xs text-red-600">Absent</p>
      </div>
      <div className="text-center p-3 bg-yellow-100 rounded-lg">
        <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
        <p className="text-xs text-yellow-600">Late</p>
      </div>
    </div>
    
    {/* Actions */}
    <div className="flex gap-2">
      <Button onClick={() => setIsMarkDialogOpen(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Mark Attendance
      </Button>
      <Button variant="outline" onClick={() => fetchSessionRecords(activeSession.id)}>
        <List className="h-4 w-4 mr-2" />
        View Records
      </Button>
      <Button variant="destructive" onClick={() => setIsEndDialogOpen(true)}>
        <Square className="h-4 w-4 mr-2" />
        End Session
      </Button>
    </div>
  </CardContent>
</Card>
```

#### 2. No Active Session State
```tsx
<Card className="border-dashed">
  <CardContent className="flex flex-col items-center justify-center py-12">
    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
      <PlayCircle className="h-6 w-6 text-muted-foreground" />
    </div>
    <h3 className="font-medium mb-1">No Active Session</h3>
    <p className="text-sm text-muted-foreground mb-4">
      Start a session from the Classes page
    </p>
    <Button variant="outline" asChild>
      <Link to="/classes">Go to Classes</Link>
    </Button>
  </CardContent>
</Card>
```

#### 3. Session Selector
```tsx
<div className="flex items-center gap-4 mb-4">
  <Label>View Session:</Label>
  <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
    <SelectTrigger className="w-[300px]">
      <SelectValue placeholder="Select a session" />
    </SelectTrigger>
    <SelectContent>
      {sessions.map(session => (
        <SelectItem key={session.id} value={session.id}>
          {session.class.name} - {formatDate(session.start_time)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

#### 4. Attendance Records Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Student</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Marked At</TableHead>
      <TableHead>Method</TableHead>
      <TableHead>Confidence</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {records.map(record => (
      <TableRow key={record.id}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials(record.student.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{record.student.full_name}</p>
              <p className="text-xs text-muted-foreground">{record.student.student_id}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <StatusBadge status={record.status} />
        </TableCell>
        <TableCell>
          {record.marked_at ? formatTime(record.marked_at) : '-'}
        </TableCell>
        <TableCell>
          {record.verification_method === 'face_recognition' ? (
            <div className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              <span className="text-xs">Auto</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Hand className="h-4 w-4" />
              <span className="text-xs">Manual</span>
            </div>
          )}
        </TableCell>
        <TableCell>
          {record.confidence_score ? `${(record.confidence_score * 100).toFixed(0)}%` : '-'}
        </TableCell>
        <TableCell className="text-right">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleOverride(record)}
          >
            Override
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### 5. Status Badge Component
```tsx
function StatusBadge({ status }: { status: string }) {
  const config = {
    present: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Present' },
    absent: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Absent' },
    late: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Late' },
    excused: { icon: AlertCircle, color: 'bg-blue-100 text-blue-700', label: 'Excused' },
  }[status];
  
  const Icon = config.icon;
  
  return (
    <Badge variant="secondary" className={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
```

#### 6. Mark Attendance Dialog
```tsx
<Dialog open={isMarkDialogOpen} onOpenChange={setIsMarkDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Mark Attendance</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Student Search/Select */}
      <div className="space-y-2">
        <Label>Student</Label>
        <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedStudent?.full_name || "Select student..."}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search students..." />
              <CommandList>
                {enrolledStudents.map(student => (
                  <CommandItem 
                    key={student.id}
                    onSelect={() => setSelectedStudent(student)}
                  >
                    {student.full_name} ({student.student_id})
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Status Selection */}
      <div className="space-y-2">
        <Label>Status</Label>
        <RadioGroup value={markStatus} onValueChange={setMarkStatus}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="present" id="present" />
            <Label htmlFor="present" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Present
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="late" id="late" />
            <Label htmlFor="late" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Late
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="absent" id="absent" />
            <Label htmlFor="absent" className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Absent
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="excused" id="excused" />
            <Label htmlFor="excused" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              Excused
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Reason (for excused) */}
      {markStatus === 'excused' && (
        <div className="space-y-2">
          <Label>Reason</Label>
          <Textarea 
            placeholder="Enter reason for excused absence..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      )}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsMarkDialogOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleMarkAttendance}>
        Mark Attendance
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 7. Student Stats Cards
```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
  <Card>
    <CardContent className="pt-6">
      <div className="text-center">
        <p className="text-3xl font-bold text-primary">
          {(studentStats.attendance_rate * 100).toFixed(0)}%
        </p>
        <p className="text-sm text-muted-foreground">Attendance Rate</p>
      </div>
    </CardContent>
  </Card>
  {/* Similar cards for Present, Late, Absent counts */}
</div>
```

### API Integration
```tsx
import { useAttendance } from '@/hooks';
import { useAuth } from '@/context/AuthContext';

const {
  activeSession,
  sessionRecords,
  sessionStats,
  studentStats,
  fetchSessionRecords,
  markManualAttendance,
  endSession,
  fetchStudentStats,
} = useAttendance();
```

### States to Handle
1. **Loading**: Skeleton for cards and table
2. **No Active Session**: Empty state with CTA
3. **Active Session**: Full session card with stats
4. **Empty Records**: "No attendance records yet"
5. **Error**: Error alert with retry

Generate a complete attendance management page with role-based views, session management, and manual attendance marking.
