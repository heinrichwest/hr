// ============================================================
// WARNINGS LIST - List and manage employee warnings
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { IRService } from '../../services/irService';
import type { Warning } from '../../types/ir';
import './IR.css';

type TabType = 'all' | 'active' | 'expired';

export function WarningsList() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [warnings, setWarnings] = useState<Warning[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadWarnings();
    }, [userProfile?.companyId]);

    const loadWarnings = async () => {
        if (!userProfile?.companyId) return;

        try {
            setLoading(true);
            const data = await IRService.getWarnings(userProfile.companyId);
            setWarnings(data);
        } catch (error) {
            console.error('Error loading warnings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check and update expired warnings
    useEffect(() => {
        const now = new Date();
        warnings.forEach(async (warning) => {
            if (warning.isActive && !warning.isExpired && new Date(warning.expiryDate) < now) {
                // Warning has expired
                await IRService.expireWarning(warning.id);
            }
        });
    }, [warnings]);

    // Filter warnings
    const filteredWarnings = useMemo(() => {
        const now = new Date();

        return warnings.filter(warning => {
            // Tab filter
            const isActive = warning.isActive && !warning.isExpired && new Date(warning.expiryDate) > now;
            if (activeTab === 'active' && !isActive) return false;
            if (activeTab === 'expired' && isActive) return false;

            // Type filter
            if (typeFilter !== 'all' && warning.warningType !== typeFilter) return false;

            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    warning.warningNumber.toLowerCase().includes(search) ||
                    warning.employeeName?.toLowerCase().includes(search) ||
                    warning.offenceCategory.toLowerCase().includes(search) ||
                    warning.offenceDescription.toLowerCase().includes(search)
                );
            }

            return true;
        });
    }, [warnings, activeTab, typeFilter, searchTerm]);

    // Count by status
    const now = new Date();
    const activeCount = warnings.filter(w =>
        w.isActive && !w.isExpired && new Date(w.expiryDate) > now
    ).length;
    const expiredCount = warnings.filter(w =>
        !w.isActive || w.isExpired || new Date(w.expiryDate) <= now
    ).length;

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

    const isWarningActive = (warning: Warning) => {
        return warning.isActive && !warning.isExpired && new Date(warning.expiryDate) > now;
    };

    const getDaysRemaining = (expiryDate: Date | string) => {
        const expiry = new Date(expiryDate);
        const now = new Date();
        const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <MainLayout>
            {/* Header */}
            <div className="ir-header">
                <div className="ir-header-content">
                    <h1 className="ir-title">Employee Warnings</h1>
                    <p className="ir-subtitle">Track and manage disciplinary warnings across your organization</p>
                </div>
                <div className="ir-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/ir')}>
                        <ArrowLeftIcon />
                        Back to IR
                    </Button>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        <PlusIcon />
                        Issue Warning
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="ir-stats">
                <div className="ir-stat-card ir-stat-card--warnings">
                    <div className="ir-stat-value">{warnings.length}</div>
                    <div className="ir-stat-label">Total Warnings</div>
                </div>
                <div className="ir-stat-card ir-stat-card--open">
                    <div className="ir-stat-value">{activeCount}</div>
                    <div className="ir-stat-label">Active</div>
                </div>
                <div className="ir-stat-card ir-stat-card--resolved">
                    <div className="ir-stat-value">{expiredCount}</div>
                    <div className="ir-stat-label">Expired</div>
                </div>
                <div className="ir-stat-card">
                    <div className="ir-stat-value">
                        {warnings.filter(w => w.warningType === 'final_written' && isWarningActive(w)).length}
                    </div>
                    <div className="ir-stat-label">Final Warnings</div>
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
                        placeholder="Search warnings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="ir-filter-selects">
                    <select
                        className="ir-filter-select"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="verbal">Verbal</option>
                        <option value="written">Written</option>
                        <option value="final_written">Final Written</option>
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="ir-tabs">
                <button
                    className={`ir-tab ${activeTab === 'all' ? 'ir-tab--active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Warnings
                    <span className="ir-tab-badge">{warnings.length}</span>
                </button>
                <button
                    className={`ir-tab ${activeTab === 'active' ? 'ir-tab--active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active
                    <span className="ir-tab-badge">{activeCount}</span>
                </button>
                <button
                    className={`ir-tab ${activeTab === 'expired' ? 'ir-tab--active' : ''}`}
                    onClick={() => setActiveTab('expired')}
                >
                    Expired
                    <span className="ir-tab-badge">{expiredCount}</span>
                </button>
            </div>

            {/* Warning Cards */}
            <div className="ir-table-container" style={{ padding: '24px' }}>
                {loading ? (
                    <div className="ir-empty-state">
                        <div className="ir-empty-icon">
                            <LoadingIcon />
                        </div>
                        <p className="ir-empty-text">Loading warnings...</p>
                    </div>
                ) : filteredWarnings.length === 0 ? (
                    <div className="ir-empty-state">
                        <div className="ir-empty-icon">
                            <AlertIcon />
                        </div>
                        <p className="ir-empty-text">No warnings found</p>
                        <p className="ir-empty-hint">
                            {searchTerm || typeFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'No warnings have been issued yet'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {filteredWarnings.map(warning => {
                            const active = isWarningActive(warning);
                            const daysRemaining = getDaysRemaining(warning.expiryDate);

                            return (
                                <div key={warning.id} className="warning-card">
                                    <div className="warning-card-header">
                                        <div className="warning-card-type">
                                            <span className={`warning-type-badge warning-type-badge--${warning.warningType}`}>
                                                {IRService.getWarningTypeLabel(warning.warningType)}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                                                {warning.warningNumber}
                                            </span>
                                        </div>
                                        <div className="warning-card-status">
                                            {active && daysRemaining <= 30 && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: 'var(--speccon-warning)',
                                                    marginRight: '8px'
                                                }}>
                                                    {daysRemaining} days left
                                                </span>
                                            )}
                                            <span className={`warning-active-badge warning-active-badge--${active ? 'active' : 'expired'}`}>
                                                {active ? 'Active' : 'Expired'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="warning-card-body">
                                        <div className="warning-card-employee">
                                            <div className="ir-employee-avatar">
                                                {warning.employeeName ? getInitials(warning.employeeName) : '??'}
                                            </div>
                                            <div className="warning-card-employee-info">
                                                <span className="warning-card-employee-name">
                                                    {warning.employeeName || 'Unknown Employee'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="warning-card-details">
                                            <div className="warning-card-detail">
                                                <span className="warning-card-detail-label">Issue Date</span>
                                                <span className="warning-card-detail-value">{formatDate(warning.issueDate)}</span>
                                            </div>
                                            <div className="warning-card-detail">
                                                <span className="warning-card-detail-label">Expiry Date</span>
                                                <span className="warning-card-detail-value">{formatDate(warning.expiryDate)}</span>
                                            </div>
                                            <div className="warning-card-detail">
                                                <span className="warning-card-detail-label">Category</span>
                                                <span className="warning-card-detail-value">{warning.offenceCategory}</span>
                                            </div>
                                            <div className="warning-card-detail">
                                                <span className="warning-card-detail-label">Issued By</span>
                                                <span className="warning-card-detail-value">{warning.issuedByName || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="warning-card-offence">
                                            <div className="warning-card-offence-label">Offence Description</div>
                                            <div className="warning-card-offence-text">{warning.offenceDescription}</div>
                                        </div>
                                        {warning.caseId && (
                                            <div style={{ marginTop: '12px' }}>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => navigate(`/ir/cases/${warning.caseId}`)}
                                                >
                                                    <LinkIcon />
                                                    View Related Case
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Issue Warning Modal - Placeholder */}
            {showModal && (
                <div className="ir-modal" onClick={() => setShowModal(false)}>
                    <div className="ir-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="ir-modal-header">
                            <h3 className="ir-modal-title">Issue Warning</h3>
                            <button className="ir-modal-close" onClick={() => setShowModal(false)}>
                                <XIcon />
                            </button>
                        </div>
                        <div className="ir-modal-body">
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                To issue a warning, create an IR case first and then issue the warning from the case.
                            </p>
                        </div>
                        <div className="ir-modal-footer">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={() => {
                                setShowModal(false);
                                navigate('/ir/cases/new');
                            }}>
                                Create IR Case
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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

function AlertIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function LinkIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
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
