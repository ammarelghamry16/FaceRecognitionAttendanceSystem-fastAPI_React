/**
 * Face Enrollment hook for managing face registration
 */
import { useState, useCallback } from 'react';
import { aiApi } from '@/services';
import type { EnrollmentStatus } from '@/services';

interface UseFaceEnrollmentReturn {
  enrollmentStatus: EnrollmentStatus | null;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  checkEnrollmentStatus: (userId: string) => Promise<void>;
  enrollFace: (userId: string, imageFile: File) => Promise<boolean>;
  enrollMultipleFaces: (userId: string, imageFiles: File[]) => Promise<boolean>;
  enrollFaceFromCamera: (userId: string, imageDataUrl: string) => Promise<boolean>;
  deleteEnrollment: (userId: string) => Promise<boolean>;
  clearMessages: () => void;
}

export function useFaceEnrollment(): UseFaceEnrollmentReturn {
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const checkEnrollmentStatus = useCallback(async (userId: string) => {
    setIsLoading(true);
    clearMessages();
    try {
      const status = await aiApi.getEnrollmentStatus(userId);
      setEnrollmentStatus(status);
    } catch (err) {
      console.error('Failed to check enrollment status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clearMessages]);

  const enrollFace = useCallback(async (userId: string, imageFile: File) => {
    setIsLoading(true);
    clearMessages();
    try {
      const result = await aiApi.enrollFace(userId, imageFile);
      if (result.success) {
        setSuccess(result.message);
        setEnrollmentStatus({
          user_id: userId,
          is_enrolled: true,
          encodings_count: result.encodings_count,
        });
        return true;
      } else {
        setError(result.message);
        return false;
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to enroll face';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearMessages]);

  const enrollMultipleFaces = useCallback(async (userId: string, imageFiles: File[]) => {
    setIsLoading(true);
    clearMessages();
    try {
      const result = await aiApi.enrollMultiple(userId, imageFiles);
      if (result.success) {
        setSuccess(result.message);
        setEnrollmentStatus({
          user_id: userId,
          is_enrolled: true,
          encodings_count: result.encodings_count,
        });
        return true;
      } else {
        setError(result.message);
        return false;
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to enroll faces';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearMessages]);

  const enrollFaceFromCamera = useCallback(async (userId: string, imageDataUrl: string) => {
    setIsLoading(true);
    clearMessages();
    try {
      const result = await aiApi.enrollFaceBase64(userId, imageDataUrl);
      if (result.success) {
        setSuccess(result.message);
        setEnrollmentStatus({
          user_id: userId,
          is_enrolled: true,
          encodings_count: result.encodings_count,
        });
        return true;
      } else {
        setError(result.message);
        return false;
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to enroll face';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearMessages]);

  const deleteEnrollment = useCallback(async (userId: string) => {
    setIsLoading(true);
    clearMessages();
    try {
      await aiApi.deleteEnrollment(userId);
      setSuccess('Face enrollment deleted successfully');
      setEnrollmentStatus({
        user_id: userId,
        is_enrolled: false,
        encodings_count: 0,
      });
      return true;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete enrollment';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearMessages]);

  return {
    enrollmentStatus,
    isLoading,
    error,
    success,
    checkEnrollmentStatus,
    enrollFace,
    enrollMultipleFaces,
    enrollFaceFromCamera,
    deleteEnrollment,
    clearMessages,
  };
}

export default useFaceEnrollment;
