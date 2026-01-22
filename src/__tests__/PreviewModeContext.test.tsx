// ============================================================
// PREVIEW MODE CONTEXT TESTS
// Tests for PreviewModeContext functionality
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewModeProvider, usePreviewMode } from '../contexts/PreviewModeContext';

// Test component to access context values
function TestComponent() {
    const { isPreviewMode, previewRole, setPreviewRole, exitPreviewMode } = usePreviewMode();

    return (
        <div>
            <span data-testid="is-preview-mode">{isPreviewMode.toString()}</span>
            <span data-testid="preview-role">{previewRole || 'null'}</span>
            <button data-testid="set-hr-admin" onClick={() => setPreviewRole('HR Admin')}>
                Set HR Admin
            </button>
            <button data-testid="set-system-admin" onClick={() => setPreviewRole('System Admin')}>
                Set System Admin
            </button>
            <button data-testid="exit-preview" onClick={exitPreviewMode}>
                Exit Preview
            </button>
        </div>
    );
}

describe('PreviewModeContext', () => {
    it('should provide default values (isPreviewMode: false, previewRole: null)', () => {
        render(
            <PreviewModeProvider>
                <TestComponent />
            </PreviewModeProvider>
        );

        expect(screen.getByTestId('is-preview-mode').textContent).toBe('false');
        expect(screen.getByTestId('preview-role').textContent).toBe('null');
    });

    it('should wrap children correctly and render them', () => {
        render(
            <PreviewModeProvider>
                <div data-testid="child">Child Content</div>
            </PreviewModeProvider>
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByTestId('child').textContent).toBe('Child Content');
    });

    it('should update state when setPreviewRole is called with a non-System Admin role', () => {
        render(
            <PreviewModeProvider>
                <TestComponent />
            </PreviewModeProvider>
        );

        fireEvent.click(screen.getByTestId('set-hr-admin'));

        expect(screen.getByTestId('is-preview-mode').textContent).toBe('true');
        expect(screen.getByTestId('preview-role').textContent).toBe('HR Admin');
    });

    it('should reset state when exitPreviewMode is called', () => {
        render(
            <PreviewModeProvider>
                <TestComponent />
            </PreviewModeProvider>
        );

        // First enter preview mode
        fireEvent.click(screen.getByTestId('set-hr-admin'));
        expect(screen.getByTestId('is-preview-mode').textContent).toBe('true');

        // Then exit preview mode
        fireEvent.click(screen.getByTestId('exit-preview'));

        expect(screen.getByTestId('is-preview-mode').textContent).toBe('false');
        expect(screen.getByTestId('preview-role').textContent).toBe('null');
    });

    it('should exit preview mode when System Admin role is selected', () => {
        render(
            <PreviewModeProvider>
                <TestComponent />
            </PreviewModeProvider>
        );

        // First enter preview mode
        fireEvent.click(screen.getByTestId('set-hr-admin'));
        expect(screen.getByTestId('is-preview-mode').textContent).toBe('true');

        // Select System Admin to exit preview
        fireEvent.click(screen.getByTestId('set-system-admin'));

        expect(screen.getByTestId('is-preview-mode').textContent).toBe('false');
        expect(screen.getByTestId('preview-role').textContent).toBe('null');
    });

    it('should provide context values accessible via usePreviewMode hook', () => {
        render(
            <PreviewModeProvider>
                <TestComponent />
            </PreviewModeProvider>
        );

        // Verify all elements rendered by usePreviewMode are present
        expect(screen.getByTestId('is-preview-mode')).toBeInTheDocument();
        expect(screen.getByTestId('preview-role')).toBeInTheDocument();
        expect(screen.getByTestId('set-hr-admin')).toBeInTheDocument();
        expect(screen.getByTestId('exit-preview')).toBeInTheDocument();
    });
});
