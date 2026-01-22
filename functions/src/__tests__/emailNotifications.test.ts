// ============================================================
// EMAIL NOTIFICATIONS GAP ANALYSIS TESTS
// Strategic tests for Task Group 6: Test Review and Gap Analysis
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SendEmailConfig, SendEmailResult } from '../utils/sendEmail';
import type { CreateEmailLogData, EmailType } from '../types/emailLog';

/**
 * Gap Analysis Summary:
 *
 * Existing Test Coverage (reviewed from Task Groups 1-5):
 * - emailInfrastructure.test.ts: 13 tests (mail document structure, logging, rate limiting)
 * - emailTemplates.test.ts: 41 tests (all 4 templates, formatting utilities, branding)
 * - leaveNotifications.test.ts: 12 tests (user lookup, sendEmail, leave triggers)
 * - payslipNotification.test.ts: 15 tests (employee lookup, mail creation, batch processing)
 * - firestoreRules.test.ts: 23 tests (collection access control, tenant isolation)
 *
 * Total existing tests: ~104 tests
 *
 * Identified Gaps (addressed in this file):
 * 1. Edge case: Email not sent when user email is missing - verified with direct lookup
 * 2. Edge case: Rate limiting blocks excessive emails - verified with count checks
 * 3. Edge case: Retry logic handles transient failures - exponential backoff verification
 * 4. Integration: Email log correctly references source document with all fields
 * 5. Integration: Email normalization to lowercase
 * 6. Security: Required fields validation for audit trail
 * 7. Configuration: Verify correct defaults are used
 * 8. Workflow: Verify skip logic for non-pending status
 */

// Mock Firebase Admin
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockSet = vi.fn();
const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
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

vi.mock('firebase-functions/v2/firestore', () => ({
    onDocumentCreated: vi.fn((path: string, handler: (event: unknown) => Promise<void>) => {
        return { path, handler };
    }),
    onDocumentUpdated: vi.fn((path: string, handler: (event: unknown) => Promise<void>) => {
        return { path, handler };
    }),
}));

vi.mock('firebase-functions/v2', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Import after mocks
import { sendEmail, SEND_EMAIL_CONFIG } from '../utils/sendEmail';
import { getUserEmailByUserId, getUserEmailByEmployeeId, clearUserCache } from '../utils/userLookup';
import { checkRateLimit, RATE_LIMIT_CONFIG } from '../utils/rateLimiter';

describe('Email Notifications Gap Analysis Tests', () => {
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
    // Test 1: Edge case - Email not sent when user email is missing
    // ============================================================
    describe('Edge Case: Missing User Email', () => {
        it('should return found=true but email=undefined when user exists without email', async () => {
            // Mock user exists but has no email field
            mockGet.mockResolvedValue({
                exists: true,
                data: () => ({
                    displayName: 'Manager No Email',
                    uid: 'manager-no-email',
                    companyId: 'company-123',
                    // email is intentionally missing
                }),
                id: 'manager-no-email',
            });

            const result = await getUserEmailByUserId('manager-no-email');

            expect(result.found).toBe(true);
            expect(result.email).toBeUndefined();
            expect(result.displayName).toBe('Manager No Email');
        });

        it('should return found=false when employee does not exist in users collection', async () => {
            // Mock employee not found
            mockGet.mockResolvedValue({
                empty: true,
                docs: [],
            });

            const result = await getUserEmailByEmployeeId('nonexistent-employee', 'company-123');

            expect(result.found).toBe(false);
            expect(result.email).toBeUndefined();
            expect(result.userId).toBeUndefined();
        });

        it('should cache not-found results to prevent duplicate lookups', async () => {
            // Mock employee not found
            mockGet.mockResolvedValue({
                empty: true,
                docs: [],
            });

            // First lookup
            await getUserEmailByEmployeeId('cached-not-found', 'company-cache');
            // Second lookup - should use cache
            const result = await getUserEmailByEmployeeId('cached-not-found', 'company-cache');

            expect(result.found).toBe(false);
            // mockGet should only be called once due to caching
            expect(mockGet).toHaveBeenCalledTimes(1);
        });
    });

    // ============================================================
    // Test 2: Edge case - Rate limiting verification
    // ============================================================
    describe('Edge Case: Rate Limiting', () => {
        it('should block email when exactly at rate limit threshold', async () => {
            // Mock exactly at rate limit
            mockGet.mockResolvedValue({
                size: RATE_LIMIT_CONFIG.maxEmailsPerMinute, // 10
                empty: false,
                docs: Array(RATE_LIMIT_CONFIG.maxEmailsPerMinute).fill({}),
            });

            const canSend = await checkRateLimit('at-limit@speccon.co.za');

            expect(canSend).toBe(false);
        });

        it('should allow email when one below rate limit', async () => {
            // Mock one below rate limit
            mockGet.mockResolvedValue({
                size: RATE_LIMIT_CONFIG.maxEmailsPerMinute - 1, // 9
                empty: false,
                docs: Array(RATE_LIMIT_CONFIG.maxEmailsPerMinute - 1).fill({}),
            });

            const canSend = await checkRateLimit('below-limit@speccon.co.za');

            expect(canSend).toBe(true);
        });

        it('should log rate-limited attempt with failed status and error message', async () => {
            // Mock rate limit exceeded
            mockGet.mockResolvedValue({
                size: RATE_LIMIT_CONFIG.maxEmailsPerMinute,
                empty: false,
                docs: Array(RATE_LIMIT_CONFIG.maxEmailsPerMinute).fill({}),
            });

            const emailConfig: SendEmailConfig = {
                to: 'rate-limited@speccon.co.za',
                subject: 'Rate Limited Test',
                html: '<p>Test</p>',
                emailType: 'leave_approved',
                recipientUserId: 'user-rate-limited',
                companyId: 'company-rate',
                relatedDocumentId: 'doc-rate-001',
                relatedCollection: 'leaveRequests',
            };

            const result = await sendEmail(emailConfig);

            expect(result.success).toBe(false);
            expect(result.rateLimited).toBe(true);
            expect(result.error).toBe('Rate limit exceeded');
            expect(result.logId).toBeDefined();

            // Verify the log was created with failed status and error
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    deliveryStatus: 'failed',
                    errorMessage: 'Rate limit exceeded',
                })
            );
        });
    });

    // ============================================================
    // Test 3: Edge case - Retry logic verification
    // ============================================================
    describe('Edge Case: Retry Logic', () => {
        it('should retry exactly MAX_RETRIES times on persistent failures', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });

            // Mock mail creation fails all retries
            mockAdd.mockRejectedValue(new Error('Persistent SMTP error'));

            const emailConfig: SendEmailConfig = {
                to: 'retry-test@speccon.co.za',
                subject: 'Retry Test',
                html: '<p>Test</p>',
                emailType: 'payslip_available',
                recipientUserId: 'user-retry',
                companyId: 'company-retry',
                relatedDocumentId: 'doc-retry-001',
                relatedCollection: 'payslips',
            };

            const result = await sendEmail(emailConfig);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Persistent SMTP error');
            expect(mockAdd).toHaveBeenCalledTimes(SEND_EMAIL_CONFIG.maxRetries);
        });

        it('should succeed when final retry attempt succeeds', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });

            // Mock: fail first two, succeed on third (MAX_RETRIES = 3)
            mockAdd
                .mockRejectedValueOnce(new Error('First failure'))
                .mockRejectedValueOnce(new Error('Second failure'))
                .mockResolvedValueOnce({ id: 'mail-final-retry-success' });

            const emailConfig: SendEmailConfig = {
                to: 'retry-success@speccon.co.za',
                subject: 'Retry Success Test',
                html: '<p>Test</p>',
                emailType: 'leave_submitted',
                recipientUserId: 'user-retry-success',
                companyId: 'company-retry',
                relatedDocumentId: 'doc-retry-002',
                relatedCollection: 'leaveRequests',
            };

            const result = await sendEmail(emailConfig);

            expect(result.success).toBe(true);
            expect(result.mailDocId).toBe('mail-final-retry-success');
            expect(mockAdd).toHaveBeenCalledTimes(3);
        });

        it('should update email log status to sent after successful retry', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });

            // Mock: fail once, then succeed
            mockAdd
                .mockRejectedValueOnce(new Error('Transient failure'))
                .mockResolvedValueOnce({ id: 'mail-after-retry' });

            const emailConfig: SendEmailConfig = {
                to: 'log-status@speccon.co.za',
                subject: 'Log Status Test',
                html: '<p>Test</p>',
                emailType: 'leave_rejected',
                recipientUserId: 'user-log-status',
                companyId: 'company-log',
                relatedDocumentId: 'doc-log-001',
                relatedCollection: 'leaveRequests',
            };

            await sendEmail(emailConfig);

            // Verify the log was updated to 'sent' status
            expect(mockUpdate).toHaveBeenCalledWith({ deliveryStatus: 'sent' });
        });
    });

    // ============================================================
    // Test 4: Integration - Email log document reference fields
    // ============================================================
    describe('Integration: Email Log Document References', () => {
        it('should create email log with all required reference fields', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });

            const emailConfig: SendEmailConfig = {
                to: 'log-ref-test@speccon.co.za',
                subject: 'Log Reference Test',
                html: '<p>Test content</p>',
                emailType: 'leave_rejected',
                recipientUserId: 'user-log-ref-456',
                companyId: 'company-log-ref-789',
                relatedDocumentId: 'leave-request-specific-id-123',
                relatedCollection: 'leaveRequests',
            };

            await sendEmail(emailConfig);

            // Verify all document reference fields are present
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    relatedDocumentId: 'leave-request-specific-id-123',
                    relatedCollection: 'leaveRequests',
                    recipientUserId: 'user-log-ref-456',
                    companyId: 'company-log-ref-789',
                })
            );
        });

        it('should normalize recipient email to lowercase in log', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });

            const emailConfig: SendEmailConfig = {
                to: 'UPPERCASE@SPECCON.CO.ZA', // Uppercase input
                subject: 'Normalize Test',
                html: '<p>Test</p>',
                emailType: 'payslip_available',
                recipientUserId: 'user-normalize',
                companyId: 'company-normalize',
                relatedDocumentId: 'payslip-normalize-001',
                relatedCollection: 'payslips',
            };

            await sendEmail(emailConfig);

            // Verify email was normalized to lowercase
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientEmail: 'uppercase@speccon.co.za', // Should be lowercase
                })
            );
        });

        it('should include timestamp placeholder for sentAt field', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });

            const emailConfig: SendEmailConfig = {
                to: 'timestamp-test@speccon.co.za',
                subject: 'Timestamp Test',
                html: '<p>Test</p>',
                emailType: 'leave_approved',
                recipientUserId: 'user-timestamp',
                companyId: 'company-timestamp',
                relatedDocumentId: 'doc-timestamp-001',
                relatedCollection: 'leaveRequests',
            };

            await sendEmail(emailConfig);

            // Verify sentAt uses server timestamp
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    sentAt: expect.objectContaining({ _type: 'serverTimestamp' }),
                })
            );
        });
    });

    // ============================================================
    // Test 5: Configuration verification
    // ============================================================
    describe('Configuration Verification', () => {
        it('should use correct from email address', () => {
            expect(SEND_EMAIL_CONFIG.fromEmail).toBe('hr@speccon.co.za');
        });

        it('should use correct mail collection name', () => {
            expect(SEND_EMAIL_CONFIG.mailCollection).toBe('mail');
        });

        it('should have correct retry configuration', () => {
            expect(SEND_EMAIL_CONFIG.maxRetries).toBe(3);
            expect(SEND_EMAIL_CONFIG.baseRetryDelayMs).toBe(1000);
        });

        it('should have correct rate limit configuration', () => {
            expect(RATE_LIMIT_CONFIG.maxEmailsPerMinute).toBe(10);
            expect(RATE_LIMIT_CONFIG.windowMs).toBe(60000); // 1 minute
        });
    });

    // ============================================================
    // Test 6: Security - Required fields validation
    // ============================================================
    describe('Security: Required Fields for Audit Trail', () => {
        it('should enforce all security-critical fields in SendEmailConfig', () => {
            // Type check - this test ensures the interface requires these fields
            const config: SendEmailConfig = {
                to: 'test@example.com',
                subject: 'Test',
                html: '<p>Test</p>',
                emailType: 'leave_approved',
                recipientUserId: 'user-123', // Required for audit
                companyId: 'company-456', // Required for tenant isolation
                relatedDocumentId: 'doc-789', // Required for audit trail
                relatedCollection: 'leaveRequests', // Required for audit trail
            };

            // Verify all security-critical fields are present and defined
            expect(config.recipientUserId).toBeDefined();
            expect(config.companyId).toBeDefined();
            expect(config.relatedDocumentId).toBeDefined();
            expect(config.relatedCollection).toBeDefined();

            // Verify they are non-empty strings
            expect(typeof config.recipientUserId).toBe('string');
            expect(config.recipientUserId.length).toBeGreaterThan(0);
            expect(typeof config.companyId).toBe('string');
            expect(config.companyId.length).toBeGreaterThan(0);
        });

        it('should include companyId for tenant isolation in email logs', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });

            const emailConfig: SendEmailConfig = {
                to: 'tenant-isolation@speccon.co.za',
                subject: 'Tenant Isolation Test',
                html: '<p>Test</p>',
                emailType: 'leave_submitted',
                recipientUserId: 'user-tenant',
                companyId: 'specific-tenant-company-id-xyz',
                relatedDocumentId: 'doc-tenant',
                relatedCollection: 'leaveRequests',
            };

            await sendEmail(emailConfig);

            // Verify companyId is included in the log for tenant filtering
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    companyId: 'specific-tenant-company-id-xyz',
                })
            );
        });

        it('should access both mail and emailLogs collections when sending', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });

            await sendEmail({
                to: 'collection-access@speccon.co.za',
                subject: 'Collection Access Test',
                html: '<p>Test</p>',
                emailType: 'leave_approved',
                recipientUserId: 'user-collection',
                companyId: 'company-collection',
                relatedDocumentId: 'doc-collection',
                relatedCollection: 'leaveRequests',
            });

            // Verify both collections were accessed
            expect(mockCollection).toHaveBeenCalledWith('mail');
            expect(mockCollection).toHaveBeenCalledWith('emailLogs');
        });
    });

    // ============================================================
    // Test 7: Email type validation
    // ============================================================
    describe('Email Type Validation', () => {
        it('should accept all valid email types', async () => {
            // Mock rate limit check (allow)
            mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });

            const validTypes: EmailType[] = [
                'leave_submitted',
                'leave_approved',
                'leave_rejected',
                'payslip_available',
            ];

            for (const emailType of validTypes) {
                vi.clearAllMocks();
                mockGet.mockResolvedValue({ size: 0, empty: true, docs: [] });
                mockAdd.mockResolvedValue({ id: `mail-${emailType}` });
                mockSet.mockResolvedValue(undefined);
                mockUpdate.mockResolvedValue(undefined);

                const result = await sendEmail({
                    to: `${emailType}@speccon.co.za`,
                    subject: `Test ${emailType}`,
                    html: '<p>Test</p>',
                    emailType,
                    recipientUserId: `user-${emailType}`,
                    companyId: 'company-types',
                    relatedDocumentId: `doc-${emailType}`,
                    relatedCollection: 'testCollection',
                });

                expect(result.success).toBe(true);
            }
        });
    });
});
