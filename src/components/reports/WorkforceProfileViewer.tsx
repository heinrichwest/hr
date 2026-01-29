// ============================================================
// WORKFORCE PROFILE VIEWER COMPONENT
// Task Group 6: Display workforce analytics with Recharts visualizations
// ============================================================

import type { WorkforceProfileReport } from '../../types/adminReports';
import { Button } from '../Button/Button';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import './WorkforceProfileViewer.css';

interface WorkforceProfileViewerProps {
    report: WorkforceProfileReport;
    onExportExcel?: () => void;
    onExportCSV?: () => void;
}

// Chart colors using HSL for Field Guide compliance
const CHART_COLORS = {
    primary: 'hsl(220, 70%, 50%)',
    secondary: 'hsl(35, 100%, 50%)',
    tertiary: 'hsl(220, 30%, 70%)',
    success: 'hsl(140, 50%, 45%)',
    warning: 'hsl(35, 100%, 50%)',
    danger: 'hsl(0, 60%, 50%)'
};

const EMPLOYEE_TYPE_COLORS = [
    'hsl(220, 70%, 50%)', // Permanent
    'hsl(35, 100%, 50%)', // Fixed Term
    'hsl(140, 50%, 45%)', // Part Time
    'hsl(280, 60%, 55%)', // Temporary
    'hsl(0, 60%, 50%)',   // Contractor
    'hsl(180, 50%, 45%)'  // Intern
];

export function WorkforceProfileViewer({ report, onExportExcel, onExportCSV }: WorkforceProfileViewerProps) {
    // Prepare department chart data
    const departmentChartData = report.headcountSummary.byDepartment.map(dept => ({
        name: dept.departmentName,
        count: dept.count,
        percentage: dept.percentage
    }));

    // Prepare employee type chart data
    const employeeTypeChartData = [
        { name: 'Permanent', value: report.employeeTypeDistribution.permanent },
        { name: 'Fixed Term', value: report.employeeTypeDistribution.fixedTerm },
        { name: 'Part Time', value: report.employeeTypeDistribution.partTime },
        { name: 'Temporary', value: report.employeeTypeDistribution.temporary },
        { name: 'Contractor', value: report.employeeTypeDistribution.contractor },
        { name: 'Intern', value: report.employeeTypeDistribution.intern }
    ].filter(item => item.value > 0);

    return (
        <div className="workforce-profile-viewer">
            {/* Report Header */}
            <div className="report-header">
                <div className="report-header-content">
                    <h2 className="report-title">Workforce Profile</h2>
                    <div className="report-meta">
                        <div className="meta-item">
                            <span className="meta-label">Company:</span>
                            <span className="meta-value">{report.metadata.companyName}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Period:</span>
                            <span className="meta-value">
                                {new Date(report.metadata.periodStart).toLocaleDateString('en-ZA')} - {new Date(report.metadata.periodEnd).toLocaleDateString('en-ZA')}
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Total Headcount:</span>
                            <span className="meta-value">{report.headcountSummary.total}</span>
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
                {/* Headcount Summary Cards */}
                <section className="report-section">
                    <h3 className="section-title">Headcount Summary</h3>
                    <div className="summary-cards">
                        <div className="summary-card">
                            <div className="card-label">Total Employees</div>
                            <div className="card-value">{report.headcountSummary.total}</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Departments</div>
                            <div className="card-value">{report.headcountSummary.byDepartment.length}</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Branches</div>
                            <div className="card-value">{report.headcountSummary.byBranch.length || 1}</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Permanent Staff</div>
                            <div className="card-value">{report.employeeTypeDistribution.permanent}</div>
                        </div>
                    </div>
                </section>

                {/* Department Headcount Chart */}
                <section className="report-section">
                    <h3 className="section-title">Headcount by Department</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={departmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    stroke="hsl(220, 10%, 50%)"
                                    style={{ fontSize: '14px' }}
                                />
                                <YAxis stroke="hsl(220, 10%, 50%)" style={{ fontSize: '14px' }} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'hsl(0, 0%, 100%)',
                                        border: '1px solid hsl(0, 0%, 90%)',
                                        borderRadius: '6px',
                                        boxShadow: '0 2px 8px hsl(0, 0%, 0%, 0.1)'
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="count" name="Employee Count" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Department Data Table */}
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Headcount</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.headcountSummary.byDepartment.map(dept => (
                                    <tr key={dept.departmentId}>
                                        <td>{dept.departmentName}</td>
                                        <td className="numeric">{dept.count}</td>
                                        <td className="numeric">{dept.percentage.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Employee Type Distribution */}
                <section className="report-section">
                    <h3 className="section-title">Employee Type Distribution</h3>
                    <div className="chart-grid">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={employeeTypeChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill={CHART_COLORS.primary}
                                        dataKey="value"
                                    >
                                        {employeeTypeChartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={EMPLOYEE_TYPE_COLORS[index % EMPLOYEE_TYPE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'hsl(0, 0%, 100%)',
                                            border: '1px solid hsl(0, 0%, 90%)',
                                            borderRadius: '6px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Employee Type Data Table */}
                        <div className="data-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Contract Type</th>
                                        <th>Count</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employeeTypeChartData.map((item, index) => (
                                        <tr key={item.name}>
                                            <td>
                                                <span
                                                    className="type-indicator"
                                                    style={{ background: EMPLOYEE_TYPE_COLORS[index] }}
                                                />
                                                {item.name}
                                            </td>
                                            <td className="numeric">{item.value}</td>
                                            <td className="numeric">
                                                {((item.value / report.employeeTypeDistribution.total) * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Demographics Breakdown */}
                <section className="report-section">
                    <h3 className="section-title">Demographics Breakdown</h3>

                    {/* Age Distribution */}
                    {report.demographics.ageGroups.length > 0 && (
                        <div className="demographics-subsection">
                            <h4 className="subsection-title">Age Distribution</h4>
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Age Group</th>
                                            <th>Count</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.demographics.ageGroups.map(group => (
                                            <tr key={group.label}>
                                                <td>{group.label}</td>
                                                <td className="numeric">{group.count}</td>
                                                <td className="numeric">{group.percentage.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Gender Distribution */}
                    {report.demographics.genderDistribution.length > 0 && (
                        <div className="demographics-subsection">
                            <h4 className="subsection-title">Gender Distribution</h4>
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Gender</th>
                                            <th>Count</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.demographics.genderDistribution.map(item => (
                                            <tr key={item.gender}>
                                                <td>{item.gender}</td>
                                                <td className="numeric">{item.count}</td>
                                                <td className="numeric">{item.percentage.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
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
