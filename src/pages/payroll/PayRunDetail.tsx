// ============================================================
// PAY RUN DETAIL - View and manage a single pay run
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { PayrollService } from '../../services/payrollService';
import type { PayRun, PayRunLine, PayRunStatus } from '../../types/payroll';
import './Payroll.css';

type DetailTab = 'employees' | 'summary' | 'exceptions';

const STATUS_LABELS: Record<PayRunStatus, string> = {
    draft: 'Draft',
    inputs_locked: 'Inputs Locked',
    calculating: 'Calculating',
    calculated: 'Calculated',
    review: 'In Review',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    finalising: 'Finalising',
    finalised: 'Finalised',
    closed: 'Closed'
};

const PROGRESS_STEPS: { status: PayRunStatus; label: string }[] = [
    { status: 'draft', label: 'Draft' },
    { status: 'inputs_locked', label: 'Inputs Locked' },
    { status: 'calculated', label: 'Calculated' },
    { status: 'approved', label: 'Approved' },
    { status: 'finalised', label: 'Finalised' }
];

export function PayRunDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [payRun, setPayRun] = useState<PayRun | null>(null);
    const [payRunLines, setPayRunLines] = useState<PayRunLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<DetailTab>('employees');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (id) {
            loadPayRunDetail();
        }
    }, [id]);

    const loadPayRunDetail = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const [runData, linesData] = await Promise.all([
                PayrollService.getPayRun(id),
                PayrollService.getPayRunLines(id)
            ]);

            if (!runData) {
                navigate('/payroll');
                return;
            }

            setPayRun(runData);
            setPayRunLines(linesData);
        } catch (error) {
            console.error('Error loading pay run:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: PayRunStatus) => {
        if (!payRun || !userProfile) return;

        try {
            setProcessing(true);

            const updateData: Partial<PayRun> = { status: newStatus };

            // Add appropriate timestamps based on status
            if (newStatus === 'calculated') {
                updateData.calculatedBy = userProfile.uid;
                updateData.calculatedAt = new Date();
            } else if (newStatus === 'approved') {
                updateData.approvedBy = userProfile.uid;
                updateData.approvedAt = new Date();
            } else if (newStatus === 'finalised') {
                updateData.finalisedBy = userProfile.uid;
                updateData.finalisedAt = new Date();
            }

            await PayrollService.updatePayRun(payRun.id, updateData);
            await loadPayRunDetail();
        } catch (error) {
            console.error('Error updating pay run status:', error);
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStepStatus = (stepStatus: PayRunStatus) => {
        if (!payRun) return 'pending';

        const currentIndex = PROGRESS_STEPS.findIndex(s => s.status === payRun.status);
        const stepIndex = PROGRESS_STEPS.findIndex(s => s.status === stepStatus);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'pending';
    };

    const getNextAction = () => {
        if (!payRun) return null;

        switch (payRun.status) {
            case 'draft':
                return { label: 'Lock Inputs', status: 'inputs_locked' as PayRunStatus };
            case 'inputs_locked':
                return { label: 'Calculate', status: 'calculating' as PayRunStatus };
            case 'calculating':
                return { label: 'Complete Calculation', status: 'calculated' as PayRunStatus };
            case 'calculated':
                return { label: 'Submit for Approval', status: 'pending_approval' as PayRunStatus };
            case 'review':
            case 'pending_approval':
                return { label: 'Approve', status: 'approved' as PayRunStatus };
            case 'approved':
                return { label: 'Finalise', status: 'finalising' as PayRunStatus };
            case 'finalising':
                return { label: 'Complete', status: 'finalised' as PayRunStatus };
            default:
                return null;
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="payroll-empty-state">
                    <div className="payroll-empty-icon">
                        <LoadingIcon />
                    </div>
                    <p className="payroll-empty-text">Loading pay run...</p>
                </div>
            </MainLayout>
        );
    }

    if (!payRun) {
        return (
            <MainLayout>
                <div className="payroll-empty-state">
                    <div className="payroll-empty-icon">
                        <AlertCircleIcon />
                    </div>
                    <p className="payroll-empty-text">Pay run not found</p>
                </div>
            </MainLayout>
        );
    }

    const nextAction = getNextAction();
    const exceptionsCount = payRunLines.filter(l => l.hasExceptions).length;

    return (
        <MainLayout>
            {/* Header */}
            <div className="payrun-detail-header">
                <div className="payrun-detail-header-left">
                    <Button variant="ghost" onClick={() => navigate('/payroll')}>
                        <ArrowLeftIcon />
                    </Button>
                    <div className="payrun-detail-info">
                        <h1 className="payrun-detail-title">
                            {payRun.payFrequency.charAt(0).toUpperCase() + payRun.payFrequency.slice(1)} Period {payRun.periodNumber}
                            <span className={`payroll-status-badge payroll-status-badge--${payRun.status}`}>
                                {STATUS_LABELS[payRun.status]}
                            </span>
                        </h1>
                        <div className="payrun-detail-meta">
                            <span>Tax Year: {payRun.taxYear}</span>
                            <span>Pay Date: {formatDate(payRun.payDate)}</span>
                            <span>{payRun.employeeCount} Employees</span>
                        </div>
                    </div>
                </div>
                <div className="payrun-detail-actions">
                    {payRun.status !== 'closed' && payRun.status !== 'finalised' && (
                        <>
                            {nextAction && (
                                <Button
                                    variant="primary"
                                    onClick={() => handleStatusChange(nextAction.status)}
                                    disabled={processing}
                                >
                                    {processing ? <LoadingIcon /> : <PlayIcon />}
                                    {nextAction.label}
                                </Button>
                            )}
                        </>
                    )}
                    {(payRun.status === 'finalised' || payRun.status === 'closed') && (
                        <>
                            <Button variant="secondary">
                                <DownloadIcon />
                                Bank File
                            </Button>
                            <Button variant="secondary">
                                <FileTextIcon />
                                Payslips
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Progress Steps */}
            <div className="payrun-progress">
                {PROGRESS_STEPS.map((step, index) => {
                    const stepStatus = getStepStatus(step.status);
                    return (
                        <div key={step.status} style={{ display: 'contents' }}>
                            <div className={`payrun-progress-step payrun-progress-step--${stepStatus}`}>
                                <div className="payrun-progress-step-icon">
                                    {stepStatus === 'completed' ? <CheckIcon /> : index + 1}
                                </div>
                                <div className="payrun-progress-step-text">
                                    <span className="payrun-progress-step-label">{step.label}</span>
                                </div>
                            </div>
                            {index < PROGRESS_STEPS.length - 1 && (
                                <div className={`payrun-progress-connector ${stepStatus === 'completed' ? 'payrun-progress-connector--completed' : ''}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Cards */}
            <div className="payrun-summary">
                <div className="payrun-summary-card">
                    <div className="payrun-summary-card-label">Gross Earnings</div>
                    <div className="payrun-summary-card-value">
                        {formatCurrency(payRun.totalGrossEarnings)}
                    </div>
                </div>
                <div className="payrun-summary-card">
                    <div className="payrun-summary-card-label">Total Deductions</div>
                    <div className="payrun-summary-card-value payrun-summary-card-value--warning">
                        {formatCurrency(payRun.totalDeductions)}
                    </div>
                </div>
                <div className="payrun-summary-card">
                    <div className="payrun-summary-card-label">Employer Contributions</div>
                    <div className="payrun-summary-card-value">
                        {formatCurrency(payRun.totalEmployerContributions)}
                    </div>
                </div>
                <div className="payrun-summary-card">
                    <div className="payrun-summary-card-label">Net Pay</div>
                    <div className="payrun-summary-card-value payrun-summary-card-value--success">
                        {formatCurrency(payRun.totalNetPay)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="payrun-detail-tabs">
                <button
                    className={`payrun-detail-tab ${activeTab === 'employees' ? 'payrun-detail-tab--active' : ''}`}
                    onClick={() => setActiveTab('employees')}
                >
                    <UsersIcon />
                    Employees ({payRunLines.length})
                </button>
                <button
                    className={`payrun-detail-tab ${activeTab === 'summary' ? 'payrun-detail-tab--active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    <BarChartIcon />
                    Summary
                </button>
                <button
                    className={`payrun-detail-tab ${activeTab === 'exceptions' ? 'payrun-detail-tab--active' : ''}`}
                    onClick={() => setActiveTab('exceptions')}
                >
                    <AlertCircleIcon />
                    Exceptions ({exceptionsCount})
                </button>
            </div>

            {/* Tab Content */}
            <div className="payroll-table-container">
                {activeTab === 'employees' && (
                    <div className="payroll-table-wrapper">
                        <table className="payrun-lines-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th className="text-right">Basic Salary</th>
                                    <th className="text-right">Gross</th>
                                    <th className="text-right">Deductions</th>
                                    <th className="text-right">PAYE</th>
                                    <th className="text-right">Net Pay</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payRunLines.map(line => (
                                    <tr key={line.id}>
                                        <td>
                                            <div className="payrun-lines-employee">
                                                <div className="payrun-lines-avatar">
                                                    {getInitials(line.employeeName)}
                                                </div>
                                                <div className="payrun-lines-employee-info">
                                                    <span className="payrun-lines-employee-name">{line.employeeName}</span>
                                                    <span className="payrun-lines-employee-number">{line.employeeNumber}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{line.departmentName || '-'}</td>
                                        <td className="text-right">
                                            <span className="payroll-amount">{formatCurrency(line.basicSalary)}</span>
                                        </td>
                                        <td className="text-right">
                                            <span className="payroll-amount">{formatCurrency(line.grossEarnings)}</span>
                                        </td>
                                        <td className="text-right">
                                            <span className="payroll-amount payroll-amount--negative">
                                                {formatCurrency(line.totalDeductions)}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <span className="payroll-amount">{formatCurrency(line.paye)}</span>
                                        </td>
                                        <td className="text-right">
                                            <span className="payroll-amount payroll-amount--positive">
                                                {formatCurrency(line.netPay)}
                                            </span>
                                        </td>
                                        <td>
                                            {line.hasExceptions ? (
                                                <span className="payrun-exception-badge payrun-exception-badge--error">
                                                    <AlertCircleIcon />
                                                    {line.exceptions?.length} Issue{(line.exceptions?.length || 0) > 1 ? 's' : ''}
                                                </span>
                                            ) : line.isIncluded ? (
                                                <span className="payroll-status-badge payroll-status-badge--approved">
                                                    <CheckIcon />
                                                    OK
                                                </span>
                                            ) : (
                                                <span className="payroll-status-badge payroll-status-badge--draft">
                                                    Excluded
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'summary' && (
                    <div className="payroll-empty-state">
                        <div className="payroll-empty-icon">
                            <BarChartIcon />
                        </div>
                        <p className="payroll-empty-text">Pay Run Summary</p>
                        <p className="payroll-empty-hint">
                            Detailed breakdown of statutory deductions:
                            PAYE {formatCurrency(payRun.totalPaye)} |
                            UIF {formatCurrency(payRun.totalUif)} |
                            SDL {formatCurrency(payRun.totalSdl)}
                        </p>
                    </div>
                )}

                {activeTab === 'exceptions' && (
                    exceptionsCount === 0 ? (
                        <div className="payroll-empty-state">
                            <div className="payroll-empty-icon">
                                <CheckCircleIcon />
                            </div>
                            <p className="payroll-empty-text">No exceptions</p>
                            <p className="payroll-empty-hint">All employee records have been processed without issues</p>
                        </div>
                    ) : (
                        <div className="payroll-table-wrapper">
                            <table className="payrun-lines-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Exception Type</th>
                                        <th>Severity</th>
                                        <th>Message</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payRunLines
                                        .filter(line => line.hasExceptions)
                                        .flatMap(line =>
                                            (line.exceptions || []).map(exc => (
                                                <tr key={`${line.id}-${exc.id}`}>
                                                    <td>
                                                        <div className="payrun-lines-employee">
                                                            <div className="payrun-lines-avatar">
                                                                {getInitials(line.employeeName)}
                                                            </div>
                                                            <div className="payrun-lines-employee-info">
                                                                <span className="payrun-lines-employee-name">{line.employeeName}</span>
                                                                <span className="payrun-lines-employee-number">{line.employeeNumber}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{exc.type.replace(/_/g, ' ')}</td>
                                                    <td>
                                                        <span className={`payrun-exception-badge ${exc.severity === 'error' ? 'payrun-exception-badge--error' : ''}`}>
                                                            {exc.severity}
                                                        </span>
                                                    </td>
                                                    <td>{exc.message}</td>
                                                    <td>
                                                        {exc.isResolved ? (
                                                            <span className="payroll-status-badge payroll-status-badge--approved">
                                                                Resolved
                                                            </span>
                                                        ) : (
                                                            <span className="payroll-status-badge payroll-status-badge--pending_approval">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
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

function PlayIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
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

function FileTextIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function BarChartIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    );
}

function AlertCircleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function LoadingIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
    );
}
