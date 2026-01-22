// ============================================================
// NOTIFICATIONS PAGE
// System Admin page for viewing and managing notifications
// ============================================================

import { useEffect, useState } from 'react';
import { NotificationService } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import type { Notification, NotificationType } from '../../types/notification';
import { Button } from '../../components/Button/Button';
import { MainLayout } from '../../components/Layout/MainLayout';
import './Notifications.css';

export function Notifications() {
    const { userProfile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const [markingId, setMarkingId] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        loadNotifications();
    }, []);

    // Load notifications
    const loadNotifications = async () => {
        setLoading(true);
        try {
            // For System Admin, load all notifications (global)
            const data = await NotificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark single notification as read
    const handleMarkAsRead = async (notificationId: string) => {
        setMarkingId(notificationId);
        try {
            await NotificationService.markAsRead(notificationId);
            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        } finally {
            setMarkingId(null);
        }
    };

    // Mark all notifications as read
    const handleMarkAllAsRead = async () => {
        setMarkingAll(true);
        try {
            await NotificationService.markAllAsRead();
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setMarkingAll(false);
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case 'info':
                return <InfoIcon />;
            case 'warning':
                return <WarningIcon />;
            case 'success':
                return <SuccessIcon />;
            case 'error':
                return <ErrorIcon />;
            case 'system':
                return <SystemIcon />;
            default:
                return <InfoIcon />;
        }
    };

    // Get notification type class
    const getNotificationTypeClass = (type: NotificationType) => {
        return `notification-type--${type}`;
    };

    // Format date for display
    const formatDate = (timestamp: Notification['createdAt']) => {
        if (!timestamp) return 'Unknown';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string);
            return date.toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Unknown';
        }
    };

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Check if user has permission
    const isSystemAdmin = userProfile?.role === 'System Admin' || userProfile?.role?.toLowerCase() === 'system admin';

    if (!isSystemAdmin) {
        return (
            <MainLayout>
                <div className="notifications-access-denied">
                    <div className="notifications-access-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h2>Access Denied</h2>
                    <p>You do not have permission to view this page.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="notifications-header animate-slide-down">
                <div className="notifications-header-content">
                    <h1 className="notifications-title">Notifications</h1>
                    <p className="notifications-subtitle">
                        View and manage system notifications
                        {unreadCount > 0 && (
                            <span className="notifications-unread-badge">
                                {unreadCount} unread
                            </span>
                        )}
                    </p>
                </div>
                <div className="notifications-header-actions">
                    <Button variant="secondary" onClick={loadNotifications} disabled={loading}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Refresh
                    </Button>
                    {unreadCount > 0 && (
                        <Button
                            variant="primary"
                            onClick={handleMarkAllAsRead}
                            loading={markingAll}
                            disabled={markingAll}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 11 12 14 22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            Mark All as Read
                        </Button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="notifications-container animate-scale-in">
                {loading ? (
                    <div className="notifications-loading">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="notification-item notification-item--loading">
                                <div className="skeleton notification-skeleton--icon" />
                                <div className="notification-content">
                                    <div className="skeleton notification-skeleton--title" />
                                    <div className="skeleton notification-skeleton--message" />
                                    <div className="skeleton notification-skeleton--date" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notifications-empty">
                        <div className="notifications-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <p className="notifications-empty-text">No notifications</p>
                        <p className="notifications-empty-hint">
                            System notifications will appear here when there are updates
                        </p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.isRead ? 'notification-item--unread' : ''} ${getNotificationTypeClass(notification.type)}`}
                            >
                                <div className={`notification-icon ${getNotificationTypeClass(notification.type)}`}>
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-header">
                                        <h3 className="notification-title">{notification.title}</h3>
                                        <span className={`notification-type-badge ${getNotificationTypeClass(notification.type)}`}>
                                            {notification.type}
                                        </span>
                                    </div>
                                    <p className="notification-message">{notification.message}</p>
                                    <div className="notification-meta">
                                        <span className="notification-date">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                        {notification.recipientRole && (
                                            <span className="notification-role">
                                                For: {notification.recipientRole}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="notification-actions">
                                    {!notification.isRead && (
                                        <button
                                            className="notification-action-btn"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            disabled={markingId === notification.id}
                                            title="Mark as read"
                                        >
                                            {markingId === notification.id ? (
                                                <span className="notification-action-loading" />
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                {!loading && notifications.length > 0 && (
                    <div className="notifications-footer">
                        <span className="notifications-count">
                            Showing <strong>{notifications.length}</strong> notification{notifications.length !== 1 ? 's' : ''}
                            {unreadCount > 0 && ` (${unreadCount} unread)`}
                        </span>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

// Icon Components
function InfoIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}

function WarningIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function SuccessIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function ErrorIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    );
}

function SystemIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    );
}
