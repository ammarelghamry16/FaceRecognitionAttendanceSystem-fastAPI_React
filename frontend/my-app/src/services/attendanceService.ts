/**
 * Attendance Service - API calls for attendance management
 */
import api from './api';

// Types
export interface AttendanceSession {
  id: string;
  class_id: string;
  started_by: string;
  ended_by?: string;
  state: 'inactive' | 'active' | 'completed' | 'cancelled';
  start_time: string;
  end_time?: string;
  late_threshold_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_at: string;
  confidence_score?: number;
  verification_method: 'face_recognition' | 'manual' | 'qr_code';
  is_manual_override: boolean;
  overridden_by?: string;
  override_reason?: string;
}

export interface SessionStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface StudentStats {
  total_sessions: number;
  present: number;
  late: number;
  absent: number;
  attendance_rate: number;
}

export interface StartSessionRequest {
  class_id: string;
  late_threshold_minutes?: number;
}

export interface ManualAttendanceRequest {
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  reason?: string;
}

// Attendance API
export const attendanceApi = {
  // ==================== Session Management ====================
  
  /**
   * Start a new attendance session
   */
  startSession: async (data: StartSessionRequest): Promise<AttendanceSession> => {
    const response = await api.post<AttendanceSession>('/api/attendance/sessions/start', data);
    return response.data;
  },

  /**
   * End an active session
   */
  endSession: async (sessionId: string): Promise<AttendanceSession> => {
    const response = await api.post<AttendanceSession>(`/api/attendance/sessions/${sessionId}/end`);
    return response.data;
  },

  /**
   * Cancel a session
   */
  cancelSession: async (sessionId: string): Promise<AttendanceSession> => {
    const response = await api.post<AttendanceSession>(`/api/attendance/sessions/${sessionId}/cancel`);
    return response.data;
  },

  /**
   * Get session by ID
   */
  getSession: async (sessionId: string): Promise<AttendanceSession> => {
    const response = await api.get<AttendanceSession>(`/api/attendance/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Get active session for a class
   */
  getActiveSession: async (classId: string): Promise<AttendanceSession | null> => {
    try {
      const response = await api.get<AttendanceSession>(`/api/attendance/sessions/class/${classId}/active`);
      return response.data;
    } catch (error: unknown) {
      if ((error as { response?: { status: number } }).response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get all sessions for a class
   */
  getClassSessions: async (classId: string): Promise<AttendanceSession[]> => {
    const response = await api.get<AttendanceSession[]>(`/api/attendance/sessions/class/${classId}`);
    return response.data;
  },

  // ==================== Attendance Marking ====================

  /**
   * Mark attendance manually
   */
  markManual: async (data: ManualAttendanceRequest): Promise<AttendanceRecord> => {
    const response = await api.post<AttendanceRecord>('/api/attendance/mark/manual', data);
    return response.data;
  },

  // ==================== Queries ====================

  /**
   * Get attendance records for a session
   */
  getSessionRecords: async (sessionId: string): Promise<AttendanceRecord[]> => {
    const response = await api.get<AttendanceRecord[]>(`/api/attendance/sessions/${sessionId}/records`);
    return response.data;
  },

  /**
   * Get session statistics
   */
  getSessionStats: async (sessionId: string): Promise<SessionStats> => {
    const response = await api.get<SessionStats>(`/api/attendance/sessions/${sessionId}/stats`);
    return response.data;
  },

  /**
   * Get student attendance history
   */
  getStudentHistory: async (studentId: string): Promise<AttendanceRecord[]> => {
    const response = await api.get<AttendanceRecord[]>(`/api/attendance/history/student/${studentId}`);
    return response.data;
  },

  /**
   * Get student attendance statistics
   */
  getStudentStats: async (studentId: string): Promise<StudentStats> => {
    const response = await api.get<StudentStats>(`/api/attendance/history/student/${studentId}/stats`);
    return response.data;
  },
};

export default attendanceApi;
