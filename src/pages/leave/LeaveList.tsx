import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import { LeaveService } from '../../services/leaveService';
import { EmployeeService } from '../../services/employeeService';
import { CompanyService } from '../../services/companyService';
import type { LeaveRequest, LeaveType, LeaveRequestStatus } from '../../types/leave';
import type { Employee } from '../../types/employee';
import type { Company } from '../../types/company';
import './Leave.css';

type TabType = 'all' | 'pending' | 'approved' | 'rejected';

// Demo-specific leave request type for UI development
interface DemoLeaveRequest {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    leaveTypeId: string;
    leaveTypeName: string;
    startDate: Date;
    endDate: Date;
    workingDays: number;
    status: LeaveRequestStatus;
    reason: string;
    createdAt: Date;
    submittedDate: Date;
    isHalfDay: boolean;
    halfDayType?: 'morning' | 'afternoon';
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: Date;
    rejectedBy?: string;
    rejectedByName?: string;
    rejectedAt?: Date;
    rejectionReason?: string;
}

// Demo-specific leave type for UI development
interface DemoLeaveType {
    id: string;
    companyId: string;
    name: string;
    color: string;
    daysAllowed: number;
    carryOverLimit: number;
    requiresApproval: boolean;
    isActive: boolean;
}

// Demo data for UI refinement
const DEMO_LEAVE_REQUESTS: DemoLeaveRequest[] = [
    {
        id: 'demo-1',
        companyId: 'demo',
        employeeId: 'emp-1',
        employeeName: 'Thabo Mokoena',
        leaveTypeId: 'lt-1',
        leaveTypeName: 'Annual Leave',
        startDate: new Date('2026-01-27'),
        endDate: new Date('2026-01-31'),
        workingDays: 5,
        status: 'pending',
        reason: 'Family vacation to Cape Town',
        createdAt: new Date('2026-01-15'),
        submittedDate: new Date('2026-01-15'),
        isHalfDay: false,
    },
    {
        id: 'demo-2',
        companyId: 'demo',
        employeeId: 'emp-2',
        employeeName: 'Naledi Dlamini',
        leaveTypeId: 'lt-2',
        leaveTypeName: 'Sick Leave',
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-01-21'),
        workingDays: 2,
        status: 'approved',
        reason: 'Medical appointment and recovery',
        createdAt: new Date('2026-01-18'),
        submittedDate: new Date('2026-01-18'),
        approvedBy: 'manager-1',
        approvedByName: 'Sarah Johnson',
        approvedAt: new Date('2026-01-18'),
        isHalfDay: false,
    },
    {
        id: 'demo-3',
        companyId: 'demo',
        employeeId: 'emp-3',
        employeeName: 'Sipho Ndlovu',
        leaveTypeId: 'lt-3',
        leaveTypeName: 'Family Responsibility',
        startDate: new Date('2026-01-22'),
        endDate: new Date('2026-01-22'),
        workingDays: 1,
        status: 'pending',
        reason: 'Child school event',
        createdAt: new Date('2026-01-17'),
        submittedDate: new Date('2026-01-17'),
        isHalfDay: false,
    },
    {
        id: 'demo-4',
        companyId: 'demo',
        employeeId: 'emp-4',
        employeeName: 'Lindiwe Zulu',
        leaveTypeId: 'lt-4',
        leaveTypeName: 'Maternity Leave',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-05-31'),
        workingDays: 120,
        status: 'approved',
        reason: 'Maternity leave as per BCEA',
        createdAt: new Date('2026-01-10'),
        submittedDate: new Date('2026-01-10'),
        approvedBy: 'manager-1',
        approvedByName: 'Sarah Johnson',
        approvedAt: new Date('2026-01-11'),
        isHalfDay: false,
    },
    {
        id: 'demo-5',
        companyId: 'demo',
        employeeId: 'emp-5',
        employeeName: 'Bongani Khumalo',
        leaveTypeId: 'lt-5',
        leaveTypeName: 'Paternity Leave',
        startDate: new Date('2026-01-28'),
        endDate: new Date('2026-02-10'),
        workingDays: 10,
        status: 'pending',
        reason: 'Birth of child expected late January',
        createdAt: new Date('2026-01-16'),
        submittedDate: new Date('2026-01-16'),
        isHalfDay: false,
    },
    {
        id: 'demo-6',
        companyId: 'demo',
        employeeId: 'emp-6',
        employeeName: 'Nomvula Mthembu',
        leaveTypeId: 'lt-6',
        leaveTypeName: 'Study Leave',
        startDate: new Date('2026-01-23'),
        endDate: new Date('2026-01-24'),
        workingDays: 2,
        status: 'rejected',
        reason: 'Final exams preparation',
        createdAt: new Date('2026-01-14'),
        submittedDate: new Date('2026-01-14'),
        rejectedBy: 'manager-1',
        rejectedByName: 'Sarah Johnson',
        rejectedAt: new Date('2026-01-15'),
        rejectionReason: 'Critical project deadline conflicts with requested dates',
        isHalfDay: false,
    },
    {
        id: 'demo-7',
        companyId: 'demo',
        employeeId: 'emp-7',
        employeeName: 'Mandla Sithole',
        leaveTypeId: 'lt-1',
        leaveTypeName: 'Annual Leave',
        startDate: new Date('2026-02-14'),
        endDate: new Date('2026-02-14'),
        workingDays: 0.5,
        status: 'approved',
        reason: 'Personal appointment',
        createdAt: new Date('2026-01-19'),
        submittedDate: new Date('2026-01-19'),
        approvedBy: 'manager-1',
        approvedByName: 'Sarah Johnson',
        approvedAt: new Date('2026-01-19'),
        isHalfDay: true,
        halfDayType: 'morning',
    },
    {
        id: 'demo-8',
        companyId: 'demo',
        employeeId: 'emp-8',
        employeeName: 'Precious Molefe',
        leaveTypeId: 'lt-7',
        leaveTypeName: 'Birthday Leave',
        startDate: new Date('2026-02-05'),
        endDate: new Date('2026-02-05'),
        workingDays: 1,
        status: 'pending',
        reason: 'Birthday celebration',
        createdAt: new Date('2026-01-20'),
        submittedDate: new Date('2026-01-20'),
        isHalfDay: false,
    },
    {
        id: 'demo-9',
        companyId: 'demo',
        employeeId: 'emp-9',
        employeeName: 'Johannes van der Merwe',
        leaveTypeId: 'lt-2',
        leaveTypeName: 'Sick Leave',
        startDate: new Date('2026-01-13'),
        endDate: new Date('2026-01-17'),
        workingDays: 5,
        status: 'taken',
        reason: 'Flu and recovery',
        createdAt: new Date('2026-01-13'),
        submittedDate: new Date('2026-01-13'),
        approvedBy: 'manager-1',
        approvedByName: 'Sarah Johnson',
        approvedAt: new Date('2026-01-13'),
        isHalfDay: false,
    },
    {
        id: 'demo-10',
        companyId: 'demo',
        employeeId: 'emp-10',
        employeeName: 'Ayanda Nkosi',
        leaveTypeId: 'lt-1',
        leaveTypeName: 'Annual Leave',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-14'),
        workingDays: 10,
        status: 'pending',
        reason: 'Overseas trip planned',
        createdAt: new Date('2026-01-21'),
        submittedDate: new Date('2026-01-21'),
        isHalfDay: false,
    },
];

// Demo leave types for coloring
const DEMO_LEAVE_TYPES: DemoLeaveType[] = [
    { id: 'lt-1', companyId: 'demo', name: 'Annual Leave', color: '#3B82F6', daysAllowed: 15, carryOverLimit: 5, requiresApproval: true, isActive: true },
    { id: 'lt-2', companyId: 'demo', name: 'Sick Leave', color: '#EF4444', daysAllowed: 30, carryOverLimit: 0, requiresApproval: true, isActive: true },
    { id: 'lt-3', companyId: 'demo', name: 'Family Responsibility', color: '#8B5CF6', daysAllowed: 3, carryOverLimit: 0, requiresApproval: true, isActive: true },
    { id: 'lt-4', companyId: 'demo', name: 'Maternity Leave', color: '#EC4899', daysAllowed: 120, carryOverLimit: 0, requiresApproval: true, isActive: true },
    { id: 'lt-5', companyId: 'demo', name: 'Paternity Leave', color: '#06B6D4', daysAllowed: 10, carryOverLimit: 0, requiresApproval: true, isActive: true },
    { id: 'lt-6', companyId: 'demo', name: 'Study Leave', color: '#F59E0B', daysAllowed: 5, carryOverLimit: 0, requiresApproval: true, isActive: true },
    { id: 'lt-7', companyId: 'demo', name: 'Birthday Leave', color: '#10B981', daysAllowed: 1, carryOverLimit: 0, requiresApproval: true, isActive: true },
];

export function LeaveList() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Determine company ID: URL param for System Admin, or user's company
    const isSystemAdmin = userProfile?.role === 'System Admin' || userProfile?.role?.toLowerCase() === 'system admin';
    const urlCompanyId = searchParams.get('companyId');

    // State
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Stats
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        taken: 0
    });

    // Approval modal
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
    const [approvalComments, setApprovalComments] = useState('');
    const [processing, setProcessing] = useState(false);

    // Initialize company ID
    useEffect(() => {
        const initializeCompanyId = async () => {
            if (isSystemAdmin) {
                // Load all companies for System Admin
                try {
                    const allCompanies = await CompanyService.getAllCompanies();
                    setCompanies(allCompanies);

                    // Use URL param if present, otherwise use first company
                    if (urlCompanyId) {
                        setCompanyId(urlCompanyId);
                    } else if (allCompanies.length > 0) {
                        setCompanyId(allCompanies[0].id);
                    }
                } catch (error) {
                    console.error('Failed to load companies:', error);
                }
            } else {
                // Non-System Admin: use their company ID
                if (userProfile?.companyId) {
                    setCompanyId(userProfile.companyId);
                }
            }
        };

        initializeCompanyId();
    }, [isSystemAdmin, urlCompanyId, userProfile?.companyId]);

    useEffect(() => {
        if (companyId) {
            loadData();
        }
    }, [companyId]);

    const loadData = async () => {
        if (!companyId) return;

        try {
            setLoading(true);
            const [requestsData, typesData, employeesData] = await Promise.all([
                LeaveService.getLeaveRequests(companyId),
                LeaveService.getLeaveTypes(companyId),
                EmployeeService.getEmployees(companyId)
            ]);

            // Enrich requests with employee and leave type names
            const enrichedRequests = requestsData.map(request => {
                const employee = employeesData.find(e => e.id === request.employeeId);
                const leaveType = typesData.find(t => t.id === request.leaveTypeId);
                return {
                    ...request,
                    employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
                    leaveTypeName: leaveType?.name || 'Unknown'
                };
            });

            // Use demo data if no real requests exist (for UI refinement)
            const finalRequests = enrichedRequests.length > 0 ? enrichedRequests : DEMO_LEAVE_REQUESTS as unknown as LeaveRequest[];
            const finalTypes = typesData.length > 0 ? typesData : DEMO_LEAVE_TYPES as unknown as LeaveType[];

            setLeaveRequests(finalRequests);
            setLeaveTypes(finalTypes);
            setEmployees(employeesData);

            // Calculate stats
            const pending = finalRequests.filter(r => r.status === 'pending').length;
            const approved = finalRequests.filter(r => r.status === 'approved').length;
            const rejected = finalRequests.filter(r => r.status === 'rejected').length;
            const taken = finalRequests.filter(r => r.status === 'taken').length;
            setStats({ pending, approved, rejected, taken });

        } catch (error) {
            console.error('Error loading leave data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCompanyId = e.target.value;
        if (newCompanyId) {
            setCompanyId(newCompanyId);
        }
    };

    // Filter requests based on tab, search, and filters
    const filteredRequests = leaveRequests.filter(request => {
        // Tab filter
        if (activeTab !== 'all' && request.status !== activeTab) {
            return false;
        }

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const matchesEmployee = request.employeeName?.toLowerCase().includes(search);
            const matchesType = request.leaveTypeName?.toLowerCase().includes(search);
            if (!matchesEmployee && !matchesType) {
                return false;
            }
        }

        // Type filter
        if (filterType && request.leaveTypeId !== filterType) {
            return false;
        }

        // Status filter
        if (filterStatus && request.status !== filterStatus) {
            return false;
        }

        return true;
    });

    // Format date
    const formatDate = (date: Date | undefined): string => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get status badge class
    const getStatusBadgeClass = (status: LeaveRequestStatus): string => {
        return `leave-status-badge leave-status-badge--${status}`;
    };

    // Get status display text
    const getStatusText = (status: LeaveRequestStatus): string => {
        const statusMap: Record<LeaveRequestStatus, string> = {
            draft: 'Draft',
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
            cancelled: 'Cancelled',
            taken: 'Taken'
        };
        return statusMap[status] || status;
    };

    // Get employee initials
    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get avatar color
    const getAvatarColor = (name: string): string => {
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // Get leave type color
    const getLeaveTypeColor = (leaveTypeId: string): string => {
        const leaveType = leaveTypes.find(t => t.id === leaveTypeId);
        return leaveType?.color || '#6B7280';
    };

    // Handle approval action
    const handleApprovalClick = (request: LeaveRequest, action: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setApprovalAction(action);
        setApprovalComments('');
        setShowApprovalModal(true);
    };

    // Process approval/rejection
    const processApproval = async () => {
        if (!selectedRequest || !currentUser || !userProfile) return;

        try {
            setProcessing(true);

            if (approvalAction === 'approve') {
                await LeaveService.approveLeaveRequest(
                    selectedRequest.id,
                    currentUser.uid,
                    userProfile.displayName || currentUser.email || 'Unknown',
                    approvalComments
                );
            } else {
                await LeaveService.rejectLeaveRequest(
                    selectedRequest.id,
                    currentUser.uid,
                    userProfile.displayName || currentUser.email || 'Unknown',
                    approvalComments
                );
            }

            setShowApprovalModal(false);
            await loadData();
        } catch (error) {
            console.error('Error processing approval:', error);
        } finally {
            setProcessing(false);
        }
    };

    // Check if user can approve
    const canApprove = (): boolean => {
        const approverRoles = ['System Admin', 'HR Admin', 'HR Manager', 'Line Manager'];
        return userProfile?.role ? approverRoles.includes(userProfile.role) : false;
    };

    // Keep employees state used for enrichment
    void employees;

    if (!companyId && !loading) {
        return (
            <div className="leave-empty-state">
                <div className="leave-empty-icon">
                    <AlertCircleIcon />
                </div>
                <h3 className="leave-empty-text">No Company Selected</h3>
                <p className="leave-empty-hint">Please select a company to view leave requests.</p>
            </div>
        );
    }

    return (
        <div className="leave-list">
            {/* Header */}
            <div className="leave-header">
                <div className="leave-header-content">
                    <h1 className="leave-title">Leave Management</h1>
                    <p className="leave-subtitle">Manage employee leave requests and balances</p>
                </div>
                <div className="leave-header-actions">
                    {/* Company Selector for System Admin */}
                    {isSystemAdmin && companies.length > 0 && (
                        <div className="company-selector">
                            <select
                                value={companyId || ''}
                                onChange={handleCompanyChange}
                                className="company-select-input"
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--speccon-gray-200)',
                                    marginRight: '12px',
                                    backgroundColor: 'white',
                                    fontSize: '14px',
                                    minWidth: '180px'
                                }}
                            >
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.legalName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/leave/balances')}
                    >
                        <FileTextIcon />
                        View Balances
                    </Button>
                    <Button onClick={() => navigate('/leave/request')}>
                        <PlusIcon />
                        New Request
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="leave-stats">
                <div className="leave-stat-card leave-stat-card--pending">
                    <div className="leave-stat-value">{stats.pending}</div>
                    <div className="leave-stat-label">Pending</div>
                </div>
                <div className="leave-stat-card leave-stat-card--approved">
                    <div className="leave-stat-value">{stats.approved}</div>
                    <div className="leave-stat-label">Approved</div>
                </div>
                <div className="leave-stat-card leave-stat-card--rejected">
                    <div className="leave-stat-value">{stats.rejected}</div>
                    <div className="leave-stat-label">Rejected</div>
                </div>
                <div className="leave-stat-card leave-stat-card--taken">
                    <div className="leave-stat-value">{stats.taken}</div>
                    <div className="leave-stat-label">Taken</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="leave-tabs">
                <button
                    className={`leave-tab ${activeTab === 'all' ? 'leave-tab--active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    <CalendarIcon />
                    All Requests
                </button>
                <button
                    className={`leave-tab ${activeTab === 'pending' ? 'leave-tab--active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    <ClockIcon />
                    Pending
                    {stats.pending > 0 && (
                        <span className="leave-tab-badge">{stats.pending}</span>
                    )}
                </button>
                <button
                    className={`leave-tab ${activeTab === 'approved' ? 'leave-tab--active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                    <CheckIcon />
                    Approved
                </button>
                <button
                    className={`leave-tab ${activeTab === 'rejected' ? 'leave-tab--active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    <XIcon />
                    Rejected
                </button>
            </div>

            {/* Filters */}
            <div className="leave-filters">
                <div className="leave-filter-search">
                    <SearchIcon />
                    <input
                        type="text"
                        className="leave-filter-input"
                        placeholder="Search by employee or leave type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="leave-filter-selects">
                    <select
                        className="leave-filter-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="">All Leave Types</option>
                        {leaveTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                    {activeTab === 'all' && (
                        <select
                            className="leave-filter-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="taken">Taken</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="leave-table-container">
                <div className="leave-table-wrapper">
                    {loading ? (
                        <div className="leave-empty-state">
                            <p>Loading leave requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="leave-empty-state">
                            <div className="leave-empty-icon">
                                <CalendarIcon />
                            </div>
                            <h3 className="leave-empty-text">No Leave Requests</h3>
                            <p className="leave-empty-hint">
                                {searchTerm || filterType || filterStatus
                                    ? 'No requests match your filters'
                                    : 'No leave requests have been submitted yet'}
                            </p>
                        </div>
                    ) : (
                        <table className="leave-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Leave Type</th>
                                    <th>Dates</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map(request => (
                                    <tr key={request.id}>
                                        <td>
                                            <div className="leave-employee-cell">
                                                <div
                                                    className="leave-employee-avatar"
                                                    style={{ backgroundColor: getAvatarColor(request.employeeName || '') }}
                                                >
                                                    {getInitials(request.employeeName || '')}
                                                </div>
                                                <div className="leave-employee-info">
                                                    <span className="leave-employee-name">
                                                        {request.employeeName}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="leave-type-badge">
                                                <span
                                                    className="leave-type-dot"
                                                    style={{ backgroundColor: getLeaveTypeColor(request.leaveTypeId) }}
                                                />
                                                {request.leaveTypeName}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="leave-dates">
                                                <span className="leave-date-range">
                                                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                                </span>
                                                {request.isHalfDay && (
                                                    <span className="leave-days-count">
                                                        Half day ({request.halfDayType})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="leave-days-count">
                                                {request.workingDays} {request.workingDays === 1 ? 'day' : 'days'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={getStatusBadgeClass(request.status)}>
                                                {getStatusText(request.status)}
                                            </span>
                                        </td>
                                        <td>
                                            {formatDate(request.submittedDate || request.createdAt)}
                                        </td>
                                        <td>
                                            <div className="leave-action-buttons">
                                                {request.status === 'pending' && canApprove() && (
                                                    <>
                                                        <button
                                                            className="leave-action-btn leave-action-btn--approve"
                                                            onClick={() => handleApprovalClick(request, 'approve')}
                                                            title="Approve"
                                                        >
                                                            <CheckIcon />
                                                        </button>
                                                        <button
                                                            className="leave-action-btn leave-action-btn--reject"
                                                            onClick={() => handleApprovalClick(request, 'reject')}
                                                            title="Reject"
                                                        >
                                                            <XIcon />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    to={`/leave/${request.id}`}
                                                    className="leave-action-btn"
                                                    title="View Details"
                                                >
                                                    <EyeIcon />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {filteredRequests.length > 0 && (
                    <div className="leave-table-footer">
                        <span className="leave-table-count">
                            Showing {filteredRequests.length} of {leaveRequests.length} requests
                        </span>
                    </div>
                )}
            </div>

            {/* Approval Modal */}
            {showApprovalModal && selectedRequest && (
                <div className="leave-approval-modal" onClick={() => setShowApprovalModal(false)}>
                    <div
                        className="leave-approval-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="leave-approval-modal-header">
                            <h3 className="leave-approval-modal-title">
                                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Leave Request
                            </h3>
                            <button
                                className="leave-approval-modal-close"
                                onClick={() => setShowApprovalModal(false)}
                            >
                                <XIcon />
                            </button>
                        </div>
                        <div className="leave-approval-modal-body">
                            <div className="leave-detail-info">
                                <div className="leave-detail-item">
                                    <span className="leave-detail-label">Employee</span>
                                    <span className="leave-detail-value">{selectedRequest.employeeName}</span>
                                </div>
                                <div className="leave-detail-item">
                                    <span className="leave-detail-label">Leave Type</span>
                                    <span className="leave-detail-value">{selectedRequest.leaveTypeName}</span>
                                </div>
                                <div className="leave-detail-item">
                                    <span className="leave-detail-label">Start Date</span>
                                    <span className="leave-detail-value">{formatDate(selectedRequest.startDate)}</span>
                                </div>
                                <div className="leave-detail-item">
                                    <span className="leave-detail-label">End Date</span>
                                    <span className="leave-detail-value">{formatDate(selectedRequest.endDate)}</span>
                                </div>
                                <div className="leave-detail-item">
                                    <span className="leave-detail-label">Days</span>
                                    <span className="leave-detail-value">{selectedRequest.workingDays}</span>
                                </div>
                                {selectedRequest.reason && (
                                    <div className="leave-detail-item leave-form-grid--full">
                                        <span className="leave-detail-label">Reason</span>
                                        <span className="leave-detail-value">{selectedRequest.reason}</span>
                                    </div>
                                )}
                            </div>

                            <div className="leave-form-field leave-form-grid--full">
                                <label className="leave-form-label">
                                    Comments {approvalAction === 'reject' && <span>*</span>}
                                </label>
                                <textarea
                                    className="leave-form-textarea"
                                    value={approvalComments}
                                    onChange={(e) => setApprovalComments(e.target.value)}
                                    placeholder={approvalAction === 'approve'
                                        ? 'Add optional comments...'
                                        : 'Please provide a reason for rejection...'}
                                    rows={3}
                                    required={approvalAction === 'reject'}
                                />
                            </div>
                        </div>
                        <div className="leave-approval-modal-footer">
                            <Button
                                variant="secondary"
                                onClick={() => setShowApprovalModal(false)}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant={approvalAction === 'approve' ? 'primary' : 'danger'}
                                onClick={processApproval}
                                disabled={processing || (approvalAction === 'reject' && !approvalComments.trim())}
                            >
                                {processing
                                    ? 'Processing...'
                                    : approvalAction === 'approve'
                                        ? 'Approve Request'
                                        : 'Reject Request'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Icon Components
function CalendarIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
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

function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
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

function XIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
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

function AlertCircleIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
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
