"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import {
  LayoutDashboard,
  BookOpen,
  School,
  CheckSquare,
  Camera,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

type Role = "student" | "mentor" | "admin"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: Role[]
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Courses", href: "/courses", icon: BookOpen, roles: ["admin"] },
  { title: "Classes", href: "/classes", icon: School },
  { title: "Attendance", href: "/attendance", icon: CheckSquare },
  { title: "Face Enrollment", href: "/face-enrollment", icon: Camera, roles: ["student", "admin"] },
  { title: "Notifications", href: "/notifications", icon: Bell },
]

const bottomItems: NavItem[] = [{ title: "Settings", href: "/profile", icon: Settings }]

export function AppSidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()

  const showFull = isExpanded || isHovered

  const filteredNavItems = navItems.filter((item) => !item.roles || item.roles.includes(user?.role as Role))

  const NavLink = ({ item, collapsed }: { item: NavItem; collapsed: boolean }) => {
    const isActive = pathname === item.href
    const showBadge = item.href === "/notifications" && unreadCount > 0

    return (
      <Link
        href={item.href}
        className={cn(
          "relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          collapsed && "justify-center px-2",
        )}
        onClick={() => setIsMobileOpen(false)}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 whitespace-nowrap">{item.title}</span>
            {showBadge && (
              <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </>
        )}
        {collapsed && showBadge && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />}
      </Link>
    )
  }

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-6 border-b border-sidebar-border",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <CheckSquare className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && <span className="font-bold text-lg whitespace-nowrap">AttendanceAI</span>}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <ThemeToggle collapsed={collapsed} />

        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}

        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-colors",
            "hover:bg-destructive/10 hover:text-destructive text-muted-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className={cn("px-3 py-4 border-t border-sidebar-border", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-sm">
              {user?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
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
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar relative transition-all duration-300 h-screen sticky top-0",
          showFull ? "w-64" : "w-16",
        )}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <SidebarContent collapsed={!showFull} />
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-sm hidden lg:flex z-10"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </aside>

      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b border-sidebar-border bg-sidebar z-40 flex items-center px-4">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 ml-2">
          <div className="h-7 w-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <CheckSquare className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold">AttendanceAI</span>
        </div>
      </div>

      {/* Mobile Content Padding */}
      <div className="lg:hidden h-14" />
    </>
  )
}
