// ============================================================
// PAYROLL DASHBOARD PREVIEW COMPONENT
// Preview for Payroll Admin and Payroll Manager roles
// ============================================================

import './DashboardPreviews.css';

export function PayrollDashboardPreview() {
    return (
        <div className="dashboard-preview payroll-preview">
            {/* Sample Data Notice */}
            <div className="preview-notice">
                <InfoIcon />
                <span>This is a preview with placeholder data for the Payroll role.</span>
            </div>

            {/* Header */}
            <div className="preview-header">
                <div className="preview-header-content">
                    <h2 className="preview-title">Payroll Dashboard</h2>
                    <p className="preview-subtitle">Manage payroll runs, calculations, and pay processing</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="preview-stats">
                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--primary">
                        <DollarIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">R2.4M</span>
                        <span className="preview-stat-label">Monthly Payroll</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--warning">
                        <CalculatorIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">15</span>
                        <span className="preview-stat-label">Pending Calculations</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--success">
                        <CheckCircleIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">In Progress</span>
                        <span className="preview-stat-label">Current Pay Run Status</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--info">
                        <CalendarIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">25 Jan</span>
                        <span className="preview-stat-label">Next Pay Date</span>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="preview-grid">
                {/* Current Pay Run */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <DollarIcon />
                            Current Pay Run - January 2026
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-info-grid">
                            <div className="preview-info-item">
                                <span className="preview-info-label">Status</span>
                                <span className="preview-status preview-status--pending">In Progress</span>
                            </div>
                            <div className="preview-info-item">
                                <span className="preview-info-label">Employees</span>
                                <span className="preview-info-value">248</span>
                            </div>
                            <div className="preview-info-item">
                                <span className="preview-info-label">Gross Total</span>
                                <span className="preview-info-value">R2,450,000</span>
                            </div>
                            <div className="preview-info-item">
                                <span className="preview-info-label">Net Total</span>
                                <span className="preview-info-value">R1,862,500</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Calculations */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <CalculatorIcon />
                            Pending Calculations
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-list">
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Overtime Adjustments</div>
                                    <div className="preview-list-item-meta">8 employees affected</div>
                                </div>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Commission Calculations</div>
                                    <div className="preview-list-item-meta">Sales team - 15 employees</div>
                                </div>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Leave Deductions</div>
                                    <div className="preview-list-item-meta">3 unpaid leave cases</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Pay Dates */}
                <div className="preview-card preview-card--full-width">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <CalendarIcon />
                            Upcoming Pay Schedule
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-schedule-grid">
                            <div className="preview-schedule-item">
                                <div className="preview-schedule-date">25 Jan 2026</div>
                                <div className="preview-schedule-info">
                                    <span className="preview-schedule-type">Monthly Salary</span>
                                    <span className="preview-schedule-status preview-status--pending">Processing</span>
                                </div>
                            </div>
                            <div className="preview-schedule-item">
                                <div className="preview-schedule-date">25 Feb 2026</div>
                                <div className="preview-schedule-info">
                                    <span className="preview-schedule-type">Monthly Salary</span>
                                    <span className="preview-schedule-status preview-status--approved">Scheduled</span>
                                </div>
                            </div>
                            <div className="preview-schedule-item">
                                <div className="preview-schedule-date">25 Mar 2026</div>
                                <div className="preview-schedule-info">
                                    <span className="preview-schedule-type">Monthly Salary</span>
                                    <span className="preview-schedule-status preview-status--approved">Scheduled</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon Components
function InfoIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}

function DollarIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}

function CalculatorIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="8" y2="10.01" />
            <line x1="12" y1="10" x2="12" y2="10.01" />
            <line x1="16" y1="10" x2="16" y2="10.01" />
            <line x1="8" y1="14" x2="8" y2="14.01" />
            <line x1="12" y1="14" x2="12" y2="14.01" />
            <line x1="16" y1="14" x2="16" y2="14.01" />
            <line x1="8" y1="18" x2="8" y2="18.01" />
            <line x1="12" y1="18" x2="12" y2="18.01" />
            <line x1="16" y1="18" x2="16" y2="18.01" />
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
