/**
 * Schedule Service - API calls for courses, classes, and enrollments
 */
import api from './api';

// Types
export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseCreate {
  code: string;
  name: string;
  description?: string;
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
  class_id: string;
  enrolled_at: string;
}

export interface EnrollmentCreate {
  student_id: string;
  class_id: string;
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
