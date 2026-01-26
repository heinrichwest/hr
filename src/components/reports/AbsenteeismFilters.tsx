// ============================================================
// ABSENTEEISM FILTERS COMPONENT
// ============================================================

import { useState, useEffect } from 'react';
import type { AbsenteeismFilters as AbsenteeismFiltersType, LeaveTypeMode } from '../../types/reports';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './AbsenteeismFilters.css';

interface Employee {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
}

interface AbsenteeismFiltersProps {
    companyId: string;
    filters: AbsenteeismFiltersType;
    onFiltersChange: (filters: AbsenteeismFiltersType) => void;
}

export function AbsenteeismFilters({ companyId, filters, onFiltersChange }: AbsenteeismFiltersProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadEmployees();
    }, [companyId]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const employeesQuery = query(
                collection(db, `companies/${companyId}/employees`),
                where('status', 'in', ['active', 'on_leave', 'probation'])
            );

            const snapshot = await getDocs(employeesQuery);
            const employeeList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Employee[];

            setEmployees(employeeList);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const setQuickDateRange = (preset: string) => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (preset) {
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'this_quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1);
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return;
        }

        onFiltersChange({
            ...filters,
            dateRange: { startDate, endDate }
        });
    };

    const handleStartDateChange = (value: string) => {
        const newStartDate = new Date(value);
        onFiltersChange({
            ...filters,
            dateRange: { ...filters.dateRange, startDate: newStartDate }
        });
    };

    const handleEndDateChange = (value: string) => {
        const newEndDate = new Date(value);
        onFiltersChange({
            ...filters,
            dateRange: { ...filters.dateRange, endDate: newEndDate }
        });
    };

    const handleEmployeeChange = (employeeId: string) => {
        onFiltersChange({
            ...filters,
            employeeId: employeeId === 'all' ? undefined : employeeId
        });
    };

    const handleLeaveTypeModeChange = (mode: LeaveTypeMode) => {
        onFiltersChange({
            ...filters,
            leaveTypeMode: mode
        });
    };

    const handleClearFilters = () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

        onFiltersChange({
            employeeId: undefined,
            dateRange: { startDate, endDate: now },
            leaveTypeMode: 'sick_only'
        });
        setSearchTerm('');
    };

    const filteredEmployees = employees.filter(emp => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            emp.employeeNumber.toLowerCase().includes(search) ||
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search)
        );
    });

    return (
        <div className="absenteeism-filters">
            {/* Date Range Section */}
            <div className="filter-section">
                <label className="filter-label">Date Range</label>
                <div className="quick-date-buttons">
                    <button
                        className="quick-date-btn"
                        onClick={() => setQuickDateRange('this_month')}
                    >
                        This Month
                    </button>
                    <button
                        className="quick-date-btn"
                        onClick={() => setQuickDateRange('this_quarter')}
                    >
                        This Quarter
                    </button>
                    <button
                        className="quick-date-btn"
                        onClick={() => setQuickDateRange('this_year')}
                    >
                        This Year
                    </button>
                </div>
            </div>

            {/* Custom Date Range */}
            <div className="filter-section">
                <label className="filter-label">Custom Range</label>
                <div className="date-range-picker">
                    <input
                        type="date"
                        value={filters.dateRange.startDate.toISOString().split('T')[0]}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="filter-input"
                    />
                    <span className="date-range-separator">to</span>
                    <input
                        type="date"
                        value={filters.dateRange.endDate.toISOString().split('T')[0]}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="filter-input"
                    />
                </div>
            </div>

            {/* Employee Filter */}
            <div className="filter-section">
                <label className="filter-label">Employee</label>
                <select
                    className="filter-input"
                    value={filters.employeeId || 'all'}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    disabled={loading}
                >
                    <option value="all">All Employees</option>
                    {filteredEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                            {emp.employeeNumber} - {emp.firstName} {emp.lastName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Leave Type Mode */}
            <div className="filter-section">
                <label className="filter-label">Leave Type</label>
                <div className="leave-type-toggles">
                    <button
                        className={`leave-type-toggle ${filters.leaveTypeMode === 'sick_only' ? 'active' : ''}`}
                        onClick={() => handleLeaveTypeModeChange('sick_only')}
                    >
                        Sick Leave Only
                    </button>
                    <button
                        className={`leave-type-toggle ${filters.leaveTypeMode === 'all_types' ? 'active' : ''}`}
                        onClick={() => handleLeaveTypeModeChange('all_types')}
                    >
                        All Absence Types
                    </button>
                </div>
            </div>

            {/* Clear Filters Button */}
            <div className="filter-section">
                <button className="clear-filters-btn" onClick={handleClearFilters}>
                    <ClearIcon />
                    Clear All Filters
                </button>
            </div>
        </div>
    );
}

// Icon Components
function ClearIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
