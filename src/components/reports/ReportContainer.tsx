// ============================================================
// REPORT CONTAINER COMPONENT
// Task Group 6: Wrapper that switches viewers by report type
// ============================================================

import type { ReportType, AdminReport } from '../../types/adminReports';
import type { UI19Report } from '../../types/ui19';
import { UI19ReportViewer } from './UI19ReportViewer';
import { BasicEmployeeInfoViewer } from './BasicEmployeeInfoViewer';
import { WorkforceProfileViewer } from './WorkforceProfileViewer';
import { LeaveMovementViewer } from './LeaveMovementViewer';
import './ReportContainer.css';

interface ReportContainerProps {
    reportType: ReportType;
    report: AdminReport | null;
    loading?: boolean;
    error?: string;
    onExportExcel?: () => void;
    onExportCSV?: () => void;
}

export function ReportContainer({
    reportType,
    report,
    loading = false,
    error,
    onExportExcel,
    onExportCSV
}: ReportContainerProps) {
    // Loading state
    if (loading) {
        return (
            <div className="report-container-loading">
                <div className="loading-spinner" />
                <p>Generating report...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="report-container-error">
                <div className="error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(0, 60%, 50%)" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h3>Failed to generate report</h3>
                <p>{error}</p>
            </div>
        );
    }

    // Empty state
    if (!report) {
        return (
            <div className="report-container-empty">
                <div className="empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="hsl(220, 10%, 80%)" strokeWidth="1">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                </div>
                <h3>No report generated yet</h3>
                <p>Configure and generate a report to see results</p>
            </div>
        );
    }

    // Type guards for report types
    const isUI19Report = (r: AdminReport): r is UI19Report => {
        return 'employees' in r && 'employerDetails' in r;
    };

    const isBasicEmployeeInfoReport = (r: AdminReport): r is AdminReport & { metadata: any; employees: any[] } => {
        return 'metadata' in r && 'employees' in r && !('employerDetails' in r);
    };

    const isWorkforceProfileReport = (r: AdminReport): r is AdminReport & { headcountSummary: any } => {
        return 'metadata' in r && 'headcountSummary' in r;
    };

    const isLeaveMovementReport = (r: AdminReport): r is AdminReport & { balancesByType: any[] } => {
        return 'metadata' in r && 'balancesByType' in r;
    };

    // Render appropriate viewer based on report type
    switch (reportType) {
        case 'ui-19':
            if (isUI19Report(report)) {
                return (
                    <UI19ReportViewer
                        report={report}
                        onExportExcel={onExportExcel}
                        onExportCSV={onExportCSV}
                    />
                );
            }
            break;

        case 'basic-employee-info':
            if (isBasicEmployeeInfoReport(report)) {
                return (
                    <BasicEmployeeInfoViewer
                        report={report as any}
                        onExportExcel={onExportExcel}
                        onExportCSV={onExportCSV}
                    />
                );
            }
            break;

        case 'workforce-profile':
            if (isWorkforceProfileReport(report)) {
                return (
                    <WorkforceProfileViewer
                        report={report as any}
                        onExportExcel={onExportExcel}
                        onExportCSV={onExportCSV}
                    />
                );
            }
            break;

        case 'leave-movement':
            if (isLeaveMovementReport(report)) {
                return (
                    <LeaveMovementViewer
                        report={report as any}
                        onExportExcel={onExportExcel}
                        onExportCSV={onExportCSV}
                    />
                );
            }
            break;

        default:
            return (
                <div className="report-container-error">
                    <h3>Unknown report type</h3>
                    <p>The selected report type is not supported.</p>
                </div>
            );
    }

    // Fallback if type guard fails
    return (
        <div className="report-container-error">
            <h3>Report type mismatch</h3>
            <p>The report data does not match the selected report type.</p>
        </div>
    );
}
