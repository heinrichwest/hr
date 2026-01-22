// ============================================================
// INTEGRATION TESTS
// Tests for component integration and workflow
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { PreviewModeProvider } from '../contexts/PreviewModeContext';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', async () => {
    const actual = await vi.importActual('../contexts/AuthContext');
    return {
        ...actual,
        useAuth: () => mockUseAuth(),
    };
});

// Mock Firebase auth
vi.mock('../firebase', () => ({
    auth: {
        signOut: vi.fn(),
    },
}));

// Mock UserService
vi.mock('../services/userService', () => ({
    UserService: {
        hasAnyPermission: () => true,
    },
}));

describe('Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('RoleSwitcherDropdown in MainLayout', () => {
        it('should appear in MainLayout header for System Admin users', () => {
            mockUseAuth.mockReturnValue({
                userProfile: {
                    role: 'System Admin',
                    displayName: 'Admin User',
                    uid: 'test-uid-123',
                },
                currentUser: { email: 'admin@test.com' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <MainLayout>
                            <div>Content</div>
                        </MainLayout>
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // RoleSwitcherDropdown should be present
            expect(screen.getByRole('button', { name: /switch role preview/i })).toBeInTheDocument();
        });

        it('should NOT appear in MainLayout header for non-System Admin users', () => {
            mockUseAuth.mockReturnValue({
                userProfile: {
                    role: 'HR Admin',
                    displayName: 'HR User',
                    uid: 'test-uid-123',
                },
                currentUser: { email: 'hr@test.com' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <MainLayout>
                            <div>Content</div>
                        </MainLayout>
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // RoleSwitcherDropdown should NOT be present
            expect(screen.queryByRole('button', { name: /switch role preview/i })).not.toBeInTheDocument();
        });
    });

    describe('PreviewModeBanner in MainLayout', () => {
        it('should appear when preview mode is active', async () => {
            mockUseAuth.mockReturnValue({
                userProfile: {
                    role: 'System Admin',
                    displayName: 'Admin User',
                    uid: 'test-uid-123',
                },
                currentUser: { email: 'admin@test.com' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <MainLayout>
                            <div>Content</div>
                        </MainLayout>
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Open the role switcher dropdown
            const roleSwitcherTrigger = screen.getByRole('button', { name: /switch role preview/i });
            fireEvent.click(roleSwitcherTrigger);

            // Select a role (HR Admin) - use exact text match
            const listbox = screen.getByRole('listbox');
            const hrAdminOption = within(listbox).getByText('HR Admin').closest('button');
            fireEvent.click(hrAdminOption!);

            // Preview banner should appear
            await waitFor(() => {
                expect(screen.getByRole('status')).toBeInTheDocument();
                expect(screen.getByText(/preview mode/i)).toBeInTheDocument();
            });
        });

        it('should NOT appear when preview mode is not active', () => {
            mockUseAuth.mockReturnValue({
                userProfile: {
                    role: 'System Admin',
                    displayName: 'Admin User',
                    uid: 'test-uid-123',
                },
                currentUser: { email: 'admin@test.com' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <MainLayout>
                            <div>Content</div>
                        </MainLayout>
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Preview banner should NOT be present initially
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });
    });

    describe('Dashboard preview content', () => {
        it('should render correct preview content based on selected role', async () => {
            mockUseAuth.mockReturnValue({
                userProfile: {
                    role: 'System Admin',
                    displayName: 'Admin User',
                    uid: 'test-uid-123',
                },
                currentUser: { email: 'admin@test.com' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <Dashboard />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Open the role switcher dropdown
            const roleSwitcherTrigger = screen.getByRole('button', { name: /switch role preview/i });
            fireEvent.click(roleSwitcherTrigger);

            // Select Employee role - find by exact text match in the listbox
            const listbox = screen.getByRole('listbox');
            const employeeOption = within(listbox).getByText('Employee').closest('button');
            fireEvent.click(employeeOption!);

            // Employee dashboard preview content should appear
            await waitFor(() => {
                expect(screen.getByText(/employee self-service/i)).toBeInTheDocument();
            });
        });

        it('should show original dashboard content when exiting preview mode', async () => {
            mockUseAuth.mockReturnValue({
                userProfile: {
                    role: 'System Admin',
                    displayName: 'Admin User',
                    uid: 'test-uid-123',
                },
                currentUser: { email: 'admin@test.com' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <Dashboard />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Open the role switcher and select a role
            const roleSwitcherTrigger = screen.getByRole('button', { name: /switch role preview/i });
            fireEvent.click(roleSwitcherTrigger);

            // Select Employee role - use exact text
            const listbox = screen.getByRole('listbox');
            const employeeOption = within(listbox).getByText('Employee').closest('button');
            fireEvent.click(employeeOption!);

            // Wait for preview mode to activate
            await waitFor(() => {
                expect(screen.getByRole('status')).toBeInTheDocument();
            });

            // Click Exit Preview button
            const exitButton = screen.getByRole('button', { name: /exit preview/i });
            fireEvent.click(exitButton);

            // Should return to original dashboard
            await waitFor(() => {
                expect(screen.getByText(/system administration/i)).toBeInTheDocument();
            });
        });
    });

    describe('Role selection workflow', () => {
        it('should show corresponding dashboard when selecting different roles', async () => {
            mockUseAuth.mockReturnValue({
                userProfile: {
                    role: 'System Admin',
                    displayName: 'Admin User',
                    uid: 'test-uid-123',
                },
                currentUser: { email: 'admin@test.com' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <Dashboard />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Test HR Admin selection
            const roleSwitcherTrigger = screen.getByRole('button', { name: /switch role preview/i });
            fireEvent.click(roleSwitcherTrigger);

            // Use exact text match
            const listbox = screen.getByRole('listbox');
            const hrAdminOption = within(listbox).getByText('HR Admin').closest('button');
            fireEvent.click(hrAdminOption!);

            await waitFor(() => {
                // HR Dashboard preview should be visible
                expect(screen.getByText(/hr dashboard/i)).toBeInTheDocument();
            });
        });
    });
});
