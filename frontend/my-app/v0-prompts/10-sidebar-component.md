# v0 Prompt: Sidebar Navigation Component

Create a professional sidebar navigation component for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Requirements

### Layout Structure
```
┌─────────────────────┐
│ [Logo] AttendanceAI │
├─────────────────────┤
│                     │
│ 📊 Dashboard        │
│ 📚 Courses     *    │
│ 🏫 Classes          │
│ ✅ Attendance       │
│ 📷 Face Enrollment *│
│ 🔔 Notifications (3)│
│                     │
├─────────────────────┤
│ ⚙️ Settings         │
│ 🚪 Logout           │
├─────────────────────┤
│ ┌────┐              │
│ │ JS │ John Smith   │
│ └────┘ Student      │
└─────────────────────┘

* = Role-specific items
```

### Features
1. **Collapsible** - Can collapse to icons only
2. **Role-based** - Shows different items per role
3. **Active state** - Highlights current page
4. **Notification badge** - Shows unread count
5. **User profile** - Shows at bottom
6. **Mobile drawer** - Becomes drawer on mobile

### Component Code
```tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks';
import {
  LayoutDashboard, BookOpen, School, CheckSquare,
  Camera, Bell, Settings, LogOut, ChevronLeft,
  ChevronRight, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('student' | 'mentor' | 'admin')[];
  badge?: number;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Courses', href: '/courses', icon: BookOpen, roles: ['admin'] },
  { title: 'Classes', href: '/classes', icon: School },
  { title: 'Attendance', href: '/attendance', icon: CheckSquare },
  { title: 'Face Enrollment', href: '/face-enrollment', icon: Camera, roles: ['student', 'admin'] },
  { title: 'Notifications', href: '/notifications', icon: Bell },
];

const bottomItems: NavItem[] = [
  { title: 'Settings', href: '/profile', icon: Settings },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const filteredNavItems = navItems.filter(
    item => !item.roles || item.roles.includes(user?.role as any)
  );

  const NavLink = ({ item, collapsed }: { item: NavItem; collapsed: boolean }) => {
    const isActive = location.pathname === item.href;
    const showBadge = item.href === '/notifications' && unreadCount > 0;

    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground font-medium",
          collapsed && "justify-center px-2"
        )}
        onClick={() => setIsMobileOpen(false)}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {showBadge && (
              <Badge className="h-5 min-w-5 px-1.5">{unreadCount}</Badge>
            )}
          </>
        )}
        {collapsed && showBadge && (
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
        )}
      </Link>
    );
  };

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-6 border-b",
        collapsed && "justify-center px-2"
      )}>
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <CheckSquare className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg">AttendanceAI</span>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavItems.map(item => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t space-y-1">
        {bottomItems.map(item => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
        
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-colors",
            "hover:bg-destructive/10 hover:text-destructive text-muted-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className={cn(
        "px-3 py-4 border-t",
        collapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle (Desktop) */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm hidden lg:flex"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r bg-card relative transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background z-40 flex items-center px-4">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2 ml-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <CheckSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">AttendanceAI</span>
        </div>
      </div>

      {/* Mobile Content Padding */}
      <div className="lg:hidden h-14" />
    </>
  );
}
```

### Navigation Items by Role
| Item | Student | Mentor | Admin |
|------|---------|--------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Courses | ❌ | ❌ | ✅ |
| Classes | ✅ | ✅ | ✅ |
| Attendance | ✅ | ✅ | ✅ |
| Face Enrollment | ✅ | ❌ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ |

### Visual Design
- Clean, minimal design
- Subtle hover states
- Clear active state indication
- Smooth collapse animation
- Notification badge stands out

### Responsive Behavior
- **Desktop (lg+)**: Fixed sidebar, collapsible
- **Mobile (<lg)**: Hidden, opens as drawer from hamburger menu
- Mobile header shows logo and menu button

### Accessibility
- Keyboard navigable
- Focus indicators
- ARIA labels for collapsed state
- Screen reader friendly

Generate a complete sidebar component with role-based navigation, collapsible state, and mobile drawer.
