// ============================================================
// REPORTS HOME - Reports & Analytics Dashboard
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { ReportService } from '../../services/reportService';
import type { DashboardMetrics } from '../../types/reports';
import './Reports.css';

export function ReportsHome() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardMetrics();
    }, [userProfile?.companyId]);

    const loadDashboardMetrics = async () => {
        if (!userProfile?.companyId) return;

        try {
            setLoading(true);
            const data = await ReportService.getDashboardMetrics(userProfile.companyId);
            setMetrics(data);
        } catch (error) {
            console.error('Error loading dashboard metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const reportCategories = [
        {
            id: 'employee',
            title: 'Employee Reports',
            description: 'Headcount, turnover, demographics, and employee lists',
            icon: <UsersIcon />,
            reportCount: 6,
            path: '/reports/employee'
        },
        {
            id: 'leave',
            title: 'Leave Reports',
            description: 'Leave balances, requests, utilization, and absenteeism',
            icon: <CalendarIcon />,
            reportCount: 4,
            path: '/reports/leave'
        },
        {
            id: 'payroll',
            title: 'Payroll Reports',
            description: 'Payroll summaries, registers, cost analysis, and statutory',
            icon: <CurrencyIcon />,
            reportCount: 5,
            path: '/reports/payroll'
        },
        {
            id: 'ir',
            title: 'IR Reports',
            description: 'IR cases, warnings, trends, and CCMA matters',
            icon: <AlertIcon />,
            reportCount: 5,
            path: '/reports/ir'
        }
    ];

    return (
        <MainLayout>
            {/* Header */}
            <div className="reports-header">
                <div className="reports-header-content">
                    <h1 className="reports-title">Reports & Analytics</h1>
                    <p className="reports-subtitle">Generate reports and view analytics across your HR data</p>
                </div>
            </div>

            {/* Dashboard Metrics */}
            {loading ? (
                <div className="reports-metrics">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="reports-metric-card">
                            <div className="report-loading-spinner" style={{ margin: '20px auto' }} />
                        </div>
                    ))}
                </div>
            ) : metrics && (
                <div className="reports-metrics">
                    <div className="reports-metric-card">
                        <div className="reports-metric-header">
                            <span className="reports-metric-label">Headcount</span>
                            <div className="reports-metric-icon reports-metric-icon--headcount">
                                <UsersIcon />
                            </div>
                        </div>
                        <div className="reports-metric-value">{metrics.headcount.total}</div>
                        <div className={`reports-metric-change ${metrics.headcount.change >= 0 ? 'reports-metric-change--up' : 'reports-metric-change--down'}`}>
                            {metrics.headcount.change >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                            {Math.abs(metrics.headcount.change)} this month
                        </div>
                    </div>

                    <div className="reports-metric-card">
                        <div className="reports-metric-header">
                            <span className="reports-metric-label">Turnover Rate</span>
                            <div className="reports-metric-icon reports-metric-icon--turnover">
                                <TrendingIcon />
                            </div>
                        </div>
                        <div className="reports-metric-value">{metrics.turnover.rate}%</div>
                        <div className={`reports-metric-change reports-metric-change--${metrics.turnover.trend}`}>
                            {metrics.turnover.trend === 'up' ? <ArrowUpIcon /> : metrics.turnover.trend === 'down' ? <ArrowDownIcon /> : <MinusIcon />}
                            {metrics.turnover.trend === 'stable' ? 'Stable' : metrics.turnover.trend === 'up' ? 'Increasing' : 'Decreasing'}
                        </div>
                    </div>

                    <div className="reports-metric-card">
                        <div className="reports-metric-header">
                            <span className="reports-metric-label">Absenteeism</span>
                            <div className="reports-metric-icon reports-metric-icon--absenteeism">
                                <CalendarXIcon />
                            </div>
                        </div>
                        <div className="reports-metric-value">{metrics.absenteeism.rate.toFixed(1)}%</div>
                        <div className={`reports-metric-change reports-metric-change--${metrics.absenteeism.trend}`}>
                            {metrics.absenteeism.trend === 'up' ? <ArrowUpIcon /> : metrics.absenteeism.trend === 'down' ? <ArrowDownIcon /> : <MinusIcon />}
                            {metrics.absenteeism.trend === 'stable' ? 'Stable' : metrics.absenteeism.trend === 'up' ? 'Increasing' : 'Decreasing'}
                        </div>
                    </div>

                    <div className="reports-metric-card">
                        <div className="reports-metric-header">
                            <span className="reports-metric-label">Leave Utilization</span>
                            <div className="reports-metric-icon reports-metric-icon--leave">
                                <CalendarIcon />
                            </div>
                        </div>
                        <div className="reports-metric-value">{metrics.leaveUtilization.rate.toFixed(0)}%</div>
                        <div className="reports-metric-change reports-metric-change--stable">
                            Avg balance: {metrics.leaveUtilization.averageBalance.toFixed(1)} days
                        </div>
                    </div>

                    <div className="reports-metric-card">
                        <div className="reports-metric-header">
                            <span className="reports-metric-label">Open IR Cases</span>
                            <div className="reports-metric-icon reports-metric-icon--ir">
                                <AlertIcon />
                            </div>
                        </div>
                        <div className="reports-metric-value">{metrics.openIRCases.count}</div>
                        <div className="reports-metric-change reports-metric-change--down">
                            {metrics.openIRCases.urgent} urgent
                        </div>
                    </div>

                    <div className="reports-metric-card">
                        <div className="reports-metric-header">
                            <span className="reports-metric-label">Payroll Cost</span>
                            <div className="reports-metric-icon reports-metric-icon--payroll">
                                <CurrencyIcon />
                            </div>
                        </div>
                        <div className="reports-metric-value">
                            {metrics.payrollCost.currentMonth > 0
                                ? formatCurrency(metrics.payrollCost.currentMonth)
                                : '-'}
                        </div>
                        <div className="reports-metric-change reports-metric-change--stable">
                            {metrics.payrollCost.change !== 0
                                ? `${metrics.payrollCost.change > 0 ? '+' : ''}${formatCurrency(metrics.payrollCost.change)}`
                                : 'No data'}
                        </div>
                    </div>
                </div>
            )}

            {/* Report Categories */}
            <div className="reports-categories">
                {reportCategories.map(category => (
                    <div
                        key={category.id}
                        className="reports-category-card"
                        onClick={() => navigate(category.path)}
                    >
                        <div className={`reports-category-icon reports-category-icon--${category.id}`}>
                            {category.icon}
                        </div>
                        <h3 className="reports-category-title">{category.title}</h3>
                        <p className="reports-category-description">{category.description}</p>
                        <span className="reports-category-count">{category.reportCount} reports available</span>
                    </div>
                ))}
            </div>

            {/* Quick Access Reports */}
            <div className="reports-list">
                <div className="reports-list-header">
                    <h2 className="reports-list-title">
                        <ReportIcon />
                        Quick Access Reports
                    </h2>
                </div>
                <div className="reports-list-content">
                    <div className="report-item" onClick={() => navigate('/reports/employee/headcount')}>
                        <div className="report-item-icon">
                            <UsersIcon />
                        </div>
                        <div className="report-item-content">
                            <h4 className="report-item-name">Headcount Summary</h4>
                            <p className="report-item-description">Current employee headcount by department and status</p>
                        </div>
                        <ChevronRightIcon />
                    </div>

                    <div className="report-item" onClick={() => navigate('/reports/leave/balances')}>
                        <div className="report-item-icon">
                            <CalendarIcon />
                        </div>
                        <div className="report-item-content">
                            <h4 className="report-item-name">Leave Balances</h4>
                            <p className="report-item-description">Current leave balances for all employees</p>
                        </div>
                        <ChevronRightIcon />
                    </div>

                    <div className="report-item" onClick={() => navigate('/reports/payroll/register')}>
                        <div className="report-item-icon">
                            <CurrencyIcon />
                        </div>
                        <div className="report-item-content">
                            <h4 className="report-item-name">Payroll Register</h4>
                            <p className="report-item-description">Detailed payroll register for selected pay run</p>
                        </div>
                        <ChevronRightIcon />
                    </div>

                    <div className="report-item" onClick={() => navigate('/reports/ir/cases')}>
                        <div className="report-item-icon">
                            <AlertIcon />
                        </div>
                        <div className="report-item-content">
                            <h4 className="report-item-name">IR Cases Report</h4>
                            <p className="report-item-description">List of all IR cases with status and outcomes</p>
                        </div>
                        <ChevronRightIcon />
                    </div>

                    <div className="report-item" onClick={() => navigate('/reports/employee/probation')}>
                        <div className="report-item-icon">
                            <ClockIcon />
                        </div>
                        <div className="report-item-content">
                            <h4 className="report-item-name">Probation Report</h4>
                            <p className="report-item-description">Employees currently on probation with end dates</p>
                        </div>
                        <ChevronRightIcon />
                    </div>

                    <div className="report-item" onClick={() => navigate('/reports/ir/warnings')}>
                        <div className="report-item-icon">
                            <WarningIcon />
                        </div>
                        <div className="report-item-content">
                            <h4 className="report-item-name">Warnings Report</h4>
                            <p className="report-item-description">Active and expired employee warnings</p>
                        </div>
                        <ChevronRightIcon />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

// Icon Components
function UsersIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

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

function CalendarXIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="10" y1="14" x2="14" y2="18" />
            <line x1="14" y1="14" x2="10" y2="18" />
        </svg>
    );
}

function CurrencyIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function TrendingIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}

function ArrowUpIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
        </svg>
    );
}

function ArrowDownIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
        </svg>
    );
}

function MinusIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function ReportIcon() {
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

function ChevronRightIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="report-item-arrow">
            <polyline points="9 18 15 12 9 6" />
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

function WarningIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
