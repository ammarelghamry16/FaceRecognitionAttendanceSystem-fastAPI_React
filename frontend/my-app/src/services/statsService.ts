/**
 * Stats Service - API calls for dashboard and statistics
 */
import api from './api';

export interface DashboardStats {
    total_courses: number;
    total_classes: number;
    total_students: number;
    total_mentors: number;
    total_admins: number;
    active_sessions: number;
    overall_attendance_rate: number;
    today_sessions: number;
    today_attendance_count: number;
}

export interface StudentStats {
    student_id: string;
    total_sessions: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendance_rate: number;
}

export interface ClassStats {
    class_id: string;
    class_name: string;
    total_sessions: number;
    total_enrolled: number;
    average_attendance_rate: number;
}

export interface UserCount {
    total: number;
    students: number;
    mentors: number;
    admins: number;
}

export const statsApi = {
    /**
     * Get aggregated dashboard statistics
     */
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await api.get<DashboardStats>('/api/stats/dashboard');
        return response.data;
    },

    /**
     * Get attendance statistics for a specific student
     */
    getStudentStats: async (studentId: string): Promise<StudentStats> => {
        const response = await api.get<StudentStats>(`/api/stats/student/${studentId}`);
        return response.data;
    },

    /**
     * Get attendance statistics for a specific class
     */
    getClassStats: async (classId: string): Promise<ClassStats> => {
        const response = await api.get<ClassStats>(`/api/stats/class/${classId}`);
        return response.data;
    },

    /**
     * Get count of users by role
     */
    getUserCount: async (): Promise<UserCount> => {
        const response = await api.get<UserCount>('/api/stats/users/count');
        return response.data;
    },
};

export default statsApi;
