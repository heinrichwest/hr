// ============================================================
// NOTIFICATIONS PAGE (REFACTORED)
// Multi-role accessible page for viewing and managing notifications
// Task Group 5: Refactored for user-specific notifications with pagination and filters
// ============================================================

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NotificationService } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import type { Notification, NotificationPriority } from '../../types/notification';
import { Button } from '../../components/Button/Button';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '../../components/ui/pagination';
import { getRelativeTime } from '../../utils/dateUtils';
import { getPriorityColor } from '../../utils/notificationUtils';
import './Notifications.css';

const ITEMS_PER_PAGE = 20;

export function Notifications() {
    const { userProfile, currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);

    // Get current page and filter from URL params
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const activeFilter = (searchParams.get('filter') || 'all') as 'all' | 'unread' | 'read';

    // Initial load
    useEffect(() => {
        loadNotifications();
    }, []);

    // Load notifications for current user
    const loadNotifications = async () => {
        if (!userProfile || !currentUser) return;

        setLoading(true);
        try {
            // Determine companyId based on role
            const companyId = userProfile.role === 'System Admin' ? null : (userProfile.companyId || null);

            // Load user-specific notifications
            const data = await NotificationService.getUserNotifications(companyId, currentUser.uid);
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
        if (!userProfile || !currentUser) return;

        setMarkingAll(true);
        try {
            const companyId = userProfile.role === 'System Admin' ? null : (userProfile.companyId || null);
            await NotificationService.markAllAsRead(companyId, currentUser.uid);
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setMarkingAll(false);
        }
    };

    // Seed demo notifications for testing
    const handleSeedDemoData = async () => {
        if (!userProfile || !currentUser) return;

        if (!window.confirm('This will create 12 demo notifications for testing. Continue?')) {
            return;
        }

        setSeeding(true);
        try {
            const companyId = userProfile.role === 'System Admin' ? null : (userProfile.companyId || null);
            await NotificationService.seedDemoNotifications(companyId, currentUser.uid);
            // Reload notifications after seeding
            await loadNotifications();
        } catch (error) {
            console.error('Failed to seed notifications:', error);
            alert('Failed to seed demo notifications. Check console for errors.');
        } finally {
            setSeeding(false);
        }
    };

    // Clear all notifications for testing
    const handleClearNotifications = async () => {
        if (!userProfile || !currentUser) return;

        if (!window.confirm('This will delete ALL your notifications. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const companyId = userProfile.role === 'System Admin' ? null : (userProfile.companyId || null);
            await NotificationService.clearDemoNotifications(companyId, currentUser.uid);
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
            alert('Failed to clear notifications. Check console for errors.');
        } finally {
            setLoading(false);
        }
    };

    // Filter notifications based on active filter
    const filteredNotifications = notifications.filter(n => {
        if (activeFilter === 'unread') return !n.isRead;
        if (activeFilter === 'read') return n.isRead;
        return true; // 'all' shows all (already filtered by service to exclude resolved/dismissed)
    });

    // Paginate filtered notifications
    const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    // Handle page change
    const handlePageChange = (page: number) => {
        setSearchParams({ page: page.toString(), filter: activeFilter });
    };

    // Handle filter tab change
    const handleFilterChange = (filter: string) => {
        setSearchParams({ page: '1', filter });
    };

    // Get notification icon based on priority
    const getNotificationIcon = (priority: NotificationPriority) => {
        const color = getPriorityColor(priority);

        switch (priority) {
            case 'high':
                return <ErrorIcon color={color} />;
            case 'medium':
                return <WarningIcon color={color} />;
            case 'low':
                return <SuccessIcon color={color} />;
            default:
                return <InfoIcon color={color} />;
        }
    };

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Get empty state message based on active filter
    const getEmptyStateMessage = () => {
        switch (activeFilter) {
            case 'unread':
                return 'No unread notifications';
            case 'read':
                return 'No read notifications';
            default:
                return 'No notifications to display';
        }
    };

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="notifications-header animate-slide-down">
                <div className="notifications-header-content">
                    <h1 className="notifications-title">Notifications</h1>
                    <p className="notifications-subtitle">
                        View and manage your notifications
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
                    {/* Demo data buttons - for testing */}
                    <Button
                        variant="secondary"
                        onClick={handleSeedDemoData}
                        disabled={seeding || loading}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                        {seeding ? 'Seeding...' : 'Seed Demo Data'}
                    </Button>
                    {notifications.length > 0 && (
                        <Button
                            variant="secondary"
                            onClick={handleClearNotifications}
                            disabled={loading}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="notifications-tabs animate-scale-in">
                <Tabs value={activeFilter} onValueChange={handleFilterChange}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">Unread</TabsTrigger>
                        <TabsTrigger value="read">Read</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        {/* Content is rendered below */}
                    </TabsContent>
                    <TabsContent value="unread">
                        {/* Content is rendered below */}
                    </TabsContent>
                    <TabsContent value="read">
                        {/* Content is rendered below */}
                    </TabsContent>
                </Tabs>
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
                ) : paginatedNotifications.length === 0 ? (
                    <div className="notifications-empty">
                        <div className="notifications-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <p className="notifications-empty-text">{getEmptyStateMessage()}</p>
                        <p className="notifications-empty-hint">
                            {activeFilter === 'all'
                                ? 'System notifications will appear here when there are updates'
                                : 'Try switching to a different filter tab'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="notifications-list">
                            {paginatedNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.isRead ? 'notification-item--unread' : ''} notification-priority--${notification.priority}`}
                                >
                                    <div
                                        className={`notification-icon notification-priority--${notification.priority}`}
                                        style={{ color: getPriorityColor(notification.priority) }}
                                    >
                                        {getNotificationIcon(notification.priority)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-header">
                                            <h3 className="notification-title">{notification.title}</h3>
                                            <span className="notification-timestamp">
                                                {getRelativeTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="notification-description">{notification.description}</p>
                                    </div>
                                    <div className="notification-actions">
                                        {!notification.isRead && (
                                            <button
                                                className="notification-action-btn"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                disabled={markingId === notification.id}
                                                title="Mark as read"
                                                aria-label="Mark as read"
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="notifications-pagination">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    onClick={() => handlePageChange(page)}
                                                    isActive={page === currentPage}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="notifications-footer">
                            <span className="notifications-count">
                                Showing <strong>{startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)}</strong> of <strong>{filteredNotifications.length}</strong> notification{filteredNotifications.length !== 1 ? 's' : ''}
                                {unreadCount > 0 && ` (${unreadCount} unread)`}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
}

// Icon Components with priority-based colors
function InfoIcon({ color }: { color: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}

function WarningIcon({ color }: { color: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function SuccessIcon({ color }: { color: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function ErrorIcon({ color }: { color: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    );
}
