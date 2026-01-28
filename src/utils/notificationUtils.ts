// ============================================================
// NOTIFICATION UTILITY FUNCTIONS
// ============================================================

import type { NotificationPriority } from '../types/notification';
import { AlertCircle, Bell, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Get HSL color string for notification priority
 * @param priority - Notification priority level
 * @returns HSL color string
 */
export function getPriorityColor(priority: NotificationPriority): string {
    switch (priority) {
        case 'high':
            return 'hsl(0, 84%, 60%)'; // Red
        case 'medium':
            return 'hsl(38, 92%, 50%)'; // Yellow/Amber
        case 'low':
            return 'hsl(160, 84%, 39%)'; // Green
        default:
            return 'hsl(220, 70%, 50%)'; // Default blue
    }
}

/**
 * Get icon component for notification priority
 * @param priority - Notification priority level
 * @returns Lucide icon component
 */
export function getPriorityIcon(priority: NotificationPriority): LucideIcon {
    switch (priority) {
        case 'high':
            return AlertCircle; // Red alert icon
        case 'medium':
            return Bell; // Yellow/amber bell icon
        case 'low':
            return CheckCircle; // Green check icon
        default:
            return Bell; // Default bell icon
    }
}
