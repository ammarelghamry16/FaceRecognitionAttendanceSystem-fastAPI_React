/**
 * Schedule Service - API calls for courses, classes, and enrollments
 */
import api from './api';

// Types
export interface MentorInfo {
  id: string;
  full_name: string;
  email: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  mentor_ids: string[];
  mentors: MentorInfo[];
  created_at: string;
  updated_at: string;
}

export interface CourseCreate {
  code: string;
  name: string;
  description?: string;
  mentor_ids?: string[];
}

export interface Class {
  id: string;
  course_id: string;
  mentor_id?: string;
  name: string;
  room_number: string;
  day_of_week: string;
  schedule_time: string;
  state: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface ClassCreate {
  course_id: string;
  mentor_id?: string;
  name: string;
  room_number: string;
  day_of_week: string;
  schedule_time: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  student_name?: string;
  student_readable_id?: string;
  class_id: string;
  enrolled_at: string;
}

export interface EnrollmentCreate {
  student_id: string;
  class_id: string;
}

// Conflict checking types
export interface ClassConflict {
  id: string;
  name: string;
  room_number: string;
  day_of_week: string;
  schedule_time: string;
  course_name?: string;
}

export interface ConflictCheckResult {
  room_conflicts: ClassConflict[];
  mentor_conflicts: ClassConflict[];
  has_conflicts: boolean;
}

export interface CreateWithValidationResult {
  success: boolean;
  class: Class | null;
  conflicts: ConflictCheckResult | null;
}

// Course API
export const courseApi = {
  getAll: (skip = 0, limit = 100) =>
    api.get<Course[]>('/api/schedule/courses', { params: { skip, limit } }),

  getById: (id: string) =>
    api.get<Course>(`/api/schedule/courses/${id}`),

  create: (data: CourseCreate) =>
    api.post<Course>('/api/schedule/courses', data),

  update: (id: string, data: Partial<CourseCreate>) =>
    api.put<Course>(`/api/schedule/courses/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/schedule/courses/${id}`),

  // Course mentor management
  getMentors: (courseId: string) =>
    api.get<MentorInfo[]>(`/api/schedule/courses/${courseId}/mentors`),

  assignMentor: (courseId: string, mentorId: string) =>
    api.post(`/api/schedule/courses/${courseId}/mentors`, { mentor_id: mentorId }),

  removeMentor: (courseId: string, mentorId: string) =>
    api.delete(`/api/schedule/courses/${courseId}/mentors/${mentorId}`),
};

// Class API
export const classApi = {
  getAll: (skip = 0, limit = 100) =>
    api.get<Class[]>('/api/schedule/classes', { params: { skip, limit } }),

  getById: (id: string) =>
    api.get<Class>(`/api/schedule/classes/${id}`),

  create: (data: ClassCreate) =>
    api.post<Class>('/api/schedule/classes', data),

  update: (id: string, data: Partial<ClassCreate>) =>
    api.put<Class>(`/api/schedule/classes/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/schedule/classes/${id}`),

  // Conflict checking
  checkConflicts: (params: {
    room_number: string;
    day_of_week: string;
    schedule_time: string;
    mentor_id?: string;
    duration_minutes?: number;
    exclude_class_id?: string;
  }) =>
    api.post<ConflictCheckResult>('/api/schedule/classes/check-conflicts', null, { params }),

  createWithValidation: (data: ClassCreate, duration_minutes = 90) =>
    api.post<CreateWithValidationResult>('/api/schedule/classes/create-with-validation', data, {
      params: { duration_minutes }
    }),

  // Schedule filtering
  getByStudent: (studentId: string, skip = 0, limit = 100) =>
    api.get<Class[]>(`/api/schedule/schedule/student/${studentId}`, { params: { skip, limit } }),

  getByMentor: (mentorId: string, skip = 0, limit = 100) =>
    api.get<Class[]>(`/api/schedule/schedule/mentor/${mentorId}`, { params: { skip, limit } }),

  getFullSchedule: (skip = 0, limit = 100) =>
    api.get<Class[]>('/api/schedule/schedule/full', { params: { skip, limit } }),

  getByDay: (day: string) =>
    api.get<Class[]>(`/api/schedule/schedule/day/${day}`),

  getByRoom: (roomNumber: string) =>
    api.get<Class[]>(`/api/schedule/schedule/room/${roomNumber}`),
};

// Enrollment API
export const enrollmentApi = {
  enroll: (data: EnrollmentCreate) =>
    api.post<Enrollment>('/api/schedule/enrollments', data),

  unenroll: (studentId: string, classId: string) =>
    api.delete(`/api/schedule/enrollments/${studentId}/${classId}`),

  getByStudent: (studentId: string) =>
    api.get<Enrollment[]>(`/api/schedule/enrollments/student/${studentId}`),

  getByClass: (classId: string) =>
    api.get<Enrollment[]>(`/api/schedule/enrollments/class/${classId}`),

  getClassCount: (classId: string) =>
    api.get<number>(`/api/schedule/enrollments/class/${classId}/count`),
};
