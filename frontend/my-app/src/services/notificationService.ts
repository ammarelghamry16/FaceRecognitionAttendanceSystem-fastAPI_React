/**
 * Notification Service - API calls for notifications
 */
import api from './api';

// Types
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationCreate {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface BroadcastNotification {
  user_ids: string[];
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  skip: number;
  limit: number;
}

export interface NotificationCounts {
  total: number;
  unread: number;
}

// Notification API
export const notificationApi = {
  // Get notifications for a user
  getByUser: (userId: string, skip = 0, limit = 50) =>
    api.get<NotificationListResponse>(`/api/notifications/user/${userId}`, {
      params: { skip, limit },
    }),

  // Get unread notifications
  getUnread: (userId: string, skip = 0, limit = 50) =>
    api.get<Notification[]>(`/api/notifications/user/${userId}/unread`, {
      params: { skip, limit },
    }),

  // Get notification counts
  getCounts: (userId: string) =>
    api.get<NotificationCounts>(`/api/notifications/user/${userId}/count`),

  // Get single notification
  getById: (id: string) =>
    api.get<Notification>(`/api/notifications/${id}`),

  // Create notification
  create: (data: NotificationCreate) =>
    api.post<Notification>('/api/notifications', data),

  // Broadcast to multiple users
  broadcast: (data: BroadcastNotification) =>
    api.post<Notification[]>('/api/notifications/broadcast', data),

  // Mark as read
  markAsRead: (id: string) =>
    api.put<Notification>(`/api/notifications/${id}/read`),

  // Mark all as read
  markAllAsRead: (userId: string) =>
    api.put<{ marked_count: number }>(`/api/notifications/user/${userId}/read-all`),

  // Delete notification
  delete: (id: string) =>
    api.delete(`/api/notifications/${id}`),

  // Get supported notification types
  getTypes: () =>
    api.get<string[]>('/api/notifications/types'),

  // Check if user is connected via WebSocket
  isConnected: (userId: string) =>
    api.get<{ user_id: string; connected: boolean }>(`/api/notifications/user/${userId}/connected`),
};

// WebSocket URL helper
export const getWebSocketUrl = (userId: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const wsUrl = baseUrl.replace('http', 'ws');
  return `${wsUrl}/api/notifications/ws/${userId}`;
};
