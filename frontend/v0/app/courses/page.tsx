"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Plus,
  Search,
  Pencil,
  Trash,
  ExternalLink,
  MoreHorizontal,
  Loader2,
  BookOpen,
  X,
  ShieldAlert,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Course {
  id: string
  code: string
  name: string
  description?: string
  classCount: number
  created_at: string
}

// Mock data
const initialCourses: Course[] = [
  {
    id: "1",
    code: "CS101",
    name: "Introduction to Programming",
    description:
      "Basic programming concepts using Python. Covers variables, loops, functions, and object-oriented programming.",
    classCount: 3,
    created_at: "2024-01-15",
  },
  {
    id: "2",
    code: "MATH201",
    name: "Calculus II",
    description: "Advanced calculus topics including integration techniques, series, and multivariable calculus.",
    classCount: 2,
    created_at: "2024-01-20",
  },
  {
    id: "3",
    code: "PHY101",
    name: "Physics I",
    description: "Mechanics, thermodynamics, and waves. Includes laboratory sessions.",
    classCount: 4,
    created_at: "2024-02-01",
  },
  {
    id: "4",
    code: "ENG102",
    name: "Technical Writing",
    description: "Professional communication and documentation skills for engineers and scientists.",
    classCount: 2,
    created_at: "2024-02-10",
  },
  {
    id: "5",
    code: "CS201",
    name: "Data Structures",
    description: "Arrays, linked lists, trees, graphs, and algorithm analysis.",
    classCount: 3,
    created_at: "2024-02-15",
  },
]

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({ code: "", name: "", description: "" })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Load courses
  useEffect(() => {
    const timer = setTimeout(() => {
      setCourses(initialCourses)
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses
    const query = searchQuery.toLowerCase()
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query),
    )
  }, [courses, searchQuery])

  // Access control
  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">Only administrators can manage courses.</p>
                <Button onClick={() => router.push("/")}>Go to Dashboard</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.code.trim()) {
      errors.code = "Course code is required"
    } else if (!/^[A-Z0-9]{3,10}$/.test(formData.code.toUpperCase())) {
      errors.code = "Code must be 3-10 alphanumeric characters"
    } else if (!editingCourse && courses.some((c) => c.code === formData.code.toUpperCase())) {
      errors.code = "Course code already exists"
    }
    if (!formData.name.trim()) {
      errors.name = "Course name is required"
    } else if (formData.name.length < 3 || formData.name.length > 100) {
      errors.name = "Name must be 3-100 characters"
    }
    if (formData.description && formData.description.length > 500) {
      errors.description = "Description must be under 500 characters"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenAddDialog = () => {
    setFormData({ code: "", name: "", description: "" })
    setFormErrors({})
    setEditingCourse(null)
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (course: Course) => {
    setFormData({ code: course.code, name: course.name, description: course.description || "" })
    setFormErrors({})
    setEditingCourse(course)
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (editingCourse) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourse.id ? { ...c, name: formData.name, description: formData.description } : c,
        ),
      )
    } else {
      const newCourse: Course = {
        id: Math.random().toString(36).substring(7),
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        classCount: 0,
        created_at: new Date().toISOString(),
      }
      setCourses((prev) => [...prev, newCourse])
    }

    setIsSubmitting(false)
    setIsAddDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deletingCourse) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setCourses((prev) => prev.filter((c) => c.id !== deletingCourse.id))
    setIsSubmitting(false)
    setIsDeleteDialogOpen(false)
    setDeletingCourse(null)
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
              <p className="text-muted-foreground mt-1">Manage your institution&apos;s courses</p>
            </div>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              disabled={isLoading}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-5 flex-1" />
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">{searchQuery ? "No courses found" : "No courses yet"}</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "Try adjusting your search query" : "Get started by creating your first course"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleOpenAddDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Course
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Code</TableHead>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[80px] text-center">Classes</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TooltipProvider>
                        {filteredCourses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-mono font-medium">{course.code}</TableCell>
                            <TableCell className="font-medium">{course.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {course.description ? (
                                course.description.length > 50 ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help">{truncateText(course.description, 50)}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">{course.description}</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  course.description
                                )
                              ) : (
                                <span className="text-muted-foreground/50">No description</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{course.classCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenEditDialog(course)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/classes?course=${course.code}`)}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Classes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeletingCourse(course)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TooltipProvider>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "Update course details" : "Create a new course for your institution"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                placeholder="e.g., CS101"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={!!editingCourse}
                className="uppercase"
              />
              {formErrors.code && <p className="text-sm text-destructive">{formErrors.code}</p>}
              <p className="text-xs text-muted-foreground">Unique identifier for the course</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Course Name</Label>
              <Input
                id="name"
                placeholder="e.g., Introduction to Programming"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the course..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCourse ? "Save Changes" : "Create Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingCourse?.name}&quot;? This will also delete all associated
              classes and cannot be undone.
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
