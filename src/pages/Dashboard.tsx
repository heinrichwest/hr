import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePreviewMode } from "../contexts/PreviewModeContext";
import { MainLayout } from "../components/Layout/MainLayout";
import { Button } from "../components/Button/Button";
import { Link, useNavigate } from "react-router-dom";
import {
    EmployeeDashboardPreview,
    HRDashboardPreview,
    PayrollDashboardPreview,
    FinanceDashboardPreview,
    LineManagerDashboardPreview,
    IRDashboardPreview,
} from "../components/DashboardPreviews";
import { CompanyService } from "../services/companyService";
import { AccessRequestService } from "../services/accessRequestService";
import { NotificationService } from "../services/notificationService";
import { EmployeeService } from "../services/employeeService";
import { LeaveService } from "../services/leaveService";
import { TakeOnSheetService } from "../services/takeOnSheetService";
import { Seeder } from "../services/seeder";
import { ReportsCard } from "./admin/ReportsCard";
import type { Company } from "../types/company";
import "./Dashboard.css";

// Dashboard stats interface
interface DashboardStats {
    pendingTasks: number;
    notifications: number;
    teamMembers: number;
    leaveRequests: number;
    takeOnSheets: number;
}

export function Dashboard() {
    const { userProfile, currentUser } = useAuth();
    const { isPreviewMode, previewRole } = usePreviewMode();
    const navigate = useNavigate();

    // State for tenant dropdown and stats
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        pendingTasks: 0,
        notifications: 0,
        teamMembers: 0,
        leaveRequests: 0,
        takeOnSheets: 0,
    });

    const getRoleBadgeClass = (role: string | undefined) => {
        switch (role) {
            case "System Admin":
                return "badge-primary";
            case "Manager":
                return "badge-success";
            case "Admin":
                return "badge-warning";
            default:
                return "badge-neutral";
        }
    };

    // Load dashboard stats
    const loadDashboardStats = useCallback(async (companyId?: string) => {
        setLoading(true);
        try {
            // Pending Tasks (access requests are global, not company-scoped)
            const pendingTasksPromise = AccessRequestService.getPendingRequestsCount();

            // Notifications (filtered by company if selected)
            const notificationsPromise = NotificationService.getUnreadNotificationsCount(companyId || undefined);

            // For employee stats and leave requests, we need to handle "All Companies" case
            let teamMembersTotal = 0;
            let leaveRequestsTotal = 0;

            if (companyId) {
                // Single company selected
                const [pendingTasks, notifications, employeeStats, leaveRequests, takeOnSheetCounts] = await Promise.all([
                    pendingTasksPromise,
                    notificationsPromise,
                    EmployeeService.getEmployeeStats(companyId),
                    LeaveService.getLeaveRequests(companyId, { status: 'pending' }),
                    TakeOnSheetService.getCountsByStatus(companyId),
                ]);

                teamMembersTotal = employeeStats.total;
                leaveRequestsTotal = leaveRequests.length;
                // Count non-complete take-on sheets (draft + pending_hr_review + pending_it_setup)
                const takeOnSheetsInProgress = takeOnSheetCounts.draft + takeOnSheetCounts.pending_hr_review + takeOnSheetCounts.pending_it_setup;

                setStats({
                    pendingTasks,
                    notifications,
                    teamMembers: teamMembersTotal,
                    leaveRequests: leaveRequestsTotal,
                    takeOnSheets: takeOnSheetsInProgress,
                });
            } else {
                // "All Companies" selected - aggregate across all companies
                const [pendingTasks, notifications] = await Promise.all([
                    pendingTasksPromise,
                    notificationsPromise,
                ]);

                // Load stats for each company
                const allCompanies = await CompanyService.getAllCompanies();

                const statsPromises = allCompanies.map(async (company) => {
                    const [employeeStats, leaveRequests, takeOnSheetCounts] = await Promise.all([
                        EmployeeService.getEmployeeStats(company.id),
                        LeaveService.getLeaveRequests(company.id, { status: 'pending' }),
                        TakeOnSheetService.getCountsByStatus(company.id),
                    ]);
                    return {
                        employees: employeeStats.total,
                        pendingLeave: leaveRequests.length,
                        takeOnSheets: takeOnSheetCounts.draft + takeOnSheetCounts.pending_hr_review + takeOnSheetCounts.pending_it_setup,
                    };
                });

                const allStats = await Promise.all(statsPromises);

                teamMembersTotal = allStats.reduce((sum, s) => sum + s.employees, 0);
                leaveRequestsTotal = allStats.reduce((sum, s) => sum + s.pendingLeave, 0);
                const takeOnSheetsTotal = allStats.reduce((sum, s) => sum + s.takeOnSheets, 0);

                setStats({
                    pendingTasks,
                    notifications,
                    teamMembers: teamMembersTotal,
                    leaveRequests: leaveRequestsTotal,
                    takeOnSheets: takeOnSheetsTotal,
                });
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            // Set default values on error
            setStats({
                pendingTasks: 0,
                notifications: 0,
                teamMembers: 0,
                leaveRequests: 0,
                takeOnSheets: 0,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Load companies on mount for System Admin
    useEffect(() => {
        const init = async () => {
            if (!userProfile) return;

            if (userProfile.role === 'System Admin' || userProfile.role?.toLowerCase() === 'system admin') {
                try {
                    const allCompanies = await CompanyService.getAllCompanies();
                    setCompanies(allCompanies);
                    // Load stats for "All Companies" by default
                    await loadDashboardStats();
                } catch (error) {
                    console.error('Failed to load companies:', error);
                }
            }
        };

        init();
    }, [userProfile, loadDashboardStats]);

    // Handle company dropdown change
    const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCompanyId = e.target.value;
        setSelectedCompanyId(newCompanyId);
        await loadDashboardStats(newCompanyId || undefined);
    };

    // Navigation handlers for stat cards
    const handlePendingTasksClick = () => {
        navigate('/admin/pending-approvals');
    };

    const handleNotificationsClick = () => {
        navigate('/admin/notifications');
    };

    const handleTeamMembersClick = () => {
        if (selectedCompanyId) {
            navigate(`/employees?companyId=${selectedCompanyId}`);
        } else {
            navigate('/employees');
        }
    };

    const handleLeaveRequestsClick = () => {
        if (selectedCompanyId) {
            navigate(`/leave?companyId=${selectedCompanyId}`);
        } else {
            navigate('/leave');
        }
    };

    const handleTakeOnSheetsClick = () => {
        if (selectedCompanyId) {
            navigate(`/take-on-sheets?companyId=${selectedCompanyId}`);
        } else {
            navigate('/take-on-sheets');
        }
    };

    // Handle seed demo data
    const handleSeedDemoData = async () => {
        if (!window.confirm('This will DELETE all existing companies and employees, then create fresh demo data with realistic South African names. Continue?')) {
            return;
        }

        setSeeding(true);
        try {
            await Seeder.clearAndReseed();
            alert('Demo data created successfully! Refreshing page...');
            window.location.reload();
        } catch (error) {
            console.error('Failed to seed database:', error);
            alert('Failed to create demo data. Check console for errors.');
        } finally {
            setSeeding(false);
        }
    };

    // Keyboard navigation handler
    const handleKeyDown = (callback: () => void) => (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            callback();
        }
    };

    // Render preview dashboard content based on previewRole
    const renderPreviewContent = () => {
        if (!isPreviewMode || !previewRole) {
            return null;
        }

        switch (previewRole) {
            case "HR Admin":
            case "HR Manager":
                return <HRDashboardPreview />;
            case "Payroll Admin":
            case "Payroll Manager":
                return <PayrollDashboardPreview />;
            case "Finance Approver":
            case "Finance Read-Only":
                return <FinanceDashboardPreview />;
            case "Line Manager":
                return <LineManagerDashboardPreview />;
            case "IR Officer":
            case "IR Manager":
                return <IRDashboardPreview />;
            case "Employee":
                return <EmployeeDashboardPreview />;
            default:
                return null;
        }
    };

    // If in preview mode, render the preview content
    if (isPreviewMode && previewRole) {
        return (
            <MainLayout>
                {renderPreviewContent()}
            </MainLayout>
        );
    }

    const isSystemAdmin = userProfile?.role === 'System Admin' || userProfile?.role?.toLowerCase() === 'system admin';

    // Original System Admin dashboard content
    return (
        <MainLayout>
            {/* Page Header */}
            <div className="dashboard-header animate-slide-down">
                <div className="dashboard-header-content">
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">Welcome back! Here is an overview of your HR activities.</p>
                </div>
                <div className="dashboard-header-actions">
                    {isSystemAdmin && (
                        <div className="company-selector">
                            <select
                                value={selectedCompanyId}
                                onChange={handleCompanyChange}
                                className="company-select-input"
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--speccon-gray-200)',
                                    marginRight: '12px',
                                    backgroundColor: 'white',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">All Companies</option>
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.legalName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <span className={`badge ${getRoleBadgeClass(userProfile?.role)}`}>
                        {userProfile?.role}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="dashboard-stats animate-slide-up">
                {/* Pending Tasks Card */}
                <div
                    className={`stat-card stat-card--clickable ${loading ? 'stat-card--loading' : ''}`}
                    onClick={handlePendingTasksClick}
                    onKeyDown={handleKeyDown(handlePendingTasksClick)}
                    role="button"
                    tabIndex={0}
                    aria-label="View pending tasks"
                >
                    <div className="stat-icon stat-icon--primary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">
                            {loading ? <span className="stat-skeleton" /> : stats.pendingTasks}
                        </span>
                        <span className="stat-label">Pending Tasks</span>
                    </div>
                </div>

                {/* Notifications Card */}
                <div
                    className={`stat-card stat-card--clickable ${loading ? 'stat-card--loading' : ''}`}
                    onClick={handleNotificationsClick}
                    onKeyDown={handleKeyDown(handleNotificationsClick)}
                    role="button"
                    tabIndex={0}
                    aria-label="View notifications"
                >
                    <div className="stat-icon stat-icon--accent">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">
                            {loading ? <span className="stat-skeleton" /> : stats.notifications}
                        </span>
                        <span className="stat-label">Notifications</span>
                    </div>
                </div>

                {/* Team Members Card */}
                <div
                    className={`stat-card stat-card--clickable ${loading ? 'stat-card--loading' : ''}`}
                    onClick={handleTeamMembersClick}
                    onKeyDown={handleKeyDown(handleTeamMembersClick)}
                    role="button"
                    tabIndex={0}
                    aria-label="View team members"
                >
                    <div className="stat-icon stat-icon--success">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">
                            {loading ? <span className="stat-skeleton" /> : stats.teamMembers}
                        </span>
                        <span className="stat-label">Team Members</span>
                    </div>
                </div>

                {/* Leave Requests Card */}
                <div
                    className={`stat-card stat-card--clickable ${loading ? 'stat-card--loading' : ''}`}
                    onClick={handleLeaveRequestsClick}
                    onKeyDown={handleKeyDown(handleLeaveRequestsClick)}
                    role="button"
                    tabIndex={0}
                    aria-label="View leave requests"
                >
                    <div className="stat-icon stat-icon--info">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">
                            {loading ? <span className="stat-skeleton" /> : stats.leaveRequests}
                        </span>
                        <span className="stat-label">Leave Requests</span>
                    </div>
                </div>

                {/* Take On Sheets Card */}
                <div
                    className={`stat-card stat-card--clickable ${loading ? 'stat-card--loading' : ''}`}
                    onClick={handleTakeOnSheetsClick}
                    onKeyDown={handleKeyDown(handleTakeOnSheetsClick)}
                    role="button"
                    tabIndex={0}
                    aria-label="View take on sheets"
                >
                    <div className="stat-icon stat-icon--warning">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            <path d="M9 14l2 2 4-4" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">
                            {loading ? <span className="stat-skeleton" /> : stats.takeOnSheets}
                        </span>
                        <span className="stat-label">Take On Sheets</span>
                    </div>
                </div>

                {/* Reports Card - System Admin only */}
                {isSystemAdmin && (
                    <ReportsCard companyId={selectedCompanyId || undefined} />
                )}
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
                                <Link to="/admin/reports">
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
                                </Link>
                                <Button
                                    variant="secondary"
                                    onClick={handleSeedDemoData}
                                    disabled={seeding}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                    {seeding ? 'Creating Data...' : 'Seed Demo Data'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
