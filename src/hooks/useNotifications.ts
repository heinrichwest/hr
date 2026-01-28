// ============================================================
// USE NOTIFICATIONS HOOK
// Shared hook for loading and managing notifications across dashboards
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { NotificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';

interface UseNotificationsProps {
    companyId: string | null;
    userId: string | undefined;
    /** Auto-load notifications on mount */
    autoLoad?: boolean;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    loading: boolean;
    error: Error | null;
    loadNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

export function useNotifications({
    companyId,
    userId,
    autoLoad = true,
}: UseNotificationsProps): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadNotifications = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const userNotifications = await NotificationService.getUserNotifications(
                companyId,
                userId
            );
            setNotifications(userNotifications);
        } catch (err) {
            console.error('Failed to load notifications:', err);
            setError(err as Error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [companyId, userId]);

    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await NotificationService.markAsRead(notificationId);
            // Refresh notifications after marking as read
            await loadNotifications();
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            throw err;
        }
    }, [loadNotifications]);

    const markAllAsRead = useCallback(async () => {
        if (!userId) return;

        try {
            await NotificationService.markAllAsRead(companyId, userId);
            // Refresh notifications after marking all as read
            await loadNotifications();
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
            throw err;
        }
    }, [companyId, userId, loadNotifications]);

    // Auto-load notifications on mount if enabled
    useEffect(() => {
        if (autoLoad && userId) {
            loadNotifications();
        }
    }, [autoLoad, userId, loadNotifications]);

    return {
        notifications,
        loading,
        error,
        loadNotifications,
        markAsRead,
        markAllAsRead,
    };
}
