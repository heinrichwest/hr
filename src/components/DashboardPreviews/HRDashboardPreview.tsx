// ============================================================
// HR DASHBOARD PREVIEW COMPONENT
// Preview for HR Admin and HR Manager roles
// ============================================================

import './DashboardPreviews.css';

export function HRDashboardPreview() {
    return (
        <div className="dashboard-preview hr-preview">
            {/* Sample Data Notice */}
            <div className="preview-notice">
                <InfoIcon />
                <span>This is a preview with placeholder data for the HR role.</span>
            </div>

            {/* Header */}
            <div className="preview-header">
                <div className="preview-header-content">
                    <h2 className="preview-title">HR Dashboard</h2>
                    <p className="preview-subtitle">Manage employees, leave requests, and HR operations</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="preview-stats">
                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--primary">
                        <UsersIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">248</span>
                        <span className="preview-stat-label">Total Employees</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--warning">
                        <ClockIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">12</span>
                        <span className="preview-stat-label">Pending Leave Requests</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--success">
                        <UserPlusIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">5</span>
                        <span className="preview-stat-label">New Hires This Month</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--info">
                        <CalendarIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">8</span>
                        <span className="preview-stat-label">On Leave Today</span>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="preview-grid">
                {/* Pending Leave Requests */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <ClockIcon />
                            Pending Leave Requests
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-list">
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">John Smith</div>
                                    <div className="preview-list-item-meta">Annual Leave - 3 days</div>
                                </div>
                                <span className="preview-status preview-status--pending">Pending</span>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Sarah Johnson</div>
                                    <div className="preview-list-item-meta">Sick Leave - 2 days</div>
                                </div>
                                <span className="preview-status preview-status--pending">Pending</span>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Mike Davis</div>
                                    <div className="preview-list-item-meta">Family Responsibility - 1 day</div>
                                </div>
                                <span className="preview-status preview-status--pending">Pending</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Hires */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <UserPlusIcon />
                            Recent Hires
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-list">
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Emily Brown</div>
                                    <div className="preview-list-item-meta">Marketing - Started 05 Jan 2026</div>
                                </div>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">David Wilson</div>
                                    <div className="preview-list-item-meta">Engineering - Started 02 Jan 2026</div>
                                </div>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Lisa Anderson</div>
                                    <div className="preview-list-item-meta">Finance - Started 28 Dec 2025</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Department Overview */}
                <div className="preview-card preview-card--full-width">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <BuildingIcon />
                            Department Overview
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-department-grid">
                            <div className="preview-department-item">
                                <span className="preview-department-name">Engineering</span>
                                <span className="preview-department-count">85 employees</span>
                            </div>
                            <div className="preview-department-item">
                                <span className="preview-department-name">Sales</span>
                                <span className="preview-department-count">62 employees</span>
                            </div>
                            <div className="preview-department-item">
                                <span className="preview-department-name">Marketing</span>
                                <span className="preview-department-count">38 employees</span>
                            </div>
                            <div className="preview-department-item">
                                <span className="preview-department-name">Finance</span>
                                <span className="preview-department-count">28 employees</span>
                            </div>
                            <div className="preview-department-item">
                                <span className="preview-department-name">HR</span>
                                <span className="preview-department-count">15 employees</span>
                            </div>
                            <div className="preview-department-item">
                                <span className="preview-department-name">Operations</span>
                                <span className="preview-department-count">20 employees</span>
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

function UsersIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function UserPlusIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
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

function BuildingIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M9 21V7l8-4v18" />
            <path d="M5 21V9l4-2" />
            <path d="M13 10h.01" />
            <path d="M13 14h.01" />
            <path d="M13 18h.01" />
        </svg>
    );
}
