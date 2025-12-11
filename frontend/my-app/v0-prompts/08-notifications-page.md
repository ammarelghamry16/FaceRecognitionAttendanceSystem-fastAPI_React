# v0 Prompt: Notifications Page

Create a professional notifications page for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Requirements

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Notifications                        [Mark All Read]    │
├─────────────────────────────────────────────────────────┤
│ [All] [Unread (5)] [Read]                               │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔵 ✅ Attendance Confirmed                    2m ago│ │
│ │    Your attendance for CS101 has been marked       │ │
│ │    as present.                      [Mark Read] [×]│ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔵 🎓 Session Started                        15m ago│ │
│ │    Attendance session for MATH201 has started.     │ │
│ │    Please mark your attendance.     [Mark Read] [×]│ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │    ⚠️ Late Attendance                         1h ago│ │
│ │    You were marked late for PHY101 Lab.            │ │
│ │                                              [×]   │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    [Load More]                          │
└─────────────────────────────────────────────────────────┘
```

### Components to Build

#### 1. Page Header
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-3xl font-bold">Notifications</h1>
    <p className="text-muted-foreground">
      Stay updated with your attendance and class activities
    </p>
  </div>
  <div className="flex items-center gap-2">
    {unreadCount > 0 && (
      <Button variant="outline" onClick={markAllAsRead}>
        <CheckCheck className="h-4 w-4 mr-2" />
        Mark All Read
      </Button>
    )}
  </div>
</div>
```

#### 2. Filter Tabs
```tsx
<Tabs value={filter} onValueChange={setFilter} className="mb-6">
  <TabsList>
    <TabsTrigger value="all">
      All
      <Badge variant="secondary" className="ml-2">
        {notifications.length}
      </Badge>
    </TabsTrigger>
    <TabsTrigger value="unread">
      Unread
      {unreadCount > 0 && (
        <Badge className="ml-2 bg-primary">
          {unreadCount}
        </Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="read">Read</TabsTrigger>
  </TabsList>
</Tabs>
```

#### 3. Notification Card
```tsx
function NotificationCard({ notification, onMarkRead, onDelete }) {
  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;
  
  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      !notification.is_read && "border-l-4 border-l-primary bg-primary/5"
    )}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Icon */}
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
            config.bgColor
          )}>
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{notification.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onMarkRead(notification.id)}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(notification.id)}
              title="Delete"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 4. Notification Type Configuration
```tsx
function getNotificationConfig(type: string) {
  const configs = {
    attendance_marked: {
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    attendance_late: {
      icon: Clock,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    attendance_absent: {
      icon: XCircle,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    session_started: {
      icon: Play,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    session_ended: {
      icon: Square,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    class_cancelled: {
      icon: Ban,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    schedule_updated: {
      icon: Calendar,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    enrollment_confirmed: {
      icon: UserPlus,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    system: {
      icon: Bell,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
  };
  
  return configs[type] || configs.system;
}
```

#### 5. Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12">
  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
    <Bell className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-medium mb-1">No notifications</h3>
  <p className="text-sm text-muted-foreground text-center max-w-sm">
    {filter === 'unread' 
      ? "You're all caught up! No unread notifications."
      : "You don't have any notifications yet. They'll appear here when you receive them."}
  </p>
</div>
```

#### 6. Loading State
```tsx
<div className="space-y-4">
  {[...Array(5)].map((_, i) => (
    <Card key={i}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
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
```

#### 7. Load More Button
```tsx
{hasMore && (
  <div className="flex justify-center mt-6">
    <Button 
      variant="outline" 
      onClick={loadMore}
      disabled={isLoadingMore}
    >
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
```

#### 8. Real-time Connection Indicator
```tsx
<div className="flex items-center gap-2 text-sm">
  <span className={cn(
    "h-2 w-2 rounded-full",
    isConnected ? "bg-green-500" : "bg-red-500"
  )} />
  <span className="text-muted-foreground">
    {isConnected ? "Live updates active" : "Reconnecting..."}
  </span>
</div>
```

### Relative Time Formatting
```tsx
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
```

### API Integration
```tsx
import { useNotifications } from '@/hooks';

const {
  notifications,
  unreadCount,
  isLoading,
  error,
  isConnected,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = useNotifications();
```

### States to Handle
1. **Loading**: Skeleton cards
2. **Empty**: Empty state with message
3. **Loaded**: List of notification cards
4. **Filtering**: Filtered list based on tab
5. **Real-time**: New notifications appear at top
6. **Error**: Error alert with retry

### Animations
- New notifications slide in from top
- Deleted notifications fade out
- Mark as read transitions smoothly

### Code Structure
```tsx
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks';
import {
  Bell, CheckCircle, XCircle, Clock, Play, Square,
  Ban, Calendar, UserPlus, Check, X, ChevronDown,
  CheckCheck, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
```

### Responsive Design
- Cards are full width on all screens
- Actions stack on mobile if needed
- Tabs scroll horizontally on mobile

Generate a complete notifications page with filtering, real-time updates indicator, and proper state handling.
