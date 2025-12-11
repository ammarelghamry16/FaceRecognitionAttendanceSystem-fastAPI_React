/**
 * Shared TypeScript types
 */

// Re-export service types
export type { User, LoginCredentials, AuthResponse, RegisterData, ChangePasswordData } from '@/services/authService';
export type { Course, CourseCreate, Class, ClassCreate, Enrollment, EnrollmentCreate } from '@/services/scheduleService';
export type { Notification, NotificationCreate, NotificationCounts } from '@/services/notificationService';
export type { 
  AttendanceSession, 
  AttendanceRecord, 
  SessionStats, 
  StudentStats,
  StartSessionRequest,
  ManualAttendanceRequest 
} from '@/services/attendanceService';
export type { 
  EnrollmentResponse, 
  RecognitionResponse, 
  EnrollmentStatus 
} from '@/services/aiService';

// UI Types
export type UserRole = 'student' | 'mentor' | 'admin';

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type ClassState = 'active' | 'inactive' | 'completed';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type SessionState = 'inactive' | 'active' | 'completed' | 'cancelled';

// Navigation
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

// Dashboard Stats
export interface DashboardStats {
  totalClasses: number;
  attendanceRate: number;
  upcomingClasses: number;
  unreadNotifications: number;
}

// Table/List Props
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

// Form States
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
