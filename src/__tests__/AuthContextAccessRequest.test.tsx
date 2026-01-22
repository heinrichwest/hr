// ============================================================
// AUTH CONTEXT ACCESS REQUEST TESTS
// Tests for auth flow handling of access request states
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { AccessRequest } from '../types/accessRequest';

// Mock AccessRequestService
const mockGetAccessRequestByEmail = vi.fn();
vi.mock('../services/accessRequestService', () => ({
    AccessRequestService: {
        getAccessRequestByEmail: (...args: unknown[]) => mockGetAccessRequestByEmail(...args),
    },
}));

// Mock Firebase Auth
const mockOnAuthStateChanged = vi.fn();
vi.mock('firebase/auth', () => ({
    onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}));

// Mock Firebase
vi.mock('../firebase', () => ({
    auth: {},
    db: {},
}));

// Mock UserService
vi.mock('../services/userService', () => ({
    UserService: {
        syncUserRoleOnLogin: vi.fn().mockResolvedValue({
            uid: 'test-uid',
            email: 'test@example.com',
            role: 'Employee',
        }),
    },
}));

// Import the utility function and context after mocks
import { checkAccessRequestStatus, AuthProvider, useAuth } from '../contexts/AuthContext';

describe('Auth Context Access Request Status', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('checkAccessRequestStatus utility', () => {
        it('should return "pending" when email has pending access request', async () => {
            const mockPendingRequest: Partial<AccessRequest> = {
                id: 'request-1',
                email: 'pending@example.com',
                status: 'pending',
                firstName: 'Test',
                lastName: 'User',
            };

            mockGetAccessRequestByEmail.mockResolvedValue(mockPendingRequest);

            const result = await checkAccessRequestStatus('pending@example.com');

            expect(result).toBe('pending');
            expect(mockGetAccessRequestByEmail).toHaveBeenCalledWith('pending@example.com');
        });

        it('should return "rejected" when email has rejected access request', async () => {
            const mockRejectedRequest: Partial<AccessRequest> = {
                id: 'request-2',
                email: 'rejected@example.com',
                status: 'rejected',
                firstName: 'Test',
                lastName: 'User',
            };

            mockGetAccessRequestByEmail.mockResolvedValue(mockRejectedRequest);

            const result = await checkAccessRequestStatus('rejected@example.com');

            expect(result).toBe('rejected');
            expect(mockGetAccessRequestByEmail).toHaveBeenCalledWith('rejected@example.com');
        });

        it('should return "none" when email has approved access request (user can login normally)', async () => {
            const mockApprovedRequest: Partial<AccessRequest> = {
                id: 'request-3',
                email: 'approved@example.com',
                status: 'approved',
                firstName: 'Test',
                lastName: 'User',
            };

            mockGetAccessRequestByEmail.mockResolvedValue(mockApprovedRequest);

            const result = await checkAccessRequestStatus('approved@example.com');

            expect(result).toBe('none');
            expect(mockGetAccessRequestByEmail).toHaveBeenCalledWith('approved@example.com');
        });

        it('should return "none" when no access request exists for email (normal login attempt)', async () => {
            mockGetAccessRequestByEmail.mockResolvedValue(null);

            const result = await checkAccessRequestStatus('newuser@example.com');

            expect(result).toBe('none');
            expect(mockGetAccessRequestByEmail).toHaveBeenCalledWith('newuser@example.com');
        });
    });

    describe('AuthProvider with access request status', () => {
        it('should expose accessRequestStatus in context value', async () => {
            // Mock auth state with no user logged in
            mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
                callback(null);
                return () => {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // accessRequestStatus should be available in context
            expect(result.current).toHaveProperty('accessRequestStatus');
        });

        it('should expose checkAccessRequestStatus function in context', async () => {
            mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
                callback(null);
                return () => {};
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // checkAccessRequestStatus function should be available
            expect(result.current).toHaveProperty('checkAccessRequestStatus');
            expect(typeof result.current.checkAccessRequestStatus).toBe('function');
        });
    });

    describe('Access request status checking during login flow', () => {
        it('should detect pending status before allowing login', async () => {
            const mockPendingRequest: Partial<AccessRequest> = {
                id: 'request-1',
                email: 'pending@example.com',
                status: 'pending',
            };

            mockGetAccessRequestByEmail.mockResolvedValue(mockPendingRequest);

            const status = await checkAccessRequestStatus('pending@example.com');

            expect(status).toBe('pending');
            // In real login flow, this would prevent Firebase auth and show pending message
        });

        it('should detect rejected status and show rejection message', async () => {
            const mockRejectedRequest: Partial<AccessRequest> = {
                id: 'request-2',
                email: 'rejected@example.com',
                status: 'rejected',
            };

            mockGetAccessRequestByEmail.mockResolvedValue(mockRejectedRequest);

            const status = await checkAccessRequestStatus('rejected@example.com');

            expect(status).toBe('rejected');
            // In real login flow, this would show rejection message
        });
    });
});
