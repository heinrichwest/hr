// ============================================================
// LEAVE REPORTS - Leave-related reports
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { ReportService } from '../../services/reportService';
import { LeaveService } from '../../services/leaveService';
import type {
    LeaveBalanceSummary,
    LeaveBalanceReport,
    LeaveRequestsReport
} from '../../types/reports';
import type { LeaveType } from '../../types/leave';
import './Reports.css';

type ReportType = 'balances' | 'requests' | 'utilization' | 'absenteeism';

export function LeaveReports() {
    const navigate = useNavigate();
    const { reportType } = useParams<{ reportType?: string }>();
    const { userProfile } = useAuth();

    const [activeReport, setActiveReport] = useState<ReportType>(
        (reportType as ReportType) || 'balances'
    );
    const [loading, setLoading] = useState(false);

    // Data states
    const [balanceSummary, setBalanceSummary] = useState<LeaveBalanceSummary | null>(null);
    const [balanceReport, setBalanceReport] = useState<LeaveBalanceReport | null>(null);
    const [requestsReport, setRequestsReport] = useState<LeaveRequestsReport | null>(null);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

    // Filters
    const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date()
    });

    useEffect(() => {
        if (reportType) {
            setActiveReport(reportType as ReportType);
        }
    }, [reportType]);

    useEffect(() => {
        loadLeaveTypes();
    }, [userProfile?.companyId]);

    useEffect(() => {
        loadReport();
    }, [activeReport, leaveTypeFilter, dateRange, userProfile?.companyId]);

    const loadLeaveTypes = async () => {
        // Use demo-company for System Admin users without companyId
        const companyId = userProfile?.companyId || 'demo-company';
        try {
            const types = await LeaveService.getLeaveTypes(companyId);
            setLeaveTypes(types);
        } catch (error) {
            console.error('Error loading leave types:', error);
        }
    };

    const loadReport = async () => {
        // Use demo-company for System Admin users without companyId
        const companyId = userProfile?.companyId || 'demo-company';

        setLoading(true);
        try {
            switch (activeReport) {
                case 'balances':
                    const summary = await ReportService.getLeaveBalanceSummary(companyId);
                    setBalanceSummary(summary);

                    const balances = await ReportService.getLeaveBalanceReport(companyId, {
                        leaveTypeId: leaveTypeFilter !== 'all' ? leaveTypeFilter : undefined
                    });
                    setBalanceReport(balances);
                    break;

                case 'requests':
                    const requests = await ReportService.getLeaveRequestsReport(
                        companyId,
                        dateRange.start,
                        dateRange.end,
                        { leaveTypeId: leaveTypeFilter !== 'all' ? leaveTypeFilter : undefined }
                    );
                    setRequestsReport(requests);
                    break;
            }
        } catch (error) {
            console.error('Error loading report:', error);
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

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const reports = [
        { id: 'balances', name: 'Leave Balances', description: 'Current leave balances' },
        { id: 'requests', name: 'Leave Requests', description: 'Leave requests for period' },
        { id: 'utilization', name: 'Leave Utilization', description: 'Leave usage analysis' },
        { id: 'absenteeism', name: 'Absenteeism Report', description: 'Absenteeism patterns' }
    ];

    const setQuickDateRange = (preset: string) => {
        const now = new Date();
        let start: Date;
        let end: Date = now;

        switch (preset) {
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this_quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                start = new Date(now.getFullYear(), quarterStart, 1);
                break;
            case 'this_year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return;
        }

        setDateRange({ start, end });
    };

    const renderReportContent = () => {
        if (loading) {
            return (
                <div className="report-loading">
                    <div className="report-loading-spinner" />
                    <p>Generating report...</p>
                </div>
            );
        }

        switch (activeReport) {
            case 'balances':
                return renderBalancesReport();
            case 'requests':
                return renderRequestsReport();
            default:
                return (
                    <div className="report-empty">
                        <div className="report-empty-icon">
                            <DocumentIcon />
                        </div>
                        <p className="report-empty-text">Report coming soon</p>
                        <p className="report-empty-hint">This report is under development</p>
                    </div>
                );
        }
    };

    const renderBalancesReport = () => {
        if (!balanceSummary || !balanceReport) return null;

        return (
            <>
                {/* Summary Cards */}
                <div className="report-summary">
                    {balanceSummary.byLeaveType.map(lt => (
                        <div key={lt.leaveTypeId} className="report-summary-card">
                            <div className="report-summary-value">{lt.averageBalance.toFixed(1)}</div>
                            <div className="report-summary-label">Avg {lt.leaveTypeName}</div>
                        </div>
                    ))}
                </div>

                {/* Detailed Table */}
                {balanceReport.balances.length === 0 ? (
                    <div className="report-empty">
                        <div className="report-empty-icon">
                            <CalendarIcon />
                        </div>
                        <p className="report-empty-text">No leave balances found</p>
                    </div>
                ) : (
                    <table className="report-table report-table--striped">
                        <thead>
                            <tr>
                                <th>Employee #</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Leave Type</th>
                                <th style={{ textAlign: 'right' }}>Entitlement</th>
                                <th style={{ textAlign: 'right' }}>Taken</th>
                                <th style={{ textAlign: 'right' }}>Pending</th>
                                <th style={{ textAlign: 'right' }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {balanceReport.balances.map((bal, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontFamily: 'monospace' }}>{bal.employeeNumber}</td>
                                    <td>{bal.employeeName}</td>
                                    <td>{bal.department}</td>
                                    <td>{bal.leaveTypeName}</td>
                                    <td className="report-value--number">{bal.entitlement}</td>
                                    <td className="report-value--number">{bal.taken}</td>
                                    <td className="report-value--number">{bal.pending}</td>
                                    <td className={`report-value--number ${bal.balance < 5 ? 'report-value--negative' : ''}`}>
                                        {bal.balance}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </>
        );
    };

    // Helper function to get employee initials
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    };

    // Helper function to get avatar color
    const getAvatarColor = (name: string) => {
        const colors = [
            'hsl(270, 70%, 60%)', // Purple
            'hsl(25, 95%, 55%)',  // Orange
            'hsl(0, 75%, 60%)',   // Red
            'hsl(180, 70%, 45%)', // Cyan
            'hsl(190, 75%, 45%)', // Teal
            'hsl(90, 60%, 50%)',  // Lime
            'hsl(220, 80%, 60%)', // Blue
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // Helper function to get status color
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'hsl(140, 50%, 45%)';
            case 'pending': return 'hsl(35, 100%, 50%)';
            case 'rejected': return 'hsl(0, 60%, 50%)';
            case 'taken': return 'hsl(220, 70%, 50%)';
            case 'cancelled': return 'hsl(0, 0%, 50%)';
            default: return 'hsl(220, 10%, 50%)';
        }
    };

    const renderRequestsReport = () => {
        if (!requestsReport) return null;

        return (
            <>
                {/* Summary Cards with Icons */}
                <div className="leave-summary-cards">
                    <div className="leave-summary-card">
                        <div className="leave-summary-icon" style={{ background: 'hsl(220, 70%, 95%)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(220, 70%, 40%)" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <div className="leave-summary-content">
                            <div className="leave-summary-value">{requestsReport.summary.total}</div>
                            <div className="leave-summary-label">Total Requests</div>
                        </div>
                    </div>

                    <div className="leave-summary-card">
                        <div className="leave-summary-icon" style={{ background: 'hsl(140, 50%, 95%)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(140, 50%, 40%)" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div className="leave-summary-content">
                            <div className="leave-summary-value" style={{ color: 'hsl(140, 50%, 40%)' }}>
                                {requestsReport.summary.approved}
                            </div>
                            <div className="leave-summary-label">Approved</div>
                        </div>
                    </div>

                    <div className="leave-summary-card">
                        <div className="leave-summary-icon" style={{ background: 'hsl(35, 100%, 95%)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(35, 100%, 40%)" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div className="leave-summary-content">
                            <div className="leave-summary-value" style={{ color: 'hsl(35, 100%, 40%)' }}>
                                {requestsReport.summary.pending}
                            </div>
                            <div className="leave-summary-label">Pending</div>
                        </div>
                    </div>

                    <div className="leave-summary-card">
                        <div className="leave-summary-icon" style={{ background: 'hsl(0, 60%, 95%)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(0, 60%, 40%)" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <div className="leave-summary-content">
                            <div className="leave-summary-value" style={{ color: 'hsl(0, 60%, 40%)' }}>
                                {requestsReport.summary.rejected}
                            </div>
                            <div className="leave-summary-label">Rejected</div>
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                {requestsReport.requests.length === 0 ? (
                    <div className="report-empty">
                        <div className="report-empty-icon">
                            <CalendarIcon />
                        </div>
                        <p className="report-empty-text">No leave requests found</p>
                        <p className="report-empty-hint">Try adjusting the date range</p>
                    </div>
                ) : (
                    <table className="leave-requests-table">
                        <thead>
                            <tr>
                                <th>EMPLOYEE</th>
                                <th>LEAVE TYPE</th>
                                <th>DATES</th>
                                <th>DAYS</th>
                                <th>STATUS</th>
                                <th>SUBMITTED</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requestsReport.requests.map(req => (
                                <tr key={req.id}>
                                    <td>
                                        <div className="employee-cell">
                                            <div
                                                className="employee-avatar"
                                                style={{ background: getAvatarColor(req.employeeName) }}
                                            >
                                                {getInitials(req.employeeName)}
                                            </div>
                                            <span className="employee-name">{req.employeeName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="leave-type-cell">
                                            <span className="leave-type-bullet">●</span>
                                            {req.leaveType}
                                        </div>
                                    </td>
                                    <td>
                                        {formatDate(req.startDate)} - {formatDate(req.endDate)}
                                    </td>
                                    <td>{req.workingDays} {req.workingDays === 1 ? 'day' : 'days'}</td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{ color: getStatusColor(req.status) }}
                                        >
                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>{formatDate(req.requestedDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </>
        );
    };

    return (
        <MainLayout>
            {/* Header */}
            <div className="reports-header">
                <div className="reports-header-content">
                    <h1 className="reports-title">Leave Reports</h1>
                    <p className="reports-subtitle">Generate leave-related reports and analytics</p>
                </div>
                <div className="reports-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/reports')}>
                        <ArrowLeftIcon />
                        Back to Reports
                    </Button>
                </div>
            </div>

            {/* Report Tabs */}
            <div className="report-tabs">
                {reports.map(report => (
                    <button
                        key={report.id}
                        className={`report-tab ${activeReport === report.id ? 'report-tab--active' : ''}`}
                        onClick={() => {
                            setActiveReport(report.id as ReportType);
                            navigate(`/reports/leave/${report.id}`);
                        }}
                    >
                        {report.name}
                    </button>
                ))}
            </div>

            {/* Report Viewer */}
            <div className="report-viewer">
                <div className="report-viewer-header">
                    <h2 className="report-viewer-title">
                        {reports.find(r => r.id === activeReport)?.name || 'Report'}
                    </h2>
                    <div className="report-viewer-actions">
                        <Button variant="secondary" size="sm" onClick={loadReport}>
                            <RefreshIcon />
                            Refresh
                        </Button>
                        <Button variant="secondary" size="sm">
                            <DownloadIcon />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="report-filters">
                    <div className="report-filter">
                        <label className="report-filter-label">Leave Type</label>
                        <select
                            className="report-filter-input"
                            value={leaveTypeFilter}
                            onChange={(e) => setLeaveTypeFilter(e.target.value)}
                        >
                            <option value="all">All Leave Types</option>
                            {leaveTypes.map(lt => (
                                <option key={lt.id} value={lt.id}>{lt.name}</option>
                            ))}
                        </select>
                    </div>

                    {activeReport === 'requests' && (
                        <>
                            <div className="report-filter">
                                <label className="report-filter-label">Date Range</label>
                                <div className="date-range-picker">
                                    <input
                                        type="date"
                                        value={dateRange.start.toISOString().split('T')[0]}
                                        onChange={(e) => setDateRange(prev => ({
                                            ...prev,
                                            start: new Date(e.target.value)
                                        }))}
                                    />
                                    <span className="date-range-separator">to</span>
                                    <input
                                        type="date"
                                        value={dateRange.end.toISOString().split('T')[0]}
                                        onChange={(e) => setDateRange(prev => ({
                                            ...prev,
                                            end: new Date(e.target.value)
                                        }))}
                                    />
                                </div>
                            </div>
                            <div className="report-filter">
                                <label className="report-filter-label">Quick Select</label>
                                <div className="quick-date-buttons">
                                    <button
                                        className="quick-date-btn"
                                        onClick={() => setQuickDateRange('this_month')}
                                    >
                                        This Month
                                    </button>
                                    <button
                                        className="quick-date-btn"
                                        onClick={() => setQuickDateRange('last_month')}
                                    >
                                        Last Month
                                    </button>
                                    <button
                                        className="quick-date-btn"
                                        onClick={() => setQuickDateRange('this_quarter')}
                                    >
                                        This Quarter
                                    </button>
                                    <button
                                        className="quick-date-btn"
                                        onClick={() => setQuickDateRange('this_year')}
                                    >
                                        This Year
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="report-viewer-content">
                    {renderReportContent()}
                </div>
            </div>
        </MainLayout>
    );
}

// Icon Components
function ArrowLeftIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>
    );
}

function RefreshIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function DocumentIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
