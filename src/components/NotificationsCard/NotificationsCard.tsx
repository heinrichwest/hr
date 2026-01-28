// ============================================================
// NOTIFICATIONS CARD COMPONENT
// Dashboard widget for displaying recent notifications
// ============================================================

import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { Notification } from '../../types/notification';
import { getRelativeTime } from '../../utils/dateUtils';
import { getPriorityColor, getPriorityIcon } from '../../utils/notificationUtils';
import {
    Card,
    CardHeader,
    CardTitle,
    CardAction,
    CardContent,
    CardFooter,
} from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface NotificationsCardProps {
    /** Array of notifications to display (should be pre-filtered and limited to 5) */
    notifications: Notification[];
    /** Callback when a notification is marked as read */
    onMarkAsRead: (notificationId: string) => void;
    /** Callback when all notifications are marked as read */
    onMarkAllAsRead: () => void;
    /** Callback when card is closed */
    onClose: () => void;
    /** Whether notifications are currently loading */
    loading?: boolean;
}

export function NotificationsCard({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClose,
    loading = false,
}: NotificationsCardProps) {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Card
            className="max-w-full md:max-w-[400px] shadow-[0_2px_8px_hsl(0,0%,0%,0.1)]"
            aria-label="Notifications"
        >
            {/* Header */}
            <CardHeader>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardAction className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-sm font-medium transition-colors hover:underline"
                            style={{ color: 'hsl(220, 70%, 50%)' }}
                            aria-label="Mark all as read"
                        >
                            Mark All as Read
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[hsl(0,0%,0%,0.05)]"
                        aria-label="Close notifications"
                    >
                        <X className="h-4 w-4" style={{ color: 'hsl(0, 0%, 40%)' }} />
                    </button>
                </CardAction>
            </CardHeader>

            {/* Content */}
            <CardContent className="px-0">
                {loading ? (
                    <div className="space-y-3 px-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-[hsl(0,0%,90%)]" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 rounded bg-[hsl(0,0%,90%)]" />
                                    <div className="h-3 w-full rounded bg-[hsl(0,0%,90%)]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                        <p className="text-sm" style={{ color: 'hsl(0, 0%, 60%)' }}>
                            No notifications
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[400px]">
                        <div className="space-y-0">
                            {notifications.slice(0, 5).map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={onMarkAsRead}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>

            {/* Footer */}
            {!loading && notifications.length > 0 && (
                <CardFooter>
                    <Button
                        variant="outline"
                        className="w-full"
                        asChild
                    >
                        <Link to="/notifications">View All Notifications</Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

// ============================================================
// NOTIFICATION ITEM COMPONENT
// Individual notification list item
// ============================================================

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (notificationId: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const Icon = getPriorityIcon(notification.priority);
    const iconColor = getPriorityColor(notification.priority);
    const relativeTime = getRelativeTime(notification.createdAt);
    const isUnread = !notification.isRead;

    const handleClick = () => {
        if (isUnread) {
            onMarkAsRead(notification.id);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && isUnread) {
            e.preventDefault();
            onMarkAsRead(notification.id);
        }
    };

    return (
        <div
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`${notification.title}. ${isUnread ? 'Mark as read' : 'Read'}`}
            className="group cursor-pointer border-b border-[hsl(0,0%,90%)] px-6 py-3 transition-all last:border-b-0 hover:shadow-[0_2px_4px_hsl(0,0%,0%,0.08)]"
            style={{
                backgroundColor: isUnread ? 'hsl(220, 70%, 98%)' : 'transparent',
            }}
        >
            <div className="flex gap-3">
                {/* Icon */}
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full md:h-10 md:w-10"
                    style={{ backgroundColor: `${iconColor}15` }}
                >
                    <Icon
                        className="h-5 w-5"
                        style={{ color: iconColor }}
                        aria-hidden="true"
                    />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    {/* Title and Timestamp */}
                    <div className="mb-1 flex items-start justify-between gap-2">
                        <h4
                            className="text-sm leading-tight"
                            style={{
                                fontWeight: isUnread ? 600 : 400,
                                color: isUnread ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 10%)',
                                opacity: isUnread ? 1 : 0.6,
                            }}
                        >
                            {notification.title}
                        </h4>
                        <span
                            className="shrink-0 text-xs"
                            style={{
                                color: 'hsl(0, 0%, 60%)',
                                opacity: isUnread ? 1 : 0.6,
                            }}
                        >
                            {relativeTime}
                        </span>
                    </div>

                    {/* Description */}
                    <p
                        className="text-sm leading-snug"
                        style={{
                            color: 'hsl(0, 0%, 40%)',
                            opacity: isUnread ? 1 : 0.6,
                        }}
                    >
                        {notification.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
