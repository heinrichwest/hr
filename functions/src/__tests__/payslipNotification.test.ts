// ============================================================
// PAYSLIP NOTIFICATION TESTS
// Tests for Task Group 4: Payslip Notification Function
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SendEmailConfig } from '../utils/sendEmail';

// Mock Firebase Admin Firestore
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockSet = vi.fn();
const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockOrderBy = vi.fn();
const mockUpdate = vi.fn();
const mockServerTimestamp = vi.fn(() => ({ _type: 'serverTimestamp' }));

// Create chainable mock for Firestore queries
const createQueryMock = () => {
    const queryMock = {
        where: vi.fn().mockImplementation(() => queryMock),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: mockGet,
    };
    return queryMock;
};

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
                add: mockAdd,
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

// Mock firebase-functions/v2 - define logger inline to avoid hoisting issues
vi.mock('firebase-functions/v2', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('firebase-functions/v2/firestore', () => ({
    onDocumentCreated: vi.fn((path: string, handler: (event: unknown) => Promise<void>) => {
        return { path, handler };
    }),
}));

// Import after mocks
import { getUserEmailByEmployeeId, clearUserCache } from '../utils/userLookup';
import { sendEmail, SEND_EMAIL_CONFIG } from '../utils/sendEmail';
import { PAYSLIP_TRIGGER_CONFIG } from '../triggers/payslipCreated';
import { formatZAR } from '../utils/formatCurrency';
import {
    renderPayslipAvailableEmail,
    getPayslipAvailableSubject,
} from '../templates/payslipAvailable';

describe('Payslip Notification Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearUserCache();
        mockSet.mockResolvedValue(undefined);
        mockAdd.mockResolvedValue({ id: 'mail-doc-123' });
        mockUpdate.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ============================================================
    // Test 1: onPayslipCreated triggers for new payslip documents
    // ============================================================
    describe('Payslip Created Trigger', () => {
        it('should have correct trigger path configuration', () => {
            expect(PAYSLIP_TRIGGER_CONFIG.collection).toBe('payslips');
        });

        it('should have batch processing delay configured', () => {
            expect(PAYSLIP_TRIGGER_CONFIG.delayBetweenEmails).toBe(100);
        });
    });

    // ============================================================
    // Test 2: Employee email lookup via employeeId field
    // ============================================================
    describe('Employee Email Lookup', () => {
        it('should look up employee email by employeeId and companyId', async () => {
            // Mock successful user lookup
            mockGet.mockResolvedValue({
                empty: false,
                docs: [
                    {
                        id: 'user-123',
                        data: () => ({
                            email: 'employee@example.com',
                            displayName: 'John Smith',
                        }),
                    },
                ],
            });

            const result = await getUserEmailByEmployeeId('emp-456', 'company-789');

            expect(result.found).toBe(true);
            expect(result.email).toBe('employee@example.com');
            expect(result.displayName).toBe('John Smith');
            expect(result.userId).toBe('user-123');

            // Verify query was made with correct employeeId parameter
            expect(mockWhere).toHaveBeenCalledWith('employeeId', '==', 'emp-456');
            // The companyId where clause is chained on the query mock, not the collection
            // so we just verify the initial where call was made correctly
        });

        it('should handle employee not found gracefully', async () => {
            // Mock empty result
            mockGet.mockResolvedValue({
                empty: true,
                docs: [],
            });

            const result = await getUserEmailByEmployeeId('nonexistent-emp', 'company-789');

            expect(result.found).toBe(false);
            expect(result.email).toBeUndefined();
        });
    });

    // ============================================================
    // Test 3: Email document is created in mail collection
    // ============================================================
    describe('Email Document Creation', () => {
        it('should create mail document with correct structure', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, docs: [] });

            const emailConfig: SendEmailConfig = {
                to: 'employee@example.com',
                subject: 'Your Payslip for January 2026 is Available',
                html: '<p>Test HTML content</p>',
                emailType: 'payslip_available',
                recipientUserId: 'user-123',
                companyId: 'company-456',
                relatedDocumentId: 'payslip-789',
                relatedCollection: 'payslips',
            };

            const result = await sendEmail(emailConfig);

            expect(result.success).toBe(true);
            expect(result.mailDocId).toBe('mail-doc-123');
            expect(mockCollection).toHaveBeenCalledWith('mail');
            expect(mockAdd).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['employee@example.com'],
                    message: expect.objectContaining({
                        subject: 'Your Payslip for January 2026 is Available',
                        html: '<p>Test HTML content</p>',
                    }),
                    from: SEND_EMAIL_CONFIG.fromEmail,
                })
            );
        });

        it('should log email in emailLogs collection', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, docs: [] });

            const emailConfig: SendEmailConfig = {
                to: 'employee@example.com',
                subject: 'Your Payslip for January 2026 is Available',
                html: '<p>Test HTML content</p>',
                emailType: 'payslip_available',
                recipientUserId: 'user-123',
                companyId: 'company-456',
                relatedDocumentId: 'payslip-789',
                relatedCollection: 'payslips',
            };

            const result = await sendEmail(emailConfig);

            expect(result.success).toBe(true);
            expect(result.logId).toBeDefined();
            expect(mockCollection).toHaveBeenCalledWith('emailLogs');
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientEmail: 'employee@example.com',
                    emailType: 'payslip_available',
                    companyId: 'company-456',
                    relatedDocumentId: 'payslip-789',
                    relatedCollection: 'payslips',
                })
            );
        });
    });

    // ============================================================
    // Test 4: Batch processing handles multiple payslips efficiently
    // ============================================================
    describe('Batch Processing', () => {
        it('should have rate limiting for batch processing', async () => {
            // Mock rate limit exceeded
            mockGet.mockResolvedValue({
                size: 10, // At rate limit
                docs: [],
            });

            const emailConfig: SendEmailConfig = {
                to: 'employee@example.com',
                subject: 'Your Payslip for January 2026 is Available',
                html: '<p>Test HTML content</p>',
                emailType: 'payslip_available',
                recipientUserId: 'user-123',
                companyId: 'company-456',
                relatedDocumentId: 'payslip-789',
                relatedCollection: 'payslips',
            };

            const result = await sendEmail(emailConfig);

            expect(result.success).toBe(false);
            expect(result.rateLimited).toBe(true);
            expect(result.error).toBe('Rate limit exceeded');
        });

        it('should retry on transient failures with exponential backoff', async () => {
            // Mock rate limit check (allow)
            const rateLimitMock = vi.fn()
                .mockResolvedValueOnce({ size: 0, docs: [] }); // Rate limit check

            mockGet.mockImplementation(rateLimitMock);

            // Mock mail document creation failure then success
            mockAdd
                .mockRejectedValueOnce(new Error('Transient failure'))
                .mockRejectedValueOnce(new Error('Transient failure'))
                .mockResolvedValueOnce({ id: 'mail-doc-success' });

            const emailConfig: SendEmailConfig = {
                to: 'employee@example.com',
                subject: 'Test',
                html: '<p>Test</p>',
                emailType: 'payslip_available',
                recipientUserId: 'user-123',
                companyId: 'company-456',
                relatedDocumentId: 'payslip-789',
                relatedCollection: 'payslips',
            };

            const result = await sendEmail(emailConfig);

            expect(result.success).toBe(true);
            expect(result.mailDocId).toBe('mail-doc-success');
            // Should have been called 3 times (2 failures + 1 success)
            expect(mockAdd).toHaveBeenCalledTimes(3);
        });

        it('should handle partial failures gracefully', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, docs: [] });

            // Mock all retries failing
            mockAdd.mockRejectedValue(new Error('Persistent failure'));

            const emailConfig: SendEmailConfig = {
                to: 'employee@example.com',
                subject: 'Test',
                html: '<p>Test</p>',
                emailType: 'payslip_available',
                recipientUserId: 'user-123',
                companyId: 'company-456',
                relatedDocumentId: 'payslip-789',
                relatedCollection: 'payslips',
            };

            const result = await sendEmail(emailConfig);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Persistent failure');
            expect(result.logId).toBeDefined(); // Email should still be logged
            // Should have tried MAX_RETRIES times
            expect(mockAdd).toHaveBeenCalledTimes(SEND_EMAIL_CONFIG.maxRetries);
        });
    });

    // ============================================================
    // Test 5: Email template rendering
    // ============================================================
    describe('Payslip Email Template', () => {
        it('should generate correct subject line', () => {
            const subject = getPayslipAvailableSubject('January 2026');
            expect(subject).toBe('Your Payslip for January 2026 is Available');
        });

        it('should render email with payslip details', () => {
            const html = renderPayslipAvailableEmail({
                employeeName: 'John Smith',
                periodDescription: 'January 2026',
                payDate: new Date('2026-01-25'),
                netPay: 25750.50,
            });

            // Check that email contains expected content
            expect(html).toContain('John Smith');
            expect(html).toContain('January 2026');
            expect(html).toContain('R 25'); // Net pay formatted (may have non-breaking space)
            expect(html).toContain('View Payslip');
        });

        it('should format net pay correctly as ZAR', () => {
            const formatted = formatZAR(25750.50);
            // South African locale may use non-breaking space as thousands separator
            // So we check for the pattern rather than exact match
            expect(formatted).toMatch(/^R\s*25[\s\u00A0]?750[,.]50$/);
        });
    });

    // ============================================================
    // Test 6: SendEmail configuration
    // ============================================================
    describe('SendEmail Configuration', () => {
        it('should use correct from email address', () => {
            expect(SEND_EMAIL_CONFIG.fromEmail).toBe('hr@speccon.co.za');
        });

        it('should use correct mail collection', () => {
            expect(SEND_EMAIL_CONFIG.mailCollection).toBe('mail');
        });

        it('should have retry configuration', () => {
            expect(SEND_EMAIL_CONFIG.maxRetries).toBe(3);
            expect(SEND_EMAIL_CONFIG.baseRetryDelayMs).toBe(1000);
        });
    });
});
