// ============================================================
// LINE MANAGER DASHBOARD PREVIEW COMPONENT
// Preview for Line Manager role
// ============================================================

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationsCard } from '../NotificationsCard/NotificationsCard';
import './DashboardPreviews.css';

export function LineManagerDashboardPreview() {
    const { userProfile, currentUser } = useAuth();
    const [notificationsCardVisible, setNotificationsCardVisible] = useState(true);

    // Load notifications for Line Manager role
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
        <div className="dashboard-preview line-manager-preview">
            {/* Sample Data Notice */}
            <div className="preview-notice">
                <InfoIcon />
                <span>This is a preview with placeholder data for the Line Manager role.</span>
            </div>

            {/* Header */}
            <div className="preview-header">
                <div className="preview-header-content">
                    <h2 className="preview-title">Team Dashboard</h2>
                    <p className="preview-subtitle">Manage your team, approve leave, and track performance</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="preview-stats">
                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--primary">
                        <UsersIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">12</span>
                        <span className="preview-stat-label">Team Members</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--warning">
                        <ClockIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">4</span>
                        <span className="preview-stat-label">Pending Approvals</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--info">
                        <CalendarIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">2</span>
                        <span className="preview-stat-label">On Leave Today</span>
                    </div>
                </div>

                <div className="preview-stat-card">
                    <div className="preview-stat-icon preview-stat-icon--success">
                        <TrendingUpIcon />
                    </div>
                    <div className="preview-stat-content">
                        <span className="preview-stat-value">92%</span>
                        <span className="preview-stat-label">Team Availability</span>
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

                {/* Pending Leave Approvals */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <ClockIcon />
                            Pending Leave Approvals
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-list">
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Alice Thompson</div>
                                    <div className="preview-list-item-meta">Annual Leave - 15-17 Jan (3 days)</div>
                                </div>
                                <div className="preview-action-buttons">
                                    <span className="preview-action-btn preview-action-btn--approve">Approve</span>
                                    <span className="preview-action-btn preview-action-btn--reject">Reject</span>
                                </div>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Bob Martinez</div>
                                    <div className="preview-list-item-meta">Sick Leave - 20 Jan (1 day)</div>
                                </div>
                                <div className="preview-action-buttons">
                                    <span className="preview-action-btn preview-action-btn--approve">Approve</span>
                                    <span className="preview-action-btn preview-action-btn--reject">Reject</span>
                                </div>
                            </div>
                            <div className="preview-list-item">
                                <div className="preview-list-item-content">
                                    <div className="preview-list-item-title">Carol White</div>
                                    <div className="preview-list-item-meta">Family Responsibility - 22 Jan (1 day)</div>
                                </div>
                                <div className="preview-action-buttons">
                                    <span className="preview-action-btn preview-action-btn--approve">Approve</span>
                                    <span className="preview-action-btn preview-action-btn--reject">Reject</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Overview */}
                <div className="preview-card">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <UsersIcon />
                            Team Overview
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-team-list">
                            <div className="preview-team-member">
                                <div className="preview-team-avatar">AT</div>
                                <div className="preview-team-info">
                                    <div className="preview-team-name">Alice Thompson</div>
                                    <div className="preview-team-role">Senior Developer</div>
                                </div>
                                <span className="preview-team-status preview-team-status--available">Available</span>
                            </div>
                            <div className="preview-team-member">
                                <div className="preview-team-avatar">BM</div>
                                <div className="preview-team-info">
                                    <div className="preview-team-name">Bob Martinez</div>
                                    <div className="preview-team-role">Developer</div>
                                </div>
                                <span className="preview-team-status preview-team-status--available">Available</span>
                            </div>
                            <div className="preview-team-member">
                                <div className="preview-team-avatar">CW</div>
                                <div className="preview-team-info">
                                    <div className="preview-team-name">Carol White</div>
                                    <div className="preview-team-role">QA Engineer</div>
                                </div>
                                <span className="preview-team-status preview-team-status--leave">On Leave</span>
                            </div>
                            <div className="preview-team-member">
                                <div className="preview-team-avatar">DJ</div>
                                <div className="preview-team-info">
                                    <div className="preview-team-name">David Johnson</div>
                                    <div className="preview-team-role">Developer</div>
                                </div>
                                <span className="preview-team-status preview-team-status--available">Available</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Performance */}
                <div className="preview-card preview-card--full-width">
                    <div className="preview-card-header">
                        <h3 className="preview-card-title">
                            <TrendingUpIcon />
                            Team Performance Overview
                        </h3>
                    </div>
                    <div className="preview-card-body">
                        <div className="preview-performance-grid">
                            <div className="preview-performance-item">
                                <span className="preview-performance-label">Tasks Completed This Week</span>
                                <span className="preview-performance-value">28</span>
                            </div>
                            <div className="preview-performance-item">
                                <span className="preview-performance-label">Average Task Completion Rate</span>
                                <span className="preview-performance-value">94%</span>
                            </div>
                            <div className="preview-performance-item">
                                <span className="preview-performance-label">Team Satisfaction Score</span>
                                <span className="preview-performance-value">4.5/5</span>
                            </div>
                            <div className="preview-performance-item">
                                <span className="preview-performance-label">Training Hours This Month</span>
                                <span className="preview-performance-value">24 hrs</span>
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

function TrendingUpIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}
