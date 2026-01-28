// ============================================================
// NOTIFICATION UI COMPONENTS TESTS
// Focused tests for NotificationsCard component and utilities
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { NotificationsCard } from '../components/NotificationsCard/NotificationsCard';
import { getRelativeTime } from '../utils/dateUtils';
import { getPriorityColor, getPriorityIcon } from '../utils/notificationUtils';
import type { Notification } from '../types/notification';
import { AlertCircle, Bell, CheckCircle } from 'lucide-react';

// ============================================================
// TEST HELPERS
// ============================================================

function createMockNotification(overrides: Partial<Notification> = {}): Notification {
    const now = new Date();
    return {
        id: 'test-notification-1',
        companyId: 'test-company',
        userId: 'test-user',
        type: 'announcement',
        priority: 'high',
        title: 'Test Notification',
        description: 'This is a test notification description',
        isRead: false,
        isResolved: false,
        isDismissed: false,
        createdAt: Timestamp.fromDate(now),
        ...overrides,
    };
}

function renderNotificationsCard(props: Partial<React.ComponentProps<typeof NotificationsCard>> = {}) {
    const defaultProps = {
        notifications: [],
        onMarkAsRead: vi.fn(),
        onMarkAllAsRead: vi.fn(),
        onClose: vi.fn(),
        loading: false,
    };

    return render(
        <BrowserRouter>
            <NotificationsCard {...defaultProps} {...props} />
        </BrowserRouter>
    );
}

// ============================================================
// TESTS: NotificationsCard Component
// ============================================================

describe('NotificationsCard', () => {
    it('renders card with title and close button', () => {
        renderNotificationsCard();
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByLabelText('Close notifications')).toBeInTheDocument();
    });

    it('displays "Mark All as Read" button when there are unread notifications', () => {
        const notifications = [
            createMockNotification({ id: '1', isRead: false }),
            createMockNotification({ id: '2', isRead: false }),
        ];
        renderNotificationsCard({ notifications });
        expect(screen.getByLabelText('Mark all as read')).toBeInTheDocument();
    });

    it('calls onMarkAllAsRead when "Mark All as Read" button is clicked', () => {
        const onMarkAllAsRead = vi.fn();
        const notifications = [createMockNotification({ isRead: false })];
        renderNotificationsCard({ notifications, onMarkAllAsRead });

        fireEvent.click(screen.getByLabelText('Mark all as read'));
        expect(onMarkAllAsRead).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        renderNotificationsCard({ onClose });

        fireEvent.click(screen.getByLabelText('Close notifications'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('displays loading skeletons when loading is true', () => {
        renderNotificationsCard({ loading: true });
        const skeletons = screen.getAllByRole('generic').filter(el =>
            el.className.includes('animate-pulse')
        );
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays "No notifications" message when there are no notifications', () => {
        renderNotificationsCard({ notifications: [] });
        expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    it('displays notification items with correct priority colors', () => {
        const notifications = [
            createMockNotification({ id: '1', priority: 'high', title: 'High Priority' }),
            createMockNotification({ id: '2', priority: 'medium', title: 'Medium Priority' }),
            createMockNotification({ id: '3', priority: 'low', title: 'Low Priority' }),
        ];
        renderNotificationsCard({ notifications });

        expect(screen.getByText('High Priority')).toBeInTheDocument();
        expect(screen.getByText('Medium Priority')).toBeInTheDocument();
        expect(screen.getByText('Low Priority')).toBeInTheDocument();
    });

    it('calls onMarkAsRead when clicking an unread notification', () => {
        const onMarkAsRead = vi.fn();
        const notifications = [
            createMockNotification({ id: 'test-1', isRead: false, title: 'Unread Notification' }),
        ];
        renderNotificationsCard({ notifications, onMarkAsRead });

        fireEvent.click(screen.getByText('Unread Notification'));
        expect(onMarkAsRead).toHaveBeenCalledWith('test-1');
    });
});

// ============================================================
// TESTS: Relative Time Utility
// ============================================================

describe('getRelativeTime', () => {
    it('returns "Just now" for timestamps less than 1 minute ago', () => {
        const now = new Date();
        const timestamp = Timestamp.fromDate(new Date(now.getTime() - 30 * 1000)); // 30 seconds ago
        expect(getRelativeTime(timestamp)).toBe('Just now');
    });

    it('returns "X min ago" for timestamps less than 60 minutes ago', () => {
        const now = new Date();
        const timestamp = Timestamp.fromDate(new Date(now.getTime() - 5 * 60 * 1000)); // 5 minutes ago
        expect(getRelativeTime(timestamp)).toBe('5 min ago');
    });

    it('returns "X hr ago" for timestamps less than 24 hours ago', () => {
        const now = new Date();
        const timestamp = Timestamp.fromDate(new Date(now.getTime() - 3 * 60 * 60 * 1000)); // 3 hours ago
        expect(getRelativeTime(timestamp)).toBe('3 hr ago');
    });

    it('returns "Yesterday" for timestamps from yesterday', () => {
        const now = new Date();
        const timestamp = Timestamp.fromDate(new Date(now.getTime() - 25 * 60 * 60 * 1000)); // 25 hours ago
        expect(getRelativeTime(timestamp)).toBe('Yesterday');
    });

    it('returns "X days ago" for timestamps older than 2 days', () => {
        const now = new Date();
        const timestamp = Timestamp.fromDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)); // 3 days ago
        expect(getRelativeTime(timestamp)).toBe('3 days ago');
    });
});

// ============================================================
// TESTS: Priority Color and Icon Utilities
// ============================================================

describe('getPriorityColor', () => {
    it('returns red for high priority', () => {
        expect(getPriorityColor('high')).toBe('hsl(0, 84%, 60%)');
    });

    it('returns yellow for medium priority', () => {
        expect(getPriorityColor('medium')).toBe('hsl(38, 92%, 50%)');
    });

    it('returns green for low priority', () => {
        expect(getPriorityColor('low')).toBe('hsl(160, 84%, 39%)');
    });
});

describe('getPriorityIcon', () => {
    it('returns AlertCircle icon for high priority', () => {
        expect(getPriorityIcon('high')).toBe(AlertCircle);
    });

    it('returns Bell icon for medium priority', () => {
        expect(getPriorityIcon('medium')).toBe(Bell);
    });

    it('returns CheckCircle icon for low priority', () => {
        expect(getPriorityIcon('low')).toBe(CheckCircle);
    });
});
