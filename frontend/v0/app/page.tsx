"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth, type UserRole } from "@/context/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import {
  BookOpen,
  TrendingUp,
  Calendar,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Play,
  Users,
  ScanFace,
  ClipboardList,
} from "lucide-react"

// Mock data
const upcomingClasses = [
  { id: 1, course: "CS101 - Intro to Programming", room: "Room 101", time: "9:00 AM", status: "In 30 min" },
  { id: 2, course: "MATH201 - Calculus II", room: "Room 205", time: "11:00 AM", status: "In 2 hours" },
  { id: 3, course: "PHY101 - Physics I", room: "Lab 3", time: "2:00 PM", status: "Today" },
  { id: 4, course: "ENG102 - Technical Writing", room: "Room 112", time: "4:00 PM", status: "Today" },
]

const recentAttendance = [
  { id: 1, course: "CS101 - Intro to Programming", date: "Today, 9:00 AM", status: "present" as const },
  { id: 2, course: "MATH201 - Calculus II", date: "Yesterday, 11:00 AM", status: "present" as const },
  { id: 3, course: "PHY101 - Physics I", date: "Yesterday, 2:00 PM", status: "late" as const },
  { id: 4, course: "ENG102 - Technical Writing", date: "Dec 9, 4:00 PM", status: "absent" as const },
]

const notifications = [
  { id: 1, title: "Attendance marked for CS101", time: "2 min ago", icon: CheckCircle },
  { id: 2, title: "New class scheduled: PHY101 Lab", time: "1 hour ago", icon: Calendar },
  { id: 3, title: "Face enrollment reminder", time: "3 hours ago", icon: Bell },
]

const statusConfig = {
  present: {
    label: "Present",
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  late: {
    label: "Late",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  absent: {
    label: "Absent",
    variant: "destructive" as const,
    icon: XCircle,
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
}

export default function DashboardPage() {
  const { user, setRole } = useAuth()
  const { unreadCount } = useNotifications()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const roles: UserRole[] = ["student", "mentor", "admin"]

  // Role-based stats
  const getStats = () => {
    if (user?.role === "admin") {
      return [
        { label: "Total Courses", value: "24", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
        { label: "Active Students", value: "1,234", icon: Users, color: "bg-green-100 text-green-600" },
        { label: "Today's Sessions", value: "18", icon: Calendar, color: "bg-purple-100 text-purple-600" },
        { label: "Avg. Attendance", value: "92%", icon: TrendingUp, color: "bg-orange-100 text-orange-600" },
      ]
    }
    if (user?.role === "mentor") {
      return [
        { label: "My Classes", value: "8", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
        { label: "Total Students", value: "156", icon: Users, color: "bg-green-100 text-green-600" },
        { label: "Today's Classes", value: "3", icon: Calendar, color: "bg-purple-100 text-purple-600" },
        { label: "Avg. Attendance", value: "89%", icon: TrendingUp, color: "bg-orange-100 text-orange-600" },
      ]
    }
    return [
      { label: "Total Classes", value: "12", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
      { label: "Attendance Rate", value: "94%", icon: TrendingUp, color: "bg-green-100 text-green-600" },
      { label: "Today's Classes", value: "3", icon: Calendar, color: "bg-purple-100 text-purple-600" },
      { label: "Notifications", value: String(unreadCount), icon: Bell, color: "bg-orange-100 text-orange-600" },
    ]
  }

  // Role-based quick actions
  const getQuickActions = () => {
    if (user?.role === "admin") {
      return [
        { label: "Manage Courses", icon: BookOpen, href: "/courses" },
        { label: "Manage Users", icon: Users, href: "/users" },
        { label: "View All Sessions", icon: ClipboardList, href: "/attendance" },
      ]
    }
    if (user?.role === "mentor") {
      return [
        { label: "Start Attendance Session", icon: Play, href: "/attendance/start", primary: true },
        { label: "View My Classes", icon: BookOpen, href: "/classes" },
        { label: "Mark Manual Attendance", icon: ClipboardList, href: "/attendance/manual" },
      ]
    }
    return [
      { label: "View My Schedule", icon: Calendar, href: "/classes" },
      { label: "Check Attendance History", icon: ClipboardList, href: "/attendance" },
      { label: "Update Face Enrollment", icon: ScanFace, href: "/face-enrollment" },
    ]
  }

  const stats = getStats()
  const quickActions = getQuickActions()

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.full_name?.split(" ")[0] || "User"}!
              </h1>
              <p className="text-muted-foreground mt-1">Here&apos;s an overview of your attendance system.</p>
            </div>
            <Button variant="outline" size="icon" className="relative bg-transparent" asChild>
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>

          {/* Role Switcher for Demo */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Demo: Switch User Role</CardTitle>
              <CardDescription>Try different roles to see role-specific content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Button
                    key={role}
                    variant={user?.role === role ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRole(role)}
                    className="capitalize"
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
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
                ))
              : stats.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-3xl font-bold">{stat.value}</p>
                        </div>
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.color}`}>
                          <stat.icon className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Classes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Upcoming Classes</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/classes" className="text-muted-foreground">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 py-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {upcomingClasses.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{cls.course}</p>
                            <p className="text-sm text-muted-foreground">
                              {cls.room} &bull; {cls.time}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{cls.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Recent Attendance</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/attendance" className="text-muted-foreground">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 py-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentAttendance.map((record) => {
                      const config = statusConfig[record.status]
                      return (
                        <div key={record.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <config.icon
                                className={`h-5 w-5 ${
                                  record.status === "present"
                                    ? "text-green-600"
                                    : record.status === "late"
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{record.course}</p>
                              <p className="text-sm text-muted-foreground">{record.date}</p>
                            </div>
                          </div>
                          <Badge className={config.className}>{config.label}</Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  {user?.role === "admin" && "Administrative actions"}
                  {user?.role === "mentor" && "Manage your classes and attendance"}
                  {user?.role === "student" && "Access your schedule and records"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant={"primary" in action ? "default" : "outline"}
                      className="justify-start h-auto py-3"
                      asChild
                    >
                      <Link href={action.href}>
                        <action.icon className="mr-3 h-5 w-5" />
                        {action.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/notifications" className="text-muted-foreground">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 py-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <notif.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
