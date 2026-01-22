// ============================================================
// NOTIFICATION TYPES
// Types for system notifications and alerts
// ============================================================

import { Timestamp } from 'firebase/firestore';
import type { UserRole } from './user';

/**
 * Type of notification
 */
export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'system';

/**
 * Notification interface
 * Represents a system notification that can be global or company-specific
 */
export interface Notification {
    /** Unique identifier for the notification */
    id: string;

    /** Type of notification (affects styling and priority) */
    type: NotificationType;

    /** Short title for the notification */
    title: string;

    /** Full notification message */
    message: string;

    /** Company ID this notification is for (null for global notifications) */
    companyId: string | null;

    /** Timestamp when the notification was created */
    createdAt: Timestamp;

    /** Whether the notification has been read */
    isRead: boolean;

    /** Role(s) this notification is intended for (null for all roles) */
    recipientRole: UserRole | null;
}

/**
 * Data required to create a new notification
 */
export interface CreateNotificationData {
    /** Type of notification */
    type: NotificationType;

    /** Short title for the notification */
    title: string;

    /** Full notification message */
    message: string;

    /** Company ID this notification is for (optional, null for global) */
    companyId?: string | null;

    /** Role this notification is intended for (optional, null for all roles) */
    recipientRole?: UserRole | null;
}
