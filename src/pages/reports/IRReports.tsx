// ============================================================
// IR REPORTS - Industrial Relations reports
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { ReportService } from '../../services/reportService';
import { IRService } from '../../services/irService';
import type { IRCaseSummary, IRCasesReport, WarningsReport } from '../../types/reports';
import type { WarningType } from '../../types/ir';
import './Reports.css';

type ReportType = 'cases' | 'summary' | 'warnings' | 'trends' | 'ccma';

export function IRReports() {
    const navigate = useNavigate();
    const { reportType } = useParams<{ reportType?: string }>();
    const { userProfile } = useAuth();

    const [activeReport, setActiveReport] = useState<ReportType>(
        (reportType as ReportType) || 'cases'
    );
    const [loading, setLoading] = useState(false);

    // Data states
    const [caseSummary, setCaseSummary] = useState<IRCaseSummary | null>(null);
    const [casesReport, setCasesReport] = useState<IRCasesReport | null>(null);
    const [warningsReport, setWarningsReport] = useState<WarningsReport | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [caseTypeFilter, setCaseTypeFilter] = useState('all');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date()
    });

    useEffect(() => {
        if (reportType) {
            setActiveReport(reportType as ReportType);
        }
    }, [reportType]);

    useEffect(() => {
        loadReport();
    }, [activeReport, statusFilter, caseTypeFilter, dateRange, userProfile?.companyId]);

    const loadReport = async () => {
        if (!userProfile?.companyId) return;

        setLoading(true);
        try {
            switch (activeReport) {
                case 'summary':
                    const summary = await ReportService.getIRCaseSummary(
                        userProfile.companyId,
                        dateRange.start,
                        dateRange.end
                    );
                    setCaseSummary(summary);
                    break;

                case 'cases':
                    const cases = await ReportService.getIRCasesReport(userProfile.companyId, {
                        status: statusFilter !== 'all' ? statusFilter : undefined,
                        caseType: caseTypeFilter !== 'all' ? caseTypeFilter : undefined
                    });
                    setCasesReport(cases);
                    break;

                case 'warnings':
                    const warnings = await ReportService.getWarningsReport(
                        userProfile.companyId,
                        dateRange.start,
                        dateRange.end
                    );
                    setWarningsReport(warnings);
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
        { id: 'cases', name: 'IR Cases', description: 'List of all IR cases' },
        { id: 'summary', name: 'IR Summary', description: 'Cases by type and status' },
        { id: 'warnings', name: 'Warnings Report', description: 'Employee warnings' },
        { id: 'trends', name: 'Disciplinary Trends', description: 'Trends over time' },
        { id: 'ccma', name: 'CCMA Report', description: 'CCMA cases and outcomes' }
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
            case 'cases':
                return renderCasesReport();
            case 'summary':
                return renderSummaryReport();
            case 'warnings':
                return renderWarningsReport();
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

    const renderSummaryReport = () => {
        if (!caseSummary) return null;

        return (
            <>
                {/* Summary Cards */}
                <div className="report-summary">
                    <div className="report-summary-card">
                        <div className="report-summary-value">{caseSummary.totalCases}</div>
                        <div className="report-summary-label">Total Cases</div>
                    </div>
                    <div className="report-summary-card">
                        <div className="report-summary-value" style={{ color: 'var(--speccon-warning)' }}>
                            {caseSummary.openCases}
                        </div>
                        <div className="report-summary-label">Open</div>
                    </div>
                    <div className="report-summary-card">
                        <div className="report-summary-value" style={{ color: 'var(--speccon-success)' }}>
                            {caseSummary.closedCases}
                        </div>
                        <div className="report-summary-label">Closed</div>
                    </div>
                    <div className="report-summary-card">
                        <div className="report-summary-value">{caseSummary.averageResolutionDays}</div>
                        <div className="report-summary-label">Avg Resolution Days</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="report-charts">
                    <div className="report-chart-card">
                        <h4 className="report-chart-title">Cases by Type</h4>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Case Type</th>
                                    <th style={{ textAlign: 'right' }}>Count</th>
                                    <th style={{ textAlign: 'right' }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {caseSummary.byCaseType.map(ct => (
                                    <tr key={ct.type}>
                                        <td>{formatStatus(ct.type)}</td>
                                        <td className="report-value--number">{ct.count}</td>
                                        <td className="report-value--percentage">
                                            {((ct.count / caseSummary.totalCases) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="report-chart-card">
                        <h4 className="report-chart-title">Cases by Status</h4>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Count</th>
                                    <th style={{ textAlign: 'right' }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {caseSummary.byStatus.map(s => (
                                    <tr key={s.status}>
                                        <td>{formatStatus(s.status)}</td>
                                        <td className="report-value--number">{s.count}</td>
                                        <td className="report-value--percentage">
                                            {((s.count / caseSummary.totalCases) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="report-chart-card">
                        <h4 className="report-chart-title">Cases by Department</h4>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th style={{ textAlign: 'right' }}>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {caseSummary.byDepartment.map(d => (
                                    <tr key={d.department}>
                                        <td>{d.department}</td>
                                        <td className="report-value--number">{d.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="report-chart-card">
                        <h4 className="report-chart-title">Cases by Outcome</h4>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Outcome</th>
                                    <th style={{ textAlign: 'right' }}>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {caseSummary.byOutcome.length > 0 ? (
                                    caseSummary.byOutcome.map(o => (
                                        <tr key={o.outcome}>
                                            <td>{formatStatus(o.outcome)}</td>
                                            <td className="report-value--number">{o.count}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                            No outcomes recorded
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        );
    };

    const renderCasesReport = () => {
        if (!casesReport || casesReport.cases.length === 0) {
            return (
                <div className="report-empty">
                    <div className="report-empty-icon">
                        <AlertIcon />
                    </div>
                    <p className="report-empty-text">No IR cases found</p>
                    <p className="report-empty-hint">Try adjusting your filters</p>
                </div>
            );
        }

        return (
            <table className="report-table report-table--striped">
                <thead>
                    <tr>
                        <th>Case #</th>
                        <th>Type</th>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Date Opened</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th style={{ textAlign: 'right' }}>Days Open</th>
                    </tr>
                </thead>
                <tbody>
                    {casesReport.cases.map(c => (
                        <tr key={c.caseNumber}>
                            <td style={{ fontFamily: 'monospace' }}>{c.caseNumber}</td>
                            <td>{formatStatus(c.caseType)}</td>
                            <td>{c.employeeName}</td>
                            <td>{c.department}</td>
                            <td>{formatDate(c.dateOpened)}</td>
                            <td>{formatStatus(c.status)}</td>
                            <td>{c.assignedTo}</td>
                            <td className="report-value--number">{c.daysOpen}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="report-table-footer">
                    <tr>
                        <td colSpan={7}>Total Cases</td>
                        <td className="report-value--number">{casesReport.cases.length}</td>
                    </tr>
                </tfoot>
            </table>
        );
    };

    const renderWarningsReport = () => {
        if (!warningsReport || warningsReport.warnings.length === 0) {
            return (
                <div className="report-empty">
                    <div className="report-empty-icon">
                        <WarningIcon />
                    </div>
                    <p className="report-empty-text">No warnings found</p>
                    <p className="report-empty-hint">Try adjusting the date range</p>
                </div>
            );
        }

        return (
            <>
                {/* Summary Cards */}
                <div className="report-summary">
                    <div className="report-summary-card">
                        <div className="report-summary-value">{warningsReport.summary.total}</div>
                        <div className="report-summary-label">Total Warnings</div>
                    </div>
                    <div className="report-summary-card">
                        <div className="report-summary-value" style={{ color: 'var(--speccon-warning)' }}>
                            {warningsReport.summary.active}
                        </div>
                        <div className="report-summary-label">Active</div>
                    </div>
                    <div className="report-summary-card">
                        <div className="report-summary-value" style={{ color: 'var(--color-text-tertiary)' }}>
                            {warningsReport.summary.expired}
                        </div>
                        <div className="report-summary-label">Expired</div>
                    </div>
                </div>

                <table className="report-table report-table--striped">
                    <thead>
                        <tr>
                            <th>Warning #</th>
                            <th>Type</th>
                            <th>Employee</th>
                            <th>Category</th>
                            <th>Issue Date</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                            <th>Issued By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {warningsReport.warnings.map(w => (
                            <tr key={w.warningNumber}>
                                <td style={{ fontFamily: 'monospace' }}>{w.warningNumber}</td>
                                <td>{IRService.getWarningTypeLabel(w.warningType as WarningType)}</td>
                                <td>{w.employeeName}</td>
                                <td>{w.offenceCategory}</td>
                                <td>{formatDate(w.issueDate)}</td>
                                <td>{formatDate(w.expiryDate)}</td>
                                <td>{w.isActive ? 'Active' : 'Expired'}</td>
                                <td>{w.issuedBy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    };

    return (
        <MainLayout>
            {/* Header */}
            <div className="reports-header">
                <div className="reports-header-content">
                    <h1 className="reports-title">IR Reports</h1>
                    <p className="reports-subtitle">Generate industrial relations reports and analytics</p>
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
                            navigate(`/reports/ir/${report.id}`);
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
                    {activeReport === 'cases' && (
                        <>
                            <div className="report-filter">
                                <label className="report-filter-label">Status</label>
                                <select
                                    className="report-filter-input"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="investigation">Investigation</option>
                                    <option value="hearing_scheduled">Hearing Scheduled</option>
                                    <option value="awaiting_outcome">Awaiting Outcome</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="report-filter">
                                <label className="report-filter-label">Case Type</label>
                                <select
                                    className="report-filter-input"
                                    value={caseTypeFilter}
                                    onChange={(e) => setCaseTypeFilter(e.target.value)}
                                >
                                    <option value="all">All Types</option>
                                    <option value="misconduct">Misconduct</option>
                                    <option value="poor_performance">Poor Performance</option>
                                    <option value="grievance">Grievance</option>
                                    <option value="incapacity">Incapacity</option>
                                </select>
                            </div>
                        </>
                    )}

                    {(activeReport === 'summary' || activeReport === 'warnings') && (
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
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function WarningIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
