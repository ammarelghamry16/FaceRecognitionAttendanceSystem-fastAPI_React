"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useFaceEnrollment } from "@/hooks/use-face-enrollment"
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Shield,
  GraduationCap,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
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
import { cn } from "@/lib/utils"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

const strengthColors = ["bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"]
const strengthTextColors = ["text-red-600", "text-yellow-600", "text-blue-600", "text-green-600"]
const strengthLabels = ["Weak", "Fair", "Good", "Strong"]

function calculatePasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return strength
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { enrollmentStatus, checkEnrollmentStatus } = useFaceEnrollment()

  // Profile form state
  const [profileForm, setProfileForm] = useState({ full_name: "" })
  const [profileErrors, setProfileErrors] = useState<{ full_name?: string }>({})
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Delete account dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const passwordStrength = calculatePasswordStrength(passwordForm.new_password)

  useEffect(() => {
    if (user) {
      setProfileForm({ full_name: user.full_name })
      checkEnrollmentStatus(user.id)
    }
  }, [user, checkEnrollmentStatus])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileErrors({})
    setProfileSuccess(false)

    if (profileForm.full_name.trim().length < 2) {
      setProfileErrors({ full_name: "Name must be at least 2 characters" })
      return
    }

    setIsProfileSaving(true)
    const result = await updateProfile({ full_name: profileForm.full_name.trim() })
    setIsProfileSaving(false)

    if (result.success) {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } else {
      setProfileErrors({ full_name: result.error })
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (passwordForm.current_password !== "password123") {
      setPasswordError("Current password is incorrect")
      return
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters")
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Passwords do not match")
      return
    }

    setIsPasswordSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsPasswordSaving(false)
    setPasswordSuccess(true)
    setPasswordForm({ current_password: "", new_password: "", confirm_password: "" })
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  if (!user) {
    return (
      <SidebarInset>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Profile & Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{user.full_name}</h2>
                  <p className="text-muted-foreground">{user.email}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="secondary" className="capitalize">
                      {user.role === "student" && <GraduationCap className="h-3 w-3 mr-1" />}
                      {user.role === "mentor" && <BookOpen className="h-3 w-3 mr-1" />}
                      {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                      {user.role}
                    </Badge>

                    {user.student_id && <span className="text-sm text-muted-foreground">ID: {user.student_id}</span>}
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Member since {formatDate(user.created_at)}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                >
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile & Change Password Forms */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Edit Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Edit Profile
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                    {profileErrors.full_name && <p className="text-sm text-destructive">{profileErrors.full_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin if needed.</p>
                  </div>

                  <Button type="submit" disabled={isProfileSaving}>
                    {isProfileSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>

                  {profileSuccess && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Profile updated successfully
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Change Password Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    {passwordForm.new_password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-colors",
                                i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-muted",
                              )}
                            />
                          ))}
                        </div>
                        <p
                          className={cn("text-xs", strengthTextColors[passwordStrength - 1] || "text-muted-foreground")}
                        >
                          {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Enter a password"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                      <p className="text-sm text-destructive">Passwords do not match</p>
                    )}
                  </div>

                  {passwordError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {passwordError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isPasswordSaving || passwordForm.new_password !== passwordForm.confirm_password}
                  >
                    {isPasswordSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Update Password
                  </Button>

                  {passwordSuccess && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Password changed successfully
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Face Enrollment Status - Students Only */}
          {user.role === "student" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Face Enrollment</CardTitle>
                <CardDescription>Your face recognition enrollment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {enrollmentStatus?.is_enrolled ? (
                      <>
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">Enrolled</p>
                          <p className="text-sm text-muted-foreground">
                            {enrollmentStatus.encodings_count} face image(s) registered
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-medium text-yellow-700 dark:text-yellow-400">Not Enrolled</p>
                          <p className="text-sm text-muted-foreground">Enroll your face for automatic attendance</p>
                        </div>
                      </>
                    )}
                  </div>

                  <Button variant="outline" asChild>
                    <Link href="/face-enrollment">
                      {enrollmentStatus?.is_enrolled ? "Manage" : "Enroll Now"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our
              servers, including attendance records and face enrollment data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}
