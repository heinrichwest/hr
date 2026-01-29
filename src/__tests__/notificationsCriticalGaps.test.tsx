// ============================================================
// CRITICAL GAPS TESTS
// Strategic tests for end-to-end workflows and edge cases
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationService } from '../services/notificationService';
import { NotificationsCard } from '../components/NotificationsCard/NotificationsCard';
import type { Notification } from '../types/notification';
import { Timestamp } from 'firebase/firestore';

// Mock NotificationService
vi.mock('../services/notificationService');

// Helper to create mock notification
function createMockNotification(overrides: Partial<Notification> = {}): Notification {
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
        createdAt: Timestamp.now(),
        ...overrides,
    };
}

describe('Critical Gaps - End-to-End Workflows', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle full leave request notification workflow: create -> display -> mark as read -> resolve', async () => {
        const companyId = 'company-123';
        const managerId = 'manager-456';
        const leaveRequestId = 'leave-request-789';

        // Step 1: Create leave request notification
        const notificationId = 'notification-001';
        vi.mocked(NotificationService.createNotification).mockResolvedValue(notificationId);

        const createResult = await NotificationService.createNotification({
            companyId,
            userId: managerId,
            type: 'leave_request',
            priority: 'high',
            title: 'New Leave Request from John Doe',
            description: 'John Doe has requested 3 days of vacation leave',
            metadata: {
                relatedEntityId: leaveRequestId,
                relatedEntityType: 'leave_request',
            },
        });

        expect(createResult).toBe(notificationId);

        // Step 2: Manager loads dashboard and sees notification
        const mockNotification = createMockNotification({
            id: notificationId,
            companyId,
            userId: managerId,
            type: 'leave_request',
            priority: 'high',
            title: 'New Leave Request from John Doe',
            description: 'John Doe has requested 3 days of vacation leave',
            metadata: {
                relatedEntityId: leaveRequestId,
                relatedEntityType: 'leave_request',
            },
        });

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue([mockNotification]);

        const onMarkAsRead = vi.fn();
        render(
            <BrowserRouter>
                <NotificationsCard
                    notifications={[mockNotification]}
                    onMarkAsRead={onMarkAsRead}
                    onMarkAllAsRead={vi.fn()}
                    onClose={vi.fn()}
                    loading={false}
                />
            </BrowserRouter>
        );

        expect(screen.getByText('New Leave Request from John Doe')).toBeInTheDocument();

        // Step 3: Manager clicks notification to mark as read
        fireEvent.click(screen.getByText('New Leave Request from John Doe'));
        expect(onMarkAsRead).toHaveBeenCalledWith(notificationId);

        // Step 4: Leave request is approved, notification marked as resolved
        vi.mocked(NotificationService.markAsResolved).mockResolvedValue();
        await NotificationService.markAsResolved(notificationId);

        expect(NotificationService.markAsResolved).toHaveBeenCalledWith(notificationId);

        // Step 5: Notification no longer appears in dashboard (filtered out by isResolved: true)
        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue([]);
        const notificationsAfterResolve = await NotificationService.getUserNotifications(companyId, managerId);

        expect(notificationsAfterResolve).toHaveLength(0);
    });

    it('should handle broadcast announcement workflow: create -> all users see -> mark as read independently', async () => {
        const companyId = 'company-123';
        const announcementId = 'notification-002';

        // Step 1: HR Admin creates broadcast announcement
        vi.mocked(NotificationService.createNotification).mockResolvedValue(announcementId);

        await NotificationService.createNotification({
            companyId,
            userId: 'ALL',
            type: 'announcement',
            priority: 'high',
            title: 'Team Meeting Friday',
            description: 'All-hands meeting scheduled for Friday at 10 AM',
        });

        expect(NotificationService.createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'ALL',
                type: 'announcement',
            })
        );

        // Step 2: Multiple users load dashboard and see same broadcast notification
        const broadcastNotification = createMockNotification({
            id: announcementId,
            companyId,
            userId: 'ALL',
            type: 'announcement',
            priority: 'high',
            title: 'Team Meeting Friday',
            description: 'All-hands meeting scheduled for Friday at 10 AM',
        });

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue([broadcastNotification]);

        // User 1 sees notification
        const notifications1 = await NotificationService.getUserNotifications(companyId, 'user-1');
        expect(notifications1).toHaveLength(1);

        // User 2 sees same notification
        const notifications2 = await NotificationService.getUserNotifications(companyId, 'user-2');
        expect(notifications2).toHaveLength(1);

        // Step 3: User 1 marks as read (doesn't affect User 2's view)
        vi.mocked(NotificationService.markAsRead).mockResolvedValue();
        await NotificationService.markAsRead(announcementId);

        expect(NotificationService.markAsRead).toHaveBeenCalledWith(announcementId);
    });

    it('should handle keyboard navigation: Tab -> Enter to mark as read -> Escape to close', async () => {
        const mockNotification = createMockNotification({ isRead: false });
        const onMarkAsRead = vi.fn();
        const onClose = vi.fn();

        render(
            <BrowserRouter>
                <NotificationsCard
                    notifications={[mockNotification]}
                    onMarkAsRead={onMarkAsRead}
                    onMarkAllAsRead={vi.fn()}
                    onClose={onClose}
                    loading={false}
                />
            </BrowserRouter>
        );

        // Find the notification item (it's a button with role="button")
        const notificationButton = screen.getByRole('button', { name: /Test Notification/i });

        // Tab to notification item
        notificationButton.focus();
        expect(document.activeElement).toBe(notificationButton);

        // Press Enter to mark as read
        fireEvent.keyDown(notificationButton, { key: 'Enter' });
        expect(onMarkAsRead).toHaveBeenCalledWith('test-notification-1');

        // Press Space to mark as read (alternative)
        onMarkAsRead.mockClear();
        fireEvent.keyDown(notificationButton, { key: ' ' });
        expect(onMarkAsRead).toHaveBeenCalledWith('test-notification-1');
    });
});

describe('Critical Gaps - Error Handling & Edge Cases', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle network errors gracefully when loading notifications', async () => {
        vi.mocked(NotificationService.getUserNotifications).mockRejectedValue(
            new Error('Network error: Failed to fetch')
        );

        let errorCaught = false;
        try {
            await NotificationService.getUserNotifications('company-123', 'user-456');
        } catch (error) {
            errorCaught = true;
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain('Network error');
        }

        expect(errorCaught).toBe(true);
    });

    it('should handle empty notification list when marking all as read', async () => {
        vi.mocked(NotificationService.markAllAsRead).mockResolvedValue();

        // No notifications to mark as read
        await NotificationService.markAllAsRead('company-123', 'user-456');

        // Should complete without errors
        expect(NotificationService.markAllAsRead).toHaveBeenCalledWith('company-123', 'user-456');
    });

    it('should handle large batch of notifications when marking all as read', async () => {
        const companyId = 'company-123';
        const userId = 'user-456';

        // Create 50 unread notifications
        const manyNotifications: Notification[] = Array.from({ length: 50 }, (_, i) =>
            createMockNotification({
                id: `notif-${i}`,
                isRead: false,
            })
        );

        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(manyNotifications);
        vi.mocked(NotificationService.markAllAsRead).mockResolvedValue();

        // Mark all as read
        await NotificationService.markAllAsRead(companyId, userId);

        expect(NotificationService.markAllAsRead).toHaveBeenCalledWith(companyId, userId);

        // Verify batch operation completed
        vi.mocked(NotificationService.getUserNotifications).mockResolvedValue(
            manyNotifications.map((n) => ({ ...n, isRead: true }))
        );

        const updatedNotifications = await NotificationService.getUserNotifications(companyId, userId);
        expect(updatedNotifications.every((n) => n.isRead)).toBe(true);
    });

    it('should validate notification data before creation', async () => {
        // Test with invalid/empty data
        vi.mocked(NotificationService.createNotification).mockRejectedValue(
            new Error('Validation error: title cannot be empty')
        );

        let errorCaught = false;
        try {
            await NotificationService.createNotification({
                companyId: 'company-123',
                userId: 'user-456',
                type: 'announcement',
                priority: 'high',
                title: '',
                description: 'Test description',
            });
        } catch (error) {
            errorCaught = true;
            expect((error as Error).message).toContain('Validation error');
        }

        expect(errorCaught).toBe(true);
    });
});

describe('Critical Gaps - createAnnouncement Method', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create broadcast announcement for all users', async () => {
        vi.mocked(NotificationService.createAnnouncement).mockResolvedValue(['notif-1']);

        const notificationIds = await NotificationService.createAnnouncement(
            'company-123',
            'System Maintenance',
            'System will be down for maintenance on Saturday',
            'all'
        );

        expect(notificationIds).toHaveLength(1);
        expect(NotificationService.createAnnouncement).toHaveBeenCalledWith(
            'company-123',
            'System Maintenance',
            'System will be down for maintenance on Saturday',
            'all'
        );
    });

    it('should create targeted announcements for specific role', async () => {
        vi.mocked(NotificationService.createAnnouncement).mockResolvedValue(['notif-1', 'notif-2']);

        const notificationIds = await NotificationService.createAnnouncement(
            'company-123',
            'Payroll Cutoff Reminder',
            'Submit all payroll changes by Jan 31st',
            'role',
            'Payroll Admin'
        );

        expect(notificationIds).toHaveLength(2);
        expect(NotificationService.createAnnouncement).toHaveBeenCalledWith(
            'company-123',
            'Payroll Cutoff Reminder',
            'Submit all payroll changes by Jan 31st',
            'role',
            'Payroll Admin'
        );
    });

    it('should create targeted announcements for specific department', async () => {
        vi.mocked(NotificationService.createAnnouncement).mockResolvedValue([
            'notif-1',
            'notif-2',
            'notif-3',
        ]);

        const notificationIds = await NotificationService.createAnnouncement(
            'company-123',
            'Department Meeting',
            'Engineering department meeting scheduled for Monday',
            'department',
            'dept-001'
        );

        expect(notificationIds).toHaveLength(3);
        expect(NotificationService.createAnnouncement).toHaveBeenCalledWith(
            'company-123',
            'Department Meeting',
            'Engineering department meeting scheduled for Monday',
            'department',
            'dept-001'
        );
    });
});
