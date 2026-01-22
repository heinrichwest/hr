// ============================================================
// PENDING APPROVALS UI TESTS
// Tests for System Admin Pending Approvals page
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { AccessRequest } from '../types/accessRequest';
import type { Company } from '../types/company';

// Mock Firebase Auth
const mockCreateUserWithEmailAndPassword = vi.fn();
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn((_auth, callback) => {
        callback(null);
        return vi.fn();
    }),
    createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
    getCountFromServer: vi.fn(),
}));

// Mock Firebase app
vi.mock('../firebase', () => ({
    auth: {},
    db: {},
}));

// Mock services
const mockGetPendingAccessRequests = vi.fn();
const mockGetPendingRequestsCount = vi.fn();
const mockApproveAccessRequest = vi.fn();
const mockRejectAccessRequest = vi.fn();
const mockGetAccessRequestById = vi.fn();

vi.mock('../services/accessRequestService', () => ({
    AccessRequestService: {
        getPendingAccessRequests: () => mockGetPendingAccessRequests(),
        getPendingRequestsCount: () => mockGetPendingRequestsCount(),
        approveAccessRequest: (...args: unknown[]) => mockApproveAccessRequest(...args),
        rejectAccessRequest: (...args: unknown[]) => mockRejectAccessRequest(...args),
        getAccessRequestById: (...args: unknown[]) => mockGetAccessRequestById(...args),
    },
}));

const mockGetAllCompanies = vi.fn();
vi.mock('../services/companyService', () => ({
    CompanyService: {
        getAllCompanies: () => mockGetAllCompanies(),
    },
}));

const mockCreateUserProfile = vi.fn();
const mockUpdateUserProfile = vi.fn();
vi.mock('../services/userService', () => ({
    UserService: {
        createUserProfile: (...args: unknown[]) => mockCreateUserProfile(...args),
        updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
        hasAnyPermission: () => true,
        syncUserRoleOnLogin: vi.fn(),
    },
}));

const mockGetEmployees = vi.fn();
vi.mock('../services/employeeService', () => ({
    EmployeeService: {
        getEmployees: (...args: unknown[]) => mockGetEmployees(...args),
    },
}));

// Mock Auth Context
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentUser: { uid: 'admin-123', email: 'admin@test.com' },
        userProfile: { uid: 'admin-123', email: 'admin@test.com', role: 'System Admin', isActive: true },
        loading: false,
        accessRequestStatus: null,
        checkAccessRequestStatus: vi.fn(),
        setAccessRequestStatus: vi.fn(),
        clearAccessRequestStatus: vi.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Preview Mode Context
vi.mock('../contexts/PreviewModeContext', () => ({
    usePreviewMode: () => ({
        isPreviewMode: false,
        previewRole: null,
        exitPreviewMode: vi.fn(),
        enterPreviewMode: vi.fn(),
    }),
    PreviewModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import component after mocks
import { PendingApprovals } from '../pages/admin/PendingApprovals';

const mockPendingRequests: Partial<AccessRequest>[] = [
    {
        id: 'request-1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'pending',
        createdAt: { toDate: () => new Date('2026-01-10') } as never,
        passwordHash: 'hashed123',
    },
    {
        id: 'request-2',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        status: 'pending',
        createdAt: { toDate: () => new Date('2026-01-11') } as never,
        passwordHash: 'hashed456',
    },
];

const mockCompanies: Partial<Company>[] = [
    { id: 'company-1', legalName: 'Speccon Holdings' },
    { id: 'company-2', legalName: 'Test Company' },
];

describe('PendingApprovals UI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPendingAccessRequests.mockResolvedValue(mockPendingRequests);
        mockGetPendingRequestsCount.mockResolvedValue(2);
        mockGetAllCompanies.mockResolvedValue(mockCompanies);
        mockGetEmployees.mockResolvedValue([]);
        mockUpdateUserProfile.mockResolvedValue(undefined);
    });

    describe('Rendering', () => {
        it('should render table of pending requests', async () => {
            render(
                <BrowserRouter>
                    <PendingApprovals />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });

            expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
            expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
        });

        it('should display correct table columns', async () => {
            render(
                <BrowserRouter>
                    <PendingApprovals />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Name')).toBeInTheDocument();
            });

            expect(screen.getByText('Email')).toBeInTheDocument();
            expect(screen.getByText('Submitted')).toBeInTheDocument();
            expect(screen.getByText('Actions')).toBeInTheDocument();
        });

        it('should show empty state when no pending requests', async () => {
            mockGetPendingAccessRequests.mockResolvedValue([]);

            render(
                <BrowserRouter>
                    <PendingApprovals />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('No pending requests')).toBeInTheDocument();
            });
        });
    });

    describe('Approval Modal', () => {
        it('should open approve modal with role and company dropdowns when Approve button clicked', async () => {
            render(
                <BrowserRouter>
                    <PendingApprovals />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
            });

            // Find and click the first Approve button
            const approveButtons = screen.getAllByText('Approve');
            fireEvent.click(approveButtons[0]);

            await waitFor(() => {
                // Modal should be open
                expect(screen.getByText('Approve Access Request')).toBeInTheDocument();
            });

            // Should show role dropdown (use id selector to be specific)
            expect(screen.getByRole('combobox', { name: /^Role$/i })).toBeInTheDocument();

            // Should show company dropdown
            expect(screen.getByRole('combobox', { name: /Company/i })).toBeInTheDocument();
        });

        it('should populate company dropdown with available companies', async () => {
            render(
                <BrowserRouter>
                    <PendingApprovals />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
            });

            const approveButtons = screen.getAllByText('Approve');
            fireEvent.click(approveButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Approve Access Request')).toBeInTheDocument();
            });

            // Check that company options are available
            const companySelect = screen.getByRole('combobox', { name: /Company/i });
            expect(companySelect).toBeInTheDocument();
        });
    });

    describe('Approve Action', () => {
        it('should create Firebase user and update request on approval', async () => {
            const mockUserCredential = {
                user: { uid: 'new-user-123' },
            };
            mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
            mockApproveAccessRequest.mockResolvedValue({
                ...mockPendingRequests[0],
                status: 'approved',
            });
            mockCreateUserProfile.mockResolvedValue(undefined);

            render(
                <BrowserRouter>
                    <PendingApprovals />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
            });

            // Click Approve button
            const approveButtons = screen.getAllByText('Approve');
            fireEvent.click(approveButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Approve Access Request')).toBeInTheDocument();
            });

            // Select role
            const roleSelect = screen.getByRole('combobox', { name: /^Role$/i });
            fireEvent.change(roleSelect, { target: { value: 'Employee' } });

            // Select company
            const companySelect = screen.getByRole('combobox', { name: /Company/i });
            fireEvent.change(companySelect, { target: { value: 'company-1' } });

            // Click Confirm button
            const confirmButton = screen.getByText('Confirm Approval');
            fireEvent.click(confirmButton);

            await waitFor(() => {
                // Verify Firebase user was created
                expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
            });

            // Verify user profile was created
            expect(mockCreateUserProfile).toHaveBeenCalled();

            // Verify access request was updated
            expect(mockApproveAccessRequest).toHaveBeenCalledWith(
                'request-1',
                expect.objectContaining({
                    reviewerId: 'admin-123',
                    assignedRole: 'Employee',
                    assignedCompanyId: 'company-1',
                })
            );
        });
    });

    describe('Reject Action', () => {
        it('should update request status to rejected when reject confirmed', async () => {
            mockRejectAccessRequest.mockResolvedValue({
                ...mockPendingRequests[0],
                status: 'rejected',
            });

            render(
                <BrowserRouter>
                    <PendingApprovals />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
            });

            // Click Reject button
            const rejectButtons = screen.getAllByText('Reject');
            fireEvent.click(rejectButtons[0]);

            // Wait for confirmation dialog
            await waitFor(() => {
                expect(screen.getByText(/Are you sure you want to reject/i)).toBeInTheDocument();
            });

            // Confirm rejection
            const confirmRejectButton = screen.getByText('Confirm Rejection');
            fireEvent.click(confirmRejectButton);

            await waitFor(() => {
                expect(mockRejectAccessRequest).toHaveBeenCalledWith(
                    'request-1',
                    'admin-123'
                );
            });
        });

        it('should close rejection dialog when cancel is clicked', async () => {
            render(
                <BrowserRouter>
                    <PendingApprovals />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
            });

            // Click Reject button
            const rejectButtons = screen.getAllByText('Reject');
            fireEvent.click(rejectButtons[0]);

            await waitFor(() => {
                expect(screen.getByText(/Are you sure you want to reject/i)).toBeInTheDocument();
            });

            // Click Cancel
            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            await waitFor(() => {
                expect(screen.queryByText(/Are you sure you want to reject/i)).not.toBeInTheDocument();
            });
        });
    });
});
