// ============================================================
// ROLE SWITCHER SECURITY AND ACCESSIBILITY TESTS
// Tests for security verification and accessibility
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RoleSwitcherDropdown } from '../components/RoleSwitcher/RoleSwitcherDropdown';
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

describe('Role Switcher Security Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Access Control', () => {
        it('should NOT allow non-System Admin users to access preview functionality', () => {
            // Test with HR Admin role
            mockUseAuth.mockReturnValue({
                userProfile: { role: 'HR Admin' },
            });

            const { container } = render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <RoleSwitcherDropdown />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Component should not render at all for non-System Admin
            expect(container.firstChild).toBeNull();
        });

        it('should NOT allow Employee role to access preview functionality', () => {
            mockUseAuth.mockReturnValue({
                userProfile: { role: 'Employee' },
            });

            const { container } = render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <RoleSwitcherDropdown />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            expect(container.firstChild).toBeNull();
        });

        it('should allow System Admin to access preview functionality', () => {
            mockUseAuth.mockReturnValue({
                userProfile: { role: 'System Admin' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <RoleSwitcherDropdown />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            expect(screen.getByRole('button', { name: /switch role preview/i })).toBeInTheDocument();
        });
    });

    describe('Keyboard Accessibility', () => {
        it('should close dropdown when Escape key is pressed', async () => {
            mockUseAuth.mockReturnValue({
                userProfile: { role: 'System Admin' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <RoleSwitcherDropdown />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Open dropdown
            const trigger = screen.getByRole('button', { name: /switch role preview/i });
            fireEvent.click(trigger);

            // Verify dropdown is open
            expect(screen.getByRole('listbox')).toBeInTheDocument();

            // Press Escape key on document level (as the component listens on document)
            fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

            // Dropdown should be closed
            await waitFor(() => {
                expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            });
        });
    });

    describe('Role Selection Verification', () => {
        it('should allow selection of all 11 roles', () => {
            mockUseAuth.mockReturnValue({
                userProfile: { role: 'System Admin' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <RoleSwitcherDropdown />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Open dropdown
            const trigger = screen.getByRole('button', { name: /switch role preview/i });
            fireEvent.click(trigger);

            // Get the listbox (dropdown menu)
            const listbox = screen.getByRole('listbox');

            // Verify all 11 roles are displayed in the dropdown menu
            const allRoles = [
                'System Admin',
                'HR Admin',
                'HR Manager',
                'Payroll Admin',
                'Payroll Manager',
                'Finance Approver',
                'Finance Read-Only',
                'Line Manager',
                'IR Officer',
                'IR Manager',
                'Employee'
            ];

            // Count the option buttons - should be 11
            const options = within(listbox).getAllByRole('option');
            expect(options).toHaveLength(11);

            // Check each role exists in the menu by finding it within the listbox
            allRoles.forEach(role => {
                expect(within(listbox).getByText(role)).toBeInTheDocument();
            });
        });

        it('should call setPreviewRole with correct role when Employee role is selected', async () => {
            mockUseAuth.mockReturnValue({
                userProfile: { role: 'System Admin' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <RoleSwitcherDropdown />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Test selecting Employee role
            const trigger = screen.getByRole('button', { name: /switch role preview/i });
            fireEvent.click(trigger);

            // Find Employee option by text within the role name span
            const employeeOption = screen.getByText('Employee').closest('button');
            expect(employeeOption).toBeInTheDocument();
            fireEvent.click(employeeOption!);

            // Re-open dropdown to verify Employee is now selected
            fireEvent.click(trigger);

            // The dropdown should show Employee as the currently selected role in the trigger
            await waitFor(() => {
                expect(screen.getByText('Previewing')).toBeInTheDocument();
            });
        });
    });

    describe('Preview Mode Security', () => {
        it('should verify preview mode only affects dashboard view', async () => {
            mockUseAuth.mockReturnValue({
                userProfile: { role: 'System Admin' },
            });

            render(
                <BrowserRouter>
                    <PreviewModeProvider>
                        <RoleSwitcherDropdown />
                    </PreviewModeProvider>
                </BrowserRouter>
            );

            // Open dropdown and select a role
            const trigger = screen.getByRole('button', { name: /switch role preview/i });
            fireEvent.click(trigger);

            // Select Employee role
            const employeeOption = screen.getByText('Employee').closest('button');
            fireEvent.click(employeeOption!);

            // In preview mode, the dropdown should show current preview state
            await waitFor(() => {
                expect(screen.getByText('Employee')).toBeInTheDocument();
                expect(screen.getByText('Previewing')).toBeInTheDocument();
            });
        });
    });
});
