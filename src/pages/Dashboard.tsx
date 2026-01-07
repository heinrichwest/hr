import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/Layout/MainLayout";
import { Button } from "../components/Button/Button";
import { Link } from "react-router-dom";
import "./Dashboard.css";

export function Dashboard() {
    const { userProfile, currentUser } = useAuth();

    const getRoleBadgeClass = (role: string | undefined) => {
        switch (role) {
            case 'System Admin':
                return 'badge-primary';
            case 'Manager':
                return 'badge-success';
            case 'Admin':
                return 'badge-warning';
            default:
                return 'badge-neutral';
        }
    };

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="dashboard-header animate-slide-down">
                <div className="dashboard-header-content">
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">Welcome back! Here's an overview of your HR activities.</p>
                </div>
                <div className="dashboard-header-actions">
                    <span className={`badge ${getRoleBadgeClass(userProfile?.role)}`}>
                        {userProfile?.role}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="dashboard-stats animate-slide-up">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--primary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">-</span>
                        <span className="stat-label">Pending Tasks</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon--accent">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">-</span>
                        <span className="stat-label">Notifications</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">-</span>
                        <span className="stat-label">Team Members</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon--info">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">-</span>
                        <span className="stat-label">Leave Requests</span>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="dashboard-grid">
                {/* Profile Card */}
                <div className="dashboard-card animate-scale-in">
                    <div className="card-header">
                        <h3 className="card-title">Profile Overview</h3>
                        <div className="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                    </div>
                    <div className="card-content">
                        <div className="profile-info-list">
                            <div className="profile-info-item">
                                <span className="profile-info-label">Email</span>
                                <span className="profile-info-value">{currentUser?.email}</span>
                            </div>
                            <div className="profile-info-item">
                                <span className="profile-info-label">Role</span>
                                <span className={`badge ${getRoleBadgeClass(userProfile?.role)}`}>
                                    {userProfile?.role}
                                </span>
                            </div>
                            <div className="profile-info-item">
                                <span className="profile-info-label">User ID</span>
                                <code className="profile-info-code">
                                    {userProfile?.uid?.substring(0, 16)}...
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="dashboard-card animate-scale-in">
                    <div className="card-header">
                        <h3 className="card-title">Quick Actions</h3>
                        <div className="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                        </div>
                    </div>
                    <div className="card-content">
                        <div className="quick-actions">
                            <button className="quick-action-btn">
                                <span className="quick-action-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </span>
                                <span className="quick-action-text">
                                    <span className="quick-action-title">Request Leave</span>
                                    <span className="quick-action-desc">Submit a new leave request</span>
                                </span>
                            </button>

                            <button className="quick-action-btn">
                                <span className="quick-action-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                </span>
                                <span className="quick-action-text">
                                    <span className="quick-action-title">View Payslips</span>
                                    <span className="quick-action-desc">Access your pay history</span>
                                </span>
                            </button>

                            <button className="quick-action-btn">
                                <span className="quick-action-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                </span>
                                <span className="quick-action-text">
                                    <span className="quick-action-title">Settings</span>
                                    <span className="quick-action-desc">Manage your preferences</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Admin Card - Full Width */}
                {userProfile?.role === "System Admin" && (
                    <div className="dashboard-card dashboard-card--full animate-scale-in">
                        <div className="card-header">
                            <h3 className="card-title">System Administration</h3>
                            <span className="badge badge-primary">Admin Only</span>
                        </div>
                        <div className="card-content">
                            <p className="admin-card-desc">
                                As a System Administrator, you have access to manage users, configure system settings, and monitor system activity.
                            </p>
                            <div className="admin-actions">
                                <Link to="/admin/users">
                                    <Button variant="primary">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        Manage Users
                                    </Button>
                                </Link>
                                <Button variant="secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                    System Settings
                                </Button>
                                <Button variant="secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                    View Reports
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
