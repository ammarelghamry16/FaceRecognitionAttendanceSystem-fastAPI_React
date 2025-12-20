"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useFaceEnrollment } from "@/hooks/use-face-enrollment"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Camera,
  Upload,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Trash,
  Video,
  X,
  Loader2,
  ChevronsUpDown,
} from "lucide-react"

// Demo students for admin selector
const demoStudents = [
  { id: "1", full_name: "John Smith", student_id: "STU001" },
  { id: "2", full_name: "Emily Johnson", student_id: "STU002" },
  { id: "3", full_name: "Michael Brown", student_id: "STU003" },
  { id: "4", full_name: "Sarah Davis", student_id: "STU004" },
  { id: "5", full_name: "James Wilson", student_id: "STU005" },
]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function FaceEnrollmentPage() {
  const { user, isAuthenticated } = useAuth()
  const { enrollmentStatus, isLoading, error, success, clearMessages, enrollFaces, deleteEnrollment } =
    useFaceEnrollment()

  // Admin student selector
  const [studentSearchOpen, setStudentSearchOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<(typeof demoStudents)[0] | null>(null)

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Page loading state
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      streamRef.current = stream
      setIsCameraActive(true)
    } catch {
      alert("Could not access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const captureImage = () => {
    if (!videoRef.current || capturedImages.length >= 5) return
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
    setCapturedImages((prev) => [...prev, dataUrl])
  }

  const submitCapturedImages = async () => {
    if (capturedImages.length === 0) return
    await enrollFaces(capturedImages)
    setCapturedImages([])
    stopCamera()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "image/jpeg" || f.type === "image/png")
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 5))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).filter((f) => f.type === "image/jpeg" || f.type === "image/png")
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 5))
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return
    // Convert files to data URLs for demo
    const dataUrls = await Promise.all(
      selectedFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          }),
      ),
    )
    await enrollFaces(dataUrls)
    setSelectedFiles([])
  }

  const handleDeleteEnrollment = async () => {
    await deleteEnrollment()
    setIsDeleteDialogOpen(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access face enrollment.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mentors cannot access this page
  if (user?.role === "mentor") {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Face Enrollment</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 p-6">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">
                  Face enrollment is only available for students and administrators.
                </p>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Face Enrollment</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold">Face Enrollment</h1>
              <p className="text-muted-foreground">Register your face for automatic attendance recognition</p>
            </div>

            {/* Alerts */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Admin Student Selector */}
            {user?.role === "admin" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Student</CardTitle>
                  <CardDescription>Choose a student to enroll their face</CardDescription>
                </CardHeader>
                <CardContent>
                  <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between bg-transparent">
                        {selectedStudent ? (
                          <span>
                            {selectedStudent.full_name} ({selectedStudent.student_id})
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Search for a student...</span>
                        )}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search by name or ID..." />
                        <CommandList>
                          <CommandEmpty>No students found.</CommandEmpty>
                          {demoStudents.map((student) => (
                            <CommandItem
                              key={student.id}
                              onSelect={() => {
                                setSelectedStudent(student)
                                setStudentSearchOpen(false)
                                clearMessages()
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{getInitials(student.full_name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{student.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{student.student_id}</p>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            )}

            {/* Enrollment Status Card */}
            {pageLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className={cn(enrollmentStatus.is_enrolled && "border-green-200 bg-green-50/50")}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Enrollment Status</CardTitle>
                    {enrollmentStatus.is_enrolled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {enrollmentStatus.is_enrolled ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700">Enrolled</p>
                        <p className="text-sm text-muted-foreground">
                          {enrollmentStatus.encodings_count} face image(s) registered
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-yellow-700">Not Enrolled</p>
                        <p className="text-sm text-muted-foreground">Please capture or upload face images below</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Capture and Upload Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Camera Capture */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Camera Capture
                  </CardTitle>
                  <CardDescription>Capture face images directly from your camera</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Camera Preview */}
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {isCameraActive ? (
                      <>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-0 border-2 border-dashed border-primary/50 m-8 rounded-lg pointer-events-none" />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Camera not active</p>
                        <Button className="mt-4" onClick={startCamera}>
                          <Video className="h-4 w-4 mr-2" />
                          Start Camera
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Captured Images Preview */}
                  {capturedImages.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Captured: {capturedImages.length}/5 images</p>
                        <Button variant="ghost" size="sm" onClick={() => setCapturedImages([])}>
                          Clear All
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-14 w-14 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden",
                              capturedImages[i] ? "border-solid border-primary" : "border-muted",
                            )}
                          >
                            {capturedImages[i] ? (
                              <img
                                src={capturedImages[i] || "/placeholder.svg"}
                                alt={`Capture ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">{i + 1}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Camera Actions */}
                  <div className="flex flex-wrap gap-2">
                    {isCameraActive && (
                      <>
                        <Button onClick={captureImage} disabled={capturedImages.length >= 5}>
                          <Camera className="h-4 w-4 mr-2" />
                          Capture ({capturedImages.length}/5)
                        </Button>
                        <Button variant="outline" onClick={stopCamera}>
                          Stop Camera
                        </Button>
                      </>
                    )}
                    {capturedImages.length > 0 && (
                      <Button className="ml-auto" onClick={submitCapturedImages} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Submit {capturedImages.length} Image(s)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Images
                  </CardTitle>
                  <CardDescription>Upload existing photos (JPG, PNG, max 5MB each)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drag & Drop Zone */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary hover:bg-primary/5",
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Drag & drop images here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected Files:</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                            <img
                              src={URL.createObjectURL(file) || "/placeholder.svg"}
                              alt={file.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFile(i)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full" onClick={uploadFiles} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Upload {selectedFiles.length} Image(s)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tips Card */}
            <Card className="bg-blue-50/50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  Tips for Best Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Ensure good, even lighting on your face</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Look directly at the camera</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Remove glasses if possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Capture from slightly different angles (3-5 images recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Use a neutral expression</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Face Enrollment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all enrolled face data? You will need to re-enroll to use face recognition
              for attendance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEnrollment} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
