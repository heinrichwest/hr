// ============================================================
// NOTIFICATION TYPES
// Types for system notifications and alerts
// ============================================================

import { Timestamp } from 'firebase/firestore';

/**
 * Type of notification - specific categories for different notification purposes
 */
export type NotificationType =
    | 'leave_request'
    | 'announcement'
    | 'performance'
    | 'training'
    | 'attendance'
    | 'payroll_cutoff';

/**
 * Priority level of notification
 */
export type NotificationPriority = 'high' | 'medium' | 'low';

/**
 * Notification interface
 * Represents a user-specific or broadcast notification with tenant isolation
 */
export interface Notification {
    /** Unique identifier for the notification */
    id: string;

    /** Company ID this notification is for (null for System Admin global notifications) */
    companyId: string | null;

    /** User ID this notification is for, or 'ALL' for broadcast notifications */
    userId: string;

    /** Type of notification */
    type: NotificationType;

    /** Priority level (affects color coding: high=red, medium=yellow, low=green) */
    priority: NotificationPriority;

    /** Short title for the notification */
    title: string;

    /** Full notification description/message */
    description: string;

    /** Whether the notification has been read */
    isRead: boolean;

    /** Whether the underlying action has been completed (e.g., leave request approved) */
    isResolved: boolean;

    /** Whether the user has dismissed this notification */
    isDismissed: boolean;

    /** Timestamp when the notification was created */
    createdAt: Timestamp;

    /** Timestamp when the notification was resolved (optional) */
    resolvedAt?: Timestamp;

    /** Timestamp when the notification was archived (optional) */
    archivedAt?: Timestamp;

    /** Additional context-specific metadata */
    metadata?: {
        /** ID of related entity (e.g., leaveRequestId, employeeId) */
        relatedEntityId?: string;
        /** Type of related entity (e.g., 'leave_request', 'employee') */
        relatedEntityType?: string;
        /** Allow additional custom fields */
        [key: string]: unknown;
    };
}

/**
 * Data required to create a new notification
 */
export interface CreateNotificationData {
    /** Company ID this notification is for (null for System Admin global notifications) */
    companyId: string | null;

    /** User ID this notification is for, or 'ALL' for broadcast notifications */
    userId: string;

    /** Type of notification */
    type: NotificationType;

    /** Priority level (high, medium, low) */
    priority: NotificationPriority;

    /** Short title for the notification */
    title: string;

    /** Full notification description/message */
    description: string;

    /** Optional metadata for context-specific information */
    metadata?: {
        relatedEntityId?: string;
        relatedEntityType?: string;
        [key: string]: unknown;
    };
}
