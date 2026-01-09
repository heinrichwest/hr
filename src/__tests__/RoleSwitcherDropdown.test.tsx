// ============================================================
// ROLE SWITCHER DROPDOWN TESTS
// Tests for RoleSwitcherDropdown component
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleSwitcherDropdown } from '../components/RoleSwitcher/RoleSwitcherDropdown';
import { PreviewModeProvider } from '../contexts/PreviewModeContext';
import { AuthProvider } from '../contexts/AuthContext';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', async () => {
    const actual = await vi.importActual('../contexts/AuthContext');
    return {
        ...actual,
        useAuth: () => mockUseAuth(),
    };
});

// Mock usePreviewMode hook
const mockSetPreviewRole = vi.fn();
const mockExitPreviewMode = vi.fn();
const mockUsePreviewMode = vi.fn();
vi.mock('../contexts/PreviewModeContext', async () => {
    const actual = await vi.importActual('../contexts/PreviewModeContext');
    return {
        ...actual,
        usePreviewMode: () => mockUsePreviewMode(),
    };
});

describe('RoleSwitcherDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSetPreviewRole.mockClear();
        mockExitPreviewMode.mockClear();
    });

    it('should render for System Admin users', () => {
        mockUseAuth.mockReturnValue({
            userProfile: { role: 'System Admin' },
        });
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: false,
            previewRole: null,
            setPreviewRole: mockSetPreviewRole,
            exitPreviewMode: mockExitPreviewMode,
        });

        render(<RoleSwitcherDropdown />);

        expect(screen.getByRole('button', { name: /switch role preview/i })).toBeInTheDocument();
    });

    it('should NOT render for non-System Admin users', () => {
        mockUseAuth.mockReturnValue({
            userProfile: { role: 'HR Admin' },
        });
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: false,
            previewRole: null,
            setPreviewRole: mockSetPreviewRole,
            exitPreviewMode: mockExitPreviewMode,
        });

        const { container } = render(<RoleSwitcherDropdown />);

        expect(container.firstChild).toBeNull();
    });

    it('should open dropdown and display all 11 roles when clicked', () => {
        mockUseAuth.mockReturnValue({
            userProfile: { role: 'System Admin' },
        });
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: false,
            previewRole: null,
            setPreviewRole: mockSetPreviewRole,
            exitPreviewMode: mockExitPreviewMode,
        });

        render(<RoleSwitcherDropdown />);

        const trigger = screen.getByRole('button', { name: /switch role preview/i });
        fireEvent.click(trigger);

        // Check all 11 roles are displayed
        expect(screen.getByText('System Admin')).toBeInTheDocument();
        expect(screen.getByText('HR Admin')).toBeInTheDocument();
        expect(screen.getByText('HR Manager')).toBeInTheDocument();
        expect(screen.getByText('Payroll Admin')).toBeInTheDocument();
        expect(screen.getByText('Payroll Manager')).toBeInTheDocument();
        expect(screen.getByText('Finance Approver')).toBeInTheDocument();
        expect(screen.getByText('Finance Read-Only')).toBeInTheDocument();
        expect(screen.getByText('Line Manager')).toBeInTheDocument();
        expect(screen.getByText('IR Officer')).toBeInTheDocument();
        expect(screen.getByText('IR Manager')).toBeInTheDocument();
        expect(screen.getByText('Employee')).toBeInTheDocument();
    });

    it('should call setPreviewRole with correct role when a role is clicked', () => {
        mockUseAuth.mockReturnValue({
            userProfile: { role: 'System Admin' },
        });
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: false,
            previewRole: null,
            setPreviewRole: mockSetPreviewRole,
            exitPreviewMode: mockExitPreviewMode,
        });

        render(<RoleSwitcherDropdown />);

        // Open dropdown
        const trigger = screen.getByRole('button', { name: /switch role preview/i });
        fireEvent.click(trigger);

        // Click on HR Admin role
        const hrAdminOption = screen.getByRole('option', { name: /hr admin/i });
        fireEvent.click(hrAdminOption);

        expect(mockSetPreviewRole).toHaveBeenCalledWith('HR Admin');
    });

    it('should close dropdown when clicking outside', () => {
        mockUseAuth.mockReturnValue({
            userProfile: { role: 'System Admin' },
        });
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: false,
            previewRole: null,
            setPreviewRole: mockSetPreviewRole,
            exitPreviewMode: mockExitPreviewMode,
        });

        render(
            <div>
                <RoleSwitcherDropdown />
                <div data-testid="outside">Outside element</div>
            </div>
        );

        // Open dropdown
        const trigger = screen.getByRole('button', { name: /switch role preview/i });
        fireEvent.click(trigger);

        // Verify dropdown is open
        expect(screen.getByRole('listbox')).toBeInTheDocument();

        // Click outside
        fireEvent.mouseDown(screen.getByTestId('outside'));

        // Dropdown should be closed
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should show current preview role when in preview mode', () => {
        mockUseAuth.mockReturnValue({
            userProfile: { role: 'System Admin' },
        });
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: true,
            previewRole: 'Employee',
            setPreviewRole: mockSetPreviewRole,
            exitPreviewMode: mockExitPreviewMode,
        });

        render(<RoleSwitcherDropdown />);

        expect(screen.getByText('Employee')).toBeInTheDocument();
        expect(screen.getByText('Previewing')).toBeInTheDocument();
    });
});
