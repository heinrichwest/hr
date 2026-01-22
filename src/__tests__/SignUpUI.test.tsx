// ============================================================
// SIGN-UP UI COMPONENT TESTS
// Tests for SignUp form and PendingApproval page components
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock AccessRequestService
const mockCreateAccessRequest = vi.fn();
vi.mock('../services/accessRequestService', () => ({
    AccessRequestService: {
        createAccessRequest: (...args: unknown[]) => mockCreateAccessRequest(...args),
        getAccessRequestByEmail: vi.fn(),
    },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
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

/**
 * Helper function to fill in form inputs by placeholder text
 */
function fillInputByPlaceholder(placeholder: string, value: string) {
    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value } });
}

/**
 * Helper to submit the signup form via form element
 */
function submitForm() {
    const form = document.querySelector('form.signup-form');
    if (form) {
        fireEvent.submit(form);
    }
}

describe('SignUp UI Components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('SignUp Form', () => {
        it('should render all required form fields', () => {
            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Check for all required fields by placeholder
            expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('name@speccon.co.za')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Minimum 8 characters')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument();

            // Check for submit button
            expect(screen.getByRole('button', { name: /request access/i })).toBeInTheDocument();
        });

        it('should validate email format and show error message', async () => {
            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill in invalid email
            fillInputByPlaceholder('John', 'TestFirst');
            fillInputByPlaceholder('Doe', 'TestLast');
            fillInputByPlaceholder('name@speccon.co.za', 'invalid-email');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password123');

            // Submit form via form element
            submitForm();

            // Check for email validation error - exact text from SignUp component
            await waitFor(() => {
                expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
            });
        });

        it('should validate password minimum length (8 characters)', async () => {
            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill in short password
            fillInputByPlaceholder('John', 'TestFirst');
            fillInputByPlaceholder('Doe', 'TestLast');
            fillInputByPlaceholder('name@speccon.co.za', 'john@example.com');
            fillInputByPlaceholder('Minimum 8 characters', 'short');
            fillInputByPlaceholder('Re-enter your password', 'short');

            // Submit form
            submitForm();

            // Check for password length validation error - exact text from SignUp component
            await waitFor(() => {
                expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
            });
        });

        it('should validate passwords match', async () => {
            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill in mismatched passwords
            fillInputByPlaceholder('John', 'TestFirst');
            fillInputByPlaceholder('Doe', 'TestLast');
            fillInputByPlaceholder('name@speccon.co.za', 'john@example.com');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password456');

            // Submit form
            submitForm();

            // Check for password match validation error - exact text from SignUp component
            await waitFor(() => {
                expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
            });
        });

        it('should create access request on successful form submission', async () => {
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
            submitForm();

            // Check that AccessRequestService was called
            await waitFor(() => {
                expect(mockCreateAccessRequest).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: 'john@example.com',
                        firstName: 'John',
                        lastName: 'Doe',
                        passwordHash: expect.any(String),
                    })
                );
            });
        });

        it('should show duplicate email error message', async () => {
            mockCreateAccessRequest.mockRejectedValue(
                new Error('An access request for this email is already pending.')
            );

            render(
                <BrowserRouter>
                    <SignUp />
                </BrowserRouter>
            );

            // Fill in all valid fields
            fillInputByPlaceholder('John', 'John');
            fillInputByPlaceholder('Doe', 'Doe');
            fillInputByPlaceholder('name@speccon.co.za', 'existing@example.com');
            fillInputByPlaceholder('Minimum 8 characters', 'password123');
            fillInputByPlaceholder('Re-enter your password', 'password123');

            // Submit form
            submitForm();

            // Check for duplicate email error
            await waitFor(() => {
                expect(screen.getByText(/already pending/i)).toBeInTheDocument();
            });
        });
    });

    describe('PendingApproval Page', () => {
        it('should render pending status message', () => {
            render(
                <BrowserRouter>
                    <PendingApproval />
                </BrowserRouter>
            );

            // Default should show pending message
            expect(screen.getByText(/being reviewed/i)).toBeInTheDocument();
        });

        it('should render return to login button', () => {
            render(
                <BrowserRouter>
                    <PendingApproval />
                </BrowserRouter>
            );

            // Check for return to login button/link
            expect(screen.getByRole('link', { name: /return to login/i })).toBeInTheDocument();
        });
    });
});
