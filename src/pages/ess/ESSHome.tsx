// ============================================================
// ESS HOME - Employee Self-Service Dashboard
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { EmployeeService } from '../../services/employeeService';
import { LeaveService } from '../../services/leaveService';
import { PayrollService } from '../../services/payrollService';
import type { Employee } from '../../types/employee';
import type { LeaveBalance, LeaveRequest } from '../../types/leave';
import type { Payslip } from '../../types/payroll';
import './ESS.css';

export function ESSHome() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [recentLeaveRequests, setRecentLeaveRequests] = useState<LeaveRequest[]>([]);
    const [recentPayslips, setRecentPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [userProfile]);

    const loadDashboardData = async () => {
        if (!userProfile?.companyId || !userProfile?.employeeId) return;

        try {
            setLoading(true);

            // Load employee data
            const empData = await EmployeeService.getEmployee(userProfile.employeeId);
            setEmployee(empData);

            // Load leave balances
            const balances = await LeaveService.getLeaveBalances(
                userProfile.companyId,
                userProfile.employeeId
            );
            setLeaveBalances(balances);

            // Load recent leave requests
            const requests = await LeaveService.getLeaveRequests(userProfile.companyId, {
                employeeId: userProfile.employeeId,
                limitCount: 5
            });
            setRecentLeaveRequests(requests);

            // Load recent payslips
            const payslips = await PayrollService.getEmployeePayslips(userProfile.employeeId, 3);
            setRecentPayslips(payslips);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'approved': return 'ess-status-badge--approved';
            case 'pending': return 'ess-status-badge--pending';
            case 'rejected': return 'ess-status-badge--rejected';
            case 'cancelled': return 'ess-status-badge--cancelled';
            default: return '';
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="ess-loading">
                    <div className="ess-loading-spinner" />
                    <p>Loading your dashboard...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header */}
            <div className="ess-header">
                <div className="ess-header-content">
                    <h1 className="ess-title">{getGreeting()}, {employee?.firstName || userProfile?.displayName?.split(' ')[0]}!</h1>
                    <p className="ess-subtitle">Welcome to your Employee Self-Service portal</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="ess-quick-actions">
                <button className="ess-quick-action" onClick={() => navigate('/ess/leave/new')}>
                    <div className="ess-quick-action-icon ess-quick-action-icon--leave">
                        <CalendarIcon />
                    </div>
                    <span className="ess-quick-action-label">Apply for Leave</span>
                </button>
                <button className="ess-quick-action" onClick={() => navigate('/ess/payslips')}>
                    <div className="ess-quick-action-icon ess-quick-action-icon--payslip">
                        <DocumentIcon />
                    </div>
                    <span className="ess-quick-action-label">View Payslips</span>
                </button>
                <button className="ess-quick-action" onClick={() => navigate('/ess/profile')}>
                    <div className="ess-quick-action-icon ess-quick-action-icon--profile">
                        <UserIcon />
                    </div>
                    <span className="ess-quick-action-label">My Profile</span>
                </button>
                <button className="ess-quick-action" onClick={() => navigate('/ess/leave')}>
                    <div className="ess-quick-action-icon ess-quick-action-icon--history">
                        <ClockIcon />
                    </div>
                    <span className="ess-quick-action-label">Leave History</span>
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="ess-dashboard-grid">
                {/* Leave Balances */}
                <div className="ess-card ess-card--full-width">
                    <div className="ess-card-header">
                        <h2 className="ess-card-title">
                            <CalendarIcon />
                            Leave Balances
                        </h2>
                        <Button variant="secondary" size="sm" onClick={() => navigate('/ess/leave')}>
                            View All
                        </Button>
                    </div>
                    <div className="ess-card-body">
                        {leaveBalances.length === 0 ? (
                            <p className="ess-empty-text">No leave balances available</p>
                        ) : (
                            <div className="ess-leave-balances">
                                {leaveBalances.map(balance => (
                                    <div key={balance.id} className="ess-leave-balance-card">
                                        <div className="ess-leave-balance-type">
                                            {balance.leaveTypeName || 'Leave'}
                                        </div>
                                        <div className="ess-leave-balance-value">
                                            {balance.currentBalance}
                                            <span className="ess-leave-balance-unit">days</span>
                                        </div>
                                        <div className="ess-leave-balance-details">
                                            <span>Taken: {balance.taken}</span>
                                            <span>Pending: {balance.pending}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Leave Requests */}
                <div className="ess-card">
                    <div className="ess-card-header">
                        <h2 className="ess-card-title">
                            <ClockIcon />
                            Recent Leave Requests
                        </h2>
                    </div>
                    <div className="ess-card-body">
                        {recentLeaveRequests.length === 0 ? (
                            <div className="ess-empty-state">
                                <CalendarIcon />
                                <p>No leave requests yet</p>
                                <Button variant="primary" size="sm" onClick={() => navigate('/ess/leave/new')}>
                                    Apply for Leave
                                </Button>
                            </div>
                        ) : (
                            <div className="ess-list">
                                {recentLeaveRequests.map(request => (
                                    <div key={request.id} className="ess-list-item">
                                        <div className="ess-list-item-content">
                                            <div className="ess-list-item-title">
                                                {request.leaveTypeName}
                                            </div>
                                            <div className="ess-list-item-meta">
                                                {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                                <span className="ess-list-item-days">
                                                    ({request.workingDays} {request.workingDays === 1 ? 'day' : 'days'})
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`ess-status-badge ${getStatusBadgeClass(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Payslips */}
                <div className="ess-card">
                    <div className="ess-card-header">
                        <h2 className="ess-card-title">
                            <DocumentIcon />
                            Recent Payslips
                        </h2>
                    </div>
                    <div className="ess-card-body">
                        {recentPayslips.length === 0 ? (
                            <div className="ess-empty-state">
                                <DocumentIcon />
                                <p>No payslips available yet</p>
                            </div>
                        ) : (
                            <div className="ess-list">
                                {recentPayslips.map(payslip => (
                                    <div
                                        key={payslip.id}
                                        className="ess-list-item ess-list-item--clickable"
                                        onClick={() => navigate(`/ess/payslips/${payslip.id}`)}
                                    >
                                        <div className="ess-list-item-content">
                                            <div className="ess-list-item-title">
                                                {payslip.periodDescription}
                                            </div>
                                            <div className="ess-list-item-meta">
                                                Pay Date: {formatDate(payslip.payDate)}
                                            </div>
                                        </div>
                                        <div className="ess-list-item-amount">
                                            {formatCurrency(payslip.netPay)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {recentPayslips.length > 0 && (
                        <div className="ess-card-footer">
                            <Button variant="secondary" size="sm" onClick={() => navigate('/ess/payslips')}>
                                View All Payslips
                            </Button>
                        </div>
                    )}
                </div>

                {/* Employee Info Summary */}
                {employee && (
                    <div className="ess-card">
                        <div className="ess-card-header">
                            <h2 className="ess-card-title">
                                <UserIcon />
                                My Information
                            </h2>
                        </div>
                        <div className="ess-card-body">
                            <div className="ess-info-grid">
                                <div className="ess-info-item">
                                    <span className="ess-info-label">Employee Number</span>
                                    <span className="ess-info-value">{employee.employeeNumber}</span>
                                </div>
                                <div className="ess-info-item">
                                    <span className="ess-info-label">Department</span>
                                    <span className="ess-info-value">{employee.department || '-'}</span>
                                </div>
                                <div className="ess-info-item">
                                    <span className="ess-info-label">Job Title</span>
                                    <span className="ess-info-value">{employee.jobTitle || '-'}</span>
                                </div>
                                <div className="ess-info-item">
                                    <span className="ess-info-label">Start Date</span>
                                    <span className="ess-info-value">
                                        {employee.startDate ? formatDate(employee.startDate) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="ess-card-footer">
                            <Button variant="secondary" size="sm" onClick={() => navigate('/ess/profile')}>
                                View Full Profile
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

// Icon Components
function CalendarIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function DocumentIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
