// ============================================================
// PREVIEW MODE BANNER COMPONENT
// Displays a persistent banner when System Admin is previewing a role
// ============================================================

import { usePreviewMode } from '../../contexts/PreviewModeContext';
import './PreviewModeBanner.css';

export function PreviewModeBanner() {
    const { isPreviewMode, previewRole, exitPreviewMode } = usePreviewMode();

    // Only render when in preview mode
    if (!isPreviewMode || !previewRole) {
        return null;
    }

    return (
        <div className="preview-banner" role="status" aria-live="polite">
            <div className="preview-banner-content">
                <span className="preview-banner-icon">
                    <EyeIcon />
                </span>
                <span className="preview-banner-text">
                    <strong>Preview Mode:</strong> Viewing dashboard as <strong>{previewRole}</strong>
                </span>
                <button
                    className="preview-banner-exit"
                    onClick={exitPreviewMode}
                    aria-label="Exit preview mode"
                >
                    <CloseIcon />
                    <span>Exit Preview</span>
                </button>
            </div>
        </div>
    );
}

// Icon Components
function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
