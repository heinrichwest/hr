// ============================================================
// IR CASE LIST - List and manage IR cases
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { IRService } from '../../services/irService';
import type { IRCase, IRCaseStatus } from '../../types/ir';
import './IR.css';

type TabType = 'all' | 'open' | 'closed';

const OPEN_STATUSES: IRCaseStatus[] = ['draft', 'investigation', 'hearing_scheduled', 'hearing_in_progress', 'awaiting_outcome', 'appeal'];
const CLOSED_STATUSES: IRCaseStatus[] = ['closed', 'withdrawn'];

export function IRCaseList() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [cases, setCases] = useState<IRCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<TabType>('all');

    // Statistics
    const [stats, setStats] = useState({
        openCases: 0,
        upcomingHearings: 0,
        activeWarnings: 0,
        closedThisMonth: 0
    });

    useEffect(() => {
        loadCases();
        loadStats();
    }, [userProfile?.companyId]);

    const loadCases = async () => {
        if (!userProfile?.companyId) return;

        try {
            setLoading(true);
            const data = await IRService.getIRCases(userProfile.companyId);
            setCases(data);
        } catch (error) {
            console.error('Error loading IR cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        if (!userProfile?.companyId) return;

        try {
            const statsData = await IRService.getIRStatistics(userProfile.companyId);

            // Calculate closed this month
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const closedThisMonth = cases.filter(c =>
                c.dateClosed && new Date(c.dateClosed) >= monthStart
            ).length;

            setStats({
                openCases: statsData.openCases,
                upcomingHearings: statsData.upcomingHearings,
                activeWarnings: statsData.activeWarnings,
                closedThisMonth
            });
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    };

    // Filter cases based on tab, search, status, and type
    const filteredCases = useMemo(() => {
        return cases.filter(irCase => {
            // Tab filter
            if (activeTab === 'open' && !OPEN_STATUSES.includes(irCase.status)) return false;
            if (activeTab === 'closed' && !CLOSED_STATUSES.includes(irCase.status)) return false;

            // Status filter
            if (statusFilter !== 'all' && irCase.status !== statusFilter) return false;

            // Type filter
            if (typeFilter !== 'all' && irCase.caseType !== typeFilter) return false;

            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    irCase.caseNumber.toLowerCase().includes(search) ||
                    irCase.employeeName?.toLowerCase().includes(search) ||
                    irCase.employeeNumber?.toLowerCase().includes(search) ||
                    irCase.incidentSummary.toLowerCase().includes(search)
                );
            }

            return true;
        });
    }, [cases, activeTab, statusFilter, typeFilter, searchTerm]);

    // Count by tab
    const openCount = cases.filter(c => OPEN_STATUSES.includes(c.status)).length;
    const closedCount = cases.filter(c => CLOSED_STATUSES.includes(c.status)).length;

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <MainLayout>
            {/* Header */}
            <div className="ir-header">
                <div className="ir-header-content">
                    <h1 className="ir-title">Industrial Relations</h1>
                    <p className="ir-subtitle">Manage disciplinary cases, grievances, and employee relations</p>
                </div>
                <div className="ir-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/ir/warnings')}>
                        <WarningIcon />
                        Warnings
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/ir/cases/new')}>
                        <PlusIcon />
                        New Case
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="ir-stats">
                <div className="ir-stat-card ir-stat-card--open">
                    <div className="ir-stat-value">{stats.openCases}</div>
                    <div className="ir-stat-label">Open Cases</div>
                </div>
                <div className="ir-stat-card ir-stat-card--hearings">
                    <div className="ir-stat-value">{stats.upcomingHearings}</div>
                    <div className="ir-stat-label">Upcoming Hearings</div>
                </div>
                <div className="ir-stat-card ir-stat-card--warnings">
                    <div className="ir-stat-value">{stats.activeWarnings}</div>
                    <div className="ir-stat-label">Active Warnings</div>
                </div>
                <div className="ir-stat-card ir-stat-card--resolved">
                    <div className="ir-stat-value">{stats.closedThisMonth}</div>
                    <div className="ir-stat-label">Closed This Month</div>
                </div>
            </div>

            {/* Filters */}
            <div className="ir-filters">
                <div className="ir-filter-search">
                    <span className="ir-search-icon">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        className="ir-filter-input"
                        placeholder="Search cases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="ir-filter-selects">
                    <select
                        className="ir-filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="investigation">Investigation</option>
                        <option value="hearing_scheduled">Hearing Scheduled</option>
                        <option value="hearing_in_progress">Hearing In Progress</option>
                        <option value="awaiting_outcome">Awaiting Outcome</option>
                        <option value="appeal">Appeal</option>
                        <option value="closed">Closed</option>
                        <option value="withdrawn">Withdrawn</option>
                    </select>
                    <select
                        className="ir-filter-select"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="misconduct">Misconduct</option>
                        <option value="poor_performance">Poor Performance</option>
                        <option value="incapacity">Incapacity</option>
                        <option value="grievance">Grievance</option>
                        <option value="abscondment">Abscondment</option>
                        <option value="dispute">Dispute</option>
                        <option value="ccma">CCMA</option>
                        <option value="retrenchment">Retrenchment</option>
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="ir-tabs">
                <button
                    className={`ir-tab ${activeTab === 'all' ? 'ir-tab--active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Cases
                    <span className="ir-tab-badge">{cases.length}</span>
                </button>
                <button
                    className={`ir-tab ${activeTab === 'open' ? 'ir-tab--active' : ''}`}
                    onClick={() => setActiveTab('open')}
                >
                    Open
                    <span className="ir-tab-badge">{openCount}</span>
                </button>
                <button
                    className={`ir-tab ${activeTab === 'closed' ? 'ir-tab--active' : ''}`}
                    onClick={() => setActiveTab('closed')}
                >
                    Closed
                    <span className="ir-tab-badge">{closedCount}</span>
                </button>
            </div>

            {/* Table */}
            <div className="ir-table-container">
                {loading ? (
                    <div className="ir-empty-state">
                        <div className="ir-empty-icon">
                            <LoadingIcon />
                        </div>
                        <p className="ir-empty-text">Loading cases...</p>
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div className="ir-empty-state">
                        <div className="ir-empty-icon">
                            <FolderIcon />
                        </div>
                        <p className="ir-empty-text">No cases found</p>
                        <p className="ir-empty-hint">
                            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Create your first IR case to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="ir-table-wrapper">
                        <table className="ir-table">
                            <thead>
                                <tr>
                                    <th>Case</th>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Date Opened</th>
                                    <th>Assigned To</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCases.map(irCase => (
                                    <tr key={irCase.id} onClick={() => navigate(`/ir/cases/${irCase.id}`)}>
                                        <td>
                                            <div className="ir-case-cell">
                                                <span className="ir-case-number">{irCase.caseNumber}</span>
                                                <span className="ir-case-type">{IRService.getCaseTypeLabel(irCase.caseType)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="ir-employee-cell">
                                                <div className="ir-employee-avatar">
                                                    {irCase.employeeName ? getInitials(irCase.employeeName) : '??'}
                                                </div>
                                                <div className="ir-employee-info">
                                                    <span className="ir-employee-name">{irCase.employeeName || 'Unknown'}</span>
                                                    <span className="ir-employee-number">{irCase.employeeNumber || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`ir-type-badge ir-type-badge--${irCase.caseType}`}>
                                                {IRService.getCaseTypeLabel(irCase.caseType)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`ir-priority-badge ir-priority-badge--${irCase.priority}`}>
                                                {irCase.priority.charAt(0).toUpperCase() + irCase.priority.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`ir-status-badge ir-status-badge--${irCase.status}`}>
                                                {IRService.getCaseStatusLabel(irCase.status)}
                                            </span>
                                        </td>
                                        <td>{formatDate(irCase.dateOpened)}</td>
                                        <td>{irCase.assignedToName || '-'}</td>
                                        <td>
                                            <div className="ir-action-buttons">
                                                <button
                                                    className="ir-action-btn ir-action-btn--primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/ir/cases/${irCase.id}`);
                                                    }}
                                                    title="View Case"
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
                )}

                {filteredCases.length > 0 && (
                    <div className="ir-table-footer">
                        <span className="ir-table-count">
                            Showing {filteredCases.length} of {cases.length} cases
                        </span>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

// Icon Components
function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function WarningIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
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

function FolderIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
