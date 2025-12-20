"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import {
  Plus,
  MoreHorizontal,
  Loader2,
  MapPin,
  Calendar,
  User,
  Play,
  LayoutGrid,
  List,
  Pencil,
  Trash,
  Users,
  Eye,
} from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  code: string
  name: string
}

interface Mentor {
  id: string
  full_name: string
}

interface Class {
  id: string
  course_id: string
  course: Course
  mentor_id: string
  mentor?: Mentor
  name: string
  room_number: string
  day_of_week: string
  schedule_time: string
  state: "active" | "inactive"
  enrolled_count?: number
}

// Mock data
const mockCourses: Course[] = [
  { id: "1", code: "CS101", name: "Introduction to Programming" },
  { id: "2", code: "MATH201", name: "Calculus II" },
  { id: "3", code: "PHY101", name: "Physics I" },
]

const mockMentors: Mentor[] = [
  { id: "2", full_name: "Dr. Sarah Chen" },
  { id: "5", full_name: "Prof. James Wilson" },
  { id: "6", full_name: "Dr. Emily Lee" },
]

const initialClasses: Class[] = [
  {
    id: "1",
    course_id: "1",
    course: { id: "1", code: "CS101", name: "Introduction to Programming" },
    mentor_id: "2",
    mentor: { id: "2", full_name: "Dr. Sarah Chen" },
    name: "Lecture 1",
    room_number: "Room 101",
    day_of_week: "monday",
    schedule_time: "09:00",
    state: "inactive",
    enrolled_count: 35,
  },
  {
    id: "2",
    course_id: "2",
    course: { id: "2", code: "MATH201", name: "Calculus II" },
    mentor_id: "5",
    mentor: { id: "5", full_name: "Prof. James Wilson" },
    name: "Tutorial A",
    room_number: "Room 205",
    day_of_week: "tuesday",
    schedule_time: "14:00",
    state: "inactive",
    enrolled_count: 28,
  },
  {
    id: "3",
    course_id: "3",
    course: { id: "3", code: "PHY101", name: "Physics I" },
    mentor_id: "6",
    mentor: { id: "6", full_name: "Dr. Emily Lee" },
    name: "Lab Session",
    room_number: "Lab 3",
    day_of_week: "wednesday",
    schedule_time: "10:00",
    state: "active",
    enrolled_count: 24,
  },
  {
    id: "4",
    course_id: "1",
    course: { id: "1", code: "CS101", name: "Introduction to Programming" },
    mentor_id: "2",
    mentor: { id: "2", full_name: "Dr. Sarah Chen" },
    name: "Lecture 2",
    room_number: "Room 102",
    day_of_week: "thursday",
    schedule_time: "11:00",
    state: "inactive",
    enrolled_count: 35,
  },
]

const daysOfWeek = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
]

function formatDay(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1)
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":")
  const hour = Number.parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export default function ClassesPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [courseFilter, setCourseFilter] = useState("all")
  const [dayFilter, setDayFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isStartSessionOpen, setIsStartSessionOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [deletingClass, setDeletingClass] = useState<Class | null>(null)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    course_id: "",
    mentor_id: "",
    name: "",
    room_number: "",
    day_of_week: "",
    schedule_time: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [lateThreshold, setLateThreshold] = useState(15)

  // Load classes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Filter based on role
      let roleFilteredClasses = initialClasses
      if (user?.role === "mentor") {
        roleFilteredClasses = initialClasses.filter((c) => c.mentor_id === user.id || c.mentor_id === "2")
      } else if (user?.role === "student") {
        // Students see enrolled classes (mock: show all for demo)
        roleFilteredClasses = initialClasses
      }
      setClasses(roleFilteredClasses)
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [user])

  // Filter classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (courseFilter !== "all" && c.course_id !== courseFilter) return false
      if (dayFilter !== "all" && c.day_of_week !== dayFilter) return false
      if (statusFilter !== "all" && c.state !== statusFilter) return false
      return true
    })
  }, [classes, courseFilter, dayFilter, statusFilter])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.course_id) errors.course_id = "Course is required"
    if (!formData.mentor_id) errors.mentor_id = "Mentor is required"
    if (!formData.name.trim()) errors.name = "Class name is required"
    else if (formData.name.length < 3 || formData.name.length > 100) errors.name = "Name must be 3-100 characters"
    if (!formData.room_number.trim()) errors.room_number = "Room number is required"
    if (!formData.day_of_week) errors.day_of_week = "Day is required"
    if (!formData.schedule_time) errors.schedule_time = "Time is required"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenAddDialog = () => {
    setFormData({ course_id: "", mentor_id: "", name: "", room_number: "", day_of_week: "", schedule_time: "" })
    setFormErrors({})
    setEditingClass(null)
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (cls: Class) => {
    setFormData({
      course_id: cls.course_id,
      mentor_id: cls.mentor_id,
      name: cls.name,
      room_number: cls.room_number,
      day_of_week: cls.day_of_week,
      schedule_time: cls.schedule_time,
    })
    setFormErrors({})
    setEditingClass(cls)
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const course = mockCourses.find((c) => c.id === formData.course_id)
    const mentor = mockMentors.find((m) => m.id === formData.mentor_id)

    if (editingClass) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === editingClass.id
            ? {
                ...c,
                ...formData,
                course: course!,
                mentor,
              }
            : c,
        ),
      )
    } else {
      const newClass: Class = {
        id: Math.random().toString(36).substring(7),
        ...formData,
        course: course!,
        mentor,
        state: "inactive",
        enrolled_count: 0,
      }
      setClasses((prev) => [...prev, newClass])
    }

    setIsSubmitting(false)
    setIsAddDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deletingClass) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setClasses((prev) => prev.filter((c) => c.id !== deletingClass.id))
    setIsSubmitting(false)
    setIsDeleteDialogOpen(false)
    setDeletingClass(null)
  }

  const handleStartSession = (cls: Class) => {
    setSelectedClass(cls)
    setLateThreshold(15)
    setIsStartSessionOpen(true)
  }

  const handleConfirmStartSession = async () => {
    if (!selectedClass) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setClasses((prev) => prev.map((c) => (c.id === selectedClass.id ? { ...c, state: "active" } : c)))
    setIsSubmitting(false)
    setIsStartSessionOpen(false)
    setSelectedClass(null)
  }

  const getRoleDescription = () => {
    switch (user?.role) {
      case "student":
        return "Your enrolled classes"
      case "mentor":
        return "Classes you teach"
      default:
        return "Manage all classes"
    }
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
              <p className="text-muted-foreground mt-1">{getRoleDescription()}</p>
            </div>
            {user?.role === "admin" && (
              <Button onClick={handleOpenAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {mockCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-5 w-16 mb-2" />
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-28" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-6 w-20" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          ) : filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                  {courseFilter !== "all" || dayFilter !== "all" || statusFilter !== "all"
                    ? "No classes match your filters"
                    : "No classes yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {courseFilter !== "all" || dayFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filter criteria"
                    : "Get started by creating your first class"}
                </p>
                {user?.role === "admin" && courseFilter === "all" && dayFilter === "all" && statusFilter === "all" && (
                  <Button onClick={handleOpenAddDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((cls) => (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {cls.course.code}
                        </Badge>
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user?.role === "admin" && (
                            <>
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(cls)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="h-4 w-4 mr-2" />
                                View Enrollments
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingClass(cls)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                          {user?.role === "mentor" && (
                            <>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {cls.state === "active" && (
                                <DropdownMenuItem asChild>
                                  <Link href="/attendance">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Session
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {user?.role === "student" && (
                            <>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="/attendance">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  My Attendance
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{cls.room_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDay(cls.day_of_week)}, {formatTime(cls.schedule_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{cls.mentor?.full_name || "Unassigned"}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-3 border-t">
                    <Badge variant={cls.state === "active" ? "default" : "secondary"}>
                      <span
                        className={`h-2 w-2 rounded-full mr-2 ${cls.state === "active" ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      {cls.state === "active" ? "Active" : "Inactive"}
                    </Badge>

                    {user?.role === "mentor" && cls.state === "inactive" && (
                      <Button size="sm" onClick={() => handleStartSession(cls)}>
                        <Play className="h-4 w-4 mr-1" />
                        Start Session
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Mentor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClasses.map((cls) => (
                        <TableRow key={cls.id}>
                          <TableCell>
                            <Badge variant="outline">{cls.course.code}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{cls.name}</TableCell>
                          <TableCell>{cls.room_number}</TableCell>
                          <TableCell>
                            {formatDay(cls.day_of_week)}, {formatTime(cls.schedule_time)}
                          </TableCell>
                          <TableCell>{cls.mentor?.full_name || "Unassigned"}</TableCell>
                          <TableCell>
                            <Badge variant={cls.state === "active" ? "default" : "secondary"}>
                              {cls.state === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user?.role === "admin" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(cls)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setDeletingClass(cls)
                                        setIsDeleteDialogOpen(true)
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {user?.role === "mentor" && cls.state === "inactive" && (
                                  <DropdownMenuItem onClick={() => handleStartSession(cls)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Session
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
            <DialogDescription>
              {editingClass ? "Update class details" : "Create a new class for a course"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select
                value={formData.course_id}
                onValueChange={(value) => setFormData({ ...formData, course_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {mockCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.course_id && <p className="text-sm text-destructive">{formErrors.course_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Mentor</Label>
              <Select
                value={formData.mentor_id}
                onValueChange={(value) => setFormData({ ...formData, mentor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mentor" />
                </SelectTrigger>
                <SelectContent>
                  {mockMentors.map((mentor) => (
                    <SelectItem key={mentor.id} value={mentor.id}>
                      {mentor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.mentor_id && <p className="text-sm text-destructive">{formErrors.mentor_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                placeholder="e.g., Lecture 1, Tutorial A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Room Number</Label>
              <Input
                id="room"
                placeholder="e.g., Room 101, Lab 3"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              />
              {formErrors.room_number && <p className="text-sm text-destructive">{formErrors.room_number}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select
                  value={formData.day_of_week}
                  onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.day_of_week && <p className="text-sm text-destructive">{formErrors.day_of_week}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.schedule_time}
                  onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                />
                {formErrors.schedule_time && <p className="text-sm text-destructive">{formErrors.schedule_time}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingClass ? "Save Changes" : "Create Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Start Session Dialog */}
      <Dialog open={isStartSessionOpen} onOpenChange={setIsStartSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Attendance Session</DialogTitle>
            <DialogDescription>Start taking attendance for {selectedClass?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Badge variant="outline">{selectedClass?.course.code}</Badge>
                <span className="font-medium">{selectedClass?.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedClass?.room_number}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {selectedClass?.enrolled_count} students
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Late Threshold (minutes)</Label>
              <Input
                id="threshold"
                type="number"
                value={lateThreshold}
                onChange={(e) => setLateThreshold(Number(e.target.value))}
                min={5}
                max={60}
              />
              <p className="text-xs text-muted-foreground">Students arriving after this time will be marked as late</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartSessionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmStartSession} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingClass?.name}&quot;? This will also delete all attendance
              records and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
