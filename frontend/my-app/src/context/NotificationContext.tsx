/**
 * Notification Context - App-wide notification state with WebSocket
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notificationApi, getWebSocketUrl } from '@/services/notificationService';
import type { Notification } from '@/services/notificationService';
import { toast } from '@/hooks/useToast';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;

        setIsLoading(true);
        try {
            const response = await notificationApi.getByUser(user.id);
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unread_count || 0);
        } catch (err) {
            console.warn('Failed to fetch notifications:', err);
            // Demo mode - use empty array
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    // Mark single notification as read
    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Mark as read error:', err);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!user?.id) return;
        try {
            await notificationApi.markAllAsRead(user.id);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Mark all as read error:', err);
        }
    }, [user?.id]);

    // Delete notification
    const deleteNotification = useCallback(async (id: string) => {
        try {
            const notification = notifications.find((n) => n.id === id);
            await notificationApi.delete(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            if (notification && !notification.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Delete notification error:', err);
        }
    }, [notifications]);

    // WebSocket connection
    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            if (ws) {
                ws.close();
                setWs(null);
                setIsConnected(false);
            }
            return;
        }

        // Connect to WebSocket
        const wsUrl = getWebSocketUrl(user.id);
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            setIsConnected(true);
            console.log('WebSocket connected');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'notification') {
                    const newNotification = data.payload as Notification;
                    setNotifications((prev) => [newNotification, ...prev]);
                    setUnreadCount((prev) => prev + 1);

                    // Show toast notification
                    toast({
                        title: newNotification.title,
                        description: newNotification.message,
                        variant: newNotification.type.includes('absent') ? 'destructive' : 'default',
                    });

                    // Show browser notification if permitted
                    if (window.Notification && window.Notification.permission === 'granted') {
                        new window.Notification(newNotification.title, {
                            body: newNotification.message,
                            icon: '/favicon.ico',
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };

        socket.onclose = () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
        };

        socket.onerror = (error) => {
            console.warn('WebSocket error:', error);
            setIsConnected(false);
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, [isAuthenticated, user?.id]);

    // Fetch notifications on auth change
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchNotifications();

            // Request browser notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, user?.id, fetchNotifications]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isConnected,
                isLoading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
}
