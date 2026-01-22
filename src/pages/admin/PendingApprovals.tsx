// ============================================================
// PENDING APPROVALS PAGE
// System Admin page for reviewing and approving access requests
// ============================================================

import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { AccessRequestService } from '../../services/accessRequestService';
import { CompanyService } from '../../services/companyService';
import { EmployeeService } from '../../services/employeeService';
import { UserService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import type { AccessRequest } from '../../types/accessRequest';
import type { Company } from '../../types/company';
import type { Employee } from '../../types/employee';
import type { UserRole } from '../../types/user';
import { Button } from '../../components/Button/Button';
import { MainLayout } from '../../components/Layout/MainLayout';
import './PendingApprovals.css';

// All available roles
const ALL_ROLES: UserRole[] = [
    'System Admin',
    'HR Admin',
    'HR Manager',
    'Payroll Admin',
    'Payroll Manager',
    'Finance Approver',
    'Finance Read-Only',
    'Line Manager',
    'IR Officer',
    'IR Manager',
    'Employee'
];

// Default password for new users (they should reset on first login)
const DEFAULT_TEMP_PASSWORD = 'TempPass123!';

export function PendingApprovals() {
    const { userProfile } = useAuth();
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Approval modal state
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>('Employee');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

    // Rejection confirmation state
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [requestToReject, setRequestToReject] = useState<AccessRequest | null>(null);

    // Success/error messages
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        loadData();
    }, []);

    // Load all necessary data
    const loadData = async () => {
        setLoading(true);
        try {
            const [pendingRequests, allCompanies] = await Promise.all([
                AccessRequestService.getPendingAccessRequests(),
                CompanyService.getAllCompanies()
            ]);
            setRequests(pendingRequests);
            setCompanies(allCompanies);

            // Set default company if available
            if (allCompanies.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(allCompanies[0].id);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            setErrorMessage('Failed to load pending requests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load employees when company is selected
    useEffect(() => {
        const loadEmployees = async () => {
            if (selectedCompanyId) {
                try {
                    const companyEmployees = await EmployeeService.getEmployees(selectedCompanyId);
                    setEmployees(companyEmployees);
                } catch (error) {
                    console.error('Failed to load employees:', error);
                    setEmployees([]);
                }
            } else {
                setEmployees([]);
            }
        };
        loadEmployees();
    }, [selectedCompanyId]);

    // Open approval modal
    const handleOpenApproveModal = (request: AccessRequest) => {
        setSelectedRequest(request);
        setSelectedRole('Employee');
        if (companies.length > 0) {
            setSelectedCompanyId(companies[0].id);
        }
        setSelectedEmployeeId('');
        setShowApproveModal(true);
        setErrorMessage(null);
    };

    // Close approval modal
    const handleCloseApproveModal = () => {
        setShowApproveModal(false);
        setSelectedRequest(null);
        setSelectedRole('Employee');
        setSelectedEmployeeId('');
    };

    // Handle approval confirmation
    const handleConfirmApproval = async () => {
        if (!selectedRequest || !userProfile || !selectedCompanyId) {
            setErrorMessage('Please select a role and company.');
            return;
        }

        setActionLoading(selectedRequest.id);
        setErrorMessage(null);

        try {
            // Step 1: Create Firebase Auth user
            // Note: We use a temporary password since we can't use the stored hash directly
            // The user should be prompted to reset their password on first login
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                selectedRequest.email,
                DEFAULT_TEMP_PASSWORD
            );

            const newUserId = userCredential.user.uid;

            // Step 2: Create user profile in Firestore
            await UserService.createUserProfile(
                newUserId,
                selectedRequest.email,
                selectedRole,
                selectedCompanyId
            );

            // Update user profile with additional info
            await UserService.updateUserProfile(newUserId, {
                firstName: selectedRequest.firstName,
                lastName: selectedRequest.lastName,
                displayName: `${selectedRequest.firstName} ${selectedRequest.lastName}`,
                employeeId: selectedEmployeeId || undefined,
            });

            // Step 3: Update access request status
            await AccessRequestService.approveAccessRequest(selectedRequest.id, {
                reviewerId: userProfile.uid,
                assignedRole: selectedRole,
                assignedCompanyId: selectedCompanyId,
                linkedEmployeeId: selectedEmployeeId || null,
            });

            // Close modal and refresh list
            handleCloseApproveModal();
            setSuccessMessage(`Successfully approved ${selectedRequest.firstName} ${selectedRequest.lastName}`);
            await loadData();

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error: unknown) {
            console.error('Failed to approve request:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to approve request';
            setErrorMessage(errorMsg);
        } finally {
            setActionLoading(null);
        }
    };

    // Open rejection confirmation
    const handleOpenRejectConfirm = (request: AccessRequest) => {
        setRequestToReject(request);
        setShowRejectConfirm(true);
        setErrorMessage(null);
    };

    // Close rejection confirmation
    const handleCloseRejectConfirm = () => {
        setShowRejectConfirm(false);
        setRequestToReject(null);
    };

    // Handle rejection confirmation
    const handleConfirmRejection = async () => {
        if (!requestToReject || !userProfile) return;

        setActionLoading(requestToReject.id);
        setErrorMessage(null);

        try {
            await AccessRequestService.rejectAccessRequest(
                requestToReject.id,
                userProfile.uid
            );

            handleCloseRejectConfirm();
            setSuccessMessage(`Rejected request from ${requestToReject.firstName} ${requestToReject.lastName}`);
            await loadData();

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error: unknown) {
            console.error('Failed to reject request:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to reject request';
            setErrorMessage(errorMsg);
        } finally {
            setActionLoading(null);
        }
    };

    // Format date for display
    const formatDate = (timestamp: AccessRequest['createdAt']) => {
        if (!timestamp) return 'Unknown';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string);
            return date.toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Unknown';
        }
    };

    // Get initials for avatar
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    // Get avatar color
    const getAvatarColor = (email: string) => {
        const colors = [
            'var(--speccon-brand-primary)',
            'var(--speccon-info)',
            'var(--speccon-success)',
            'var(--speccon-warning)',
            '#8B5CF6',
            '#EC4899',
        ];
        const index = email.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="pending-header animate-slide-down">
                <div className="pending-header-content">
                    <h1 className="pending-title">Pending Approvals</h1>
                    <p className="pending-subtitle">Review and approve access requests from new users</p>
                </div>
                <div className="pending-header-actions">
                    <Button variant="secondary" onClick={loadData} disabled={loading}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="pending-message pending-message--success animate-slide-down">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="pending-message-close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {errorMessage && (
                <div className="pending-message pending-message--error animate-slide-down">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMessage}</span>
                    <button onClick={() => setErrorMessage(null)} className="pending-message-close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Requests Table */}
            <div className="pending-table-container animate-scale-in">
                <div className="pending-table-wrapper">
                    <table className="pending-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Submitted</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <tr key={i} className="loading-row">
                                            <td>
                                                <div className="request-cell">
                                                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)' }} />
                                                    <div className="skeleton" style={{ width: 150, height: 16 }} />
                                                </div>
                                            </td>
                                            <td><div className="skeleton" style={{ width: 180, height: 16 }} /></td>
                                            <td><div className="skeleton" style={{ width: 120, height: 16 }} /></td>
                                            <td className="text-right"><div className="skeleton" style={{ width: 160, height: 32, marginLeft: 'auto' }} /></td>
                                        </tr>
                                    ))}
                                </>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <p className="empty-state-text">No pending requests</p>
                                            <p className="empty-state-hint">New access requests will appear here when users sign up</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <div className="request-cell">
                                                <div
                                                    className="request-avatar"
                                                    style={{ backgroundColor: getAvatarColor(request.email) }}
                                                >
                                                    {getInitials(request.firstName, request.lastName)}
                                                </div>
                                                <span className="request-name">
                                                    {request.firstName} {request.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="request-email">{request.email}</span>
                                        </td>
                                        <td>
                                            <span className="request-date">{formatDate(request.createdAt)}</span>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn action-btn--approve"
                                                    onClick={() => handleOpenApproveModal(request)}
                                                    disabled={actionLoading === request.id}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    Approve
                                                </button>
                                                <button
                                                    className="action-btn action-btn--reject"
                                                    onClick={() => handleOpenRejectConfirm(request)}
                                                    disabled={actionLoading === request.id}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                {!loading && requests.length > 0 && (
                    <div className="table-footer">
                        <span className="table-count">
                            Showing <strong>{requests.length}</strong> pending request{requests.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Approval Modal */}
            {showApproveModal && selectedRequest && (
                <div className="modal-overlay" onClick={handleCloseApproveModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Approve Access Request</h2>
                            <button className="modal-close" onClick={handleCloseApproveModal}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-user-info">
                                <div
                                    className="modal-user-avatar"
                                    style={{ backgroundColor: getAvatarColor(selectedRequest.email) }}
                                >
                                    {getInitials(selectedRequest.firstName, selectedRequest.lastName)}
                                </div>
                                <div className="modal-user-details">
                                    <span className="modal-user-name">
                                        {selectedRequest.firstName} {selectedRequest.lastName}
                                    </span>
                                    <span className="modal-user-email">{selectedRequest.email}</span>
                                </div>
                            </div>

                            <div className="modal-form">
                                <div className="form-group">
                                    <label htmlFor="role-select">Role</label>
                                    <select
                                        id="role-select"
                                        className="form-select"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                    >
                                        {ALL_ROLES.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="company-select">Company</label>
                                    <select
                                        id="company-select"
                                        className="form-select"
                                        value={selectedCompanyId}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    >
                                        <option value="">Select a company</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.legalName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="employee-select">Link to Employee (Optional)</label>
                                    <select
                                        id="employee-select"
                                        className="form-select"
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    >
                                        <option value="">No employee link</option>
                                        {employees.map(employee => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.firstName} {employee.lastName} ({employee.employeeNumber})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-note">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    <span>The user will be created with a temporary password and should reset it on first login.</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <Button variant="secondary" onClick={handleCloseApproveModal}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleConfirmApproval}
                                loading={actionLoading === selectedRequest.id}
                                disabled={!selectedCompanyId}
                            >
                                Confirm Approval
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Confirmation Modal */}
            {showRejectConfirm && requestToReject && (
                <div className="modal-overlay" onClick={handleCloseRejectConfirm}>
                    <div className="modal-content modal-content--small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Reject Access Request</h2>
                            <button className="modal-close" onClick={handleCloseRejectConfirm}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="confirm-message">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                <p>
                                    Are you sure you want to reject the access request from{' '}
                                    <strong>{requestToReject.firstName} {requestToReject.lastName}</strong>?
                                </p>
                                <p className="confirm-hint">
                                    This action cannot be undone. The user will be notified that their request was not approved.
                                </p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <Button variant="secondary" onClick={handleCloseRejectConfirm}>
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleConfirmRejection}
                                loading={actionLoading === requestToReject.id}
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
