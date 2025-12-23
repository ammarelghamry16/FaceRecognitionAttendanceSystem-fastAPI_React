/**
 * AI Service - Face recognition and enrollment API calls
 */
import api from './api';

// Types
export interface EnrollmentResponse {
  success: boolean;
  user_id: string;
  encodings_count: number;
  message: string;
}

export interface RecognitionResponse {
  recognized: boolean;
  user_id?: string;
  confidence?: number;
  distance?: number;
  message: string;
}

export interface EnrollmentStatus {
  user_id: string;
  is_enrolled: boolean;
  encodings_count: number;
}

export interface AttendanceRecognitionResponse {
  recognized: boolean;
  attendance_marked: boolean;
  user_id?: string;
  confidence?: number;
  status?: string;
  message?: string;
}

// AI API
export const aiApi = {
  // ==================== Enrollment ====================

  /**
   * Enroll a single face image for a user
   */
  enrollFace: async (userId: string, imageFile: File): Promise<EnrollmentResponse> => {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('image', imageFile);

    const response = await api.post<EnrollmentResponse>('/api/ai/enroll', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Enroll multiple face images for a user
   */
  enrollMultiple: async (userId: string, imageFiles: File[]): Promise<EnrollmentResponse> => {
    const formData = new FormData();
    formData.append('user_id', userId);
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post<EnrollmentResponse>('/api/ai/enroll/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Enroll face from base64 image data
   */
  enrollFaceBase64: async (userId: string, base64Image: string): Promise<EnrollmentResponse> => {
    // Convert base64 to blob
    const byteString = atob(base64Image.split(',')[1] || base64Image);
    const mimeString = base64Image.split(',')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], 'face.jpg', { type: mimeString });

    return aiApi.enrollFace(userId, file);
  },

  // ==================== Recognition ====================

  /**
   * Recognize a face from an image file
   */
  recognizeFace: async (imageFile: File): Promise<RecognitionResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post<RecognitionResponse>('/api/ai/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Recognize face and mark attendance in one call
   */
  recognizeForAttendance: async (
    sessionId: string,
    imageFile: File
  ): Promise<AttendanceRecognitionResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post<AttendanceRecognitionResponse>(
      `/api/ai/recognize/attendance/${sessionId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Recognize face from base64 image data
   */
  recognizeFaceBase64: async (base64Image: string): Promise<RecognitionResponse> => {
    // Convert base64 to blob
    const byteString = atob(base64Image.split(',')[1] || base64Image);
    const mimeString = base64Image.split(',')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], 'face.jpg', { type: mimeString });

    return aiApi.recognizeFace(file);
  },

  /**
   * Recognize face from base64 and mark attendance
   */
  recognizeForAttendanceBase64: async (
    sessionId: string,
    base64Image: string
  ): Promise<AttendanceRecognitionResponse> => {
    // Convert base64 to blob
    const byteString = atob(base64Image.split(',')[1] || base64Image);
    const mimeString = base64Image.split(',')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], 'face.jpg', { type: mimeString });

    return aiApi.recognizeForAttendance(sessionId, file);
  },

  // ==================== Management ====================

  /**
   * Get enrollment status for a user
   */
  getEnrollmentStatus: async (userId: string): Promise<EnrollmentStatus> => {
    const response = await api.get<EnrollmentStatus>(`/api/ai/enrollment/status/${userId}`);
    return response.data;
  },

  /**
   * Delete all face encodings for a user
   */
  deleteEnrollment: async (userId: string): Promise<{ deleted_count: number; message: string }> => {
    const response = await api.delete(`/api/ai/enrollment/${userId}`);
    return response.data;
  },
};

export default aiApi;
