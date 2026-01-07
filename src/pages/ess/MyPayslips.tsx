// ============================================================
// MY PAYSLIPS - View and download payslips
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { PayrollService } from '../../services/payrollService';
import type { Payslip } from '../../types/payroll';
import './ESS.css';

export function MyPayslips() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState<string>('all');

    useEffect(() => {
        loadPayslips();
    }, [userProfile?.employeeId]);

    const loadPayslips = async () => {
        if (!userProfile?.employeeId) return;

        try {
            setLoading(true);
            const data = await PayrollService.getEmployeePayslips(userProfile.employeeId);
            setPayslips(data);
        } catch (error) {
            console.error('Error loading payslips:', error);
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

    // Get unique years from payslips
    const years = [...new Set(payslips.map(p => new Date(p.payDate).getFullYear()))].sort((a, b) => b - a);

    // Filter payslips by year
    const filteredPayslips = yearFilter === 'all'
        ? payslips
        : payslips.filter(p => new Date(p.payDate).getFullYear().toString() === yearFilter);

    // Group payslips by year
    const groupedPayslips = filteredPayslips.reduce((acc, payslip) => {
        const year = new Date(payslip.payDate).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(payslip);
        return acc;
    }, {} as Record<number, Payslip[]>);

    return (
        <MainLayout>
            {/* Header */}
            <div className="ess-header">
                <div className="ess-header-content">
                    <h1 className="ess-title">My Payslips</h1>
                    <p className="ess-subtitle">View and download your payslips</p>
                </div>
                <div className="ess-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/ess')}>
                        <ArrowLeftIcon />
                        Back to Dashboard
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="ess-filters">
                <div className="ess-filter-group">
                    <label className="ess-filter-label">Year</label>
                    <select
                        className="ess-filter-select"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                    >
                        <option value="all">All Years</option>
                        {years.map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Payslips List */}
            <div className="ess-content">
                {loading ? (
                    <div className="ess-loading">
                        <div className="ess-loading-spinner" />
                        <p>Loading payslips...</p>
                    </div>
                ) : payslips.length === 0 ? (
                    <div className="ess-empty-state">
                        <DocumentIcon />
                        <h3>No Payslips Available</h3>
                        <p>Your payslips will appear here after your first pay run.</p>
                    </div>
                ) : (
                    <div className="ess-payslips-container">
                        {Object.entries(groupedPayslips)
                            .sort(([a], [b]) => Number(b) - Number(a))
                            .map(([year, yearPayslips]) => (
                                <div key={year} className="ess-payslips-year-group">
                                    <h3 className="ess-year-header">{year}</h3>
                                    <div className="ess-payslips-grid">
                                        {yearPayslips.map(payslip => (
                                            <div
                                                key={payslip.id}
                                                className="ess-payslip-card"
                                                onClick={() => navigate(`/ess/payslips/${payslip.id}`)}
                                            >
                                                <div className="ess-payslip-card-header">
                                                    <div className="ess-payslip-period">
                                                        {payslip.periodDescription}
                                                    </div>
                                                    {!payslip.viewedByEmployee && (
                                                        <span className="ess-badge ess-badge--new">New</span>
                                                    )}
                                                </div>
                                                <div className="ess-payslip-card-body">
                                                    <div className="ess-payslip-amount">
                                                        {formatCurrency(payslip.netPay)}
                                                    </div>
                                                    <div className="ess-payslip-meta">
                                                        <span>Pay Date: {formatDate(payslip.payDate)}</span>
                                                    </div>
                                                </div>
                                                <div className="ess-payslip-card-footer">
                                                    <div className="ess-payslip-summary">
                                                        <div className="ess-payslip-summary-item">
                                                            <span className="ess-payslip-summary-label">Gross</span>
                                                            <span className="ess-payslip-summary-value">
                                                                {formatCurrency(payslip.grossEarnings)}
                                                            </span>
                                                        </div>
                                                        <div className="ess-payslip-summary-item">
                                                            <span className="ess-payslip-summary-label">Deductions</span>
                                                            <span className="ess-payslip-summary-value ess-payslip-summary-value--deduction">
                                                                -{formatCurrency(payslip.totalDeductions)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export function PayslipDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { userProfile } = useAuth();
    const [payslip, setPayslip] = useState<Payslip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPayslip();
    }, [id]);

    const loadPayslip = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const data = await PayrollService.getPayslip(id);
            setPayslip(data);

            // Mark as viewed
            if (data && !data.viewedByEmployee && userProfile?.employeeId === data.employeeId) {
                await PayrollService.markPayslipViewed(id);
            }
        } catch (error) {
            console.error('Error loading payslip:', error);
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

    const handleDownload = () => {
        if (payslip?.pdfUrl) {
            window.open(payslip.pdfUrl, '_blank');
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="ess-loading">
                    <div className="ess-loading-spinner" />
                    <p>Loading payslip...</p>
                </div>
            </MainLayout>
        );
    }

    if (!payslip) {
        return (
            <MainLayout>
                <div className="ess-empty-state">
                    <DocumentIcon />
                    <h3>Payslip Not Found</h3>
                    <p>The requested payslip could not be found.</p>
                    <Button variant="primary" onClick={() => navigate('/ess/payslips')}>
                        Back to Payslips
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header */}
            <div className="ess-header">
                <div className="ess-header-content">
                    <h1 className="ess-title">Payslip - {payslip.periodDescription}</h1>
                    <p className="ess-subtitle">Pay Date: {formatDate(payslip.payDate)}</p>
                </div>
                <div className="ess-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/ess/payslips')}>
                        <ArrowLeftIcon />
                        Back
                    </Button>
                    {payslip.pdfUrl && (
                        <Button variant="primary" onClick={handleDownload}>
                            <DownloadIcon />
                            Download PDF
                        </Button>
                    )}
                </div>
            </div>

            {/* Payslip Content */}
            <div className="ess-payslip-detail">
                {/* Company & Employee Info */}
                <div className="ess-payslip-header-section">
                    <div className="ess-payslip-company">
                        <h3>{payslip.companyName}</h3>
                        {payslip.companyAddress && <p>{payslip.companyAddress}</p>}
                    </div>
                    <div className="ess-payslip-employee">
                        <div className="ess-payslip-info-row">
                            <span className="ess-payslip-info-label">Employee Name:</span>
                            <span className="ess-payslip-info-value">{payslip.employeeName}</span>
                        </div>
                        <div className="ess-payslip-info-row">
                            <span className="ess-payslip-info-label">Employee Number:</span>
                            <span className="ess-payslip-info-value">{payslip.employeeNumber}</span>
                        </div>
                        {payslip.department && (
                            <div className="ess-payslip-info-row">
                                <span className="ess-payslip-info-label">Department:</span>
                                <span className="ess-payslip-info-value">{payslip.department}</span>
                            </div>
                        )}
                        {payslip.jobTitle && (
                            <div className="ess-payslip-info-row">
                                <span className="ess-payslip-info-label">Job Title:</span>
                                <span className="ess-payslip-info-value">{payslip.jobTitle}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Period Info */}
                <div className="ess-payslip-period-section">
                    <div className="ess-payslip-info-row">
                        <span className="ess-payslip-info-label">Pay Period:</span>
                        <span className="ess-payslip-info-value">
                            {formatDate(payslip.periodStart)} - {formatDate(payslip.periodEnd)}
                        </span>
                    </div>
                    {payslip.bankDetails && (
                        <div className="ess-payslip-info-row">
                            <span className="ess-payslip-info-label">Bank Account:</span>
                            <span className="ess-payslip-info-value">{payslip.bankDetails}</span>
                        </div>
                    )}
                </div>

                {/* Earnings & Deductions */}
                <div className="ess-payslip-breakdown">
                    {/* Earnings */}
                    <div className="ess-payslip-section">
                        <h4 className="ess-payslip-section-title">Earnings</h4>
                        <table className="ess-payslip-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th className="ess-payslip-table-amount">Amount</th>
                                    <th className="ess-payslip-table-amount">YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payslip.earnings.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.description}</td>
                                        <td className="ess-payslip-table-amount">
                                            {formatCurrency(item.amount)}
                                        </td>
                                        <td className="ess-payslip-table-amount ess-payslip-table-ytd">
                                            {item.ytdAmount ? formatCurrency(item.ytdAmount) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td><strong>Total Earnings</strong></td>
                                    <td className="ess-payslip-table-amount">
                                        <strong>{formatCurrency(payslip.grossEarnings)}</strong>
                                    </td>
                                    <td className="ess-payslip-table-amount ess-payslip-table-ytd">
                                        {formatCurrency(payslip.ytdGross)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Deductions */}
                    <div className="ess-payslip-section">
                        <h4 className="ess-payslip-section-title">Deductions</h4>
                        <table className="ess-payslip-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th className="ess-payslip-table-amount">Amount</th>
                                    <th className="ess-payslip-table-amount">YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payslip.deductions.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.description}</td>
                                        <td className="ess-payslip-table-amount ess-payslip-deduction">
                                            {formatCurrency(item.amount)}
                                        </td>
                                        <td className="ess-payslip-table-amount ess-payslip-table-ytd">
                                            {item.ytdAmount ? formatCurrency(item.ytdAmount) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td><strong>Total Deductions</strong></td>
                                    <td className="ess-payslip-table-amount ess-payslip-deduction">
                                        <strong>{formatCurrency(payslip.totalDeductions)}</strong>
                                    </td>
                                    <td className="ess-payslip-table-amount ess-payslip-table-ytd">
                                        {formatCurrency(payslip.ytdPaye + payslip.ytdUif)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Employer Contributions */}
                {payslip.employerContributions && payslip.employerContributions.length > 0 && (
                    <div className="ess-payslip-section ess-payslip-section--contributions">
                        <h4 className="ess-payslip-section-title">Employer Contributions</h4>
                        <table className="ess-payslip-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th className="ess-payslip-table-amount">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payslip.employerContributions.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.description}</td>
                                        <td className="ess-payslip-table-amount">
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Leave Balances */}
                {payslip.leaveBalances && payslip.leaveBalances.length > 0 && (
                    <div className="ess-payslip-section ess-payslip-section--leave">
                        <h4 className="ess-payslip-section-title">Leave Balances</h4>
                        <div className="ess-payslip-leave-grid">
                            {payslip.leaveBalances.map((balance, index) => (
                                <div key={index} className="ess-payslip-leave-item">
                                    <span className="ess-payslip-leave-type">{balance.leaveType}</span>
                                    <span className="ess-payslip-leave-balance">
                                        {balance.balance} {balance.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Net Pay */}
                <div className="ess-payslip-net-pay">
                    <div className="ess-payslip-net-pay-row">
                        <span className="ess-payslip-net-pay-label">Net Pay</span>
                        <span className="ess-payslip-net-pay-value">
                            {formatCurrency(payslip.netPay)}
                        </span>
                    </div>
                    <div className="ess-payslip-net-pay-row ess-payslip-net-pay-row--ytd">
                        <span className="ess-payslip-net-pay-label">YTD Net Pay</span>
                        <span className="ess-payslip-net-pay-value">
                            {formatCurrency(payslip.ytdNetPay)}
                        </span>
                    </div>
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

function DocumentIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}
