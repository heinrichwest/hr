// ============================================================
// TAKE-ON SHEET INTEGRATION TESTS
// Tests for integration with AccessRequest approval workflow
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessRequestService } from '../services/accessRequestService';
import type { AccessRequest } from '../types/accessRequest';

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => ({ id: 'mock-doc-id' })),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(() => ({})),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    getCountFromServer: vi.fn(() => ({ data: () => ({ count: 0 }) })),
}));

// Helper to create mock access request
const createMockAccessRequest = (overrides?: Partial<AccessRequest>): AccessRequest => ({
    id: 'request-123',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: 'hashedpassword',
    status: 'pending',
    createdAt: { toMillis: () => Date.now() } as unknown as AccessRequest['createdAt'],
    reviewedAt: null,
    reviewedBy: null,
    assignedRole: null,
    assignedCompanyId: null,
    linkedEmployeeId: null,
    takeOnSheetId: null,
    ...overrides,
});

describe('TakeOnSheet Integration with AccessRequest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('approveAccessRequest with take-on sheet check', () => {
        it('should block approval when take-on sheet is not complete', async () => {
            const { getDoc, doc, getDocs } = await import('firebase/firestore');

            // Mock access request exists and is pending
            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => createMockAccessRequest({
                    takeOnSheetId: 'sheet-123',
                }),
            } as never);

            // Mock take-on sheet query returns incomplete sheet
            vi.mocked(getDocs).mockResolvedValueOnce({
                empty: false,
                docs: [{
                    data: () => ({
                        id: 'sheet-123',
                        status: 'pending_hr_review', // Not complete
                        companyId: 'company-456',
                    }),
                }],
            } as never);

            // Attempt to approve should be blocked
            await expect(
                AccessRequestService.approveAccessRequest('request-123', {
                    reviewerId: 'admin-789',
                    assignedRole: 'Employee',
                    assignedCompanyId: 'company-456',
                })
            ).rejects.toThrow(/take-on sheet/i);
        });
    });

    describe('AccessRequest with takeOnSheetId field', () => {
        it('should include takeOnSheetId field in AccessRequest interface', () => {
            const accessRequest = createMockAccessRequest({
                takeOnSheetId: 'sheet-123',
            });

            expect(accessRequest).toHaveProperty('takeOnSheetId');
            expect(accessRequest.takeOnSheetId).toBe('sheet-123');
        });

        it('should allow null takeOnSheetId for legacy requests', () => {
            const accessRequest = createMockAccessRequest({
                takeOnSheetId: null,
            });

            expect(accessRequest.takeOnSheetId).toBeNull();
        });
    });
});
