// ============================================================
// FINANCE DASHBOARD PREVIEW COMPONENT
// Preview for Finance Approver and Finance Read-Only roles
// ============================================================

import './DashboardPreviews.css';

export function FinanceDashboardPreview() {

    return (
        <div className="dashboard-preview finance-preview">
            {/* Sample Data Notice */}
            <div className="preview-notice">
                <InfoIcon />
                <span>This is a preview with placeholder data for the Finance role.</span>
            </div>

            {/* Header */}
            <div className="preview-header">
                <div className="preview-header-content">
                    <h2 className="preview-title">Finance Dashboard</h2>
                    <p className="preview-subtitle">Review and approve payroll, view financial summaries</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="preview-stats">
                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--warning">
                        <ClipboardIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">3</span>
                        <span className="preview-stat-label">Pending Approvals</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--success">
                        <CheckCircleIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">12</span>
                        <span className="preview-stat-label">Approved This Month</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--primary">
                        <DollarIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">R2.4M</span>
                        <span className="preview-stat-label">Monthly Payroll Cost</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--info">
                        <TrendingUpIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">+3.2%</span>
                        <span className="preview-stat-label">YoY Change</span>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="preview-grid">
                {/* Pending Approvals */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <ClipboardIcon />
                            Pending Approvals
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-list">
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">January 2026 Payroll</div>
                                    <div className="preview-list-item-meta">248 employees - R2,450,000</div>
                                </div>
                                <span className="preview-status preview-status--pending">Awaiting Approval</span>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Bonus Payment - Q4</div>
                                    <div className="preview-list-item-meta">45 employees - R125,000</div>
                                </div>
                                <span className="preview-status preview-status--pending">Awaiting Approval</span>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Commission Payout</div>
                                    <div className="preview-list-item-meta">Sales team - R85,000</div>
                                </div>
                                <span className="preview-status preview-status--pending">Awaiting Approval</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <ChartIcon />
                            Financial Summary - YTD
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-info-grid">
                            <div className="preview-info-item">
                                <span className="preview-info-label">Total Gross Salaries</span>
                                <span className="preview-info-value">R28,750,000</span>
                            </div>
                            <div className="preview-info-item">
                                <span className="preview-info-label">Total Deductions</span>
                                <span className="preview-info-value">R7,850,000</span>
                            </div>
                            <div className="preview-info-item">
                                <span className="preview-info-label">Net Payments</span>
                                <span className="preview-info-value">R20,900,000</span>
                            </div>
                            <div className="preview-info-item">
                                <span className="preview-info-label">Employer Contributions</span>
                                <span className="preview-info-value">R4,312,500</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Approvals */}
                <div className="preview-card preview-card--full-width">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <CheckCircleIcon />
                            Recent Approval Activity
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-activity-list">
                            <div className="preview-activity-item">
                                <div className="preview-activity-icon preview-activity-icon--success">
                                    <CheckIcon />
                                </div>
                                <div className="preview-activity-content">
                                    <div className="preview-activity-title">December 2025 Payroll Approved</div>
                                    <div className="preview-activity-meta">Approved by J. Finance - 23 Dec 2025</div>
                                </div>
                                <div className="preview-activity-amount">R2,380,000</div>
                            </div>
                            <div className="preview-activity-item">
                                <div className="preview-activity-icon preview-activity-icon--success">
                                    <CheckIcon />
                                </div>
                                <div className="preview-activity-content">
                                    <div className="preview-activity-title">13th Cheque Payment Approved</div>
                                    <div className="preview-activity-meta">Approved by J. Finance - 18 Dec 2025</div>
                                </div>
                                <div className="preview-activity-amount">R1,200,000</div>
                            </div>
                            <div className="preview-activity-item">
                                <div className="preview-activity-icon preview-activity-icon--success">
                                    <CheckIcon />
                                </div>
                                <div className="preview-activity-content">
                                    <div className="preview-activity-title">November 2025 Payroll Approved</div>
                                    <div className="preview-activity-meta">Approved by J. Finance - 22 Nov 2025</div>
                                </div>
                                <div className="preview-activity-amount">R2,380,000</div>
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

function ClipboardIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
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

function DollarIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}

function TrendingUpIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}

function ChartIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
