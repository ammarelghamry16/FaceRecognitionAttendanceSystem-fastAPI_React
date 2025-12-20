/**
 * Sidebar Navigation Component - Mobile Responsive
 */
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotificationContext } from '@/context/NotificationContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarDays,
  Bell,
  LogOut,
  CheckSquare,
  Camera,
  Settings,
  ChevronLeft,
  ChevronRight,
  ScanFace,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('student' | 'mentor' | 'admin')[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Schedule',
    href: '/schedule',
    icon: CalendarDays,
  },
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpen,
    roles: ['admin'],
  },
  {
    title: 'Classes',
    href: '/classes',
    icon: Calendar,
    roles: ['admin', 'mentor'],
  },
  {
    title: 'Enrollments',
    href: '/enrollments',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: CheckSquare,
  },
  {
    title: 'Face Enrollment',
    href: '/face-enrollment',
    icon: Camera,
    roles: ['student', 'admin'],
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
];

const bottomItems: NavItem[] = [
  {
    title: 'Settings',
    href: '/profile',
    icon: Settings,
  },
];

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFull = isExpanded || isHovered;

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Handle hover with 150ms delay to prevent accidental expansion
  const handleMouseEnter = () => {
    if (!isExpanded) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(true);
      }, 150);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    logout();
    navigate('/login');
  };

  const NavLink = ({ item, mobile = false }: { item: NavItem; mobile?: boolean }) => {
    const isActive = location.pathname === item.href;
    // Show unread count for notifications
    const badgeCount = item.href === '/notifications' ? unreadCount : item.badge;
    const showText = mobile || showFull;

    return (
      <Link
        to={item.href}
        onClick={() => mobile && setIsMobileOpen(false)}
        className={cn(
          'relative flex items-center h-10 rounded-lg transition-colors',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
        )}
      >
        {/* Fixed icon container - always same width */}
        <div className="w-10 h-10 flex items-center justify-center shrink-0 relative">
          <item.icon className="h-5 w-5" />
          {/* Badge dot when collapsed */}
          {!showText && badgeCount && badgeCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </div>
        {/* Text that appears/disappears */}
        <div className={cn(
          'flex items-center gap-2 overflow-hidden transition-all duration-200',
          showText ? 'w-auto opacity-100 pr-3' : 'w-0 opacity-0'
        )}>
          <span className="whitespace-nowrap">{item.title}</span>
          {badgeCount && badgeCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
              {badgeCount > 99 ? '99+' : badgeCount}
            </Badge>
          )}
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <ScanFace className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold">AttendanceAI</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'md:hidden fixed top-14 left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
          {filteredNavItems.map((item) => (
            <NavLink key={item.href} item={item} mobile />
          ))}
        </nav>
        <div className="py-4 border-t border-sidebar-border space-y-1 px-3">
          <ThemeToggle collapsed={false} />
          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} mobile />
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center h-10 rounded-lg w-full transition-colors hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <LogOut className="h-5 w-5" />
            </div>
            <span>Logout</span>
          </button>
        </div>
        <div className="py-3 border-t border-sidebar-border px-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-sm">
                {getInitials(user?.first_name, user?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-sidebar-border bg-sidebar relative transition-all duration-300 h-screen',
          showFull ? 'w-64' : 'w-16'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className="flex items-center h-[72px] border-b border-sidebar-border">
          <div className="w-16 h-full flex items-center justify-center shrink-0">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <ScanFace className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
          </div>
          <div className={cn(
            'overflow-hidden transition-all duration-200',
            showFull ? 'w-auto opacity-100' : 'w-0 opacity-0'
          )}>
            <span className="font-bold text-lg whitespace-nowrap">AttendanceAI</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
          {filteredNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="py-4 border-t border-sidebar-border space-y-1 px-3">
          {/* Theme Toggle */}
          <ThemeToggle collapsed={!showFull} />

          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center h-10 rounded-lg w-full transition-colors',
              'hover:bg-destructive/10 hover:text-destructive text-muted-foreground'
            )}
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <LogOut className="h-5 w-5" />
            </div>
            <div className={cn(
              'overflow-hidden transition-all duration-200',
              showFull ? 'w-auto opacity-100' : 'w-0 opacity-0'
            )}>
              <span className="whitespace-nowrap">Logout</span>
            </div>
          </button>
        </div>

        {/* User Profile */}
        <div className="py-3 border-t border-sidebar-border">
          <div className="flex items-center">
            <div className="w-16 flex items-center justify-center shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-sm">
                  {getInitials(user?.first_name, user?.last_name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className={cn(
              'overflow-hidden transition-all duration-200',
              showFull ? 'w-auto opacity-100 pr-3' : 'w-0 opacity-0'
            )}>
              <p className="text-sm font-medium truncate whitespace-nowrap">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-sm z-10"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </aside>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
