// ============================================================
// PAY RUN LIST - List and manage payroll runs
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { PayrollService } from '../../services/payrollService';
import type { PayRun, PayRunStatus } from '../../types/payroll';
import './Payroll.css';

type TabFilter = 'all' | 'in_progress' | 'completed';

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

const IN_PROGRESS_STATUSES: PayRunStatus[] = [
    'draft', 'inputs_locked', 'calculating', 'calculated', 'review', 'pending_approval', 'approved', 'finalising'
];

const COMPLETED_STATUSES: PayRunStatus[] = ['finalised', 'closed'];

export function PayRunList() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [payRuns, setPayRuns] = useState<PayRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState<string>('all');

    useEffect(() => {
        loadPayRuns();
    }, [userProfile?.companyId]);

    const loadPayRuns = async () => {
        if (!userProfile?.companyId) return;

        try {
            setLoading(true);
            const data = await PayrollService.getPayRuns(userProfile.companyId);
            setPayRuns(data);
        } catch (error) {
            console.error('Error loading pay runs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePayRun = () => {
        navigate('/payroll/runs/new');
    };

    const handleViewPayRun = (payRunId: string) => {
        navigate(`/payroll/runs/${payRunId}`);
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

    // Filter pay runs
    const filteredPayRuns = payRuns.filter(run => {
        // Tab filter
        if (activeTab === 'in_progress' && !IN_PROGRESS_STATUSES.includes(run.status)) return false;
        if (activeTab === 'completed' && !COMPLETED_STATUSES.includes(run.status)) return false;

        // Year filter
        if (yearFilter !== 'all' && run.taxYear !== yearFilter) return false;

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const periodDesc = `${run.payFrequency} ${run.periodNumber} ${run.taxYear}`.toLowerCase();
            if (!periodDesc.includes(search)) return false;
        }

        return true;
    });

    // Calculate stats
    const stats = {
        draft: payRuns.filter(r => r.status === 'draft').length,
        inProgress: payRuns.filter(r => IN_PROGRESS_STATUSES.includes(r.status) && r.status !== 'draft').length,
        completed: payRuns.filter(r => COMPLETED_STATUSES.includes(r.status)).length,
        totalNetPay: payRuns.reduce((sum, r) => sum + r.totalNetPay, 0)
    };

    // Get unique tax years for filter
    const taxYears = [...new Set(payRuns.map(r => r.taxYear))].sort().reverse();

    return (
        <MainLayout>
            {/* Header */}
            <div className="payroll-header">
                <div className="payroll-header-content">
                    <h1 className="payroll-title">Payroll</h1>
                    <p className="payroll-subtitle">Manage pay runs, process payroll, and generate payslips</p>
                </div>
                <div className="payroll-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/payroll/elements')}>
                        <SettingsIcon />
                        Pay Elements
                    </Button>
                    <Button variant="primary" onClick={handleCreatePayRun}>
                        <PlusIcon />
                        New Pay Run
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="payroll-stats">
                <div className="payroll-stat-card payroll-stat-card--draft">
                    <div className="payroll-stat-value">{stats.draft}</div>
                    <div className="payroll-stat-label">Draft</div>
                </div>
                <div className="payroll-stat-card payroll-stat-card--processing">
                    <div className="payroll-stat-value">{stats.inProgress}</div>
                    <div className="payroll-stat-label">In Progress</div>
                </div>
                <div className="payroll-stat-card payroll-stat-card--approved">
                    <div className="payroll-stat-value">{stats.completed}</div>
                    <div className="payroll-stat-label">Completed</div>
                </div>
                <div className="payroll-stat-card payroll-stat-card--total">
                    <div className="payroll-stat-value">{formatCurrency(stats.totalNetPay)}</div>
                    <div className="payroll-stat-label">Total Net Pay (YTD)</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="payroll-tabs">
                <button
                    className={`payroll-tab ${activeTab === 'all' ? 'payroll-tab--active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    <ListIcon />
                    All Pay Runs
                    <span className="payroll-tab-badge">{payRuns.length}</span>
                </button>
                <button
                    className={`payroll-tab ${activeTab === 'in_progress' ? 'payroll-tab--active' : ''}`}
                    onClick={() => setActiveTab('in_progress')}
                >
                    <ClockIcon />
                    In Progress
                    {stats.draft + stats.inProgress > 0 && (
                        <span className="payroll-tab-badge">{stats.draft + stats.inProgress}</span>
                    )}
                </button>
                <button
                    className={`payroll-tab ${activeTab === 'completed' ? 'payroll-tab--active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    <CheckCircleIcon />
                    Completed
                </button>
            </div>

            {/* Filters */}
            <div className="payroll-filters">
                <div className="payroll-filter-search">
                    <SearchIcon />
                    <input
                        type="text"
                        className="payroll-filter-input"
                        placeholder="Search pay runs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="payroll-filter-selects">
                    <select
                        className="payroll-filter-select"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                    >
                        <option value="all">All Tax Years</option>
                        {taxYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="payroll-table-container">
                {loading ? (
                    <div className="payroll-empty-state">
                        <div className="payroll-empty-icon">
                            <LoadingIcon />
                        </div>
                        <p className="payroll-empty-text">Loading pay runs...</p>
                    </div>
                ) : filteredPayRuns.length === 0 ? (
                    <div className="payroll-empty-state">
                        <div className="payroll-empty-icon">
                            <DollarIcon />
                        </div>
                        <p className="payroll-empty-text">
                            {payRuns.length === 0 ? 'No pay runs yet' : 'No matching pay runs'}
                        </p>
                        <p className="payroll-empty-hint">
                            {payRuns.length === 0
                                ? 'Create your first pay run to process payroll'
                                : 'Try adjusting your filters'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="payroll-table-wrapper">
                            <table className="payroll-table">
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th>Tax Year</th>
                                        <th>Pay Date</th>
                                        <th>Employees</th>
                                        <th>Gross Pay</th>
                                        <th>Net Pay</th>
                                        <th>Status</th>
                                        <th style={{ width: '80px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayRuns.map(run => (
                                        <tr key={run.id} onClick={() => handleViewPayRun(run.id)}>
                                            <td>
                                                <div className="payroll-run-cell">
                                                    <span className="payroll-run-period">
                                                        {run.payFrequency.charAt(0).toUpperCase() + run.payFrequency.slice(1)} Period {run.periodNumber}
                                                    </span>
                                                    <span className="payroll-run-dates">
                                                        {formatDate(run.periodStart)} - {formatDate(run.periodEnd)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{run.taxYear}</td>
                                            <td>{formatDate(run.payDate)}</td>
                                            <td>
                                                <span className="payroll-amount">{run.employeeCount}</span>
                                                {run.exceptionCount > 0 && (
                                                    <span className="payrun-exception-badge" style={{ marginLeft: '8px' }}>
                                                        <AlertIcon />
                                                        {run.exceptionCount}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="payroll-amount">
                                                    {formatCurrency(run.totalGrossEarnings)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="payroll-amount payroll-amount--positive">
                                                    {formatCurrency(run.totalNetPay)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`payroll-status-badge payroll-status-badge--${run.status}`}>
                                                    {STATUS_LABELS[run.status]}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="payroll-action-buttons" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className="payroll-action-btn payroll-action-btn--primary"
                                                        onClick={() => handleViewPayRun(run.id)}
                                                        title="View pay run"
                                                    >
                                                        <EyeIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="payroll-table-footer">
                            <span className="payroll-table-count">
                                Showing {filteredPayRuns.length} of {payRuns.length} pay runs
                            </span>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
}

// Icon Components
function PlusIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function SettingsIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg className="payroll-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function ListIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function DollarIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
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
