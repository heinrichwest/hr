// ============================================================
// MY PROFILE - View and update personal information
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { EmployeeService } from '../../services/employeeService';
import type { Employee, EmployeeDocument } from '../../types/employee';
import './ESS.css';

type TabType = 'personal' | 'employment' | 'banking' | 'documents';

export function MyProfile() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('personal');

    useEffect(() => {
        loadProfile();
    }, [userProfile?.employeeId]);

    const loadProfile = async () => {
        if (!userProfile?.employeeId) return;

        try {
            setLoading(true);
            const data = await EmployeeService.getEmployee(userProfile.employeeId);
            setEmployee(data);

            // Load employee documents separately if needed
            if (data?.id && userProfile?.companyId) {
                try {
                    const docs = await EmployeeService.getEmployeeDocuments(data.id);
                    // Filter to show only documents accessible to employee
                    setDocuments(docs.filter(d => d.accessLevel === 'employee'));
                } catch {
                    // Documents loading failed, that's ok
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '??';
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="ess-loading">
                    <div className="ess-loading-spinner" />
                    <p>Loading profile...</p>
                </div>
            </MainLayout>
        );
    }

    if (!employee) {
        return (
            <MainLayout>
                <div className="ess-empty-state">
                    <UserIcon />
                    <h3>Profile Not Found</h3>
                    <p>Your employee profile could not be loaded.</p>
                    <Button variant="primary" onClick={() => navigate('/ess')}>
                        Back to Dashboard
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
                    <h1 className="ess-title">My Profile</h1>
                    <p className="ess-subtitle">View your personal and employment information</p>
                </div>
                <div className="ess-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/ess')}>
                        <ArrowLeftIcon />
                        Back to Dashboard
                    </Button>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="ess-profile-header-card">
                <div className="ess-profile-avatar">
                    {employee.avatar ? (
                        <img src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                    ) : (
                        <span>{getInitials(employee.firstName, employee.lastName)}</span>
                    )}
                </div>
                <div className="ess-profile-summary">
                    <h2 className="ess-profile-name">
                        {employee.firstName} {employee.lastName}
                    </h2>
                    <p className="ess-profile-title">{employee.jobTitle || 'Employee'}</p>
                    <div className="ess-profile-meta">
                        <span className="ess-profile-meta-item">
                            <BadgeIcon />
                            {employee.employeeNumber}
                        </span>
                        <span className="ess-profile-meta-item">
                            <BuildingIcon />
                            {employee.department || 'No Department'}
                        </span>
                        {employee.email && (
                            <span className="ess-profile-meta-item">
                                <EmailIcon />
                                {employee.email}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="ess-tabs">
                <button
                    className={`ess-tab ${activeTab === 'personal' ? 'ess-tab--active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    <UserIcon />
                    Personal
                </button>
                <button
                    className={`ess-tab ${activeTab === 'employment' ? 'ess-tab--active' : ''}`}
                    onClick={() => setActiveTab('employment')}
                >
                    <BriefcaseIcon />
                    Employment
                </button>
                <button
                    className={`ess-tab ${activeTab === 'banking' ? 'ess-tab--active' : ''}`}
                    onClick={() => setActiveTab('banking')}
                >
                    <BankIcon />
                    Banking
                </button>
                <button
                    className={`ess-tab ${activeTab === 'documents' ? 'ess-tab--active' : ''}`}
                    onClick={() => setActiveTab('documents')}
                >
                    <DocumentIcon />
                    Documents
                </button>
            </div>

            {/* Tab Content */}
            <div className="ess-profile-content">
                {/* Personal Information */}
                {activeTab === 'personal' && (
                    <div className="ess-profile-section">
                        <h3 className="ess-section-title">Personal Information</h3>
                        <div className="ess-info-grid ess-info-grid--two-col">
                            <div className="ess-info-item">
                                <span className="ess-info-label">First Name</span>
                                <span className="ess-info-value">{employee.firstName}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Last Name</span>
                                <span className="ess-info-value">{employee.lastName}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">ID Number</span>
                                <span className="ess-info-value">{employee.idNumber || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Date of Birth</span>
                                <span className="ess-info-value">{formatDate(employee.dateOfBirth)}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Gender</span>
                                <span className="ess-info-value" style={{ textTransform: 'capitalize' }}>
                                    {employee.gender || '-'}
                                </span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Nationality</span>
                                <span className="ess-info-value">{employee.nationality || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Tax Number</span>
                                <span className="ess-info-value">{employee.taxNumber || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Marital Status</span>
                                <span className="ess-info-value" style={{ textTransform: 'capitalize' }}>
                                    {employee.maritalStatus || '-'}
                                </span>
                            </div>
                        </div>

                        <h3 className="ess-section-title" style={{ marginTop: '32px' }}>Contact Information</h3>
                        <div className="ess-info-grid ess-info-grid--two-col">
                            <div className="ess-info-item">
                                <span className="ess-info-label">Personal Email</span>
                                <span className="ess-info-value">{employee.personalEmail || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Work Email</span>
                                <span className="ess-info-value">{employee.email || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Phone</span>
                                <span className="ess-info-value">{employee.phone || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Alternate Phone</span>
                                <span className="ess-info-value">{employee.alternatePhone || '-'}</span>
                            </div>
                        </div>

                        <h3 className="ess-section-title" style={{ marginTop: '32px' }}>Address</h3>
                        <div className="ess-info-grid">
                            <div className="ess-info-item">
                                <span className="ess-info-label">Residential Address</span>
                                <span className="ess-info-value">
                                    {employee.residentialAddress ? (
                                        <>
                                            {employee.residentialAddress.line1 && <>{employee.residentialAddress.line1}<br /></>}
                                            {employee.residentialAddress.line2 && <>{employee.residentialAddress.line2}<br /></>}
                                            {employee.residentialAddress.suburb && <>{employee.residentialAddress.suburb}<br /></>}
                                            {employee.residentialAddress.city && <>{employee.residentialAddress.city}, </>}
                                            {employee.residentialAddress.province && <>{employee.residentialAddress.province} </>}
                                            {employee.residentialAddress.postalCode && <>{employee.residentialAddress.postalCode}</>}
                                        </>
                                    ) : '-'}
                                </span>
                            </div>
                        </div>

                        <h3 className="ess-section-title" style={{ marginTop: '32px' }}>Emergency Contact</h3>
                        <div className="ess-info-grid ess-info-grid--two-col">
                            <div className="ess-info-item">
                                <span className="ess-info-label">Contact Name</span>
                                <span className="ess-info-value">{employee.emergencyContact?.name || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Relationship</span>
                                <span className="ess-info-value">{employee.emergencyContact?.relationship || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Phone Number</span>
                                <span className="ess-info-value">{employee.emergencyContact?.phone || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Email</span>
                                <span className="ess-info-value">{employee.emergencyContact?.email || '-'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Employment Information */}
                {activeTab === 'employment' && (
                    <div className="ess-profile-section">
                        <h3 className="ess-section-title">Employment Details</h3>
                        <div className="ess-info-grid ess-info-grid--two-col">
                            <div className="ess-info-item">
                                <span className="ess-info-label">Employee Number</span>
                                <span className="ess-info-value">{employee.employeeNumber}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Job Title</span>
                                <span className="ess-info-value">{employee.jobTitle || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Department</span>
                                <span className="ess-info-value">{employee.department || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Contract Type</span>
                                <span className="ess-info-value" style={{ textTransform: 'capitalize' }}>
                                    {employee.contractType?.replace('_', ' ') || '-'}
                                </span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Employment Status</span>
                                <span className="ess-info-value" style={{ textTransform: 'capitalize' }}>
                                    {employee.status || '-'}
                                </span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Start Date</span>
                                <span className="ess-info-value">{formatDate(employee.startDate)}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Branch</span>
                                <span className="ess-info-value">{employee.branch || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Cost Centre</span>
                                <span className="ess-info-value">{employee.costCentre || '-'}</span>
                            </div>
                        </div>

                        <h3 className="ess-section-title" style={{ marginTop: '32px' }}>Reporting Structure</h3>
                        <div className="ess-info-grid ess-info-grid--two-col">
                            <div className="ess-info-item">
                                <span className="ess-info-label">Reports To</span>
                                <span className="ess-info-value">{employee.managerName || '-'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Banking Information */}
                {activeTab === 'banking' && (
                    <div className="ess-profile-section">
                        <h3 className="ess-section-title">Bank Details</h3>
                        <div className="ess-notice ess-notice--info">
                            <InfoIcon />
                            <p>
                                Bank details are used for salary payments. Contact HR if you need to update your banking information.
                            </p>
                        </div>
                        <div className="ess-info-grid ess-info-grid--two-col">
                            <div className="ess-info-item">
                                <span className="ess-info-label">Account Holder</span>
                                <span className="ess-info-value">{employee.bankDetails?.accountHolderName || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Bank Name</span>
                                <span className="ess-info-value">{employee.bankDetails?.bankName || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Account Number</span>
                                <span className="ess-info-value">
                                    {employee.bankDetails?.accountNumber
                                        ? `****${employee.bankDetails.accountNumber.slice(-4)}`
                                        : '-'}
                                </span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Branch Code</span>
                                <span className="ess-info-value">{employee.bankDetails?.branchCode || '-'}</span>
                            </div>
                            <div className="ess-info-item">
                                <span className="ess-info-label">Account Type</span>
                                <span className="ess-info-value" style={{ textTransform: 'capitalize' }}>
                                    {employee.bankDetails?.accountType || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents */}
                {activeTab === 'documents' && (
                    <div className="ess-profile-section">
                        <h3 className="ess-section-title">My Documents</h3>
                        {documents.length > 0 ? (
                            <div className="ess-documents-list">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="ess-document-item">
                                        <div className="ess-document-icon">
                                            <FileIcon />
                                        </div>
                                        <div className="ess-document-info">
                                            <span className="ess-document-name">{doc.name}</span>
                                            <span className="ess-document-meta">
                                                {doc.category} - Uploaded {formatDate(doc.uploadedAt)}
                                            </span>
                                        </div>
                                        {doc.fileUrl && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => window.open(doc.fileUrl, '_blank')}
                                            >
                                                <DownloadIcon />
                                                Download
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="ess-empty-state">
                                <DocumentIcon />
                                <p>No documents available</p>
                            </div>
                        )}
                    </div>
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

function UserIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function BadgeIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function BuildingIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
            <path d="M8 14h.01" />
            <path d="M16 14h.01" />
        </svg>
    );
}

function EmailIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    );
}

function BriefcaseIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    );
}

function BankIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="5" y1="6" x2="19" y2="6" />
            <line x1="5" y1="10" x2="5" y2="18" />
            <line x1="19" y1="10" x2="19" y2="18" />
            <line x1="9" y1="10" x2="9" y2="18" />
            <line x1="15" y1="10" x2="15" y2="18" />
            <line x1="3" y1="18" x2="21" y2="18" />
            <path d="M3 6l9-4 9 4" />
            <rect x="3" y="18" width="18" height="3" />
        </svg>
    );
}

function DocumentIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

function InfoIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}

function FileIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
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
