// ============================================================
// EMAIL INFRASTRUCTURE TESTS
// Tests for Task Group 1: Firebase Extension and Cloud Functions Setup
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CreateEmailLogData, EmailLog, MailDocument, EmailType, DeliveryStatus } from '../types/emailLog';

// Mock Firebase Admin
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockGet = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockServerTimestamp = vi.fn(() => ({ _type: 'serverTimestamp' }));

// Create chainable mock for Firestore queries
const createQueryMock = () => ({
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: mockGet,
});

vi.mock('firebase-admin/firestore', () => ({
    getFirestore: () => ({
        collection: (name: string) => {
            mockCollection(name);
            const queryMock = createQueryMock();
            return {
                doc: (id?: string) => {
                    mockDoc(id);
                    return {
                        id: id || 'generated-id-123',
                        set: mockSet,
                        update: mockUpdate,
                        get: mockGet,
                    };
                },
                where: (...args: unknown[]) => {
                    mockWhere(...args);
                    return queryMock;
                },
                orderBy: (...args: unknown[]) => {
                    mockOrderBy(...args);
                    return queryMock;
                },
                limit: (n: number) => {
                    mockLimit(n);
                    return queryMock;
                },
            };
        },
    }),
    FieldValue: {
        serverTimestamp: () => mockServerTimestamp(),
    },
}));

vi.mock('firebase-admin', () => ({
    initializeApp: vi.fn(),
}));

// Import after mocks
import { logEmail, updateEmailStatus, getEmailLog } from '../utils/emailLogger';
import { checkRateLimit, RATE_LIMIT_CONFIG } from '../utils/rateLimiter';

describe('Email Infrastructure Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSet.mockResolvedValue(undefined);
        mockUpdate.mockResolvedValue(undefined);
    });

    // ============================================================
    // Test 1: Email document structure validation
    // ============================================================
    describe('MailDocument Structure', () => {
        it('should have valid structure for Firebase Trigger Email extension', () => {
            const mailDoc: MailDocument = {
                to: ['recipient@example.com'],
                message: {
                    subject: 'Test Subject',
                    html: '<p>Test HTML content</p>',
                },
                from: 'hr@speccon.co.za',
            };

            // Verify required fields exist
            expect(mailDoc.to).toBeDefined();
            expect(Array.isArray(mailDoc.to)).toBe(true);
            expect(mailDoc.to.length).toBeGreaterThan(0);
            expect(mailDoc.message).toBeDefined();
            expect(mailDoc.message.subject).toBeDefined();
            expect(mailDoc.message.html).toBeDefined();

            // Verify types
            expect(typeof mailDoc.to[0]).toBe('string');
            expect(typeof mailDoc.message.subject).toBe('string');
            expect(typeof mailDoc.message.html).toBe('string');
        });

        it('should accept optional from field', () => {
            const mailDocWithFrom: MailDocument = {
                to: ['user@example.com'],
                message: {
                    subject: 'Test',
                    html: '<p>Content</p>',
                },
                from: 'hr@speccon.co.za',
            };

            const mailDocWithoutFrom: MailDocument = {
                to: ['user@example.com'],
                message: {
                    subject: 'Test',
                    html: '<p>Content</p>',
                },
            };

            expect(mailDocWithFrom.from).toBe('hr@speccon.co.za');
            expect(mailDocWithoutFrom.from).toBeUndefined();
        });
    });

    // ============================================================
    // Test 2: EmailLogs collection receives log entries
    // ============================================================
    describe('Email Logging', () => {
        it('should create log entry in emailLogs collection', async () => {
            const emailData: CreateEmailLogData = {
                recipientEmail: 'test@example.com',
                recipientUserId: 'user-123',
                emailType: 'leave_approved',
                subject: 'Your Leave Request Has Been Approved',
                companyId: 'company-456',
                deliveryStatus: 'pending',
                relatedDocumentId: 'leave-789',
                relatedCollection: 'leaveRequests',
            };

            const logId = await logEmail(emailData);

            expect(logId).toBe('generated-id-123');
            expect(mockCollection).toHaveBeenCalledWith('emailLogs');
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'generated-id-123',
                    recipientEmail: 'test@example.com',
                    recipientUserId: 'user-123',
                    emailType: 'leave_approved',
                    subject: 'Your Leave Request Has Been Approved',
                    companyId: 'company-456',
                    deliveryStatus: 'pending',
                    relatedDocumentId: 'leave-789',
                    relatedCollection: 'leaveRequests',
                    errorMessage: null,
                })
            );
        });

        it('should normalize recipient email to lowercase', async () => {
            const emailData: CreateEmailLogData = {
                recipientEmail: 'TEST@EXAMPLE.COM',
                recipientUserId: 'user-123',
                emailType: 'leave_submitted',
                subject: 'Leave Request Submitted',
                companyId: 'company-456',
                deliveryStatus: 'pending',
                relatedDocumentId: 'leave-789',
                relatedCollection: 'leaveRequests',
            };

            await logEmail(emailData);

            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientEmail: 'test@example.com',
                })
            );
        });

        it('should update email delivery status', async () => {
            await updateEmailStatus('log-123', 'delivered');

            expect(mockCollection).toHaveBeenCalledWith('emailLogs');
            expect(mockDoc).toHaveBeenCalledWith('log-123');
            expect(mockUpdate).toHaveBeenCalledWith({
                deliveryStatus: 'delivered',
            });
        });

        it('should include error message when updating to failed status', async () => {
            await updateEmailStatus('log-123', 'failed', 'SMTP connection refused');

            expect(mockUpdate).toHaveBeenCalledWith({
                deliveryStatus: 'failed',
                errorMessage: 'SMTP connection refused',
            });
        });
    });

    // ============================================================
    // Test 3: Rate limiting logic prevents email flooding
    // ============================================================
    describe('Rate Limiting', () => {
        it('should allow email when under rate limit', async () => {
            // Mock fewer than MAX_EMAILS_PER_MINUTE emails
            mockGet.mockResolvedValue({
                size: 5,
                docs: [],
            });

            const canSend = await checkRateLimit('user@example.com');

            expect(canSend).toBe(true);
            expect(mockWhere).toHaveBeenCalledWith('recipientEmail', '==', 'user@example.com');
        });

        it('should block email when rate limit exceeded', async () => {
            // Mock MAX_EMAILS_PER_MINUTE or more emails
            mockGet.mockResolvedValue({
                size: RATE_LIMIT_CONFIG.maxEmailsPerMinute,
                docs: [],
            });

            const canSend = await checkRateLimit('user@example.com');

            expect(canSend).toBe(false);
        });

        it('should allow email on rate limit check error (fail open)', async () => {
            // Mock error during rate limit check
            mockGet.mockRejectedValue(new Error('Firestore unavailable'));

            const canSend = await checkRateLimit('user@example.com');

            // Should fail open to prevent blocking all emails
            expect(canSend).toBe(true);
        });

        it('should have correct rate limit configuration', () => {
            expect(RATE_LIMIT_CONFIG.maxEmailsPerMinute).toBe(10);
            expect(RATE_LIMIT_CONFIG.windowMs).toBe(60 * 1000); // 1 minute in ms
        });
    });

    // ============================================================
    // Test 4: EmailLog type validation
    // ============================================================
    describe('EmailLog Type', () => {
        it('should have all required fields in EmailLog interface', () => {
            const emailLog: EmailLog = {
                id: 'log-123',
                recipientEmail: 'user@example.com',
                recipientUserId: 'user-456',
                emailType: 'leave_approved',
                subject: 'Test Subject',
                sentAt: { seconds: 1234567890, nanoseconds: 0 } as any,
                companyId: 'company-789',
                deliveryStatus: 'sent',
                relatedDocumentId: 'doc-abc',
                relatedCollection: 'leaveRequests',
                errorMessage: null,
            };

            // Verify all required fields
            expect(emailLog.id).toBeDefined();
            expect(emailLog.recipientEmail).toBeDefined();
            expect(emailLog.recipientUserId).toBeDefined();
            expect(emailLog.emailType).toBeDefined();
            expect(emailLog.subject).toBeDefined();
            expect(emailLog.sentAt).toBeDefined();
            expect(emailLog.companyId).toBeDefined();
            expect(emailLog.deliveryStatus).toBeDefined();
            expect(emailLog.relatedDocumentId).toBeDefined();
            expect(emailLog.relatedCollection).toBeDefined();
        });

        it('should support all valid email types', () => {
            const validTypes: EmailType[] = [
                'leave_submitted',
                'leave_approved',
                'leave_rejected',
                'payslip_available',
            ];

            validTypes.forEach((type) => {
                const data: CreateEmailLogData = {
                    recipientEmail: 'test@example.com',
                    recipientUserId: 'user-123',
                    emailType: type,
                    subject: 'Test',
                    companyId: 'company-456',
                    deliveryStatus: 'pending',
                    relatedDocumentId: 'doc-789',
                    relatedCollection: 'test',
                };
                expect(data.emailType).toBe(type);
            });
        });

        it('should support all valid delivery statuses', () => {
            const validStatuses: DeliveryStatus[] = [
                'pending',
                'sent',
                'delivered',
                'failed',
                'bounced',
            ];

            validStatuses.forEach((status) => {
                const data: CreateEmailLogData = {
                    recipientEmail: 'test@example.com',
                    recipientUserId: 'user-123',
                    emailType: 'leave_approved',
                    subject: 'Test',
                    companyId: 'company-456',
                    deliveryStatus: status,
                    relatedDocumentId: 'doc-789',
                    relatedCollection: 'test',
                };
                expect(data.deliveryStatus).toBe(status);
            });
        });
    });
});
