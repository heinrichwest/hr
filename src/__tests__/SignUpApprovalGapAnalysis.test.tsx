// ============================================================
// SIGN-UP AND APPROVAL GAP ANALYSIS TESTS
// Strategic tests to fill critical coverage gaps for the
// User Sign-up and Role Approval feature (Task Group 7)
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { AccessRequest } from '../types/accessRequest';

// =============================================================
// MOCK SETUP - Must be hoisted before imports
// =============================================================

// Mock navigate function
const mockNavigate = vi.fn();

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn((_auth, callback) => {
        callback(null);
        return vi.fn();
    }),
    signInWithEmailAndPassword: vi.fn(),
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
const mockCreateAccessRequest = vi.fn();
const mockGetAccessRequestByEmail = vi.fn();
vi.mock('../services/accessRequestService', () => ({
    AccessRequestService: {
        createAccessRequest: (...args: unknown[]) => mockCreateAccessRequest(...args),
        getAccessRequestByEmail: (...args: unknown[]) => mockGetAccessRequestByEmail(...args),
        getPendingAccessRequests: vi.fn().mockResolvedValue([]),
        getPendingRequestsCount: vi.fn().mockResolvedValue(0),
        approveAccessRequest: vi.fn(),
        rejectAccessRequest: vi.fn(),
    },
}));

// Mock UserService
vi.mock('../services/userService', () => ({
    UserService: {
        syncUserRoleOnLogin: vi.fn().mockResolvedValue(null),
        createUserProfile: vi.fn(),
        updateUserProfile: vi.fn(),
        initializeSystem: vi.fn(),
        hasAnyPermission: vi.fn().mockReturnValue(true),
    },
}));

// Mock react-router-dom useNavigate
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: null }),
    };
});

// Import components after mocks
import { SignUp } from '../pages/SignUp';
import { PendingApproval } from '../pages/PendingApproval';
import { checkAccessRequestStatus } from '../contexts/AuthContext';

// Helper to fill in form inputs
function fillInputByPlaceholder(placeholder: string, value: string) {
    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value } });
}

// Helper to submit signup form
function submitSignupForm() {
    const form = document.querySelector('form.signup-form');
    if (form) {
        fireEvent.submit(form);
    }
}

// =============================================================
// GAP ANALYSIS TESTS (10 Strategic Tests)
// =============================================================

describe('Sign-up and Approval - Gap Analysis Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAccessRequestByEmail.mockResolvedValue(null);
    });

    // =========================================================
    // Test 1: Login flow checks for pending status
    // =========================================================
    describe('Login Flow Integration', () => {
        it('should return pending status when user has pending access request', async () => {
            // Mock a pending access request
            mockGetAccessRequestByEmail.mockResolvedValue({
                id: 'request-1',
                email: 'pending@example.com',
                status: 'pending',
                firstName: 'Test',
                lastName: 'User',
            } as Partial<AccessRequest>);

            // Verify the status check returns pending
            const status = await checkAccessRequestStatus('pending@example.com');
            expect(status).toBe('pending');
        });

        it('should return rejected status for rejected user', async () => {
            // Mock a rejected access request
            mockGetAccessRequestByEmail.mockResolvedValue({
                id: 'request-1',
                email: 'rejected@example.com',
                status: 'rejected',
                firstName: 'Test',
                lastName: 'User',
            } as Partial<AccessRequest>);

            const status = await checkAccessRequestStatus('rejected@example.com');
            expect(status).toBe('rejected');
        });
    });

    // =========================================================
    // Test 2: Approved user can log in (status returns none)
    // =========================================================
    describe('Approved User Login', () => {
        it('should return none status for approved user allowing normal login', async () => {
            // Mock an approved access request
            mockGetAccessRequestByEmail.mockResolvedValue({
                id: 'request-1',
                email: 'approved@example.com',
                status: 'approved',
                firstName: 'Test',
                lastName: 'User',
                assignedRole: 'Employee',
                assignedCompanyId: 'company-1',
            } as Partial<AccessRequest>);

            // For approved users, status should be 'none' (allow normal login)
            const status = await checkAccessRequestStatus('approved@example.com');
            expect(status).toBe('none');
        });

        it('should return none status for user without any access request', async () => {
            // No access request exists for this email
            mockGetAccessRequestByEmail.mockResolvedValue(null);

            const status = await checkAccessRequestStatus('newuser@example.com');
            expect(status).toBe('none');
        });
    });

    // =========================================================
    // Test 3: Error handling returns none to allow login attempt
    // =========================================================
    describe('Auth Context Error Handling', () => {
        it('should return none status when service throws error to allow login attempt', async () => {
            // Mock the service to throw an error
            mockGetAccessRequestByEmail.mockRejectedValue(new Error('Service unavailable'));

            // Should gracefully handle error and return 'none' to allow login attempt
            const status = await checkAccessRequestStatus('test@example.com');
            expect(status).toBe('none');
        });
    });

    // =========================================================
    // Test 4: SignUp handles existing approved email error
    // =========================================================
    describe('Existing User Email Handling', () => {
        it('should display error when signing up with already approved email', async () => {
            // Mock error for existing approved user
            mockCreateAccessRequest.mockRejectedValue(
                new Error('An account with this email already exists.')
            );

            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill in form with existing user email
            fillInputByPlaceholder('John', 'John');
            fillInputByPlaceholder('Doe', 'Doe');
            fillInputByPlaceholder('name@speccon.co.za', 'existing@example.com');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password123');

            // Submit form
            submitSignupForm();

            // Check for error message
            await waitFor(() => {
                expect(screen.getByText(/already exists/i)).toBeInTheDocument();
            });
        });
    });

    // =========================================================
    // Test 5: SignUp handles network errors gracefully
    // =========================================================
    describe('Network Error Handling', () => {
        it('should display error message on network failure during signup', async () => {
            // Mock a network error
            mockCreateAccessRequest.mockRejectedValue(
                new Error('Network request failed')
            );

            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill in valid form data
            fillInputByPlaceholder('John', 'John');
            fillInputByPlaceholder('Doe', 'Doe');
            fillInputByPlaceholder('name@speccon.co.za', 'test@example.com');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password123');

            // Submit form
            submitSignupForm();

            // Should show the error message from the exception
            await waitFor(() => {
                expect(screen.getByText(/Network request failed/i)).toBeInTheDocument();
            });
        });
    });

    // =========================================================
    // Test 6: Required first name validation
    // =========================================================
    describe('Required Field Validation', () => {
        it('should show validation error when first name is empty', async () => {
            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill all fields except firstName
            fillInputByPlaceholder('Doe', 'Doe');
            fillInputByPlaceholder('name@speccon.co.za', 'test@example.com');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password123');

            // Submit form
            submitSignupForm();

            // Validation should show error for firstName
            await waitFor(() => {
                expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
            });

            // Service should NOT be called
            expect(mockCreateAccessRequest).not.toHaveBeenCalled();
        });

        it('should show validation error when last name is empty', async () => {
            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill all fields except lastName
            fillInputByPlaceholder('John', 'John');
            fillInputByPlaceholder('name@speccon.co.za', 'test@example.com');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password123');

            // Submit form
            submitSignupForm();

            // Validation should show error for lastName
            await waitFor(() => {
                expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
            });

            // Service should NOT be called
            expect(mockCreateAccessRequest).not.toHaveBeenCalled();
        });
    });

    // =========================================================
    // Test 7: SignUp shows success state after submission
    // =========================================================
    describe('SignUp Success State', () => {
        it('should display success message after successful submission', async () => {
            mockCreateAccessRequest.mockResolvedValue('new-request-id');

            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill in all valid fields
            fillInputByPlaceholder('John', 'John');
            fillInputByPlaceholder('Doe', 'Doe');
            fillInputByPlaceholder('name@speccon.co.za', 'john@example.com');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password123');

            // Submit form
            submitSignupForm();

            // Should show success state with message about being reviewed
            await waitFor(() => {
                expect(screen.getByText(/Request Submitted!/i)).toBeInTheDocument();
            }, { timeout: 3000 });

            // Success message should mention pending review
            expect(screen.getByText(/pending review/i)).toBeInTheDocument();
        });
    });

    // =========================================================
    // Test 8: Email normalization to lowercase
    // =========================================================
    describe('Email Normalization', () => {
        it('should normalize email to lowercase before submission', async () => {
            mockCreateAccessRequest.mockResolvedValue('new-request-id');

            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill in form with uppercase email
            fillInputByPlaceholder('John', 'John');
            fillInputByPlaceholder('Doe', 'Doe');
            fillInputByPlaceholder('name@speccon.co.za', 'JOHN@EXAMPLE.COM');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password123');

            // Submit form
            submitSignupForm();

            // Check that the service was called with lowercase email
            await waitFor(() => {
                expect(mockCreateAccessRequest).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: 'john@example.com',
                    })
                );
            });
        });
    });

    // =========================================================
    // Test 9: PendingApproval page renders correctly
    // =========================================================
    describe('PendingApproval Page', () => {
        it('should render pending approval page with status information', () => {
            render(
                <BrowserRouter>
                    <PendingApproval />
                </BrowserRouter>
            );

            // Should show the pending approval page
            expect(document.querySelector('.pending-approval-page')).toBeInTheDocument();

            // Should have return to login link
            expect(screen.getByRole('link', { name: /return to login/i })).toBeInTheDocument();
        });
    });

    // =========================================================
    // Test 10: Navigation to pending-approval after success
    // =========================================================
    describe('Post-Submission Navigation', () => {
        it('should navigate to pending-approval page after successful submission', async () => {
            mockCreateAccessRequest.mockResolvedValue('new-request-id');

            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill in all valid fields
            fillInputByPlaceholder('John', 'John');
            fillInputByPlaceholder('Doe', 'Doe');
            fillInputByPlaceholder('name@speccon.co.za', 'john@example.com');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password123');

            // Submit form
            submitSignupForm();

            // Wait for success state
            await waitFor(() => {
                expect(screen.getByText(/Request Submitted!/i)).toBeInTheDocument();
            });

            // Wait for navigation (2 second delay in component)
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith(
                    '/pending-approval',
                    expect.objectContaining({
                        state: expect.objectContaining({
                            status: 'pending',
                        }),
                    })
                );
            }, { timeout: 3000 });
        });
    });
});
