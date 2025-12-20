"use client"

import { useState, useCallback } from "react"

export interface Notification {
  id: string
  type:
    | "attendance_marked"
    | "attendance_late"
    | "attendance_absent"
    | "session_started"
    | "session_ended"
    | "class_cancelled"
    | "schedule_updated"
    | "enrollment_confirmed"
    | "system"
  title: string
  message: string
  is_read: boolean
  created_at: string
  data?: {
    class_name?: string
    course_code?: string
  }
}

// Demo notifications
const demoNotifications: Notification[] = [
  {
    id: "1",
    type: "attendance_marked",
    title: "Attendance Confirmed",
    message: "Your attendance for CS101 has been marked as present.",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    data: { class_name: "CS101 - Lecture", course_code: "CS101" },
  },
  {
    id: "2",
    type: "session_started",
    title: "Session Started",
    message: "Attendance session for MATH201 has started. Please mark your attendance.",
    is_read: false,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    data: { class_name: "MATH201 - Lecture", course_code: "MATH201" },
  },
  {
    id: "3",
    type: "attendance_late",
    title: "Late Attendance",
    message: "You were marked late for PHY101 Lab.",
    is_read: false,
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    data: { class_name: "PHY101 - Lab", course_code: "PHY101" },
  },
  {
    id: "4",
    type: "schedule_updated",
    title: "Schedule Change",
    message: "The schedule for ENG102 has been updated. New time: 2:00 PM.",
    is_read: true,
    created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    data: { class_name: "ENG102 - Lecture", course_code: "ENG102" },
  },
  {
    id: "5",
    type: "class_cancelled",
    title: "Class Cancelled",
    message: "Today's CHEM101 lecture has been cancelled due to unforeseen circumstances.",
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    data: { class_name: "CHEM101 - Lecture", course_code: "CHEM101" },
  },
  {
    id: "6",
    type: "enrollment_confirmed",
    title: "Enrollment Confirmed",
    message: "You have been successfully enrolled in BIO201 - Genetics.",
    is_read: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
    data: { class_name: "BIO201 - Genetics", course_code: "BIO201" },
  },
  {
    id: "7",
    type: "session_ended",
    title: "Session Ended",
    message: "The attendance session for CS101 has ended.",
    is_read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    data: { class_name: "CS101 - Lecture", course_code: "CS101" },
  },
]

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const loadMore = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setHasMore(false)
    setIsLoading(false)
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  }
}
