// ============================================================
// NOTIFICATIONS PAGE TESTS
// Focused tests for full notifications page (Task Group 5)
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Notifications } from '../pages/admin/Notifications';
import { NotificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';
import { Timestamp } from 'firebase/firestore';

// Mock services
vi.mock('../services/notificationService');

// Create a default mock implementation for useAuth
const defaultAuthMock = {
    userProfile: {
        role: 'HR Admin',
        companyId: 'company-1',
    },
    currentUser: {
        uid: 'user-1',
    },
};

// Mock AuthContext with a default implementation
vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => defaultAuthMock),
}));

// Mock MainLayout to simplify testing
vi.mock('../components/Layout/MainLayout', () => ({
    MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('NotificationsPage', () => {
    const mockNotifications: Notification[] = [
        {
            id: 'notif-1',
            companyId: 'company-1',
            userId: 'user-1',
            type: 'leave_request',
            priority: 'high',
            title: 'New Leave Request',
            description: 'John Doe has requested 3 days of vacation leave',
            isRead: false,
            isResolved: false,
            isDismissed: false,
            createdAt: Timestamp.now(),
        },
        {
            id: 'notif-2',
            companyId: 'company-1',
            userId: 'user-1',
            type: 'announcement',
            priority: 'medium',
            title: 'Company Announcement',
            description: 'Team meeting scheduled for Friday',
            isRead: true,
            isResolved: false,
            isDismissed: false,
            createdAt: Timestamp.now(),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display user-specific notifications filtered by userId', async () => {
        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(mockNotifications);

        render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(NotificationService.getUserNotifications).toHaveBeenCalledWith('company-1', 'user-1');
        });

        expect(screen.getByText('New Leave Request')).toBeInTheDocument();
        expect(screen.getByText('Company Announcement')).toBeInTheDocument();
    });

    it('should apply priority-based color coding for notifications', async () => {
        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(mockNotifications);

        render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        await waitFor(() => {
            const highPriorityNotif = screen.getByText('New Leave Request').closest('.notification-item');
            expect(highPriorityNotif).toHaveClass('notification-priority--high');
        });
    });

    it('should display relative timestamps correctly', async () => {
        const recentNotification: Notification = {
            ...mockNotifications[0],
            createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)), // 5 minutes ago
        };

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue([recentNotification]);

        render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/5 min ago/)).toBeInTheDocument();
        });
    });

    it('should filter notifications by read/unread status', async () => {
        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(mockNotifications);

        const { container } = render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('New Leave Request')).toBeInTheDocument();
            expect(screen.getByText('Company Announcement')).toBeInTheDocument();
        });

        // Click "Unread" tab
        const unreadTab = screen.getByRole('tab', { name: /unread/i });
        fireEvent.click(unreadTab);

        // Wait for the URL parameter to update and component to filter
        await waitFor(() => {
            // After clicking Unread, only unread notifications should be visible
            // Company Announcement is read, so it should not be in the DOM
            const notifications = container.querySelectorAll('.notification-item:not(.notification-item--loading)');
            const visibleTitles = Array.from(notifications).map(n => n.textContent);

            expect(screen.getByText('New Leave Request')).toBeInTheDocument();
            expect(visibleTitles).not.toContain('Company Announcement');
        });
    });

    it('should display empty state messages based on active filter tab', async () => {
        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue([]);

        render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('No notifications to display')).toBeInTheDocument();
        });
    });

    it('should paginate notifications with 20 per page', async () => {
        // Create 25 notifications
        const manyNotifications: Notification[] = Array.from({ length: 25 }, (_, i) => ({
            id: `notif-${i}`,
            companyId: 'company-1',
            userId: 'user-1',
            type: 'announcement',
            priority: 'low',
            title: `Notification ${i + 1}`,
            description: `Description ${i + 1}`,
            isRead: false,
            isResolved: false,
            isDismissed: false,
            createdAt: Timestamp.now(),
        }));

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(manyNotifications);

        render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        await waitFor(() => {
            // Should display first 20 notifications
            expect(screen.getByText('Notification 1')).toBeInTheDocument();
            expect(screen.getByText('Notification 20')).toBeInTheDocument();
            // Should not display notification 21 on first page
            expect(screen.queryByText('Notification 21')).not.toBeInTheDocument();
        });

        // Pagination controls should be present
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should allow all authenticated users to access notifications page', async () => {
        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue([]);

        render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        await waitFor(() => {
            // Should not show access denied message
            expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
            // Should show the main notifications header
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });
    });
});
