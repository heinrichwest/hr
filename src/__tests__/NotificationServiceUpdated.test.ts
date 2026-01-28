// ============================================================
// NOTIFICATION SERVICE TESTS (NEW SCHEMA)
// Tests for updated NotificationService with user-specific filtering
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Notification, CreateNotificationData } from '../types/notification';
import { Timestamp } from 'firebase/firestore';

// Mock Firestore
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockGetCountFromServer = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOr = vi.fn();
const mockOrderBy = vi.fn();
const mockWriteBatch = vi.fn();
const mockServerTimestamp = vi.fn(() => ({ _type: 'serverTimestamp' }));

// Mock batch object
const mockBatchUpdate = vi.fn();
const mockBatchCommit = vi.fn();

vi.mock('firebase/firestore', () => ({
    doc: (...args: unknown[]) => mockDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    getCountFromServer: (...args: unknown[]) => mockGetCountFromServer(...args),
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    where: (...args: unknown[]) => mockWhere(...args),
    or: (...args: unknown[]) => mockOr(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    writeBatch: () => mockWriteBatch(),
    serverTimestamp: () => mockServerTimestamp(),
    Timestamp: {
        now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
        fromDate: (date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }),
    },
}));

vi.mock('../firebase', () => ({
    db: {},
}));

// Import after mocks are set up
import { NotificationService } from '../services/notificationService';

describe('NotificationService - Updated Schema', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock implementations
        mockDoc.mockReturnValue({ id: 'test-notification-id' });
        mockCollection.mockReturnValue({ id: 'notifications' });
        mockQuery.mockReturnValue({});
        mockWhere.mockReturnValue({});
        mockOr.mockReturnValue({});
        mockOrderBy.mockReturnValue({});
        mockWriteBatch.mockReturnValue({
            update: mockBatchUpdate,
            commit: mockBatchCommit,
        });
        mockBatchCommit.mockResolvedValue(undefined);
    });

    describe('getUserNotifications', () => {
        it('should return user-specific notifications AND broadcast notifications (userId: ALL)', async () => {
            const mockNotifications: Partial<Notification>[] = [
                {
                    id: 'notif-1',
                    companyId: 'company-123',
                    userId: 'user-456',
                    type: 'leave_request',
                    priority: 'high',
                    title: 'Leave Request',
                    description: 'User-specific notification',
                    isRead: false,
                    isResolved: false,
                    isDismissed: false,
                    createdAt: Timestamp.now(),
                },
                {
                    id: 'notif-2',
                    companyId: 'company-123',
                    userId: 'ALL',
                    type: 'announcement',
                    priority: 'high',
                    title: 'Company Announcement',
                    description: 'Broadcast notification for all users',
                    isRead: false,
                    isResolved: false,
                    isDismissed: false,
                    createdAt: Timestamp.now(),
                },
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockNotifications.map((notif) => ({
                    data: () => notif,
                })),
            });

            const result = await NotificationService.getUserNotifications('company-123', 'user-456');

            expect(result).toHaveLength(2);
            expect(mockWhere).toHaveBeenCalledWith('companyId', '==', 'company-123');
            expect(mockOr).toHaveBeenCalled();
            expect(mockWhere).toHaveBeenCalledWith('isResolved', '==', false);
            expect(mockWhere).toHaveBeenCalledWith('isDismissed', '==', false);
            expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
        });

        it('should filter out resolved notifications', async () => {
            const mockNotifications: Partial<Notification>[] = [
                {
                    id: 'notif-1',
                    companyId: 'company-123',
                    userId: 'user-456',
                    type: 'leave_request',
                    priority: 'high',
                    title: 'Active Notification',
                    description: 'Not resolved',
                    isRead: false,
                    isResolved: false,
                    isDismissed: false,
                    createdAt: Timestamp.now(),
                },
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockNotifications.map((notif) => ({
                    data: () => notif,
                })),
            });

            const result = await NotificationService.getUserNotifications('company-123', 'user-456');

            expect(result).toHaveLength(1);
            expect(result[0].isResolved).toBe(false);
            expect(mockWhere).toHaveBeenCalledWith('isResolved', '==', false);
        });

        it('should enforce tenant isolation (companyId filtering)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
            });

            await NotificationService.getUserNotifications('company-123', 'user-456');

            expect(mockWhere).toHaveBeenCalledWith('companyId', '==', 'company-123');
        });
    });

    describe('getUnreadCount', () => {
        it('should return count of unread notifications for specific user', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 5 }),
            });

            const result = await NotificationService.getUnreadCount('company-123', 'user-456');

            expect(result).toBe(5);
            expect(mockWhere).toHaveBeenCalledWith('companyId', '==', 'company-123');
            expect(mockWhere).toHaveBeenCalledWith('isRead', '==', false);
            expect(mockWhere).toHaveBeenCalledWith('isResolved', '==', false);
            expect(mockWhere).toHaveBeenCalledWith('isDismissed', '==', false);
        });

        it('should include broadcast notifications in unread count', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 3 }),
            });

            const result = await NotificationService.getUnreadCount('company-123', 'user-456');

            expect(result).toBe(3);
            expect(mockOr).toHaveBeenCalled();
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all unread notifications as read for specific user', async () => {
            const mockDocs = [
                { ref: { id: 'notif-1' }, data: () => ({ id: 'notif-1', isRead: false, userId: 'user-456' }) },
                { ref: { id: 'notif-2' }, data: () => ({ id: 'notif-2', isRead: false, userId: 'ALL' }) },
            ];

            mockGetDocs.mockResolvedValue({
                empty: false,
                docs: mockDocs,
            });

            await NotificationService.markAllAsRead('company-123', 'user-456');

            expect(mockWhere).toHaveBeenCalledWith('companyId', '==', 'company-123');
            expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
            expect(mockBatchCommit).toHaveBeenCalled();
        });
    });

    describe('markAsResolved', () => {
        it('should update notification isResolved flag and set resolvedAt timestamp', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            await NotificationService.markAsResolved('notif-123');

            expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'notifications', 'notif-123');
            expect(mockUpdateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    isResolved: true,
                    resolvedAt: expect.anything(),
                })
            );
        });
    });

    describe('dismissNotification', () => {
        it('should set isDismissed flag to true', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            await NotificationService.dismissNotification('notif-123');

            expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'notifications', 'notif-123');
            expect(mockUpdateDoc).toHaveBeenCalledWith(
                expect.anything(),
                { isDismissed: true }
            );
        });
    });

    describe('createNotification', () => {
        it('should create notification with new schema fields', async () => {
            const createData: CreateNotificationData = {
                companyId: 'company-123',
                userId: 'user-456',
                type: 'leave_request',
                priority: 'high',
                title: 'New Leave Request',
                description: 'John Doe has requested 3 days of vacation leave',
                metadata: {
                    relatedEntityId: 'leave-request-789',
                    relatedEntityType: 'leave_request',
                },
            };

            mockSetDoc.mockResolvedValue(undefined);

            const result = await NotificationService.createNotification(createData);

            expect(result).toBe('test-notification-id');
            expect(mockSetDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    id: 'test-notification-id',
                    companyId: 'company-123',
                    userId: 'user-456',
                    type: 'leave_request',
                    priority: 'high',
                    title: 'New Leave Request',
                    description: 'John Doe has requested 3 days of vacation leave',
                    isRead: false,
                    isResolved: false,
                    isDismissed: false,
                    metadata: {
                        relatedEntityId: 'leave-request-789',
                        relatedEntityType: 'leave_request',
                    },
                })
            );
        });

        it('should create broadcast notification with userId: ALL', async () => {
            const createData: CreateNotificationData = {
                companyId: 'company-123',
                userId: 'ALL',
                type: 'announcement',
                priority: 'high',
                title: 'Company Announcement',
                description: 'Team meeting scheduled for Friday',
            };

            mockSetDoc.mockResolvedValue(undefined);

            await NotificationService.createNotification(createData);

            expect(mockSetDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    userId: 'ALL',
                    type: 'announcement',
                })
            );
        });
    });
});
