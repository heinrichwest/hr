import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import { LeaveService } from '../../services/leaveService';
import { EmployeeService } from '../../services/employeeService';
import { CompanyService } from '../../services/companyService';
import type { LeaveRequest, LeaveType, LeaveRequestStatus } from '../../types/leave';
import type { Employee } from '../../types/employee';
import type { Company } from '../../types/company';
import './Leave.css';


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
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Determine company ID: URL param for System Admin, or user's company
    const isSystemAdmin = userProfile?.role === 'System Admin' || userProfile?.role?.toLowerCase() === 'system admin';
    const urlCompanyId = searchParams.get('companyId');

    // State
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [, setLeaveTypes] = useState<LeaveType[]>([]);
    const [, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Stats
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        taken: 0
    });


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

            {/* Info Card */}
            <div className="leave-info-card">
                <div className="leave-info-icon">
                    <FileTextIcon />
                </div>
                <div className="leave-info-content">
                    <h3 className="leave-info-title">View Detailed Leave Reports</h3>
                    <p className="leave-info-text">
                        For detailed leave request information including employee names, dates, and statuses,
                        please view the Leave Movement Report in the Reports section.
                    </p>
                    <div className="leave-info-actions">
                        <Button
                            variant="primary"
                            onClick={() => navigate('/reports')}
                        >
                            <FileTextIcon />
                            Go to Reports
                        </Button>
                    </div>
                </div>
            </div>
        </div>
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
