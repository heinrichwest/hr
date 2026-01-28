// ============================================================
// IR DASHBOARD PREVIEW COMPONENT
// Preview for IR Officer and IR Manager roles
// ============================================================

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationsCard } from '../NotificationsCard/NotificationsCard';
import './DashboardPreviews.css';

export function IRDashboardPreview() {
    const { userProfile, currentUser } = useAuth();
    const [notificationsCardVisible, setNotificationsCardVisible] = useState(true);

    // Load notifications for IR role
    const {
        notifications,
        loading: notificationsLoading,
        markAsRead,
        markAllAsRead,
    } = useNotifications({
        companyId: userProfile?.companyId || null,
        userId: currentUser?.uid,
        autoLoad: true,
    });

    const handleCloseNotifications = () => {
        setNotificationsCardVisible(false);
    };

    return (
        <div className="dashboard-preview ir-preview">
            {/* Sample Data Notice */}
            <div className="preview-notice">
                <InfoIcon />
                <span>This is a preview with placeholder data for the IR role.</span>
            </div>

            {/* Header */}
            <div className="preview-header">
                <div className="preview-header-content">
                    <h2 className="preview-title">IR Dashboard</h2>
                    <p className="preview-subtitle">Manage industrial relations cases and investigations</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="preview-stats">
                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--warning">
                        <FileIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">8</span>
                        <span className="preview-stat-label">Active Cases</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--info">
                        <SearchIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">3</span>
                        <span className="preview-stat-label">Pending Investigations</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--success">
                        <CheckCircleIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">24</span>
                        <span className="preview-stat-label">Resolved This Quarter</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--primary">
                        <AlertIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">2</span>
                        <span className="preview-stat-label">Urgent Priority</span>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="preview-grid">
                {/* Notifications Card - Full width at top */}
                {notificationsCardVisible && (
                    <div className="preview-card-full-width" style={{ gridColumn: '1 / -1' }}>
                        <NotificationsCard
                            notifications={notifications}
                            onMarkAsRead={markAsRead}
                            onMarkAllAsRead={markAllAsRead}
                            onClose={handleCloseNotifications}
                            loading={notificationsLoading}
                        />
                    </div>
                )}

                {/* Active Cases */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <FileIcon />
                            Active Cases
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-list">
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">IR-2026-001</div>
                                    <div className="preview-list-item-meta">Misconduct - Investigation Phase</div>
                                </div>
                                <span className="preview-status preview-status--warning">High Priority</span>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">IR-2026-002</div>
                                    <div className="preview-list-item-meta">Performance - Hearing Scheduled</div>
                                </div>
                                <span className="preview-status preview-status--pending">Medium</span>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">IR-2025-089</div>
                                    <div className="preview-list-item-meta">Grievance - Documentation Review</div>
                                </div>
                                <span className="preview-status preview-status--approved">Normal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Investigations */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <SearchIcon />
                            Pending Investigations
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-list">
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">INV-2026-003</div>
                                    <div className="preview-list-item-meta">Workplace Incident - Started 05 Jan</div>
                                </div>
                                <span className="preview-status preview-status--pending">In Progress</span>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">INV-2026-002</div>
                                    <div className="preview-list-item-meta">Policy Violation - Started 03 Jan</div>
                                </div>
                                <span className="preview-status preview-status--pending">In Progress</span>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">INV-2026-001</div>
                                    <div className="preview-list-item-meta">Harassment Complaint - Witness Interviews</div>
                                </div>
                                <span className="preview-status preview-status--warning">Urgent</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Case Summary */}
                <div className="preview-card preview-card--full-width">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <ChartIcon />
                            Case Summary - Last 12 Months
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-case-summary">
                            <div className="preview-case-category">
                                <div className="preview-case-category-header">
                                    <span className="preview-case-category-name">Misconduct</span>
                                    <span className="preview-case-category-count">32 cases</span>
                                </div>
                                <div className="preview-case-bar">
                                    <div className="preview-case-bar-fill" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                            <div className="preview-case-category">
                                <div className="preview-case-category-header">
                                    <span className="preview-case-category-name">Performance</span>
                                    <span className="preview-case-category-count">18 cases</span>
                                </div>
                                <div className="preview-case-bar">
                                    <div className="preview-case-bar-fill" style={{ width: '37%' }}></div>
                                </div>
                            </div>
                            <div className="preview-case-category">
                                <div className="preview-case-category-header">
                                    <span className="preview-case-category-name">Grievance</span>
                                    <span className="preview-case-category-count">15 cases</span>
                                </div>
                                <div className="preview-case-bar">
                                    <div className="preview-case-bar-fill" style={{ width: '30%' }}></div>
                                </div>
                            </div>
                            <div className="preview-case-category">
                                <div className="preview-case-category-header">
                                    <span className="preview-case-category-name">Harassment</span>
                                    <span className="preview-case-category-count">5 cases</span>
                                </div>
                                <div className="preview-case-bar">
                                    <div className="preview-case-bar-fill" style={{ width: '10%' }}></div>
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

function FileIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

function AlertIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
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
