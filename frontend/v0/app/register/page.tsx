"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, Eye, EyeOff, Award as IdCard, Loader2, ScanFace, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { useAuth, type RegisterData } from "@/context/auth-context"

interface FormErrors {
  full_name?: string
  email?: string
  password?: string
  confirm_password?: string
  student_id?: string
}

type PasswordStrength = "weak" | "medium" | "strong"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [formData, setFormData] = useState<RegisterData>({
    full_name: "",
    email: "",
    password: "",
    role: "student",
    student_id: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Password strength calculation
  const passwordStrength = useMemo((): PasswordStrength => {
    const password = formData.password
    if (password.length < 8) return "weak"

    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (hasUppercase && hasNumber && hasSpecial) return "strong"
    if (hasUppercase || hasNumber) return "medium"
    return "weak"
  }, [formData.password])

  const strengthConfig = {
    weak: { label: "Weak password", color: "bg-destructive", width: "w-1/3" },
    medium: { label: "Medium strength", color: "bg-yellow-500", width: "w-2/3" },
    strong: { label: "Strong password", color: "bg-green-500", width: "w-full" },
  }

  // Validation functions
  const validateFullName = (value: string): string | undefined => {
    if (!value) return "Full name is required"
    if (value.length < 2) return "Name must be at least 2 characters"
    return undefined
  }

  const validateEmail = (value: string): string | undefined => {
    if (!value) return "Email is required"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return "Please enter a valid email"
    return undefined
  }

  const validatePassword = (value: string): string | undefined => {
    if (!value) return "Password is required"
    if (value.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter"
    if (!/\d/.test(value)) return "Password must contain at least one number"
    return undefined
  }

  const validateConfirmPassword = (value: string): string | undefined => {
    if (!value) return "Please confirm your password"
    if (value !== formData.password) return "Passwords do not match"
    return undefined
  }

  const validateStudentId = (value: string): string | undefined => {
    if (formData.role === "student" && !value) return "Student ID is required"
    return undefined
  }

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)

    // Clear field error on change
    if (errors[field as keyof FormErrors]) {
      const validators: Record<string, (v: string) => string | undefined> = {
        full_name: validateFullName,
        email: validateEmail,
        password: validatePassword,
        student_id: validateStudentId,
      }
      if (validators[field]) {
        setErrors((prev) => ({ ...prev, [field]: validators[field](value) }))
      }
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    setError(null)
    if (errors.confirm_password) {
      setErrors((prev) => ({ ...prev, confirm_password: validateConfirmPassword(value) }))
    }
  }

  const handleRoleChange = (role: "student" | "mentor") => {
    setFormData((prev) => ({ ...prev, role, student_id: role === "mentor" ? "" : prev.student_id }))
    setError(null)
    if (role === "mentor") {
      setErrors((prev) => ({ ...prev, student_id: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all fields
    const newErrors: FormErrors = {
      full_name: validateFullName(formData.full_name),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirm_password: validateConfirmPassword(confirmPassword),
      student_id: validateStudentId(formData.student_id || ""),
    }
    setErrors(newErrors)

    if (Object.values(newErrors).some((e) => e !== undefined)) return

    setIsLoading(true)
    try {
      const result = await register(formData)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push("/"), 2000)
      } else {
        setError(result.error || "Registration failed")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Registration Successful!</h2>
            <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <ScanFace className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join the Face Recognition Attendance System</p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  onBlur={() => setErrors((prev) => ({ ...prev, full_name: validateFullName(formData.full_name) }))}
                  disabled={isLoading}
                  className={`pl-10 ${errors.full_name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-describedby={errors.full_name ? "fullname-error" : undefined}
                />
              </div>
              {errors.full_name && (
                <p id="fullname-error" className="text-sm text-destructive">
                  {errors.full_name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(formData.email) }))}
                  disabled={isLoading}
                  className={`pl-10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(formData.password) }))}
                  disabled={isLoading}
                  className={`pl-10 pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-describedby={errors.password ? "password-error" : "password-strength"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password}
                </p>
              )}
              {/* Password Strength Indicator */}
              {formData.password && !errors.password && (
                <div id="password-strength" className="space-y-1.5">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthConfig[passwordStrength].color} ${strengthConfig[passwordStrength].width} transition-all duration-300`}
                    />
                  </div>
                  <p
                    className={`text-xs ${passwordStrength === "weak" ? "text-destructive" : passwordStrength === "medium" ? "text-yellow-600" : "text-green-600"}`}
                  >
                    {strengthConfig[passwordStrength].label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  onBlur={() =>
                    setErrors((prev) => ({ ...prev, confirm_password: validateConfirmPassword(confirmPassword) }))
                  }
                  disabled={isLoading}
                  className={`pl-10 pr-10 ${errors.confirm_password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-describedby={errors.confirm_password ? "confirm-password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p id="confirm-password-error" className="text-sm text-destructive">
                  {errors.confirm_password}
                </p>
              )}
            </div>

            {/* Role Selector */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => handleRoleChange(v as "student" | "mentor")}
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student ID - Conditional */}
            {formData.role === "student" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="student_id">Student ID</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="student_id"
                    placeholder="Enter your student ID"
                    value={formData.student_id}
                    onChange={(e) => handleInputChange("student_id", e.target.value)}
                    onBlur={() =>
                      setErrors((prev) => ({ ...prev, student_id: validateStudentId(formData.student_id || "") }))
                    }
                    disabled={isLoading}
                    className={`pl-10 ${errors.student_id ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    aria-describedby={errors.student_id ? "studentid-error" : undefined}
                  />
                </div>
                {errors.student_id && (
                  <p id="studentid-error" className="text-sm text-destructive">
                    {errors.student_id}
                  </p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="text-center text-sm text-muted-foreground">
            {"Already have an account? "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-center text-muted-foreground">© 2025 Face Recognition Attendance System</p>
        </CardFooter>
      </Card>
    </div>
  )
}
