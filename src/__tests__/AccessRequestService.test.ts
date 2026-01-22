// ============================================================
// ACCESS REQUEST SERVICE TESTS
// Tests for AccessRequestService functionality
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
    AccessRequest,
    CreateAccessRequestData,
    ApproveAccessRequestData,
} from '../types/accessRequest';
import type { UserRole } from '../types/user';

// Mock Firestore
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockGetCountFromServer = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockServerTimestamp = vi.fn(() => ({ _type: 'serverTimestamp' }));

vi.mock('firebase/firestore', () => ({
    doc: (...args: unknown[]) => mockDoc(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    getCountFromServer: (...args: unknown[]) => mockGetCountFromServer(...args),
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    where: (...args: unknown[]) => mockWhere(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    serverTimestamp: () => mockServerTimestamp(),
}));

vi.mock('../firebase', () => ({
    db: {},
}));

// Import after mocks are set up
import { AccessRequestService } from '../services/accessRequestService';

describe('AccessRequestService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock implementations
        mockDoc.mockReturnValue({ id: 'test-request-id' });
        mockCollection.mockReturnValue({ id: 'access_requests' });
        mockQuery.mockReturnValue({});
        mockWhere.mockReturnValue({});
        mockOrderBy.mockReturnValue({});
    });

    describe('createAccessRequest', () => {
        it('should create a new access request with valid data', async () => {
            const createData: CreateAccessRequestData = {
                email: 'john.doe@example.com',
                firstName: 'John',
                lastName: 'Doe',
                passwordHash: 'hashed_password_123',
            };

            // Mock no existing request
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
            mockSetDoc.mockResolvedValue(undefined);

            const result = await AccessRequestService.createAccessRequest(createData);

            expect(result).toBe('test-request-id');
            expect(mockSetDoc).toHaveBeenCalledTimes(1);
            expect(mockSetDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    email: 'john.doe@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    passwordHash: 'hashed_password_123',
                    status: 'pending',
                    reviewedAt: null,
                    reviewedBy: null,
                    assignedRole: null,
                    assignedCompanyId: null,
                    linkedEmployeeId: null,
                })
            );
        });

        it('should normalize email to lowercase', async () => {
            const createData: CreateAccessRequestData = {
                email: 'JOHN.DOE@EXAMPLE.COM',
                firstName: 'John',
                lastName: 'Doe',
                passwordHash: 'hashed_password_123',
            };

            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
            mockSetDoc.mockResolvedValue(undefined);

            await AccessRequestService.createAccessRequest(createData);

            expect(mockSetDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    email: 'john.doe@example.com',
                })
            );
        });

        it('should throw error if pending request already exists for email', async () => {
            const createData: CreateAccessRequestData = {
                email: 'john.doe@example.com',
                firstName: 'John',
                lastName: 'Doe',
                passwordHash: 'hashed_password_123',
            };

            // Mock existing pending request
            mockGetDocs.mockResolvedValueOnce({
                empty: false,
                docs: [
                    {
                        data: () => ({
                            id: 'existing-id',
                            email: 'john.doe@example.com',
                            status: 'pending',
                        }),
                    },
                ],
            });

            await expect(
                AccessRequestService.createAccessRequest(createData)
            ).rejects.toThrow('An access request for this email is already pending.');
        });
    });

    describe('getPendingAccessRequests', () => {
        it('should fetch all pending access requests', async () => {
            const mockPendingRequests: Partial<AccessRequest>[] = [
                {
                    id: 'request-1',
                    email: 'user1@example.com',
                    firstName: 'User',
                    lastName: 'One',
                    status: 'pending',
                },
                {
                    id: 'request-2',
                    email: 'user2@example.com',
                    firstName: 'User',
                    lastName: 'Two',
                    status: 'pending',
                },
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockPendingRequests.map((req) => ({
                    data: () => req,
                })),
            });

            const result = await AccessRequestService.getPendingAccessRequests();

            expect(result).toHaveLength(2);
            expect(result[0].email).toBe('user1@example.com');
            expect(result[1].email).toBe('user2@example.com');
            expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
            expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
        });

        it('should return empty array when no pending requests exist', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
            });

            const result = await AccessRequestService.getPendingAccessRequests();

            expect(result).toHaveLength(0);
        });
    });

    describe('approveAccessRequest', () => {
        it('should approve a pending access request with role and company', async () => {
            const mockRequest: Partial<AccessRequest> = {
                id: 'request-1',
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                status: 'pending',
            };

            const approvalData: ApproveAccessRequestData = {
                reviewerId: 'admin-uid-123',
                assignedRole: 'Employee' as UserRole,
                assignedCompanyId: 'company-123',
                linkedEmployeeId: 'employee-456',
            };

            mockGetDoc
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => mockRequest,
                })
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => ({
                        ...mockRequest,
                        status: 'approved',
                        reviewedBy: 'admin-uid-123',
                        assignedRole: 'Employee',
                        assignedCompanyId: 'company-123',
                        linkedEmployeeId: 'employee-456',
                    }),
                });

            mockUpdateDoc.mockResolvedValue(undefined);

            const result = await AccessRequestService.approveAccessRequest(
                'request-1',
                approvalData
            );

            expect(result.status).toBe('approved');
            expect(result.assignedRole).toBe('Employee');
            expect(result.assignedCompanyId).toBe('company-123');
            expect(result.linkedEmployeeId).toBe('employee-456');
            expect(mockUpdateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    status: 'approved',
                    reviewedBy: 'admin-uid-123',
                    assignedRole: 'Employee',
                    assignedCompanyId: 'company-123',
                    linkedEmployeeId: 'employee-456',
                })
            );
        });

        it('should throw error when trying to approve non-pending request', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'request-1',
                    status: 'approved',
                }),
            });

            const approvalData: ApproveAccessRequestData = {
                reviewerId: 'admin-uid-123',
                assignedRole: 'Employee' as UserRole,
                assignedCompanyId: 'company-123',
            };

            await expect(
                AccessRequestService.approveAccessRequest('request-1', approvalData)
            ).rejects.toThrow('Cannot approve request with status: approved');
        });
    });

    describe('rejectAccessRequest', () => {
        it('should reject a pending access request', async () => {
            const mockRequest: Partial<AccessRequest> = {
                id: 'request-1',
                email: 'user@example.com',
                status: 'pending',
            };

            mockGetDoc
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => mockRequest,
                })
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => ({
                        ...mockRequest,
                        status: 'rejected',
                        reviewedBy: 'admin-uid-123',
                    }),
                });

            mockUpdateDoc.mockResolvedValue(undefined);

            const result = await AccessRequestService.rejectAccessRequest(
                'request-1',
                'admin-uid-123'
            );

            expect(result.status).toBe('rejected');
            expect(result.reviewedBy).toBe('admin-uid-123');
            expect(mockUpdateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    status: 'rejected',
                    reviewedBy: 'admin-uid-123',
                })
            );
        });

        it('should throw error when request not found', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => false,
            });

            await expect(
                AccessRequestService.rejectAccessRequest('non-existent-id', 'admin-uid')
            ).rejects.toThrow('Access request not found.');
        });
    });

    describe('getAccessRequestByEmail', () => {
        it('should return pending request when found', async () => {
            const mockRequest: Partial<AccessRequest> = {
                id: 'request-1',
                email: 'user@example.com',
                status: 'pending',
            };

            mockGetDocs.mockResolvedValueOnce({
                empty: false,
                docs: [{ data: () => mockRequest }],
            });

            const result = await AccessRequestService.getAccessRequestByEmail(
                'user@example.com'
            );

            expect(result).not.toBeNull();
            expect(result?.email).toBe('user@example.com');
            expect(result?.status).toBe('pending');
        });

        it('should return null when no request exists for email', async () => {
            mockGetDocs.mockResolvedValue({
                empty: true,
                docs: [],
            });

            const result = await AccessRequestService.getAccessRequestByEmail(
                'nonexistent@example.com'
            );

            expect(result).toBeNull();
        });

        it('should handle email case-insensitively', async () => {
            mockGetDocs.mockResolvedValueOnce({
                empty: true,
                docs: [],
            }).mockResolvedValueOnce({
                empty: true,
                docs: [],
            });

            await AccessRequestService.getAccessRequestByEmail('USER@EXAMPLE.COM');

            // Check that the where clause was called with lowercase email
            expect(mockWhere).toHaveBeenCalledWith('email', '==', 'user@example.com');
        });
    });

    describe('getPendingRequestsCount', () => {
        it('should return the count of pending requests', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 5 }),
            });

            const result = await AccessRequestService.getPendingRequestsCount();

            expect(result).toBe(5);
            expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
        });

        it('should return 0 when no pending requests exist', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 }),
            });

            const result = await AccessRequestService.getPendingRequestsCount();

            expect(result).toBe(0);
        });
    });
});
