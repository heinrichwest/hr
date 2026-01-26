// ============================================================
// LEAVE MOVEMENT VIEWER COMPONENT
// Task Group 6: Display leave balances and trends with line charts
// ============================================================

import type { LeaveMovementReport } from '../../types/adminReports';
import { Button } from '../Button/Button';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import './LeaveMovementViewer.css';

interface LeaveMovementViewerProps {
    report: LeaveMovementReport;
    onExportExcel?: () => void;
    onExportCSV?: () => void;
}

// Chart colors using HSL for Field Guide compliance
const LEAVE_TYPE_COLORS = {
    annualLeaveDays: 'hsl(220, 70%, 50%)',
    sickLeaveDays: 'hsl(0, 60%, 50%)',
    familyResponsibilityDays: 'hsl(35, 100%, 50%)',
    maternityDays: 'hsl(280, 60%, 55%)',
    paternityDays: 'hsl(140, 50%, 45%)',
    otherDays: 'hsl(220, 30%, 70%)'
};

export function LeaveMovementViewer({ report, onExportExcel, onExportCSV }: LeaveMovementViewerProps) {
    // Format date for display
    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('en-ZA');
    };

    return (
        <div className="leave-movement-viewer">
            {/* Report Header */}
            <div className="report-header">
                <div className="report-header-content">
                    <h2 className="report-title">Employee Leave Movement</h2>
                    <div className="report-meta">
                        <div className="meta-item">
                            <span className="meta-label">Company:</span>
                            <span className="meta-value">{report.metadata.companyName}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Period:</span>
                            <span className="meta-value">
                                {formatDate(report.metadata.periodStart)} - {formatDate(report.metadata.periodEnd)}
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Total Employees:</span>
                            <span className="meta-value">{report.balancesByType[0]?.employeeCount || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="report-actions">
                    <Button
                        variant="primary"
                        onClick={onExportExcel}
                        disabled={!onExportExcel}
                        aria-label="Export to Excel"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Export to Excel
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onExportCSV}
                        disabled={!onExportCSV}
                        aria-label="Export to CSV"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Export to CSV
                    </Button>
                </div>
            </div>

            <div className="report-content">
                {/* Summary Statistics */}
                <section className="report-section">
                    <h3 className="section-title">Leave Summary</h3>
                    <div className="summary-cards">
                        <div className="summary-card">
                            <div className="card-label">Total Leave Taken</div>
                            <div className="card-value">{report.summary.totalLeaveDaysTaken}</div>
                            <div className="card-unit">days</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Leave Pending</div>
                            <div className="card-value">{report.summary.totalLeaveDaysPending}</div>
                            <div className="card-unit">days</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Total Balance</div>
                            <div className="card-value">{report.summary.totalLeaveBalance}</div>
                            <div className="card-unit">days</div>
                        </div>
                        <div className="summary-card card-warning">
                            <div className="card-label">Negative Balances</div>
                            <div className="card-value">{report.summary.employeesWithNegativeBalances}</div>
                            <div className="card-unit">employees</div>
                        </div>
                    </div>
                </section>

                {/* Leave Usage Trends Chart */}
                {report.usageTrends.length > 0 && (
                    <section className="report-section">
                        <h3 className="section-title">Leave Usage Trends</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={report.usageTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                                    <XAxis
                                        dataKey="period"
                                        stroke="hsl(220, 10%, 50%)"
                                        style={{ fontSize: '14px' }}
                                    />
                                    <YAxis
                                        stroke="hsl(220, 10%, 50%)"
                                        style={{ fontSize: '14px' }}
                                        label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'hsl(0, 0%, 100%)',
                                            border: '1px solid hsl(0, 0%, 90%)',
                                            borderRadius: '6px',
                                            boxShadow: '0 2px 8px hsl(0, 0%, 0%, 0.1)'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="annualLeaveDays"
                                        name="Annual Leave"
                                        stroke={LEAVE_TYPE_COLORS.annualLeaveDays}
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="sickLeaveDays"
                                        name="Sick Leave"
                                        stroke={LEAVE_TYPE_COLORS.sickLeaveDays}
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="familyResponsibilityDays"
                                        name="Family Responsibility"
                                        stroke={LEAVE_TYPE_COLORS.familyResponsibilityDays}
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    {report.usageTrends.some(t => t.maternityDays > 0) && (
                                        <Line
                                            type="monotone"
                                            dataKey="maternityDays"
                                            name="Maternity Leave"
                                            stroke={LEAVE_TYPE_COLORS.maternityDays}
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    )}
                                    {report.usageTrends.some(t => t.paternityDays > 0) && (
                                        <Line
                                            type="monotone"
                                            dataKey="paternityDays"
                                            name="Paternity Leave"
                                            stroke={LEAVE_TYPE_COLORS.paternityDays}
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                )}

                {/* Leave Balances by Type */}
                <section className="report-section">
                    <h3 className="section-title">Leave Balances by Type</h3>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Leave Type</th>
                                    <th>Total Entitlement</th>
                                    <th>Total Taken</th>
                                    <th>Total Pending</th>
                                    <th>Total Balance</th>
                                    <th>Avg. Balance</th>
                                    <th>Employees</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.balancesByType.map(balance => (
                                    <tr key={balance.leaveTypeId}>
                                        <td className="leave-type-name">{balance.leaveTypeName}</td>
                                        <td className="numeric">{balance.totalEntitlement.toFixed(1)}</td>
                                        <td className="numeric">{balance.totalTaken.toFixed(1)}</td>
                                        <td className="numeric">{balance.totalPending.toFixed(1)}</td>
                                        <td className="numeric">{balance.totalBalance.toFixed(1)}</td>
                                        <td className="numeric">{balance.averageBalance.toFixed(1)}</td>
                                        <td className="numeric">{balance.employeeCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Leave Requests */}
                {report.leaveTakenRecords && report.leaveTakenRecords.length > 0 && (
                    <section className="report-section">
                        <h3 className="section-title">Leave Requests</h3>
                        <div className="data-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Leave Type</th>
                                        <th>Dates</th>
                                        <th>Days</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.leaveTakenRecords.map((record, index) => {
                                        const getInitials = (name: string): string => {
                                            return name
                                                .split(' ')
                                                .map(n => n[0])
                                                .join('')
                                                .toUpperCase()
                                                .slice(0, 2);
                                        };

                                        const getAvatarColor = (name: string): string => {
                                            const colors = [
                                                'hsl(220, 70%, 50%)', 'hsl(140, 50%, 45%)', 'hsl(35, 100%, 50%)',
                                                'hsl(0, 60%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(330, 60%, 55%)',
                                                'hsl(190, 60%, 50%)', 'hsl(80, 50%, 45%)', 'hsl(20, 100%, 55%)',
                                                'hsl(250, 60%, 60%)'
                                            ];
                                            const charCode = name.charCodeAt(0);
                                            const colorIndex = charCode % colors.length;
                                            return colors[colorIndex];
                                        };

                                        const getStatusBadgeClass = (status: string): string => {
                                            const statusMap: Record<string, string> = {
                                                pending: 'badge badge-pending',
                                                approved: 'badge badge-approved',
                                                rejected: 'badge badge-rejected',
                                                taken: 'badge badge-taken',
                                                cancelled: 'badge badge-cancelled'
                                            };
                                            return statusMap[status.toLowerCase()] || 'badge';
                                        };

                                        const getStatusText = (status: string): string => {
                                            return status.charAt(0).toUpperCase() + status.slice(1);
                                        };

                                        const formatDateRange = (start: Date, end: Date): string => {
                                            const startStr = new Date(start).toLocaleDateString('en-ZA', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            });
                                            const endStr = new Date(end).toLocaleDateString('en-ZA', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            });
                                            return `${startStr} - ${endStr}`;
                                        };

                                        return (
                                            <tr key={`${record.employeeId}-${index}`}>
                                                <td>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px'
                                                    }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            backgroundColor: getAvatarColor(record.employeeName),
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 600,
                                                            fontSize: '14px',
                                                            flexShrink: 0
                                                        }}>
                                                            {getInitials(record.employeeName)}
                                                        </div>
                                                        <span style={{ fontWeight: 500 }}>{record.employeeName}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        <span style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: 'hsl(220, 30%, 70%)'
                                                        }}></span>
                                                        {record.leaveTypeName}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div>
                                                        {formatDateRange(record.startDate, record.endDate)}
                                                        {record.isHalfDay && (
                                                            <div style={{
                                                                fontSize: '12px',
                                                                color: 'hsl(0, 0%, 60%)',
                                                                marginTop: '2px'
                                                            }}>
                                                                Half day ({record.halfDayType})
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="numeric">
                                                    {record.workingDays} {record.workingDays === 1 ? 'day' : 'days'}
                                                </td>
                                                <td>
                                                    <span className={getStatusBadgeClass(record.status)}>
                                                        {getStatusText(record.status)}
                                                    </span>
                                                </td>
                                                <td>{formatDate(record.submittedDate)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Employee Balances with Negative Balance Warnings */}
                <section className="report-section">
                    <h3 className="section-title">
                        Employee Leave Balances
                        {report.summary.employeesWithNegativeBalances > 0 && (
                            <span className="warning-badge">
                                {report.summary.employeesWithNegativeBalances} with negative balances
                            </span>
                        )}
                    </h3>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee No.</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Leave Type</th>
                                    <th>Entitlement</th>
                                    <th>Taken</th>
                                    <th>Pending</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.employeeBalances.map(employee => (
                                    employee.leaveBalances.map((balance, index) => (
                                        <tr
                                            key={`${employee.employeeId}-${balance.leaveTypeId}`}
                                            className={balance.hasNegativeBalance ? 'row-warning' : ''}
                                        >
                                            {index === 0 && (
                                                <>
                                                    <td rowSpan={employee.leaveBalances.length} className="emp-number">
                                                        {employee.employeeNumber}
                                                    </td>
                                                    <td rowSpan={employee.leaveBalances.length} className="emp-name">
                                                        {employee.employeeName}
                                                    </td>
                                                    <td rowSpan={employee.leaveBalances.length}>
                                                        {employee.department}
                                                    </td>
                                                </>
                                            )}
                                            <td>{balance.leaveTypeName}</td>
                                            <td className="numeric">{balance.entitlement.toFixed(1)}</td>
                                            <td className="numeric">{balance.taken.toFixed(1)}</td>
                                            <td className="numeric">{balance.pending.toFixed(1)}</td>
                                            <td className="numeric balance-value">
                                                {balance.balance.toFixed(1)}
                                            </td>
                                            <td>
                                                {balance.hasNegativeBalance && (
                                                    <span className="badge badge-warning">Negative Balance</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Export Buttons - Bottom */}
            <div className="report-footer-actions">
                <Button
                    variant="primary"
                    onClick={onExportExcel}
                    disabled={!onExportExcel}
                >
                    Export to Excel
                </Button>
                <Button
                    variant="secondary"
                    onClick={onExportCSV}
                    disabled={!onExportCSV}
                >
                    Export to CSV
                </Button>
            </div>
        </div>
    );
}
