// ============================================================
// IR CASE DETAIL - View and manage a single IR case
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { IRService } from '../../services/irService';
import type { IRCase, IRCaseEvent, Hearing, Warning } from '../../types/ir';
import './IR.css';

type TabType = 'overview' | 'timeline' | 'hearings' | 'documents';

export function IRCaseDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [irCase, setIRCase] = useState<IRCase | null>(null);
    const [events, setEvents] = useState<IRCaseEvent[]>([]);
    const [hearings, setHearings] = useState<Hearing[]>([]);
    const [warnings, setWarnings] = useState<Warning[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    useEffect(() => {
        if (id) {
            loadCase();
        }
    }, [id]);

    const loadCase = async () => {
        if (!id || !userProfile?.companyId) return;

        try {
            setLoading(true);
            const [caseData, eventsData, hearingsData, warningsData] = await Promise.all([
                IRService.getIRCase(id),
                IRService.getCaseEvents(id),
                IRService.getHearings(userProfile.companyId, { caseId: id }),
                IRService.getWarnings(userProfile.companyId)
            ]);

            setIRCase(caseData);
            setEvents(eventsData);
            setHearings(hearingsData);
            // Filter warnings for this case
            setWarnings(warningsData.filter(w => w.caseId === id));
        } catch (error) {
            console.error('Error loading IR case:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!irCase || !userProfile) return;

        try {
            await IRService.updateIRCase(irCase.id, { status: newStatus as IRCase['status'] }, userProfile.uid);
            loadCase();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (date: Date | string) => {
        return new Date(date).toLocaleString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimelineIcon = (eventType: string) => {
        switch (eventType) {
            case 'case_created':
                return <FolderPlusIcon />;
            case 'investigation_started':
            case 'evidence_added':
                return <SearchIcon />;
            case 'hearing_scheduled':
            case 'hearing_held':
                return <CalendarIcon />;
            case 'warning_issued':
                return <AlertIcon />;
            case 'case_closed':
                return <CheckIcon />;
            case 'status_changed':
                return <RefreshIcon />;
            default:
                return <FileIcon />;
        }
    };

    const getTimelineIconClass = (eventType: string) => {
        switch (eventType) {
            case 'case_created':
            case 'case_closed':
                return 'ir-timeline-icon--success';
            case 'warning_issued':
                return 'ir-timeline-icon--warning';
            case 'hearing_scheduled':
            case 'hearing_held':
                return 'ir-timeline-icon--info';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="ir-empty-state">
                    <div className="ir-empty-icon">
                        <LoadingIcon />
                    </div>
                    <p className="ir-empty-text">Loading case...</p>
                </div>
            </MainLayout>
        );
    }

    if (!irCase) {
        return (
            <MainLayout>
                <div className="ir-empty-state">
                    <div className="ir-empty-icon">
                        <FolderIcon />
                    </div>
                    <p className="ir-empty-text">Case not found</p>
                    <Button variant="primary" onClick={() => navigate('/ir')}>
                        Back to Cases
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header */}
            <div className="ir-case-header">
                <div className="ir-case-header-left">
                    <Button variant="ghost" onClick={() => navigate('/ir')}>
                        <ArrowLeftIcon />
                    </Button>
                    <div className="ir-case-header-info">
                        <h1 className="ir-case-header-title">
                            {irCase.caseNumber}
                            <span className={`ir-status-badge ir-status-badge--${irCase.status}`}>
                                {IRService.getCaseStatusLabel(irCase.status)}
                            </span>
                        </h1>
                        <div className="ir-case-header-meta">
                            <span>{IRService.getCaseTypeLabel(irCase.caseType)}</span>
                            <span>|</span>
                            <span>Opened {formatDate(irCase.dateOpened)}</span>
                            {irCase.assignedToName && (
                                <>
                                    <span>|</span>
                                    <span>Assigned to {irCase.assignedToName}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="ir-case-header-actions">
                    <select
                        className="ir-filter-select"
                        value={irCase.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        <option value="draft">Draft</option>
                        <option value="investigation">Investigation</option>
                        <option value="hearing_scheduled">Hearing Scheduled</option>
                        <option value="hearing_in_progress">Hearing In Progress</option>
                        <option value="awaiting_outcome">Awaiting Outcome</option>
                        <option value="appeal">Appeal</option>
                        <option value="closed">Closed</option>
                        <option value="withdrawn">Withdrawn</option>
                    </select>
                    <Button variant="secondary" onClick={() => navigate(`/ir/cases/${id}/edit`)}>
                        <EditIcon />
                        Edit
                    </Button>
                    <Button variant="primary" onClick={() => navigate(`/ir/hearings/new?caseId=${id}`)}>
                        <PlusIcon />
                        Schedule Hearing
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="ir-case-tabs">
                <button
                    className={`ir-case-tab ${activeTab === 'overview' ? 'ir-case-tab--active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`ir-case-tab ${activeTab === 'timeline' ? 'ir-case-tab--active' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                >
                    Timeline ({events.length})
                </button>
                <button
                    className={`ir-case-tab ${activeTab === 'hearings' ? 'ir-case-tab--active' : ''}`}
                    onClick={() => setActiveTab('hearings')}
                >
                    Hearings ({hearings.length})
                </button>
                <button
                    className={`ir-case-tab ${activeTab === 'documents' ? 'ir-case-tab--active' : ''}`}
                    onClick={() => setActiveTab('documents')}
                >
                    Documents
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {/* Info Cards */}
                    <div className="ir-case-info-grid">
                        {/* Employee Info */}
                        <div className="ir-case-info-card">
                            <div className="ir-case-info-card-header">
                                <div className="ir-case-info-card-icon">
                                    <UserIcon />
                                </div>
                                <h3 className="ir-case-info-card-title">Employee Information</h3>
                            </div>
                            <div className="ir-case-info-card-body">
                                <div className="ir-case-info-row">
                                    <span className="ir-case-info-label">Name</span>
                                    <span className="ir-case-info-value">{irCase.employeeName || '-'}</span>
                                </div>
                                <div className="ir-case-info-row">
                                    <span className="ir-case-info-label">Employee Number</span>
                                    <span className="ir-case-info-value">{irCase.employeeNumber || '-'}</span>
                                </div>
                                <div className="ir-case-info-row">
                                    <span className="ir-case-info-label">Department</span>
                                    <span className="ir-case-info-value">{irCase.departmentName || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Case Details */}
                        <div className="ir-case-info-card">
                            <div className="ir-case-info-card-header">
                                <div className="ir-case-info-card-icon">
                                    <FileTextIcon />
                                </div>
                                <h3 className="ir-case-info-card-title">Case Details</h3>
                            </div>
                            <div className="ir-case-info-card-body">
                                <div className="ir-case-info-row">
                                    <span className="ir-case-info-label">Case Type</span>
                                    <span className="ir-case-info-value">{IRService.getCaseTypeLabel(irCase.caseType)}</span>
                                </div>
                                <div className="ir-case-info-row">
                                    <span className="ir-case-info-label">Priority</span>
                                    <span className={`ir-priority-badge ir-priority-badge--${irCase.priority}`}>
                                        {irCase.priority.charAt(0).toUpperCase() + irCase.priority.slice(1)}
                                    </span>
                                </div>
                                <div className="ir-case-info-row">
                                    <span className="ir-case-info-label">Incident Date</span>
                                    <span className="ir-case-info-value">{formatDate(irCase.incidentDate)}</span>
                                </div>
                                <div className="ir-case-info-row">
                                    <span className="ir-case-info-label">Target Resolution</span>
                                    <span className="ir-case-info-value">
                                        {irCase.targetResolutionDate ? formatDate(irCase.targetResolutionDate) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Incident Summary */}
                    <div className="ir-case-summary">
                        <h3 className="ir-case-summary-title">Incident Summary</h3>
                        <p className="ir-case-summary-text">{irCase.incidentSummary}</p>
                        {irCase.policyReference && (
                            <p className="ir-case-summary-text" style={{ marginTop: '12px' }}>
                                <strong>Policy Reference:</strong> {irCase.policyReference}
                            </p>
                        )}
                    </div>

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <div className="ir-case-timeline">
                            <div className="ir-case-timeline-header">
                                <h3 className="ir-case-timeline-title">Related Warnings ({warnings.length})</h3>
                            </div>
                            <div className="ir-case-timeline-body">
                                {warnings.map(warning => (
                                    <div key={warning.id} className="warning-card" style={{ marginBottom: '12px' }}>
                                        <div className="warning-card-header">
                                            <div className="warning-card-type">
                                                <span className={`warning-type-badge warning-type-badge--${warning.warningType}`}>
                                                    {IRService.getWarningTypeLabel(warning.warningType)}
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                                    {warning.warningNumber}
                                                </span>
                                            </div>
                                            <span className={`warning-active-badge warning-active-badge--${warning.isActive ? 'active' : 'expired'}`}>
                                                {warning.isActive ? 'Active' : 'Expired'}
                                            </span>
                                        </div>
                                        <div className="warning-card-body">
                                            <div className="warning-card-details">
                                                <div className="warning-card-detail">
                                                    <span className="warning-card-detail-label">Issue Date</span>
                                                    <span className="warning-card-detail-value">{formatDate(warning.issueDate)}</span>
                                                </div>
                                                <div className="warning-card-detail">
                                                    <span className="warning-card-detail-label">Expiry Date</span>
                                                    <span className="warning-card-detail-value">{formatDate(warning.expiryDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'timeline' && (
                <div className="ir-case-timeline">
                    <div className="ir-case-timeline-header">
                        <h3 className="ir-case-timeline-title">Case Timeline</h3>
                        <Button variant="secondary" size="sm">
                            <PlusIcon />
                            Add Event
                        </Button>
                    </div>
                    <div className="ir-case-timeline-body">
                        {events.length === 0 ? (
                            <div className="ir-empty-state" style={{ padding: '40px' }}>
                                <p className="ir-empty-text">No events recorded yet</p>
                            </div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="ir-timeline-item">
                                    <div className={`ir-timeline-icon ${getTimelineIconClass(event.eventType)}`}>
                                        {getTimelineIcon(event.eventType)}
                                    </div>
                                    <div className="ir-timeline-content">
                                        <h4 className="ir-timeline-title">{event.title}</h4>
                                        {event.description && (
                                            <p className="ir-timeline-description">{event.description}</p>
                                        )}
                                        <span className="ir-timeline-date">{formatDateTime(event.eventDate)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'hearings' && (
                <div className="ir-case-timeline">
                    <div className="ir-case-timeline-header">
                        <h3 className="ir-case-timeline-title">Hearings</h3>
                        <Button variant="primary" size="sm" onClick={() => navigate(`/ir/hearings/new?caseId=${id}`)}>
                            <PlusIcon />
                            Schedule Hearing
                        </Button>
                    </div>
                    <div className="ir-case-timeline-body">
                        {hearings.length === 0 ? (
                            <div className="ir-empty-state" style={{ padding: '40px' }}>
                                <p className="ir-empty-text">No hearings scheduled</p>
                                <p className="ir-empty-hint">Schedule a hearing to proceed with this case</p>
                            </div>
                        ) : (
                            hearings.map(hearing => (
                                <div key={hearing.id} className="hearing-card">
                                    <div className="hearing-card-header">
                                        <span className="hearing-card-title">
                                            {hearing.hearingType.charAt(0).toUpperCase() + hearing.hearingType.slice(1)} Hearing #{hearing.hearingNumber}
                                        </span>
                                        <span className={`hearing-status-badge hearing-status-badge--${hearing.status}`}>
                                            {hearing.status.replace('_', ' ').charAt(0).toUpperCase() + hearing.status.replace('_', ' ').slice(1)}
                                        </span>
                                    </div>
                                    <div className="hearing-card-body">
                                        <div className="hearing-card-details">
                                            <div className="hearing-card-detail">
                                                <span className="hearing-card-detail-label">Date</span>
                                                <span className="hearing-card-detail-value">{formatDate(hearing.scheduledDate)}</span>
                                            </div>
                                            <div className="hearing-card-detail">
                                                <span className="hearing-card-detail-label">Time</span>
                                                <span className="hearing-card-detail-value">{hearing.scheduledTime}</span>
                                            </div>
                                            <div className="hearing-card-detail">
                                                <span className="hearing-card-detail-label">Location</span>
                                                <span className="hearing-card-detail-value">{hearing.location}</span>
                                            </div>
                                        </div>
                                        {hearing.chairpersonName && (
                                            <div className="hearing-card-participants">
                                                <div className="hearing-card-participants-title">Participants</div>
                                                <div className="hearing-card-participants-list">
                                                    <span className="hearing-participant-chip">
                                                        <UserIcon /> Chairperson: {hearing.chairpersonName}
                                                    </span>
                                                    {hearing.initiatorName && (
                                                        <span className="hearing-participant-chip">
                                                            <UserIcon /> Initiator: {hearing.initiatorName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'documents' && (
                <div className="ir-case-timeline">
                    <div className="ir-case-timeline-header">
                        <h3 className="ir-case-timeline-title">Documents</h3>
                        <Button variant="secondary" size="sm">
                            <UploadIcon />
                            Upload Document
                        </Button>
                    </div>
                    <div className="ir-case-timeline-body">
                        <div className="ir-empty-state" style={{ padding: '40px' }}>
                            <div className="ir-empty-icon">
                                <FileIcon />
                            </div>
                            <p className="ir-empty-text">No documents uploaded yet</p>
                            <p className="ir-empty-hint">Upload evidence, statements, and other relevant documents</p>
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

function EditIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

function UserIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
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

function FolderPlusIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function RefreshIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    );
}

function FileIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
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
