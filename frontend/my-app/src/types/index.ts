/**
 * Shared TypeScript types
 */

// Re-export service types
export type { User, LoginCredentials, AuthResponse } from '@/services/authService';
export type { Course, CourseCreate, Class, ClassCreate, Enrollment, EnrollmentCreate } from '@/services/scheduleService';
export type { Notification, NotificationCreate, NotificationCounts } from '@/services/notificationService';

// UI Types
export type UserRole = 'student' | 'mentor' | 'admin';

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type ClassState = 'active' | 'inactive' | 'completed';

// Navigation
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}
