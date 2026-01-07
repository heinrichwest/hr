// ============================================================
// MY LEAVE - View leave requests and apply for leave
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { LeaveService } from '../../services/leaveService';
import type { LeaveType, LeaveRequest, LeaveBalance, LeaveRequestStatus } from '../../types/leave';
import './ESS.css';

type TabType = 'requests' | 'balances' | 'calendar';

export function MyLeave() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('requests');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, [userProfile?.companyId, userProfile?.employeeId]);

    const loadData = async () => {
        if (!userProfile?.companyId || !userProfile?.employeeId) return;

        try {
            setLoading(true);
            const [requests, balances, types] = await Promise.all([
                LeaveService.getLeaveRequests(userProfile.companyId, {
                    employeeId: userProfile.employeeId
                }),
                LeaveService.getLeaveBalances(userProfile.companyId, userProfile.employeeId),
                LeaveService.getLeaveTypes(userProfile.companyId)
            ]);

            setLeaveRequests(requests);
            setLeaveBalances(balances);
            setLeaveTypes(types);
        } catch (error) {
            console.error('Error loading leave data:', error);
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

    const getStatusBadgeClass = (status: LeaveRequestStatus) => {
        switch (status) {
            case 'approved': return 'ess-status-badge--approved';
            case 'pending': return 'ess-status-badge--pending';
            case 'rejected': return 'ess-status-badge--rejected';
            case 'cancelled': return 'ess-status-badge--cancelled';
            case 'taken': return 'ess-status-badge--taken';
            default: return '';
        }
    };

    const filteredRequests = useMemo(() => {
        if (statusFilter === 'all') return leaveRequests;
        return leaveRequests.filter(r => r.status === statusFilter);
    }, [leaveRequests, statusFilter]);

    // Count requests by status
    const requestCounts = useMemo(() => {
        return {
            all: leaveRequests.length,
            pending: leaveRequests.filter(r => r.status === 'pending').length,
            approved: leaveRequests.filter(r => r.status === 'approved').length,
            rejected: leaveRequests.filter(r => r.status === 'rejected').length,
        };
    }, [leaveRequests]);

    const handleCancelRequest = async (requestId: string) => {
        if (!confirm('Are you sure you want to cancel this leave request?')) return;

        try {
            await LeaveService.cancelLeaveRequest(
                requestId,
                userProfile?.uid || '',
                'Cancelled by employee'
            );
            loadData();
        } catch (error) {
            console.error('Error cancelling request:', error);
            alert('Failed to cancel request. Please try again.');
        }
    };

    return (
        <MainLayout>
            {/* Header */}
            <div className="ess-header">
                <div className="ess-header-content">
                    <h1 className="ess-title">My Leave</h1>
                    <p className="ess-subtitle">View your leave balances and requests</p>
                </div>
                <div className="ess-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/ess')}>
                        <ArrowLeftIcon />
                        Back
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/ess/leave/new')}>
                        <PlusIcon />
                        Apply for Leave
                    </Button>
                </div>
            </div>

            {/* Leave Balance Cards */}
            <div className="ess-leave-balance-cards">
                {leaveBalances.map(balance => {
                    const leaveType = leaveTypes.find(t => t.id === balance.leaveTypeId);
                    return (
                        <div
                            key={balance.id}
                            className="ess-leave-balance-card"
                            style={{ borderLeftColor: leaveType?.color || 'var(--color-primary)' }}
                        >
                            <div className="ess-leave-balance-type">
                                {balance.leaveTypeName || 'Leave'}
                            </div>
                            <div className="ess-leave-balance-value">
                                {balance.currentBalance}
                                <span className="ess-leave-balance-unit">days available</span>
                            </div>
                            <div className="ess-leave-balance-breakdown">
                                <div className="ess-leave-balance-breakdown-item">
                                    <span>Accrued</span>
                                    <span>{balance.accrued}</span>
                                </div>
                                <div className="ess-leave-balance-breakdown-item">
                                    <span>Taken</span>
                                    <span>{balance.taken}</span>
                                </div>
                                <div className="ess-leave-balance-breakdown-item">
                                    <span>Pending</span>
                                    <span>{balance.pending}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {leaveBalances.length === 0 && !loading && (
                    <div className="ess-empty-text" style={{ gridColumn: '1 / -1' }}>
                        No leave balances available
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="ess-tabs">
                <button
                    className={`ess-tab ${activeTab === 'requests' ? 'ess-tab--active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    <ClockIcon />
                    Requests
                    <span className="ess-tab-badge">{requestCounts.all}</span>
                </button>
                <button
                    className={`ess-tab ${activeTab === 'balances' ? 'ess-tab--active' : ''}`}
                    onClick={() => setActiveTab('balances')}
                >
                    <CalendarIcon />
                    Balance Details
                </button>
            </div>

            {/* Tab Content */}
            <div className="ess-content">
                {loading ? (
                    <div className="ess-loading">
                        <div className="ess-loading-spinner" />
                        <p>Loading leave data...</p>
                    </div>
                ) : activeTab === 'requests' ? (
                    <>
                        {/* Filters */}
                        <div className="ess-filters">
                            <div className="ess-filter-chips">
                                <button
                                    className={`ess-filter-chip ${statusFilter === 'all' ? 'ess-filter-chip--active' : ''}`}
                                    onClick={() => setStatusFilter('all')}
                                >
                                    All ({requestCounts.all})
                                </button>
                                <button
                                    className={`ess-filter-chip ${statusFilter === 'pending' ? 'ess-filter-chip--active' : ''}`}
                                    onClick={() => setStatusFilter('pending')}
                                >
                                    Pending ({requestCounts.pending})
                                </button>
                                <button
                                    className={`ess-filter-chip ${statusFilter === 'approved' ? 'ess-filter-chip--active' : ''}`}
                                    onClick={() => setStatusFilter('approved')}
                                >
                                    Approved ({requestCounts.approved})
                                </button>
                                <button
                                    className={`ess-filter-chip ${statusFilter === 'rejected' ? 'ess-filter-chip--active' : ''}`}
                                    onClick={() => setStatusFilter('rejected')}
                                >
                                    Rejected ({requestCounts.rejected})
                                </button>
                            </div>
                        </div>

                        {/* Requests List */}
                        {filteredRequests.length === 0 ? (
                            <div className="ess-empty-state">
                                <CalendarIcon />
                                <h3>No Leave Requests</h3>
                                <p>
                                    {statusFilter === 'all'
                                        ? "You haven't submitted any leave requests yet."
                                        : `No ${statusFilter} requests found.`}
                                </p>
                                <Button variant="primary" onClick={() => navigate('/ess/leave/new')}>
                                    Apply for Leave
                                </Button>
                            </div>
                        ) : (
                            <div className="ess-leave-requests-list">
                                {filteredRequests.map(request => (
                                    <div key={request.id} className="ess-leave-request-card">
                                        <div className="ess-leave-request-header">
                                            <div className="ess-leave-request-type">
                                                {request.leaveTypeName}
                                            </div>
                                            <span className={`ess-status-badge ${getStatusBadgeClass(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </div>
                                        <div className="ess-leave-request-body">
                                            <div className="ess-leave-request-dates">
                                                <div className="ess-leave-request-date">
                                                    <span className="ess-leave-request-date-label">From</span>
                                                    <span className="ess-leave-request-date-value">
                                                        {formatDate(request.startDate)}
                                                    </span>
                                                </div>
                                                <ArrowRightIcon />
                                                <div className="ess-leave-request-date">
                                                    <span className="ess-leave-request-date-label">To</span>
                                                    <span className="ess-leave-request-date-value">
                                                        {formatDate(request.endDate)}
                                                    </span>
                                                </div>
                                                <div className="ess-leave-request-days">
                                                    {request.workingDays} {request.workingDays === 1 ? 'day' : 'days'}
                                                    {request.isHalfDay && ` (${request.halfDayType})`}
                                                </div>
                                            </div>
                                            {request.reason && (
                                                <div className="ess-leave-request-reason">
                                                    <strong>Reason:</strong> {request.reason}
                                                </div>
                                            )}
                                            {request.approvalHistory && request.approvalHistory.length > 0 && (
                                                <div className="ess-leave-request-approval">
                                                    {request.approvalHistory.map((approval, index) => (
                                                        <div key={index} className="ess-leave-request-approval-item">
                                                            <span className={`ess-approval-action ess-approval-action--${approval.action}`}>
                                                                {approval.action}
                                                            </span>
                                                            <span> by {approval.approverName}</span>
                                                            <span className="ess-approval-date">
                                                                on {formatDate(approval.actionDate)}
                                                            </span>
                                                            {approval.comments && (
                                                                <div className="ess-approval-comments">
                                                                    "{approval.comments}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {request.status === 'pending' && (
                                            <div className="ess-leave-request-footer">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleCancelRequest(request.id)}
                                                >
                                                    Cancel Request
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* Balance Details Tab */
                    <div className="ess-balance-details">
                        {leaveBalances.length === 0 ? (
                            <div className="ess-empty-state">
                                <CalendarIcon />
                                <h3>No Leave Balances</h3>
                                <p>Your leave balances will appear here once they are initialized.</p>
                            </div>
                        ) : (
                            <div className="ess-balance-table-container">
                                <table className="ess-balance-table">
                                    <thead>
                                        <tr>
                                            <th>Leave Type</th>
                                            <th className="ess-balance-table-number">Opening</th>
                                            <th className="ess-balance-table-number">Accrued</th>
                                            <th className="ess-balance-table-number">Taken</th>
                                            <th className="ess-balance-table-number">Pending</th>
                                            <th className="ess-balance-table-number">Adjusted</th>
                                            <th className="ess-balance-table-number">Available</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaveBalances.map(balance => (
                                            <tr key={balance.id}>
                                                <td>
                                                    <strong>{balance.leaveTypeName}</strong>
                                                    <div className="ess-balance-cycle">
                                                        Cycle: {balance.cycleYear}
                                                    </div>
                                                </td>
                                                <td className="ess-balance-table-number">{balance.openingBalance}</td>
                                                <td className="ess-balance-table-number">{balance.accrued}</td>
                                                <td className="ess-balance-table-number ess-balance-table-taken">
                                                    {balance.taken}
                                                </td>
                                                <td className="ess-balance-table-number ess-balance-table-pending">
                                                    {balance.pending}
                                                </td>
                                                <td className="ess-balance-table-number">
                                                    {balance.adjusted > 0 ? `+${balance.adjusted}` : balance.adjusted}
                                                </td>
                                                <td className="ess-balance-table-number ess-balance-table-available">
                                                    <strong>{balance.currentBalance}</strong>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

// Leave Application Form
export function LeaveApplication() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        isHalfDay: false,
        halfDayType: 'morning' as 'morning' | 'afternoon',
        reason: '',
        emergencyContact: ''
    });

    useEffect(() => {
        loadData();
    }, [userProfile?.companyId, userProfile?.employeeId]);

    const loadData = async () => {
        if (!userProfile?.companyId || !userProfile?.employeeId) return;

        try {
            setLoading(true);
            const [types, balances] = await Promise.all([
                LeaveService.getLeaveTypes(userProfile.companyId),
                LeaveService.getLeaveBalances(userProfile.companyId, userProfile.employeeId)
            ]);

            setLeaveTypes(types.filter(t => t.isActive));
            setLeaveBalances(balances);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedLeaveType = leaveTypes.find(t => t.id === formData.leaveTypeId);
    const selectedBalance = leaveBalances.find(b => b.leaveTypeId === formData.leaveTypeId);

    const calculatedDays = useMemo(() => {
        if (!formData.startDate || !formData.endDate) return 0;
        if (formData.isHalfDay) return 0.5;

        return LeaveService.calculateBusinessDays(
            new Date(formData.startDate),
            new Date(formData.endDate)
        );
    }, [formData.startDate, formData.endDate, formData.isHalfDay]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userProfile?.companyId || !userProfile?.employeeId) return;

        if (!formData.leaveTypeId || !formData.startDate || !formData.endDate) {
            alert('Please fill in all required fields.');
            return;
        }

        if (selectedBalance && calculatedDays > selectedBalance.currentBalance) {
            alert('Insufficient leave balance for this request.');
            return;
        }

        try {
            setSubmitting(true);

            const request: Omit<LeaveRequest, 'id' | 'createdAt'> = {
                employeeId: userProfile.employeeId,
                employeeName: userProfile.displayName,
                companyId: userProfile.companyId,
                leaveTypeId: formData.leaveTypeId,
                leaveTypeName: selectedLeaveType?.name,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                isHalfDay: formData.isHalfDay,
                halfDayType: formData.isHalfDay ? formData.halfDayType : undefined,
                totalDays: calculatedDays,
                workingDays: calculatedDays,
                reason: formData.reason,
                emergencyContact: formData.emergencyContact,
                status: 'pending',
                submittedDate: new Date(),
                approvalHistory: [],
                createdBy: userProfile.uid
            };

            await LeaveService.createLeaveRequest(request);
            navigate('/ess/leave');
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit leave request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="ess-loading">
                    <div className="ess-loading-spinner" />
                    <p>Loading...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header */}
            <div className="ess-header">
                <div className="ess-header-content">
                    <h1 className="ess-title">Apply for Leave</h1>
                    <p className="ess-subtitle">Submit a new leave request</p>
                </div>
                <div className="ess-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/ess/leave')}>
                        <ArrowLeftIcon />
                        Back
                    </Button>
                </div>
            </div>

            {/* Form */}
            <div className="ess-form-container">
                <form onSubmit={handleSubmit} className="ess-form">
                    <div className="ess-form-section">
                        <h3 className="ess-form-section-title">Leave Details</h3>

                        <div className="ess-form-group">
                            <label className="ess-form-label">Leave Type *</label>
                            <select
                                className="ess-form-select"
                                value={formData.leaveTypeId}
                                onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                                required
                            >
                                <option value="">Select leave type</option>
                                {leaveTypes.map(type => {
                                    const balance = leaveBalances.find(b => b.leaveTypeId === type.id);
                                    return (
                                        <option key={type.id} value={type.id}>
                                            {type.name} ({balance?.currentBalance || 0} days available)
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {selectedLeaveType && (
                            <div className="ess-form-info-box">
                                <p><strong>{selectedLeaveType.name}</strong></p>
                                {selectedLeaveType.description && (
                                    <p>{selectedLeaveType.description}</p>
                                )}
                                {selectedBalance && (
                                    <p className="ess-form-balance">
                                        Available balance: <strong>{selectedBalance.currentBalance} days</strong>
                                    </p>
                                )}
                                {selectedLeaveType.requiresAttachment && (
                                    <p className="ess-form-warning">
                                        Note: Supporting documentation may be required
                                        {selectedLeaveType.attachmentRequiredAfterDays &&
                                            ` for requests longer than ${selectedLeaveType.attachmentRequiredAfterDays} days`}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="ess-form-row">
                            <div className="ess-form-group">
                                <label className="ess-form-label">Start Date *</label>
                                <input
                                    type="date"
                                    className="ess-form-input"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="ess-form-group">
                                <label className="ess-form-label">End Date *</label>
                                <input
                                    type="date"
                                    className="ess-form-input"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                        </div>

                        <div className="ess-form-group">
                            <label className="ess-form-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.isHalfDay}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        isHalfDay: e.target.checked,
                                        endDate: e.target.checked ? formData.startDate : formData.endDate
                                    })}
                                />
                                <span>Half Day</span>
                            </label>
                        </div>

                        {formData.isHalfDay && (
                            <div className="ess-form-group">
                                <label className="ess-form-label">Half Day Type</label>
                                <div className="ess-form-radio-group">
                                    <label className="ess-form-radio-label">
                                        <input
                                            type="radio"
                                            name="halfDayType"
                                            checked={formData.halfDayType === 'morning'}
                                            onChange={() => setFormData({ ...formData, halfDayType: 'morning' })}
                                        />
                                        <span>Morning</span>
                                    </label>
                                    <label className="ess-form-radio-label">
                                        <input
                                            type="radio"
                                            name="halfDayType"
                                            checked={formData.halfDayType === 'afternoon'}
                                            onChange={() => setFormData({ ...formData, halfDayType: 'afternoon' })}
                                        />
                                        <span>Afternoon</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {calculatedDays > 0 && (
                            <div className="ess-form-summary">
                                <span>Total Days:</span>
                                <strong>{calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}</strong>
                            </div>
                        )}

                        <div className="ess-form-group">
                            <label className="ess-form-label">Reason</label>
                            <textarea
                                className="ess-form-textarea"
                                rows={3}
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Provide a reason for your leave request..."
                            />
                        </div>

                        <div className="ess-form-group">
                            <label className="ess-form-label">Emergency Contact (while on leave)</label>
                            <input
                                type="text"
                                className="ess-form-input"
                                value={formData.emergencyContact}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                placeholder="Phone number or email"
                            />
                        </div>
                    </div>

                    <div className="ess-form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/ess/leave')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={submitting || !formData.leaveTypeId || !formData.startDate || !formData.endDate}
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </div>
                </form>
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

function ArrowRightIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
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

function CalendarIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
