import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import { LeaveService } from '../../services/leaveService';
import { EmployeeService } from '../../services/employeeService';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { LeaveBalance, LeaveType } from '../../types/leave';
import type { Employee } from '../../types/employee';
import './Leave.css';

// Enriched balance type with employee details
interface EnrichedBalance extends LeaveBalance {
    employeeName?: string;
    employeeNumber?: string;
}

export function LeaveBalances() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const companyId = userProfile?.companyId;

    // State
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<EnrichedBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [filterLeaveType, setFilterLeaveType] = useState<string>('');
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        if (companyId) {
            loadData();
        }
    }, [companyId]);

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

            // Load all balances for all employees
            const allBalances: EnrichedBalance[] = [];
            for (const employee of activeEmployees) {
                try {
                    const empBalances = await LeaveService.getLeaveBalances(companyId, employee.id);
                    const enriched = empBalances.map(balance => ({
                        ...balance,
                        employeeName: `${employee.firstName} ${employee.lastName}`,
                        employeeNumber: employee.employeeNumber
                    }));
                    allBalances.push(...enriched);
                } catch (error) {
                    console.error(`Error loading balances for ${employee.id}:`, error);
                }
            }

            setBalances(allBalances);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export balances:', filteredBalances);
    };

    // Get leave type details
    const getLeaveType = (leaveTypeId: string): LeaveType | undefined => {
        return leaveTypes.find(t => t.id === leaveTypeId);
    };

    // Get leave type color
    const getLeaveTypeColor = (leaveTypeId: string): string => {
        const leaveType = getLeaveType(leaveTypeId);
        return leaveType?.color || '#6B7280';
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

    // Filter balances
    const filteredBalances = balances.filter(balance => {
        // Filter by leave type (skip if "all" is selected)
        if (filterLeaveType && filterLeaveType !== 'all' && balance.leaveTypeId !== filterLeaveType) {
            return false;
        }

        // Filter by year
        if (balance.cycleYear !== filterYear) {
            return false;
        }

        return true;
    });

    // Calculate average balances per leave type
    const averagesByType = leaveTypes.map(type => {
        const typeBalances = filteredBalances.filter(b => b.leaveTypeId === type.id);
        const count = typeBalances.length;
        const avgBalance = count > 0
            ? (typeBalances.reduce((sum, b) => sum + b.currentBalance, 0) / count).toFixed(1)
            : '0.0';

        return {
            leaveTypeId: type.id,
            leaveTypeName: type.name,
            leaveTypeColor: type.color,
            averageBalance: avgBalance,
            count
        };
    }).filter(avg => avg.count > 0); // Only show types with data

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
                    <p className="leave-subtitle">View employee leave balances and allocation</p>
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

            {/* Filters Section */}
            <div className="leave-filters-section">
                <div className="leave-filters-row">
                    <div className="leave-filter-group">
                        <label className="leave-filter-label">Leave Type</label>
                        <Select
                            value={filterLeaveType}
                            onValueChange={setFilterLeaveType}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Leave Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Leave Types</SelectItem>
                                {leaveTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="leave-filter-group">
                        <label className="leave-filter-label">Cycle Year</label>
                        <Select
                            value={filterYear.toString()}
                            onValueChange={(value) => setFilterYear(Number(value))}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                {[2026, 2025, 2024, 2023].map(year => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="leave-filter-actions" style={{ marginLeft: 'auto' }}>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCwIcon className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleExport}
                        >
                            <DownloadIcon />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Average Balance Cards */}
            <div className="leave-balance-averages">
                {averagesByType.map(avg => (
                    <div key={avg.leaveTypeId} className="leave-balance-avg-card">
                        <div
                            className="leave-balance-avg-indicator"
                            style={{ backgroundColor: avg.leaveTypeColor }}
                        />
                        <div className="leave-balance-avg-content">
                            <div className="leave-balance-avg-value">{avg.averageBalance}</div>
                            <div className="leave-balance-avg-label">
                                AVG {avg.leaveTypeName.toUpperCase()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Balances Table */}
            {filteredBalances.length === 0 ? (
                <div className="leave-table-container">
                    <div className="leave-empty-state">
                        <div className="leave-empty-icon">
                            <TrendingUpIcon />
                        </div>
                        <h3 className="leave-empty-text">No Leave Balances</h3>
                        <p className="leave-empty-hint">
                            No leave balance records found for the selected filters.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="leave-table-container">
                    <table className="leave-table">
                        <thead className="leave-table-header">
                            <tr>
                                <th className="leave-table-th">EMPLOYEE</th>
                                <th className="leave-table-th">LEAVE TYPE</th>
                                <th className="leave-table-th">OPENING</th>
                                <th className="leave-table-th">ACCRUED</th>
                                <th className="leave-table-th">TAKEN</th>
                                <th className="leave-table-th">PENDING</th>
                                <th className="leave-table-th">AVAILABLE</th>
                                <th className="leave-table-th">CYCLE YEAR</th>
                            </tr>
                        </thead>
                        <tbody className="leave-table-body">
                            {filteredBalances.map(balance => {
                                const leaveType = getLeaveType(balance.leaveTypeId);
                                const employeeName = balance.employeeName || 'Unknown';

                                return (
                                    <tr key={balance.id} className="leave-table-row">
                                        <td className="leave-table-td">
                                            <div className="leave-employee-cell">
                                                <div
                                                    className="leave-employee-avatar"
                                                    style={{ backgroundColor: getAvatarColor(employeeName) }}
                                                >
                                                    {getInitials(employeeName)}
                                                </div>
                                                <span className="leave-employee-name">{employeeName}</span>
                                            </div>
                                        </td>
                                        <td className="leave-table-td">
                                            <div className="leave-type-cell">
                                                <span
                                                    className="leave-type-dot"
                                                    style={{ backgroundColor: getLeaveTypeColor(balance.leaveTypeId) }}
                                                />
                                                <span className="leave-type-name">
                                                    {leaveType?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="leave-table-td">
                                            <span className="leave-balance-value">{balance.openingBalance}</span>
                                        </td>
                                        <td className="leave-table-td">
                                            <span className="leave-balance-value">{balance.accrued}</span>
                                        </td>
                                        <td className="leave-table-td">
                                            <span className="leave-balance-value leave-balance-value--danger">
                                                {balance.taken}
                                            </span>
                                        </td>
                                        <td className="leave-table-td">
                                            <span className="leave-balance-value leave-balance-value--warning">
                                                {balance.pending}
                                            </span>
                                        </td>
                                        <td className="leave-table-td">
                                            <span className="leave-balance-value leave-balance-value--success">
                                                {balance.currentBalance}
                                            </span>
                                        </td>
                                        <td className="leave-table-td">
                                            <span className="leave-cycle-year">{balance.cycleYear}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
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

function PlusIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
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

function DownloadIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function TrendingUpIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}
