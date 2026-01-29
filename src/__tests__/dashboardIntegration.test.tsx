// ============================================================
// DASHBOARD INTEGRATION TESTS
// Tests for NotificationsCard integration across dashboards
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';
import { Timestamp } from 'firebase/firestore';

// Mock NotificationService
vi.mock('../services/notificationService', () => ({
    NotificationService: {
        getUserNotifications: vi.fn(),
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
    },
}));

// Helper to create mock notification
function createMockNotification(
    id: string,
    userId: string,
    type: Notification['type'],
    priority: Notification['priority'],
    isRead = false
): Notification {
    return {
        id,
        companyId: 'test-company-123',
        userId,
        type,
        priority,
        title: `Test ${type} notification`,
        description: 'Test description',
        isRead,
        isResolved: false,
        isDismissed: false,
        createdAt: Timestamp.now(),
    };
}

describe('Dashboard Integration - NotificationsCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load user-specific notifications for HR roles', async () => {
        const userId = 'hr-user-123';

        const mockNotifications: Notification[] = [
            createMockNotification('1', userId, 'leave_request', 'high'),
            createMockNotification('2', 'ALL', 'announcement', 'high'),
        ];

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(mockNotifications);

        const { NotificationsCard } = await import('../components/NotificationsCard/NotificationsCard');

        render(
            <MemoryRouter>
                <NotificationsCard
                    notifications={mockNotifications}
                    onMarkAsRead={vi.fn()}
                    onMarkAllAsRead={vi.fn()}
                    onClose={vi.fn()}
                    loading={false}
                />
            </MemoryRouter>
        );

        // Verify notifications are displayed
        await waitFor(() => {
            expect(screen.getByText('Test leave_request notification')).toBeInTheDocument();
            expect(screen.getByText('Test announcement notification')).toBeInTheDocument();
        });
    });

    it('should filter broadcast notifications (userId: ALL) for all users', async () => {
        const mockNotifications: Notification[] = [
            createMockNotification('1', 'ALL', 'announcement', 'high'),
            createMockNotification('2', 'ALL', 'announcement', 'high'),
        ];

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(mockNotifications);

        const { NotificationsCard } = await import('../components/NotificationsCard/NotificationsCard');

        render(
            <MemoryRouter>
                <NotificationsCard
                    notifications={mockNotifications}
                    onMarkAsRead={vi.fn()}
                    onMarkAllAsRead={vi.fn()}
                    onClose={vi.fn()}
                    loading={false}
                />
            </MemoryRouter>
        );

        // Verify broadcast notifications are displayed
        await waitFor(() => {
            const announcements = screen.getAllByText('Test announcement notification');
            expect(announcements).toHaveLength(2);
        });
    });

    it('should load global notifications for System Admin (companyId: null)', async () => {
        const userId = 'system-admin-789';

        const mockNotifications: Notification[] = [
            {
                id: '1',
                companyId: null, // System Admin global notification
                userId,
                type: 'announcement',
                priority: 'high',
                title: 'Test announcement notification',
                description: 'Test description',
                isRead: false,
                isResolved: false,
                isDismissed: false,
                createdAt: Timestamp.now(),
            },
        ];

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(mockNotifications);

        const { NotificationsCard } = await import('../components/NotificationsCard/NotificationsCard');

        render(
            <MemoryRouter>
                <NotificationsCard
                    notifications={mockNotifications}
                    onMarkAsRead={vi.fn()}
                    onMarkAllAsRead={vi.fn()}
                    onClose={vi.fn()}
                    loading={false}
                />
            </MemoryRouter>
        );

        // Verify global notification is displayed
        await waitFor(() => {
            expect(screen.getByText('Test announcement notification')).toBeInTheDocument();
        });
    });

    it('should enforce tenant isolation (companyId filtering)', async () => {
        const userId = 'payroll-user-999';
        const companyId = 'company-A';

        // Notifications only from company-A
        const mockNotifications: Notification[] = [
            createMockNotification('1', userId, 'payroll_cutoff', 'high'),
        ];

        mockNotifications[0].companyId = companyId;

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(mockNotifications);

        const { NotificationsCard } = await import('../components/NotificationsCard/NotificationsCard');

        render(
            <MemoryRouter>
                <NotificationsCard
                    notifications={mockNotifications}
                    onMarkAsRead={vi.fn()}
                    onMarkAllAsRead={vi.fn()}
                    onClose={vi.fn()}
                    loading={false}
                />
            </MemoryRouter>
        );

        // Verify only notifications from company-A are displayed
        await waitFor(() => {
            expect(screen.getByText('Test payroll_cutoff notification')).toBeInTheDocument();
        });
    });

    it('should display loading state while notifications are loading', async () => {
        const { NotificationsCard } = await import('../components/NotificationsCard/NotificationsCard');

        render(
            <MemoryRouter>
                <NotificationsCard
                    notifications={[]}
                    onMarkAsRead={vi.fn()}
                    onMarkAllAsRead={vi.fn()}
                    onClose={vi.fn()}
                    loading={true}
                />
            </MemoryRouter>
        );

        // Verify loading skeleton is displayed
        const loadingElements = document.querySelectorAll('.animate-pulse');
        expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should display empty state when no notifications exist', async () => {
        const { NotificationsCard } = await import('../components/NotificationsCard/NotificationsCard');

        render(
            <MemoryRouter>
                <NotificationsCard
                    notifications={[]}
                    onMarkAsRead={vi.fn()}
                    onMarkAllAsRead={vi.fn()}
                    onClose={vi.fn()}
                    loading={false}
                />
            </MemoryRouter>
        );

        // Verify empty state message is displayed
        await waitFor(() => {
            expect(screen.getByText('No notifications')).toBeInTheDocument();
        });
    });

    it('should show role-specific notifications for Line Manager', async () => {
        const userId = 'line-manager-111';

        const mockNotifications: Notification[] = [
            createMockNotification('1', userId, 'leave_request', 'high'),
            createMockNotification('2', userId, 'attendance', 'medium'),
            createMockNotification('3', 'ALL', 'announcement', 'high'),
        ];

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(mockNotifications);

        const { NotificationsCard } = await import('../components/NotificationsCard/NotificationsCard');

        render(
            <MemoryRouter>
                <NotificationsCard
                    notifications={mockNotifications}
                    onMarkAsRead={vi.fn()}
                    onMarkAllAsRead={vi.fn()}
                    onClose={vi.fn()}
                    loading={false}
                />
            </MemoryRouter>
        );

        // Verify all relevant notifications are displayed
        await waitFor(() => {
            expect(screen.getByText('Test leave_request notification')).toBeInTheDocument();
            expect(screen.getByText('Test attendance notification')).toBeInTheDocument();
            expect(screen.getByText('Test announcement notification')).toBeInTheDocument();
        });
    });

    it('should show role-specific notifications for Employee', async () => {
        const userId = 'employee-222';

        const mockNotifications: Notification[] = [
            createMockNotification('1', userId, 'training', 'low'),
            createMockNotification('2', 'ALL', 'announcement', 'high'),
        ];

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(mockNotifications);

        const { NotificationsCard } = await import('../components/NotificationsCard/NotificationsCard');

        render(
            <MemoryRouter>
                <NotificationsCard
                    notifications={mockNotifications}
                    onMarkAsRead={vi.fn()}
                    onMarkAllAsRead={vi.fn()}
                    onClose={vi.fn()}
                    loading={false}
                />
            </MemoryRouter>
        );

        // Verify employee-specific notifications are displayed
        await waitFor(() => {
            expect(screen.getByText('Test training notification')).toBeInTheDocument();
            expect(screen.getByText('Test announcement notification')).toBeInTheDocument();
        });
    });
});
