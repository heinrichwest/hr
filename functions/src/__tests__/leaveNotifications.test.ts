// ============================================================
// LEAVE NOTIFICATIONS TESTS
// Tests for leave notification Cloud Functions
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock firebase-admin before imports
vi.mock('firebase-admin/firestore', () => {
    const mockQuerySnapshot = {
        empty: true,
        docs: [],
        size: 0,
    };

    const mockDocSnapshot = {
        exists: true,
        data: () => ({}),
        id: 'test-doc-id',
    };

    // Chain pattern for query builder
    const createChain = () => {
        const chain = {
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue(mockQuerySnapshot),
        };
        return chain;
    };

    const mockFirestore = {
        collection: vi.fn().mockImplementation(() => {
            const chain = createChain();
            return {
                ...chain,
                doc: vi.fn().mockImplementation(() => ({
                    get: vi.fn().mockResolvedValue(mockDocSnapshot),
                    set: vi.fn().mockResolvedValue(undefined),
                    update: vi.fn().mockResolvedValue(undefined),
                    id: 'new-doc-id',
                })),
                add: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
            };
        }),
    };

    return {
        getFirestore: vi.fn(() => mockFirestore),
        FieldValue: {
            serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
        },
        Timestamp: {
            now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
            fromDate: vi.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
        },
    };
});

// Mock firebase-functions
vi.mock('firebase-functions/v2/firestore', () => ({
    onDocumentCreated: vi.fn((path, handler) => handler),
    onDocumentUpdated: vi.fn((path, handler) => handler),
}));

// Import modules after mocks
import { getFirestore } from 'firebase-admin/firestore';
import { getUserEmailByUserId, getUserEmailByEmployeeId, clearUserCache } from '../utils/userLookup';
import { sendEmail } from '../utils/sendEmail';
import { handleLeaveSubmitted } from '../triggers/leaveSubmitted';
import { handleLeaveStatusChanged } from '../triggers/leaveStatusChanged';

describe('Leave Notification Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearUserCache();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    // ============================================================
    // Task 3.1: Tests for leave notification functions
    // ============================================================

    describe('getUserEmailByUserId', () => {
        it('should return user lookup result when user exists', async () => {
            const mockDb = getFirestore();
            const mockDocSnapshot = {
                exists: true,
                data: () => ({
                    email: 'manager@example.com',
                    displayName: 'John Manager',
                }),
                id: 'user-123',
            };

            (mockDb.collection as ReturnType<typeof vi.fn>).mockImplementation(() => ({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue(mockDocSnapshot),
                }),
            }));

            const result = await getUserEmailByUserId('user-123');

            expect(result.found).toBe(true);
            expect(result.email).toBe('manager@example.com');
            expect(result.displayName).toBe('John Manager');
        });

        it('should return not found when user does not exist', async () => {
            const mockDb = getFirestore();
            const mockDocSnapshot = {
                exists: false,
                data: () => null,
            };

            (mockDb.collection as ReturnType<typeof vi.fn>).mockImplementation(() => ({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue(mockDocSnapshot),
                }),
            }));

            // Clear cache to ensure fresh lookup
            clearUserCache();
            const result = await getUserEmailByUserId('non-existent-user');

            expect(result.found).toBe(false);
            expect(result.email).toBeUndefined();
        });
    });

    describe('getUserEmailByEmployeeId', () => {
        it('should return user lookup result when employee exists', async () => {
            const mockDb = getFirestore();
            const mockQuerySnapshot = {
                empty: false,
                docs: [
                    {
                        data: () => ({
                            email: 'employee@example.com',
                            displayName: 'Jane Employee',
                            uid: 'user-456',
                        }),
                        id: 'user-456',
                    },
                ],
            };

            const mockChain = {
                where: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue(mockQuerySnapshot),
            };

            (mockDb.collection as ReturnType<typeof vi.fn>).mockImplementation(() => mockChain);

            const result = await getUserEmailByEmployeeId('emp-123', 'company-456');

            expect(result.found).toBe(true);
            expect(result.email).toBe('employee@example.com');
            expect(result.displayName).toBe('Jane Employee');
        });

        it('should return not found when employee does not exist', async () => {
            const mockDb = getFirestore();
            const mockQuerySnapshot = {
                empty: true,
                docs: [],
            };

            const mockChain = {
                where: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue(mockQuerySnapshot),
            };

            (mockDb.collection as ReturnType<typeof vi.fn>).mockImplementation(() => mockChain);

            // Clear cache to ensure fresh lookup
            clearUserCache();
            const result = await getUserEmailByEmployeeId('non-existent-emp', 'company-456');

            expect(result.found).toBe(false);
            expect(result.email).toBeUndefined();
        });
    });

    describe('sendEmail', () => {
        it('should create email document in mail collection', async () => {
            const mockDb = getFirestore();
            const mockAdd = vi.fn().mockResolvedValue({ id: 'mail-doc-id' });

            // Mock for emailLogs rate limit check (empty = not rate limited)
            const mockRateLimitQuery = {
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue({ size: 0, empty: true, docs: [] }),
            };

            // Mock for emailLogs logging with both set and update methods
            const mockLogDoc = {
                id: 'log-doc-id',
                set: vi.fn().mockResolvedValue(undefined),
                update: vi.fn().mockResolvedValue(undefined),
            };

            (mockDb.collection as ReturnType<typeof vi.fn>).mockImplementation((collectionName: string) => {
                if (collectionName === 'mail') {
                    return {
                        add: mockAdd,
                    };
                }
                if (collectionName === 'emailLogs') {
                    return {
                        ...mockRateLimitQuery,
                        doc: vi.fn().mockReturnValue(mockLogDoc),
                    };
                }
                return mockRateLimitQuery;
            });

            const result = await sendEmail({
                to: 'recipient@example.com',
                subject: 'Test Subject',
                html: '<p>Test content</p>',
                emailType: 'leave_submitted',
                recipientUserId: 'user-123',
                companyId: 'company-456',
                relatedDocumentId: 'leave-request-789',
                relatedCollection: 'leaveRequests',
            });

            expect(result.success).toBe(true);
            expect(result.mailDocId).toBeDefined();
        });

        it('should skip email when rate limited', async () => {
            const mockDb = getFirestore();

            // Mock rate limit check to return 10+ recent emails (rate limited)
            const mockRateLimitQuery = {
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue({ size: 10, empty: false, docs: Array(10).fill({}) }),
                doc: vi.fn().mockReturnValue({
                    id: 'log-doc-id',
                    set: vi.fn().mockResolvedValue(undefined),
                    update: vi.fn().mockResolvedValue(undefined),
                }),
            };

            (mockDb.collection as ReturnType<typeof vi.fn>).mockImplementation(() => mockRateLimitQuery);

            const result = await sendEmail({
                to: 'recipient@example.com',
                subject: 'Test Subject',
                html: '<p>Test content</p>',
                emailType: 'leave_submitted',
                recipientUserId: 'user-123',
                companyId: 'company-456',
                relatedDocumentId: 'leave-request-789',
                relatedCollection: 'leaveRequests',
            });

            expect(result.success).toBe(false);
            expect(result.rateLimited).toBe(true);
        });
    });

    describe('handleLeaveSubmitted trigger', () => {
        it('should send notification for new pending leave request', async () => {
            const mockDb = getFirestore();

            // Mock manager lookup
            const mockManagerDoc = {
                exists: true,
                data: () => ({
                    email: 'manager@example.com',
                    displayName: 'John Manager',
                }),
                id: 'manager-user-id',
            };

            // Mock mail add
            const mockAdd = vi.fn().mockResolvedValue({ id: 'mail-doc-id' });

            // Mock emailLogs for rate limiting and logging
            const mockLogDoc = {
                id: 'log-doc-id',
                set: vi.fn().mockResolvedValue(undefined),
                update: vi.fn().mockResolvedValue(undefined),
            };

            const mockRateLimitQuery = {
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue({ size: 0, empty: true, docs: [] }),
            };

            (mockDb.collection as ReturnType<typeof vi.fn>).mockImplementation((collectionName: string) => {
                if (collectionName === 'users') {
                    return {
                        doc: vi.fn().mockReturnValue({
                            get: vi.fn().mockResolvedValue(mockManagerDoc),
                        }),
                    };
                }
                if (collectionName === 'mail') {
                    return {
                        add: mockAdd,
                    };
                }
                if (collectionName === 'emailLogs') {
                    return {
                        ...mockRateLimitQuery,
                        doc: vi.fn().mockReturnValue(mockLogDoc),
                    };
                }
                return mockRateLimitQuery;
            });

            // Clear cache before test
            clearUserCache();

            const mockEvent = {
                params: { requestId: 'leave-request-123' },
                data: {
                    data: () => ({
                        status: 'pending',
                        employeeId: 'emp-123',
                        employeeName: 'Jane Employee',
                        companyId: 'company-456',
                        currentApprover: 'manager-user-id',
                        leaveTypeName: 'Annual Leave',
                        startDate: { seconds: 1768435200, nanoseconds: 0 },
                        endDate: { seconds: 1768780800, nanoseconds: 0 },
                        totalDays: 5,
                        reason: 'Family vacation',
                    }),
                },
            };

            const result = await handleLeaveSubmitted(mockEvent as any);

            expect(result.success).toBe(true);
            expect(result.emailSent).toBe(true);
        });

        it('should skip notification for non-pending status', async () => {
            const mockEvent = {
                params: { requestId: 'leave-request-123' },
                data: {
                    data: () => ({
                        status: 'draft',
                        employeeId: 'emp-123',
                        employeeName: 'Jane Employee',
                        companyId: 'company-456',
                    }),
                },
            };

            const result = await handleLeaveSubmitted(mockEvent as any);

            expect(result.success).toBe(true);
            expect(result.skipped).toBe(true);
            expect(result.reason).toBe('Status is not pending');
        });
    });

    describe('handleLeaveStatusChanged trigger', () => {
        it('should send approved notification when status changes to approved', async () => {
            const mockDb = getFirestore();

            // Mock employee lookup (by employeeId)
            const mockEmployeeQuery = {
                where: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue({
                    empty: false,
                    docs: [
                        {
                            data: () => ({
                                email: 'employee@example.com',
                                displayName: 'Jane Employee',
                                uid: 'user-456',
                            }),
                            id: 'user-456',
                        },
                    ],
                }),
            };

            // Mock mail add
            const mockAdd = vi.fn().mockResolvedValue({ id: 'mail-doc-id' });

            // Mock emailLogs for rate limiting and logging
            const mockLogDoc = {
                id: 'log-doc-id',
                set: vi.fn().mockResolvedValue(undefined),
                update: vi.fn().mockResolvedValue(undefined),
            };

            const mockRateLimitQuery = {
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue({ size: 0, empty: true, docs: [] }),
            };

            (mockDb.collection as ReturnType<typeof vi.fn>).mockImplementation((collectionName: string) => {
                if (collectionName === 'users') {
                    return mockEmployeeQuery;
                }
                if (collectionName === 'mail') {
                    return {
                        add: mockAdd,
                    };
                }
                if (collectionName === 'emailLogs') {
                    return {
                        ...mockRateLimitQuery,
                        doc: vi.fn().mockReturnValue(mockLogDoc),
                    };
                }
                return mockRateLimitQuery;
            });

            // Clear cache before test
            clearUserCache();

            const mockEvent = {
                params: { requestId: 'leave-request-123' },
                data: {
                    before: {
                        data: () => ({
                            status: 'pending',
                        }),
                    },
                    after: {
                        data: () => ({
                            status: 'approved',
                            employeeId: 'emp-123',
                            employeeName: 'Jane Employee',
                            companyId: 'company-456',
                            leaveTypeName: 'Annual Leave',
                            startDate: { seconds: 1768435200, nanoseconds: 0 },
                            endDate: { seconds: 1768780800, nanoseconds: 0 },
                            approvalHistory: [
                                {
                                    approverName: 'John Manager',
                                    action: 'approved',
                                    comments: 'Approved, enjoy your leave!',
                                },
                            ],
                        }),
                    },
                },
            };

            const result = await handleLeaveStatusChanged(mockEvent as any);

            expect(result.success).toBe(true);
            expect(result.emailType).toBe('leave_approved');
        });

        it('should send rejected notification when status changes to rejected', async () => {
            const mockDb = getFirestore();

            // Mock employee lookup (by employeeId)
            const mockEmployeeQuery = {
                where: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue({
                    empty: false,
                    docs: [
                        {
                            data: () => ({
                                email: 'employee@example.com',
                                displayName: 'Jane Employee',
                                uid: 'user-456',
                            }),
                            id: 'user-456',
                        },
                    ],
                }),
            };

            // Mock mail add
            const mockAdd = vi.fn().mockResolvedValue({ id: 'mail-doc-id' });

            // Mock emailLogs for rate limiting and logging
            const mockLogDoc = {
                id: 'log-doc-id',
                set: vi.fn().mockResolvedValue(undefined),
                update: vi.fn().mockResolvedValue(undefined),
            };

            const mockRateLimitQuery = {
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue({ size: 0, empty: true, docs: [] }),
            };

            (mockDb.collection as ReturnType<typeof vi.fn>).mockImplementation((collectionName: string) => {
                if (collectionName === 'users') {
                    return mockEmployeeQuery;
                }
                if (collectionName === 'mail') {
                    return {
                        add: mockAdd,
                    };
                }
                if (collectionName === 'emailLogs') {
                    return {
                        ...mockRateLimitQuery,
                        doc: vi.fn().mockReturnValue(mockLogDoc),
                    };
                }
                return mockRateLimitQuery;
            });

            // Clear cache before test
            clearUserCache();

            const mockEvent = {
                params: { requestId: 'leave-request-123' },
                data: {
                    before: {
                        data: () => ({
                            status: 'pending',
                        }),
                    },
                    after: {
                        data: () => ({
                            status: 'rejected',
                            employeeId: 'emp-123',
                            employeeName: 'Jane Employee',
                            companyId: 'company-456',
                            leaveTypeName: 'Annual Leave',
                            startDate: { seconds: 1768435200, nanoseconds: 0 },
                            endDate: { seconds: 1768780800, nanoseconds: 0 },
                            approvalHistory: [
                                {
                                    approverName: 'John Manager',
                                    action: 'rejected',
                                    comments: 'Team capacity is low during this period.',
                                },
                            ],
                        }),
                    },
                },
            };

            const result = await handleLeaveStatusChanged(mockEvent as any);

            expect(result.success).toBe(true);
            expect(result.emailType).toBe('leave_rejected');
        });

        it('should skip notification when status does not change', async () => {
            const mockEvent = {
                params: { requestId: 'leave-request-123' },
                data: {
                    before: {
                        data: () => ({
                            status: 'pending',
                        }),
                    },
                    after: {
                        data: () => ({
                            status: 'pending',
                            employeeId: 'emp-123',
                        }),
                    },
                },
            };

            const result = await handleLeaveStatusChanged(mockEvent as any);

            expect(result.success).toBe(true);
            expect(result.skipped).toBe(true);
        });

        it('should skip notification when status changes to non-relevant value', async () => {
            const mockEvent = {
                params: { requestId: 'leave-request-123' },
                data: {
                    before: {
                        data: () => ({
                            status: 'pending',
                        }),
                    },
                    after: {
                        data: () => ({
                            status: 'cancelled',
                            employeeId: 'emp-123',
                        }),
                    },
                },
            };

            const result = await handleLeaveStatusChanged(mockEvent as any);

            expect(result.success).toBe(true);
            expect(result.skipped).toBe(true);
        });
    });
});
