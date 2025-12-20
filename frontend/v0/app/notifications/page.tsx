"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useNotifications, type Notification } from "@/hooks/use-notifications"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Square,
  Ban,
  Calendar,
  UserPlus,
  Check,
  X,
  ChevronDown,
  CheckCheck,
  Loader2,
  AlertCircle,
} from "lucide-react"

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getNotificationConfig(type: Notification["type"]) {
  const configs: Record<Notification["type"], { icon: typeof CheckCircle; bgColor: string; iconColor: string }> = {
    attendance_marked: {
      icon: CheckCircle,
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    attendance_late: {
      icon: Clock,
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    attendance_absent: {
      icon: XCircle,
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
    session_started: {
      icon: Play,
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    session_ended: {
      icon: Square,
      bgColor: "bg-gray-100 dark:bg-gray-800/50",
      iconColor: "text-gray-600 dark:text-gray-400",
    },
    class_cancelled: {
      icon: Ban,
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
    schedule_updated: {
      icon: Calendar,
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    enrollment_confirmed: {
      icon: UserPlus,
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    system: {
      icon: Bell,
      bgColor: "bg-gray-100 dark:bg-gray-800/50",
      iconColor: "text-gray-600 dark:text-gray-400",
    },
  }

  return configs[type] || configs.system
}

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const config = getNotificationConfig(notification.type)
  const Icon = config.icon

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        !notification.is_read && "border-l-4 border-l-primary bg-primary/5",
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Icon */}
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{notification.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(notification.created_at)}
              </span>
            </div>

            {/* Additional data (if any) */}
            {notification.data?.class_name && (
              <Badge variant="outline" className="mt-2">
                {notification.data.class_name}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-start gap-1">
            {!notification.is_read && (
              <Button variant="ghost" size="icon" onClick={() => onMarkRead(notification.id)} title="Mark as read">
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onDelete(notification.id)} title="Delete">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth()
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications()

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [pageLoading, setPageLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read
    if (filter === "read") return n.is_read
    return true
  })

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    await loadMore()
    setIsLoadingMore(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to view notifications.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with your attendance and class activities</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Real-time Connection Indicator */}
              <div className="flex items-center gap-2 text-sm">
                <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
                <span className="text-muted-foreground">{isConnected ? "Live updates active" : "Reconnecting..."}</span>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && <Badge className="ml-2 bg-primary text-primary-foreground">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Notifications List */}
          {pageLoading || isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {filter === "unread"
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet. They'll appear here when you receive them."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Load More
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
