// ============================================================
// EMPLOYEE DASHBOARD PREVIEW COMPONENT
// Preview of Employee Self-Service dashboard with mock data
// ============================================================

import {
    MOCK_EMPLOYEE,
    MOCK_LEAVE_BALANCES,
    MOCK_PAYSLIPS,
    MOCK_LEAVE_REQUESTS,
} from '../../data/mockEmployeeData';
import './DashboardPreviews.css';

export function EmployeeDashboardPreview() {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
        }).format(amount);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'approved':
                return 'preview-status--approved';
            case 'pending':
                return 'preview-status--pending';
            case 'rejected':
                return 'preview-status--rejected';
            case 'cancelled':
                return 'preview-status--cancelled';
            default:
                return '';
        }
    };

    return (
        <div className="dashboard-preview employee-preview">
            {/* Sample Data Notice */}
            <div className="preview-notice">
                <InfoIcon />
                <span>This is a preview with sample data. Actual employee data will vary.</span>
            </div>

            {/* Header */}
            <div className="preview-header">
                <div className="preview-header-content">
                    <h2 className="preview-title">Good morning, {MOCK_EMPLOYEE.firstName}!</h2>
                    <p className="preview-subtitle">Welcome to your Employee Self-Service portal</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="preview-quick-actions">
                <div className="preview-quick-action">
                    <div className="preview-quick-action-icon preview-quick-action-icon--leave">
                        <CalendarIcon />
                    </div>
                    <span className="preview-quick-action-label">Apply for Leave</span>
                </div>
                <div className="preview-quick-action">
                    <div className="preview-quick-action-icon preview-quick-action-icon--payslip">
                        <DocumentIcon />
                    </div>
                    <span className="preview-quick-action-label">View Payslips</span>
                </div>
                <div className="preview-quick-action">
                    <div className="preview-quick-action-icon preview-quick-action-icon--profile">
                        <UserIcon />
                    </div>
                    <span className="preview-quick-action-label">My Profile</span>
                </div>
                <div className="preview-quick-action">
                    <div className="preview-quick-action-icon preview-quick-action-icon--history">
                        <ClockIcon />
                    </div>
                    <span className="preview-quick-action-label">Leave History</span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="preview-grid">
                {/* Leave Balances */}
                <div className="preview-card preview-card--full-width">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <CalendarIcon />
                            Leave Balances
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-leave-balances">
                            {MOCK_LEAVE_BALANCES.map((balance) => (
                                <div key={balance.id} className="preview-leave-balance-card">
                                    <div className="preview-leave-balance-type">
                                        {balance.leaveTypeName}
                                    </div>
                                    <div className="preview-leave-balance-value">
                                        {balance.currentBalance}
                                        <span className="preview-leave-balance-unit">days</span>
                                    </div>
                                    <div className="preview-leave-balance-details">
                                        <span>Taken: {balance.taken}</span>
                                        <span>Pending: {balance.pending}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Leave Requests */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <ClockIcon />
                            Recent Leave Requests
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-list">
                            {MOCK_LEAVE_REQUESTS.map((request) => (
                                <div key={request.id} className="preview-list-item">
                                    <div className="preview-list-item-content">
                                        <div className="preview-list-item-title">
                                            {request.leaveTypeName}
                                        </div>
                                        <div className="preview-list-item-meta">
                                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                            <span className="preview-list-item-days">
                                                ({request.workingDays} {request.workingDays === 1 ? 'day' : 'days'})
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`preview-status ${getStatusBadgeClass(request.status)}`}>
                                        {request.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Payslips */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <DocumentIcon />
                            Recent Payslips
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-list">
                            {MOCK_PAYSLIPS.map((payslip) => (
                                <div key={payslip.id} className="preview-list-item">
                                    <div className="preview-list-item-content">
                                        <div className="preview-list-item-title">
                                            {payslip.periodDescription}
                                        </div>
                                        <div className="preview-list-item-meta">
                                            Pay Date: {formatDate(payslip.payDate)}
                                        </div>
                                    </div>
                                    <div className="preview-list-item-amount">
                                        {formatCurrency(payslip.netPay)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Employee Info */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <UserIcon />
                            My Information
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-info-grid">
                            <div className="preview-info-item">
                                <span className="preview-info-label">Employee Number</span>
                                <span className="preview-info-value">{MOCK_EMPLOYEE.employeeNumber}</span>
                            </div>
                            <div className="preview-info-item">
                                <span className="preview-info-label">Department</span>
                                <span className="preview-info-value">{MOCK_EMPLOYEE.department}</span>
                            </div>
                            <div className="preview-info-item">
                                <span className="preview-info-label">Job Title</span>
                                <span className="preview-info-value">{MOCK_EMPLOYEE.jobTitle}</span>
                            </div>
                            <div className="preview-info-item">
                                <span className="preview-info-label">Start Date</span>
                                <span className="preview-info-value">{formatDate(MOCK_EMPLOYEE.startDate)}</span>
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

function CalendarIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function DocumentIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
