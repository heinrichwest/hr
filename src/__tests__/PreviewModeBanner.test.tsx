// ============================================================
// PREVIEW MODE BANNER TESTS
// Tests for PreviewModeBanner component
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewModeBanner } from '../components/RoleSwitcher/PreviewModeBanner';

// Mock usePreviewMode hook
const mockExitPreviewMode = vi.fn();
const mockUsePreviewMode = vi.fn();
vi.mock('../contexts/PreviewModeContext', () => ({
    usePreviewMode: () => mockUsePreviewMode(),
}));

describe('PreviewModeBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExitPreviewMode.mockClear();
    });

    it('should NOT render when isPreviewMode is false', () => {
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: false,
            previewRole: null,
            exitPreviewMode: mockExitPreviewMode,
        });

        const { container } = render(<PreviewModeBanner />);

        expect(container.firstChild).toBeNull();
    });

    it('should render with correct role name when previewing', () => {
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: true,
            previewRole: 'HR Admin',
            exitPreviewMode: mockExitPreviewMode,
        });

        render(<PreviewModeBanner />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText(/preview mode/i)).toBeInTheDocument();
        expect(screen.getByText('HR Admin')).toBeInTheDocument();
    });

    it('should call exitPreviewMode when Exit Preview button is clicked', () => {
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: true,
            previewRole: 'Employee',
            exitPreviewMode: mockExitPreviewMode,
        });

        render(<PreviewModeBanner />);

        const exitButton = screen.getByRole('button', { name: /exit preview/i });
        fireEvent.click(exitButton);

        expect(mockExitPreviewMode).toHaveBeenCalledTimes(1);
    });

    it('should display warning styling (amber/warning color scheme)', () => {
        mockUsePreviewMode.mockReturnValue({
            isPreviewMode: true,
            previewRole: 'Payroll Admin',
            exitPreviewMode: mockExitPreviewMode,
        });

        render(<PreviewModeBanner />);

        const banner = screen.getByRole('status');
        expect(banner).toHaveClass('preview-banner');
        // The amber color is applied via CSS, this test ensures the class is present
    });

    it('should display different role names correctly', () => {
        const testRoles = ['Employee', 'HR Manager', 'Line Manager', 'IR Officer'];

        testRoles.forEach((role) => {
            mockUsePreviewMode.mockReturnValue({
                isPreviewMode: true,
                previewRole: role,
                exitPreviewMode: mockExitPreviewMode,
            });

            const { unmount } = render(<PreviewModeBanner />);
            expect(screen.getByText(role)).toBeInTheDocument();
            unmount();
        });
    });
});
