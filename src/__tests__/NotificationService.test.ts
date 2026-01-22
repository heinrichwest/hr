// ============================================================
// NOTIFICATION SERVICE TESTS
// Tests for NotificationService functionality
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Notification, CreateNotificationData } from '../types/notification';

// Mock Firestore
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockGetCountFromServer = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
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
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    writeBatch: () => mockWriteBatch(),
    serverTimestamp: () => mockServerTimestamp(),
}));

vi.mock('../firebase', () => ({
    db: {},
}));

// Import after mocks are set up
import { NotificationService } from '../services/notificationService';

describe('NotificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock implementations
        mockDoc.mockReturnValue({ id: 'test-notification-id' });
        mockCollection.mockReturnValue({ id: 'notifications' });
        mockQuery.mockReturnValue({});
        mockWhere.mockReturnValue({});
        mockOrderBy.mockReturnValue({});
        mockWriteBatch.mockReturnValue({
            update: mockBatchUpdate,
            commit: mockBatchCommit,
        });
        mockBatchCommit.mockResolvedValue(undefined);
    });

    describe('getUnreadNotificationsCount', () => {
        it('should return correct count of unread notifications', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 7 }),
            });

            const result = await NotificationService.getUnreadNotificationsCount();

            expect(result).toBe(7);
            expect(mockWhere).toHaveBeenCalledWith('companyId', '==', null);
            expect(mockWhere).toHaveBeenCalledWith('isRead', '==', false);
        });

        it('should return 0 when no unread notifications exist', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 }),
            });

            const result = await NotificationService.getUnreadNotificationsCount();

            expect(result).toBe(0);
        });

        it('should filter by companyId when provided', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 3 }),
            });

            const result = await NotificationService.getUnreadNotificationsCount('company-123');

            expect(result).toBe(3);
            expect(mockWhere).toHaveBeenCalledWith('companyId', 'in', ['company-123', null]);
            expect(mockWhere).toHaveBeenCalledWith('isRead', '==', false);
        });
    });

    describe('getNotifications', () => {
        it('should filter by companyId correctly when provided', async () => {
            const mockNotifications: Partial<Notification>[] = [
                {
                    id: 'notif-1',
                    type: 'info',
                    title: 'Company Notification',
                    message: 'Test message 1',
                    companyId: 'company-123',
                    isRead: false,
                },
                {
                    id: 'notif-2',
                    type: 'system',
                    title: 'Global Notification',
                    message: 'Test message 2',
                    companyId: null,
                    isRead: false,
                },
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockNotifications.map((notif) => ({
                    data: () => notif,
                })),
            });

            const result = await NotificationService.getNotifications('company-123');

            expect(result).toHaveLength(2);
            expect(mockWhere).toHaveBeenCalledWith('companyId', 'in', ['company-123', null]);
            expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
        });

        it('should return global notifications when companyId is null/undefined', async () => {
            const mockNotifications: Partial<Notification>[] = [
                {
                    id: 'notif-1',
                    type: 'system',
                    title: 'Global Notification',
                    message: 'Test message',
                    companyId: null,
                    isRead: false,
                },
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockNotifications.map((notif) => ({
                    data: () => notif,
                })),
            });

            const result = await NotificationService.getNotifications();

            expect(result).toHaveLength(1);
            expect(result[0].companyId).toBeNull();
            expect(mockWhere).toHaveBeenCalledWith('companyId', '==', null);
        });

        it('should order notifications by createdAt descending', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
            });

            await NotificationService.getNotifications();

            expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
        });

        it('should return empty array when no notifications exist', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
            });

            const result = await NotificationService.getNotifications('company-123');

            expect(result).toHaveLength(0);
        });
    });

    describe('markAsRead', () => {
        it('should update notification isRead status to true', async () => {
            mockUpdateDoc.mockResolvedValue(undefined);

            await NotificationService.markAsRead('notif-123');

            expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'notifications', 'notif-123');
            expect(mockUpdateDoc).toHaveBeenCalledWith(
                expect.anything(),
                { isRead: true }
            );
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all unread notifications as read', async () => {
            const mockDocs = [
                { ref: { id: 'notif-1' }, data: () => ({ id: 'notif-1', isRead: false }) },
                { ref: { id: 'notif-2' }, data: () => ({ id: 'notif-2', isRead: false }) },
            ];

            mockGetDocs.mockResolvedValue({
                empty: false,
                docs: mockDocs,
            });

            await NotificationService.markAllAsRead();

            expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
            expect(mockBatchCommit).toHaveBeenCalled();
        });

        it('should not call batch commit when no unread notifications exist', async () => {
            mockGetDocs.mockResolvedValue({
                empty: true,
                docs: [],
            });

            await NotificationService.markAllAsRead();

            expect(mockBatchCommit).not.toHaveBeenCalled();
        });
    });

    describe('createNotification', () => {
        it('should create a new notification with valid data', async () => {
            const createData: CreateNotificationData = {
                type: 'info',
                title: 'Test Notification',
                message: 'This is a test notification message',
                companyId: 'company-123',
                recipientRole: 'HR Admin',
            };

            mockSetDoc.mockResolvedValue(undefined);

            const result = await NotificationService.createNotification(createData);

            expect(result).toBe('test-notification-id');
            expect(mockSetDoc).toHaveBeenCalledTimes(1);
            expect(mockSetDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    id: 'test-notification-id',
                    type: 'info',
                    title: 'Test Notification',
                    message: 'This is a test notification message',
                    companyId: 'company-123',
                    isRead: false,
                    recipientRole: 'HR Admin',
                })
            );
        });

        it('should create global notification when companyId is not provided', async () => {
            const createData: CreateNotificationData = {
                type: 'system',
                title: 'System Update',
                message: 'A system-wide update has occurred',
            };

            mockSetDoc.mockResolvedValue(undefined);

            await NotificationService.createNotification(createData);

            expect(mockSetDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    companyId: null,
                    recipientRole: null,
                })
            );
        });

        it('should trim title and message whitespace', async () => {
            const createData: CreateNotificationData = {
                type: 'warning',
                title: '  Trimmed Title  ',
                message: '  Trimmed message content  ',
            };

            mockSetDoc.mockResolvedValue(undefined);

            await NotificationService.createNotification(createData);

            expect(mockSetDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    title: 'Trimmed Title',
                    message: 'Trimmed message content',
                })
            );
        });
    });
});
