"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Clock,
  Timer,
  UserPlus,
  List,
  Square,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Camera,
  Hand,
  ChevronsUpDown,
  Loader2,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

interface Session {
  id: string
  class_id: string
  class: {
    name: string
    room_number: string
    course: { code: string; name: string }
  }
  start_time: string
  end_time?: string
  late_threshold: number
  is_active: boolean
}

interface AttendanceRecord {
  id: string
  session_id: string
  student: {
    id: string
    full_name: string
    student_id: string
  }
  status: "present" | "absent" | "late" | "excused"
  marked_at?: string
  verification_method?: "face_recognition" | "manual"
  confidence_score?: number
}

interface StudentStats {
  attendance_rate: number
  present_count: number
  late_count: number
  absent_count: number
}

// Mock data
const mockActiveSession: Session = {
  id: "session-1",
  class_id: "3",
  class: {
    name: "Lab Session",
    room_number: "Lab 3",
    course: { code: "PHY101", name: "Physics I" },
  },
  start_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
  late_threshold: 15,
  is_active: true,
}

const mockSessions: Session[] = [
  mockActiveSession,
  {
    id: "session-2",
    class_id: "1",
    class: {
      name: "Lecture 1",
      room_number: "Room 101",
      course: { code: "CS101", name: "Introduction to Programming" },
    },
    start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    late_threshold: 15,
    is_active: false,
  },
  {
    id: "session-3",
    class_id: "2",
    class: {
      name: "Tutorial A",
      room_number: "Room 205",
      course: { code: "MATH201", name: "Calculus II" },
    },
    start_time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
    late_threshold: 10,
    is_active: false,
  },
]

const mockRecords: AttendanceRecord[] = [
  {
    id: "r1",
    session_id: "session-1",
    student: { id: "s1", full_name: "John Smith", student_id: "STU001" },
    status: "present",
    marked_at: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
    verification_method: "face_recognition",
    confidence_score: 0.98,
  },
  {
    id: "r2",
    session_id: "session-1",
    student: { id: "s2", full_name: "Jane Doe", student_id: "STU002" },
    status: "late",
    marked_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    verification_method: "face_recognition",
    confidence_score: 0.95,
  },
  {
    id: "r3",
    session_id: "session-1",
    student: { id: "s3", full_name: "Bob Wilson", student_id: "STU003" },
    status: "absent",
  },
  {
    id: "r4",
    session_id: "session-1",
    student: { id: "s4", full_name: "Alice Brown", student_id: "STU004" },
    status: "present",
    marked_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    verification_method: "face_recognition",
    confidence_score: 0.92,
  },
  {
    id: "r5",
    session_id: "session-1",
    student: { id: "s5", full_name: "Charlie Davis", student_id: "STU005" },
    status: "excused",
    marked_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    verification_method: "manual",
  },
]

const mockEnrolledStudents = [
  { id: "s1", full_name: "John Smith", student_id: "STU001" },
  { id: "s2", full_name: "Jane Doe", student_id: "STU002" },
  { id: "s3", full_name: "Bob Wilson", student_id: "STU003" },
  { id: "s4", full_name: "Alice Brown", student_id: "STU004" },
  { id: "s5", full_name: "Charlie Davis", student_id: "STU005" },
  { id: "s6", full_name: "Diana Evans", student_id: "STU006" },
]

const mockStudentStats: StudentStats = {
  attendance_rate: 0.94,
  present_count: 45,
  late_count: 3,
  absent_count: 2,
}

const mockStudentRecords: AttendanceRecord[] = [
  {
    id: "sr1",
    session_id: "session-1",
    student: { id: "1", full_name: "John Smith", student_id: "STU001" },
    status: "present",
    marked_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    verification_method: "face_recognition",
  },
  {
    id: "sr2",
    session_id: "session-2",
    student: { id: "1", full_name: "John Smith", student_id: "STU001" },
    status: "present",
    marked_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    verification_method: "face_recognition",
  },
  {
    id: "sr3",
    session_id: "session-3",
    student: { id: "1", full_name: "John Smith", student_id: "STU001" },
    status: "late",
    marked_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    verification_method: "face_recognition",
  },
]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatDuration(startTime: string) {
  const start = new Date(startTime)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    present: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Present" },
    absent: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Absent" },
    late: { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Late" },
    excused: { icon: AlertCircle, color: "bg-blue-100 text-blue-700", label: "Excused" },
  }

  const { icon: Icon, color, label } = config[status] || config.absent

  return (
    <Badge variant="secondary" className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}

export default function AttendancePage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null)
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([])
  const [duration, setDuration] = useState("00:00:00")

  // Dialog states
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false)
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mark attendance form state
  const [studentSearchOpen, setStudentSearchOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; full_name: string; student_id: string } | null>(
    null,
  )
  const [markStatus, setMarkStatus] = useState("present")
  const [reason, setReason] = useState("")

  // Student filters
  const [classFilter, setClassFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Load data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === "student") {
        setStudentStats(mockStudentStats)
        setStudentRecords(mockStudentRecords)
      } else {
        setActiveSession(mockActiveSession)
        setRecords(mockRecords)
        setSelectedSessionId(mockActiveSession.id)
      }
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [user])

  // Update duration timer
  useEffect(() => {
    if (!activeSession?.is_active) return
    const interval = setInterval(() => {
      setDuration(formatDuration(activeSession.start_time))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeSession])

  const sessionStats = {
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    late: records.filter((r) => r.status === "late").length,
  }

  const handleMarkAttendance = async () => {
    if (!selectedStudent) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const existingRecord = records.find((r) => r.student.id === selectedStudent.id)
    if (existingRecord) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === existingRecord.id
            ? {
                ...r,
                status: markStatus as AttendanceRecord["status"],
                marked_at: new Date().toISOString(),
                verification_method: "manual",
              }
            : r,
        ),
      )
    } else {
      const newRecord: AttendanceRecord = {
        id: Math.random().toString(36).substring(7),
        session_id: activeSession?.id || "",
        student: selectedStudent,
        status: markStatus as AttendanceRecord["status"],
        marked_at: new Date().toISOString(),
        verification_method: "manual",
      }
      setRecords((prev) => [...prev, newRecord])
    }

    setIsSubmitting(false)
    setIsMarkDialogOpen(false)
    setSelectedStudent(null)
    setMarkStatus("present")
    setReason("")
  }

  const handleOverride = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setMarkStatus(record.status)
    setReason("")
    setIsOverrideDialogOpen(true)
  }

  const handleConfirmOverride = async () => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    setRecords((prev) =>
      prev.map((r) =>
        r.id === selectedRecord.id
          ? {
              ...r,
              status: markStatus as AttendanceRecord["status"],
              verification_method: "manual",
            }
          : r,
      ),
    )

    setIsSubmitting(false)
    setIsOverrideDialogOpen(false)
    setSelectedRecord(null)
  }

  const handleEndSession = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setActiveSession((prev) => (prev ? { ...prev, is_active: false, end_time: new Date().toISOString() } : null))
    setIsSubmitting(false)
    setIsEndDialogOpen(false)
  }

  // Student view filters
  const filteredStudentRecords = studentRecords.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    )
  }

  // Student View
  if (user?.role === "student") {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
              <p className="text-muted-foreground mt-1">View your attendance history and statistics</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <p className="text-3xl font-bold text-primary">
                        {studentStats ? Math.round(studentStats.attendance_rate * 100) : 0}%
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Attendance Rate</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-3xl font-bold text-green-600">{studentStats?.present_count || 0}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Present</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <p className="text-3xl font-bold text-yellow-600">{studentStats?.late_count || 0}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Late</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <p className="text-3xl font-bold text-red-600">{studentStats?.absent_count || 0}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Absent</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="cs101">CS101 - Lecture 1</SelectItem>
                  <SelectItem value="math201">MATH201 - Tutorial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Records Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudentRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No attendance records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudentRecords.map((record) => {
                          const session = mockSessions.find((s) => s.id === record.session_id)
                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                {formatDate(record.marked_at || session?.start_time || "")}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {session?.class.course.code} - {session?.class.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{session?.class.room_number}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={record.status} />
                              </TableCell>
                              <TableCell>{record.marked_at ? formatTime(record.marked_at) : "-"}</TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Mentor/Admin View
  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground mt-1">Manage attendance sessions and records</p>
          </div>

          {/* Active Session Card or Empty State */}
          {activeSession?.is_active ? (
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
                <p className="text-sm text-muted-foreground">{activeSession.class.name}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Started: {formatTime(activeSession.start_time)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    <span>Duration: {duration}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-100 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{sessionStats.present}</p>
                    <p className="text-xs text-green-600">Present</p>
                  </div>
                  <div className="text-center p-3 bg-red-100 rounded-lg">
                    <p className="text-2xl font-bold text-red-700">{sessionStats.absent}</p>
                    <p className="text-xs text-red-600">Absent</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-100 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-700">{sessionStats.late}</p>
                    <p className="text-xs text-yellow-600">Late</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setIsMarkDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                  <Button variant="outline">
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
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <PlayCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No Active Session</h3>
                <p className="text-sm text-muted-foreground mb-4">Start a session from the Classes page</p>
                <Button variant="outline" asChild>
                  <Link href="/classes">Go to Classes</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Session Selector */}
          <div className="flex items-center gap-4">
            <Label>View Session:</Label>
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {mockSessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.class.course.code} - {session.class.name} ({formatDate(session.start_time)})
                    {session.is_active && " (Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
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
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No attendance records yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((record) => (
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
                          <TableCell>{record.marked_at ? formatTime(record.marked_at) : "-"}</TableCell>
                          <TableCell>
                            {record.verification_method === "face_recognition" ? (
                              <div className="flex items-center gap-1">
                                <Camera className="h-4 w-4" />
                                <span className="text-xs">Auto</span>
                              </div>
                            ) : record.verification_method === "manual" ? (
                              <div className="flex items-center gap-1">
                                <Hand className="h-4 w-4" />
                                <span className="text-xs">Manual</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {record.confidence_score ? `${Math.round(record.confidence_score * 100)}%` : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleOverride(record)}>
                              Override
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Mark Attendance Dialog */}
      <Dialog open={isMarkDialogOpen} onOpenChange={setIsMarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>Manually mark attendance for a student</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Student Search/Select */}
            <div className="space-y-2">
              <Label>Student</Label>
              <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    {selectedStudent?.full_name || "Select student..."}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search students..." />
                    <CommandList>
                      <CommandEmpty>No students found.</CommandEmpty>
                      {mockEnrolledStudents.map((student) => (
                        <CommandItem
                          key={student.id}
                          onSelect={() => {
                            setSelectedStudent(student)
                            setStudentSearchOpen(false)
                          }}
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
                  <Label htmlFor="present" className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Present
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="late" id="late" />
                  <Label htmlFor="late" className="flex items-center gap-2 cursor-pointer">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Late
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="absent" id="absent" />
                  <Label htmlFor="absent" className="flex items-center gap-2 cursor-pointer">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Absent
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excused" id="excused" />
                  <Label htmlFor="excused" className="flex items-center gap-2 cursor-pointer">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    Excused
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Reason (for excused) */}
            {markStatus === "excused" && (
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
            <Button onClick={handleMarkAttendance} disabled={!selectedStudent || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Attendance</DialogTitle>
            <DialogDescription>Change status for {selectedRecord?.student.full_name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup value={markStatus} onValueChange={setMarkStatus}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="present" id="override-present" />
                <Label htmlFor="override-present" className="flex items-center gap-2 cursor-pointer">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Present
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="late" id="override-late" />
                <Label htmlFor="override-late" className="flex items-center gap-2 cursor-pointer">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  Late
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="absent" id="override-absent" />
                <Label htmlFor="override-absent" className="flex items-center gap-2 cursor-pointer">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Absent
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excused" id="override-excused" />
                <Label htmlFor="override-excused" className="flex items-center gap-2 cursor-pointer">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  Excused
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmOverride} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Session Confirmation */}
      <AlertDialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Attendance Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this session? All unmarked students will be marked as absent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndSession}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
