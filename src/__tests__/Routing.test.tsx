// ============================================================
// ROUTING TESTS
// Tests for route configuration and navigation
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn((_auth, callback) => {
        // Default: no user logged in
        callback(null);
        return vi.fn();
    }),
    createUserWithEmailAndPassword: vi.fn(),
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

// Mock AccessRequestService
vi.mock('../services/accessRequestService', () => ({
    AccessRequestService: {
        createAccessRequest: vi.fn(),
        getAccessRequestByEmail: vi.fn(),
        getPendingAccessRequests: vi.fn().mockResolvedValue([]),
        getPendingRequestsCount: vi.fn().mockResolvedValue(0),
        approveAccessRequest: vi.fn(),
        rejectAccessRequest: vi.fn(),
    },
}));

// Mock CompanyService
vi.mock('../services/companyService', () => ({
    CompanyService: {
        getAllCompanies: vi.fn().mockResolvedValue([]),
    },
}));

// Mock UserService
vi.mock('../services/userService', () => ({
    UserService: {
        syncUserRoleOnLogin: vi.fn(),
        createUserProfile: vi.fn(),
        updateUserProfile: vi.fn(),
        hasAnyPermission: vi.fn().mockReturnValue(true),
    },
}));

// Mock EmployeeService
vi.mock('../services/employeeService', () => ({
    EmployeeService: {
        getEmployees: vi.fn().mockResolvedValue([]),
    },
}));

// Import components after mocks
import { SignUp } from '../pages/SignUp';
import { PendingApproval } from '../pages/PendingApproval';

/**
 * Helper to render component with router at specific path
 */
function renderWithRouter(
    component: React.ReactNode,
    { initialEntries = ['/'] } = {}
) {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            {component}
        </MemoryRouter>
    );
}

describe('Route Configuration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('/signup route', () => {
        it('should render SignUp component at /signup route', async () => {
            renderWithRouter(
                <Routes>
                    <Route path="/signup" element={<SignUp />} />
                </Routes>,
                { initialEntries: ['/signup'] }
            );

            // SignUp page should render - check for the signup form page class
            await waitFor(() => {
                expect(document.querySelector('.signup-page')).toBeInTheDocument();
            });

            // Form fields should be present
            expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('name@speccon.co.za')).toBeInTheDocument();
        });

        it('should be accessible without authentication (public route)', async () => {
            // Render SignUp without any auth wrapper - should work
            renderWithRouter(
                <Routes>
                    <Route path="/signup" element={<SignUp />} />
                </Routes>,
                { initialEntries: ['/signup'] }
            );

            // Page renders successfully without auth - check for submit button
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /request access/i })).toBeInTheDocument();
            });
        });
    });

    describe('/pending-approval route', () => {
        it('should render PendingApproval component at /pending-approval route', async () => {
            renderWithRouter(
                <Routes>
                    <Route path="/pending-approval" element={<PendingApproval />} />
                </Routes>,
                { initialEntries: ['/pending-approval'] }
            );

            // PendingApproval page should render with pending message
            await waitFor(() => {
                expect(screen.getByText(/being reviewed/i)).toBeInTheDocument();
            });

            // Return to login link should be present
            expect(screen.getByRole('link', { name: /return to login/i })).toBeInTheDocument();
        });

        it('should show pending status by default', async () => {
            renderWithRouter(
                <Routes>
                    <Route path="/pending-approval" element={<PendingApproval />} />
                </Routes>,
                { initialEntries: ['/pending-approval'] }
            );

            await waitFor(() => {
                expect(screen.getByText('Request Pending')).toBeInTheDocument();
            });
        });

        it('should be accessible without authentication (public route)', async () => {
            // Render PendingApproval without any auth wrapper - should work
            renderWithRouter(
                <Routes>
                    <Route path="/pending-approval" element={<PendingApproval />} />
                </Routes>,
                { initialEntries: ['/pending-approval'] }
            );

            // Page renders successfully without auth
            await waitFor(() => {
                expect(screen.getByText('Request Pending')).toBeInTheDocument();
            });
        });
    });

    describe('/admin/pending-approvals route (protected)', () => {
        it('should render PendingApprovals page when accessed by authenticated admin', async () => {
            // Mock AuthContext with System Admin user
            vi.doMock('../contexts/AuthContext', () => ({
                useAuth: () => ({
                    currentUser: { uid: 'admin-123', email: 'admin@test.com' },
                    userProfile: {
                        uid: 'admin-123',
                        email: 'admin@test.com',
                        role: 'System Admin',
                        isActive: true
                    },
                    loading: false,
                    accessRequestStatus: null,
                    checkAccessRequestStatus: vi.fn(),
                    setAccessRequestStatus: vi.fn(),
                    clearAccessRequestStatus: vi.fn(),
                }),
                AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
            }));

            // Mock PreviewModeContext
            vi.doMock('../contexts/PreviewModeContext', () => ({
                usePreviewMode: () => ({
                    isPreviewMode: false,
                    previewRole: null,
                    exitPreviewMode: vi.fn(),
                    enterPreviewMode: vi.fn(),
                }),
                PreviewModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
            }));

            // Import PendingApprovals after mocking context
            const { PendingApprovals } = await import('../pages/admin/PendingApprovals');

            renderWithRouter(
                <Routes>
                    <Route path="/admin/pending-approvals" element={<PendingApprovals />} />
                </Routes>,
                { initialEntries: ['/admin/pending-approvals'] }
            );

            // Admin page should render - check for page title element (h1 with class)
            await waitFor(() => {
                expect(document.querySelector('.pending-title')).toBeInTheDocument();
            });

            // Should show the subtitle
            expect(screen.getByText(/Review and approve access requests/i)).toBeInTheDocument();

            // Should show the table
            expect(document.querySelector('.pending-table')).toBeInTheDocument();
        });
    });

    describe('Navigation between routes', () => {
        it('should have link from SignUp page to Login page', async () => {
            renderWithRouter(
                <Routes>
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>,
                { initialEntries: ['/signup'] }
            );

            // Wait for page to render - check for signup page class
            await waitFor(() => {
                expect(document.querySelector('.signup-page')).toBeInTheDocument();
            });

            // Check for Sign In link
            const signInLink = screen.getByRole('link', { name: /sign in/i });
            expect(signInLink).toBeInTheDocument();
            expect(signInLink).toHaveAttribute('href', '/login');
        });

        it('should have link from PendingApproval page to Login page', async () => {
            renderWithRouter(
                <Routes>
                    <Route path="/pending-approval" element={<PendingApproval />} />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>,
                { initialEntries: ['/pending-approval'] }
            );

            await waitFor(() => {
                expect(screen.getByText('Request Pending')).toBeInTheDocument();
            });

            // Check for Return to Login link
            const returnLink = screen.getByRole('link', { name: /return to login/i });
            expect(returnLink).toBeInTheDocument();
            expect(returnLink).toHaveAttribute('href', '/login');
        });
    });
});
