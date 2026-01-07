// ============================================================
// EMPLOYEE REPORTS - Employee-related reports
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { ReportService } from '../../services/reportService';
import { CompanyService } from '../../services/companyService';
import type {
    HeadcountSummary,
    EmployeeReportRow,
    ProbationReport,
    ServiceAnniversaryReport
} from '../../types/reports';
import type { Department } from '../../types/company';
import './Reports.css';

type ReportType = 'list' | 'headcount' | 'turnover' | 'probation' | 'anniversaries' | 'documents';

export function EmployeeReports() {
    const navigate = useNavigate();
    const { reportType } = useParams<{ reportType?: string }>();
    const { userProfile } = useAuth();

    const [activeReport, setActiveReport] = useState<ReportType>(
        (reportType as ReportType) || 'list'
    );
    const [loading, setLoading] = useState(false);

    // Data states
    const [headcount, setHeadcount] = useState<HeadcountSummary | null>(null);
    const [employees, setEmployees] = useState<EmployeeReportRow[]>([]);
    const [probation, setProbation] = useState<ProbationReport | null>(null);
    const [anniversaries, setAnniversaries] = useState<ServiceAnniversaryReport | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Filters
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('active');

    useEffect(() => {
        if (reportType) {
            setActiveReport(reportType as ReportType);
        }
    }, [reportType]);

    useEffect(() => {
        loadDepartments();
    }, [userProfile?.companyId]);

    useEffect(() => {
        loadReport();
    }, [activeReport, departmentFilter, statusFilter, userProfile?.companyId]);

    const loadDepartments = async () => {
        if (!userProfile?.companyId) return;
        try {
            const depts = await CompanyService.getDepartments(userProfile.companyId);
            setDepartments(depts);
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const loadReport = async () => {
        if (!userProfile?.companyId) return;

        setLoading(true);
        try {
            switch (activeReport) {
                case 'headcount':
                    const headcountData = await ReportService.getHeadcountSummary(userProfile.companyId);
                    setHeadcount(headcountData);
                    break;

                case 'list':
                    const employeeList = await ReportService.getEmployeeList(userProfile.companyId, {
                        departmentId: departmentFilter !== 'all' ? departmentFilter : undefined,
                        status: statusFilter as 'active' | 'terminated' | undefined
                    });
                    setEmployees(employeeList);
                    break;

                case 'probation':
                    const probationData = await ReportService.getProbationReport(userProfile.companyId);
                    setProbation(probationData);
                    break;

                case 'anniversaries':
                    const anniversaryData = await ReportService.getServiceAnniversaries(userProfile.companyId, 30);
                    setAnniversaries(anniversaryData);
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
        { id: 'list', name: 'Employee List', description: 'Complete list of employees' },
        { id: 'headcount', name: 'Headcount Summary', description: 'Headcount by department and status' },
        { id: 'probation', name: 'Probation Report', description: 'Employees on probation' },
        { id: 'anniversaries', name: 'Service Anniversaries', description: 'Upcoming work anniversaries' },
        { id: 'turnover', name: 'Turnover Report', description: 'Employee turnover analysis' },
        { id: 'documents', name: 'Document Expiry', description: 'Expiring documents' }
    ];

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
            case 'headcount':
                return renderHeadcountReport();
            case 'list':
                return renderEmployeeListReport();
            case 'probation':
                return renderProbationReport();
            case 'anniversaries':
                return renderAnniversariesReport();
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

    const renderHeadcountReport = () => {
        if (!headcount) return null;

        return (
            <>
                {/* Summary Cards */}
                <div className="report-summary">
                    <div className="report-summary-card">
                        <div className="report-summary-value">{headcount.totalEmployees}</div>
                        <div className="report-summary-label">Total Employees</div>
                    </div>
                    <div className="report-summary-card">
                        <div className="report-summary-value">{headcount.activeEmployees}</div>
                        <div className="report-summary-label">Active</div>
                    </div>
                    <div className="report-summary-card">
                        <div className="report-summary-value">{headcount.probationEmployees}</div>
                        <div className="report-summary-label">On Probation</div>
                    </div>
                    <div className="report-summary-card">
                        <div className="report-summary-value">{headcount.turnoverRate}%</div>
                        <div className="report-summary-label">Turnover Rate</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="report-charts">
                    <div className="report-chart-card">
                        <h4 className="report-chart-title">Headcount by Department</h4>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th style={{ textAlign: 'right' }}>Count</th>
                                    <th style={{ textAlign: 'right' }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {headcount.byDepartment.map(dept => (
                                    <tr key={dept.department}>
                                        <td>{dept.department}</td>
                                        <td className="report-value--number">{dept.count}</td>
                                        <td className="report-value--percentage">
                                            {((dept.count / headcount.totalEmployees) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="report-chart-card">
                        <h4 className="report-chart-title">Headcount by Status</h4>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Count</th>
                                    <th style={{ textAlign: 'right' }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {headcount.byStatus.map(status => (
                                    <tr key={status.status}>
                                        <td>{formatStatus(status.status)}</td>
                                        <td className="report-value--number">{status.count}</td>
                                        <td className="report-value--percentage">
                                            {((status.count / headcount.totalEmployees) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="report-chart-card">
                        <h4 className="report-chart-title">Headcount by Contract Type</h4>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Contract Type</th>
                                    <th style={{ textAlign: 'right' }}>Count</th>
                                    <th style={{ textAlign: 'right' }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {headcount.byContractType.map(ct => (
                                    <tr key={ct.type}>
                                        <td>{formatStatus(ct.type)}</td>
                                        <td className="report-value--number">{ct.count}</td>
                                        <td className="report-value--percentage">
                                            {((ct.count / headcount.totalEmployees) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {headcount.byGender && headcount.byGender.length > 0 && (
                        <div className="report-chart-card">
                            <h4 className="report-chart-title">Headcount by Gender</h4>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Gender</th>
                                        <th style={{ textAlign: 'right' }}>Count</th>
                                        <th style={{ textAlign: 'right' }}>%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {headcount.byGender.map(g => (
                                        <tr key={g.gender}>
                                            <td>{formatStatus(g.gender)}</td>
                                            <td className="report-value--number">{g.count}</td>
                                            <td className="report-value--percentage">
                                                {((g.count / headcount.totalEmployees) * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </>
        );
    };

    const renderEmployeeListReport = () => {
        if (employees.length === 0) {
            return (
                <div className="report-empty">
                    <div className="report-empty-icon">
                        <UsersIcon />
                    </div>
                    <p className="report-empty-text">No employees found</p>
                    <p className="report-empty-hint">Try adjusting your filters</p>
                </div>
            );
        }

        return (
            <table className="report-table report-table--striped">
                <thead>
                    <tr>
                        <th>Employee #</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Job Title</th>
                        <th>Start Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Years</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(emp => (
                        <tr key={emp.id}>
                            <td style={{ fontFamily: 'monospace' }}>{emp.employeeNumber}</td>
                            <td>{emp.fullName}</td>
                            <td>{emp.department}</td>
                            <td>{emp.jobTitle}</td>
                            <td>{formatDate(emp.startDate)}</td>
                            <td>{formatStatus(emp.status)}</td>
                            <td className="report-value--number">{emp.yearsOfService}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="report-table-footer">
                    <tr>
                        <td colSpan={6}>Total Employees</td>
                        <td className="report-value--number">{employees.length}</td>
                    </tr>
                </tfoot>
            </table>
        );
    };

    const renderProbationReport = () => {
        if (!probation || probation.employeesOnProbation.length === 0) {
            return (
                <div className="report-empty">
                    <div className="report-empty-icon">
                        <ClockIcon />
                    </div>
                    <p className="report-empty-text">No employees on probation</p>
                    <p className="report-empty-hint">All employees have completed their probation period</p>
                </div>
            );
        }

        return (
            <table className="report-table report-table--striped">
                <thead>
                    <tr>
                        <th>Employee #</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Start Date</th>
                        <th>Probation End</th>
                        <th style={{ textAlign: 'right' }}>Days Left</th>
                        <th>Extended</th>
                    </tr>
                </thead>
                <tbody>
                    {probation.employeesOnProbation.map(emp => (
                        <tr key={emp.employeeId}>
                            <td style={{ fontFamily: 'monospace' }}>{emp.employeeNumber}</td>
                            <td>{emp.employeeName}</td>
                            <td>{emp.department}</td>
                            <td>{formatDate(emp.startDate)}</td>
                            <td>{formatDate(emp.probationEndDate)}</td>
                            <td className={`report-value--number ${emp.daysRemaining <= 14 ? 'report-value--negative' : ''}`}>
                                {emp.daysRemaining}
                            </td>
                            <td>{emp.isExtended ? 'Yes' : 'No'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderAnniversariesReport = () => {
        if (!anniversaries || anniversaries.upcomingAnniversaries.length === 0) {
            return (
                <div className="report-empty">
                    <div className="report-empty-icon">
                        <CalendarIcon />
                    </div>
                    <p className="report-empty-text">No upcoming anniversaries</p>
                    <p className="report-empty-hint">No work anniversaries in the next 30 days</p>
                </div>
            );
        }

        return (
            <table className="report-table report-table--striped">
                <thead>
                    <tr>
                        <th>Employee #</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Anniversary Date</th>
                        <th style={{ textAlign: 'right' }}>Years</th>
                    </tr>
                </thead>
                <tbody>
                    {anniversaries.upcomingAnniversaries.map(emp => (
                        <tr key={emp.employeeId}>
                            <td style={{ fontFamily: 'monospace' }}>{emp.employeeNumber}</td>
                            <td>{emp.employeeName}</td>
                            <td>{emp.department}</td>
                            <td>{formatDate(emp.anniversaryDate)}</td>
                            <td className="report-value--number">{emp.yearsOfService}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <MainLayout>
            {/* Header */}
            <div className="reports-header">
                <div className="reports-header-content">
                    <h1 className="reports-title">Employee Reports</h1>
                    <p className="reports-subtitle">Generate employee-related reports and analytics</p>
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
                            navigate(`/reports/employee/${report.id}`);
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
                {activeReport === 'list' && (
                    <div className="report-filters">
                        <div className="report-filter">
                            <label className="report-filter-label">Department</label>
                            <select
                                className="report-filter-input"
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="report-filter">
                            <label className="report-filter-label">Status</label>
                            <select
                                className="report-filter-input"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="probation">On Probation</option>
                                <option value="on_leave">On Leave</option>
                                <option value="terminated">Terminated</option>
                            </select>
                        </div>
                    </div>
                )}

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

function UsersIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
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
