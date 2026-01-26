// ============================================================
// COMPLIANCE INDICATORS COMPONENT
// ============================================================

import type { ComplianceFlag } from '../../types/reports';
import './ComplianceIndicators.css';

interface ComplianceIndicatorsProps {
    flags: ComplianceFlag[];
    unauthorizedAbsenceCount?: number;
}

export function ComplianceIndicators({ flags, unauthorizedAbsenceCount }: ComplianceIndicatorsProps) {
    if (flags.length === 0 && !unauthorizedAbsenceCount) {
        return (
            <span className="compliance-indicator-none">
                No issues
            </span>
        );
    }

    return (
        <div className="compliance-indicators">
            {flags.map((flag, index) => (
                <div key={index} className="compliance-indicator-wrapper">
                    <div
                        className={`compliance-indicator compliance-indicator--${flag.severity}`}
                        title={`${flag.message}\n${flag.ruleTriggered}`}
                    >
                        {getIconForFlagType(flag.type)}
                        <span className="compliance-indicator-text">{getFlagLabel(flag.type)}</span>
                    </div>
                </div>
            ))}
            {unauthorizedAbsenceCount && unauthorizedAbsenceCount > 0 ? (
                <div className="compliance-indicator-wrapper">
                    <div
                        className="compliance-indicator compliance-indicator--error"
                        title="Unauthorized absence count"
                    >
                        <AlertCircleIcon />
                        <span className="compliance-indicator-text">
                            {unauthorizedAbsenceCount} unauthorized
                        </span>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function getIconForFlagType(type: string) {
    switch (type) {
        case 'medical_certificate_required':
            return <AlertTriangleIcon />;
        case 'bcea_violation_risk':
            return <AlertCircleIcon />;
        case 'attendance_counseling_recommended':
            return <InfoIcon />;
        default:
            return <AlertTriangleIcon />;
    }
}

function getFlagLabel(type: string): string {
    switch (type) {
        case 'medical_certificate_required':
            return 'Certificate Required';
        case 'bcea_violation_risk':
            return 'BCEA Violation Risk';
        case 'attendance_counseling_recommended':
            return 'Counseling Recommended';
        case 'unauthorized_absence':
            return 'Unauthorized';
        default:
            return 'Flag';
    }
}

// Icon Components
function AlertTriangleIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function AlertCircleIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}

function InfoIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}
