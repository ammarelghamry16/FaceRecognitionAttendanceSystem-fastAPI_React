/**
 * Attendance hook for managing attendance sessions and records
 */
import { useState, useCallback } from 'react';
import { attendanceApi } from '@/services';
import type {
  AttendanceSession,
  AttendanceRecord,
  SessionStats,
  StudentStats,
} from '@/services';

interface UseAttendanceReturn {
  // Session management
  activeSession: AttendanceSession | null;
  isLoading: boolean;
  error: string | null;
  startSession: (classId: string, lateThreshold?: number) => Promise<AttendanceSession | null>;
  endSession: (sessionId: string) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  getActiveSession: (classId: string) => Promise<AttendanceSession | null>;
  
  // Records
  sessionRecords: AttendanceRecord[];
  fetchSessionRecords: (sessionId: string) => Promise<void>;
  markManualAttendance: (
    sessionId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
    reason?: string
  ) => Promise<void>;
  
  // Stats
  sessionStats: SessionStats | null;
  fetchSessionStats: (sessionId: string) => Promise<void>;
  studentStats: StudentStats | null;
  fetchStudentStats: (studentId: string) => Promise<void>;
}

export function useAttendance(): UseAttendanceReturn {
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (classId: string, lateThreshold = 15) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await attendanceApi.startSession({
        class_id: classId,
        late_threshold_minutes: lateThreshold,
      });
      setActiveSession(session);
      return session;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start session';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await attendanceApi.endSession(sessionId);
      setActiveSession(null);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to end session';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await attendanceApi.cancelSession(sessionId);
      setActiveSession(null);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to cancel session';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActiveSession = useCallback(async (classId: string) => {
    setIsLoading(true);
    try {
      const session = await attendanceApi.getActiveSession(classId);
      setActiveSession(session);
      return session;
    } catch {
      setActiveSession(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSessionRecords = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const records = await attendanceApi.getSessionRecords(sessionId);
      setSessionRecords(records);
    } catch (err) {
      console.error('Failed to fetch session records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markManualAttendance = useCallback(async (
    sessionId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
    reason?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const record = await attendanceApi.markManual({
        session_id: sessionId,
        student_id: studentId,
        status,
        reason,
      });
      setSessionRecords((prev) => {
        const existing = prev.findIndex((r) => r.student_id === studentId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = record;
          return updated;
        }
        return [...prev, record];
      });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to mark attendance';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSessionStats = useCallback(async (sessionId: string) => {
    try {
      const stats = await attendanceApi.getSessionStats(sessionId);
      setSessionStats(stats);
    } catch (err) {
      console.error('Failed to fetch session stats:', err);
    }
  }, []);

  const fetchStudentStats = useCallback(async (studentId: string) => {
    try {
      const stats = await attendanceApi.getStudentStats(studentId);
      setStudentStats(stats);
    } catch (err) {
      console.error('Failed to fetch student stats:', err);
    }
  }, []);

  return {
    activeSession,
    isLoading,
    error,
    startSession,
    endSession,
    cancelSession,
    getActiveSession,
    sessionRecords,
    fetchSessionRecords,
    markManualAttendance,
    sessionStats,
    fetchSessionStats,
    studentStats,
    fetchStudentStats,
  };
}

export default useAttendance;
