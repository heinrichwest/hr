import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import { LeaveService } from '../../services/leaveService';
import { EmployeeService } from '../../services/employeeService';
import type { LeaveBalance, LeaveType } from '../../types/leave';
import type { Employee } from '../../types/employee';
import './Leave.css';

export function LeaveBalances() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const companyId = userProfile?.companyId;

    // State
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Check if user is HR/Admin
    const isHRAdmin = userProfile?.role && ['System Admin', 'HR Admin', 'HR Manager'].includes(userProfile.role);

    useEffect(() => {
        if (companyId) {
            loadData();
        }
    }, [companyId]);

    useEffect(() => {
        if (selectedEmployeeId && companyId) {
            loadBalances(selectedEmployeeId);
        }
    }, [selectedEmployeeId, companyId]);

    const loadData = async () => {
        if (!companyId) return;

        try {
            setLoading(true);
            const [employeesData, typesData] = await Promise.all([
                EmployeeService.getEmployees(companyId),
                LeaveService.getLeaveTypes(companyId)
            ]);

            const activeEmployees = employeesData.filter(e => e.status === 'active');
            setEmployees(activeEmployees);
            setLeaveTypes(typesData.filter(t => t.isActive));

            // If not HR/Admin, auto-select current user's employee record
            if (!isHRAdmin && currentUser) {
                const currentEmployee = activeEmployees.find(e => e.userId === currentUser.uid);
                if (currentEmployee) {
                    setSelectedEmployeeId(currentEmployee.id);
                }
            } else if (activeEmployees.length > 0) {
                setSelectedEmployeeId(activeEmployees[0].id);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBalances = async (employeeId: string) => {
        if (!companyId) return;

        try {
            setRefreshing(true);
            const balancesData = await LeaveService.getLeaveBalances(companyId, employeeId);
            setBalances(balancesData);
        } catch (error) {
            console.error('Error loading balances:', error);
            setBalances([]);
        } finally {
            setRefreshing(false);
        }
    };

    const handleInitializeBalances = async () => {
        if (!selectedEmployeeId || !companyId) return;

        try {
            setRefreshing(true);
            const currentYear = new Date().getFullYear();

            // Initialize balance for each active leave type
            for (const leaveType of leaveTypes) {
                // Check if balance already exists
                const existing = balances.find(b => b.leaveTypeId === leaveType.id);
                if (!existing) {
                    await LeaveService.initializeLeaveBalance(
                        companyId,
                        selectedEmployeeId,
                        leaveType.id,
                        currentYear
                    );
                }
            }

            // Reload balances
            await loadBalances(selectedEmployeeId);
        } catch (error) {
            console.error('Error initializing balances:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Get leave type details
    const getLeaveType = (leaveTypeId: string): LeaveType | undefined => {
        return leaveTypes.find(t => t.id === leaveTypeId);
    };

    // Calculate progress percentage
    const calculateProgress = (balance: LeaveBalance): number => {
        const leaveType = getLeaveType(balance.leaveTypeId);
        if (!leaveType) return 0;

        const total = leaveType.defaultDaysPerYear;
        const used = balance.taken + balance.pending;
        const percentage = ((total - used) / total) * 100;
        return Math.max(0, Math.min(100, percentage));
    };

    // Get progress bar class based on percentage
    const getProgressClass = (percentage: number): string => {
        if (percentage <= 20) return 'leave-balance-progress-fill--critical';
        if (percentage <= 40) return 'leave-balance-progress-fill--low';
        return '';
    };

    // Format date
    const formatDate = (date: Date | undefined): string => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get selected employee
    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    // Filter employees by search
    const filteredEmployees = employees.filter(emp => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        return fullName.includes(search) || emp.employeeNumber?.toLowerCase().includes(search);
    });

    if (loading) {
        return (
            <div className="leave-empty-state">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="leave-balances">
            {/* Header */}
            <div className="leave-header">
                <div className="leave-header-content">
                    <h1 className="leave-title">Leave Balances</h1>
                    <p className="leave-subtitle">View and manage employee leave balances</p>
                </div>
                <div className="leave-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/leave')}>
                        <ArrowLeftIcon />
                        Back to Leave
                    </Button>
                    <Button onClick={() => navigate('/leave/request')}>
                        <PlusIcon />
                        New Request
                    </Button>
                </div>
            </div>

            {/* Employee Selector */}
            {isHRAdmin && (
                <div className="leave-employee-selector">
                    <span className="leave-employee-selector-label">
                        <UserIcon />
                        Employee:
                    </span>
                    <div className="leave-filter-search" style={{ flex: 1 }}>
                        <SearchIcon />
                        <input
                            type="text"
                            className="leave-filter-input"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="leave-employee-selector-select"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    >
                        <option value="">Select an employee...</option>
                        {filteredEmployees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => loadBalances(selectedEmployeeId)}
                        disabled={!selectedEmployeeId || refreshing}
                    >
                        <RefreshCwIcon className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>
            )}

            {/* Employee Info */}
            {selectedEmployee && (
                <div className="leave-stats" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="leave-stat-card">
                        <div className="leave-stat-value">{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                        <div className="leave-stat-label">Employee</div>
                    </div>
                    <div className="leave-stat-card">
                        <div className="leave-stat-value">{selectedEmployee.employeeNumber || '-'}</div>
                        <div className="leave-stat-label">Employee Number</div>
                    </div>
                    <div className="leave-stat-card">
                        <div className="leave-stat-value">{selectedEmployee.jobTitle || '-'}</div>
                        <div className="leave-stat-label">Position</div>
                    </div>
                    <div className="leave-stat-card">
                        <div className="leave-stat-value">
                            {formatDate(selectedEmployee.startDate)}
                        </div>
                        <div className="leave-stat-label">Start Date</div>
                    </div>
                </div>
            )}

            {/* Leave Balance Cards */}
            {selectedEmployeeId ? (
                <>
                    {balances.length === 0 ? (
                        <div className="leave-table-container">
                            <div className="leave-empty-state">
                                <div className="leave-empty-icon">
                                    <TrendingUpIcon />
                                </div>
                                <h3 className="leave-empty-text">No Leave Balances</h3>
                                <p className="leave-empty-hint">
                                    Leave balances have not been initialized for this employee.
                                </p>
                                {isHRAdmin && (
                                    <Button
                                        onClick={handleInitializeBalances}
                                        disabled={refreshing}
                                        style={{ marginTop: 'var(--space-4)' }}
                                    >
                                        <PlusIcon />
                                        Initialize Balances
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="leave-balances-grid">
                            {balances.map(balance => {
                                const leaveType = getLeaveType(balance.leaveTypeId);
                                const progress = calculateProgress(balance);
                                const progressClass = getProgressClass(progress);

                                return (
                                    <div key={balance.id} className="leave-balance-card">
                                        <div className="leave-balance-card-header">
                                            <div className="leave-balance-card-type">
                                                <span
                                                    className="leave-balance-card-dot"
                                                    style={{ backgroundColor: leaveType?.color || '#6B7280' }}
                                                />
                                                <span className="leave-balance-card-name">
                                                    {leaveType?.name || balance.leaveTypeName || 'Unknown'}
                                                </span>
                                            </div>
                                            <span className="leave-balance-card-cycle">
                                                {balance.cycleYear}
                                            </span>
                                        </div>
                                        <div className="leave-balance-card-body">
                                            {/* Main Balance Display */}
                                            <div className="leave-balance-card-main">
                                                <span className="leave-balance-card-value">
                                                    {balance.currentBalance}
                                                </span>
                                                <span className="leave-balance-card-total">
                                                    / {leaveType?.defaultDaysPerYear || 0}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="leave-balance-progress">
                                                <div className="leave-balance-progress-bar">
                                                    <div
                                                        className={`leave-balance-progress-fill ${progressClass}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Balance Details */}
                                            <div className="leave-balance-card-details">
                                                <div className="leave-balance-card-detail">
                                                    <span className="leave-balance-card-detail-label">Opening</span>
                                                    <span className="leave-balance-card-detail-value">
                                                        {balance.openingBalance}
                                                    </span>
                                                </div>
                                                <div className="leave-balance-card-detail">
                                                    <span className="leave-balance-card-detail-label">Accrued</span>
                                                    <span className="leave-balance-card-detail-value">
                                                        {balance.accrued}
                                                    </span>
                                                </div>
                                                <div className="leave-balance-card-detail">
                                                    <span className="leave-balance-card-detail-label">Taken</span>
                                                    <span className="leave-balance-card-detail-value">
                                                        {balance.taken}
                                                    </span>
                                                </div>
                                                <div className="leave-balance-card-detail">
                                                    <span className="leave-balance-card-detail-label">Pending</span>
                                                    <span className="leave-balance-card-detail-value">
                                                        {balance.pending}
                                                    </span>
                                                </div>
                                                <div className="leave-balance-card-detail">
                                                    <span className="leave-balance-card-detail-label">Carry Over</span>
                                                    <span className="leave-balance-card-detail-value">
                                                        {balance.carriedForward}
                                                    </span>
                                                </div>
                                                <div className="leave-balance-card-detail">
                                                    <span className="leave-balance-card-detail-label">Adjusted</span>
                                                    <span className="leave-balance-card-detail-value">
                                                        {balance.adjusted}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Initialize Button for missing leave types */}
                    {balances.length > 0 && balances.length < leaveTypes.length && isHRAdmin && (
                        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                            <Button
                                variant="secondary"
                                onClick={handleInitializeBalances}
                                disabled={refreshing}
                            >
                                <PlusIcon />
                                Initialize Missing Leave Types
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="leave-table-container">
                    <div className="leave-empty-state">
                        <div className="leave-empty-icon">
                            <UserIcon />
                        </div>
                        <h3 className="leave-empty-text">Select an Employee</h3>
                        <p className="leave-empty-hint">
                            Please select an employee to view their leave balances.
                        </p>
                    </div>
                </div>
            )}
        </div>
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function TrendingUpIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}

function RefreshCwIcon({ className }: { className?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
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
