// ============================================================
// ABSENTEEISM REPORT TABLE COMPONENT
// ============================================================

import { useState } from 'react';
import type { AbsenteeismReportData } from '../../types/reports';
import { ComplianceIndicators } from './ComplianceIndicators';
import './AbsenteeismReportTable.css';

interface AbsenteeismReportTableProps {
    data: AbsenteeismReportData[];
    loading?: boolean;
}

type SortField = 'employeeNumber' | 'employeeName' | 'department' | 'totalAbsentDays' | 'sickLeaveDays' | 'occasions' | 'absenteeismRate';
type SortDirection = 'asc' | 'desc';

export function AbsenteeismReportTable({ data, loading }: AbsenteeismReportTableProps) {
    const [sortField, setSortField] = useState<SortField>('employeeName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedData = [...data].sort((a, b) => {
        let aValue: string | number = a[sortField];
        let bValue: string | number = b[sortField];

        // Handle nested cycle info
        if (sortField === 'employeeName' || sortField === 'employeeNumber' || sortField === 'department') {
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const paginatedData = sortedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const totalPages = Math.ceil(data.length / pageSize);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'hsl(270, 70%, 60%)', // Purple
            'hsl(25, 95%, 55%)',  // Orange
            'hsl(0, 75%, 60%)',   // Red
            'hsl(180, 70%, 45%)', // Cyan
            'hsl(190, 75%, 45%)', // Teal
            'hsl(90, 60%, 50%)',  // Lime
            'hsl(220, 80%, 60%)', // Blue
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const hasUnauthorizedAbsence = (unauthorizedCount: number) => {
        return unauthorizedCount > 0;
    };

    if (loading) {
        return (
            <div className="absenteeism-table-loading">
                <div className="table-skeleton">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton-row" />
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="absenteeism-table-empty">
                <div className="empty-icon">
                    <CalendarIcon />
                </div>
                <p className="empty-text">No absenteeism data found</p>
                <p className="empty-hint">Try adjusting the filters or date range</p>
            </div>
        );
    }

    return (
        <div className="absenteeism-table-container">
            <div className="table-wrapper">
                <table className="absenteeism-table">
                    <thead>
                        <tr>
                            <th
                                className={`sortable ${sortField === 'employeeNumber' ? 'sorted' : ''}`}
                                onClick={() => handleSort('employeeNumber')}
                            >
                                EMPLOYEE #
                                {sortField === 'employeeNumber' && (
                                    <SortIcon direction={sortDirection} />
                                )}
                            </th>
                            <th
                                className={`sortable ${sortField === 'employeeName' ? 'sorted' : ''}`}
                                onClick={() => handleSort('employeeName')}
                            >
                                EMPLOYEE NAME
                                {sortField === 'employeeName' && (
                                    <SortIcon direction={sortDirection} />
                                )}
                            </th>
                            <th
                                className={`sortable ${sortField === 'department' ? 'sorted' : ''}`}
                                onClick={() => handleSort('department')}
                            >
                                DEPARTMENT
                                {sortField === 'department' && (
                                    <SortIcon direction={sortDirection} />
                                )}
                            </th>
                            <th
                                className={`sortable ${sortField === 'totalAbsentDays' ? 'sorted' : ''}`}
                                onClick={() => handleSort('totalAbsentDays')}
                            >
                                TOTAL ABSENT DAYS
                                {sortField === 'totalAbsentDays' && (
                                    <SortIcon direction={sortDirection} />
                                )}
                            </th>
                            <th
                                className={`sortable ${sortField === 'sickLeaveDays' ? 'sorted' : ''}`}
                                onClick={() => handleSort('sickLeaveDays')}
                            >
                                SICK LEAVE DAYS
                                {sortField === 'sickLeaveDays' && (
                                    <SortIcon direction={sortDirection} />
                                )}
                            </th>
                            <th
                                className={`sortable ${sortField === 'occasions' ? 'sorted' : ''}`}
                                onClick={() => handleSort('occasions')}
                            >
                                OCCASIONS
                                {sortField === 'occasions' && (
                                    <SortIcon direction={sortDirection} />
                                )}
                            </th>
                            <th>CYCLE USED/REMAINING</th>
                            <th
                                className={`sortable ${sortField === 'absenteeismRate' ? 'sorted' : ''}`}
                                onClick={() => handleSort('absenteeismRate')}
                            >
                                ABSENTEEISM RATE %
                                {sortField === 'absenteeismRate' && (
                                    <SortIcon direction={sortDirection} />
                                )}
                            </th>
                            <th>ACTION FLAGS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row) => (
                            <tr
                                key={row.employeeId}
                                className={hasUnauthorizedAbsence(row.unauthorizedAbsenceCount) ? 'row-unauthorized' : ''}
                            >
                                <td className="cell-employee-number">{row.employeeNumber}</td>
                                <td>
                                    <div className="employee-cell">
                                        <div
                                            className="employee-avatar"
                                            style={{ background: getAvatarColor(row.employeeName) }}
                                        >
                                            {getInitials(row.employeeName)}
                                        </div>
                                        <span className="employee-name">{row.employeeName}</span>
                                    </div>
                                </td>
                                <td>{row.department}</td>
                                <td className="cell-number">{row.totalAbsentDays}</td>
                                <td className="cell-number">{row.sickLeaveDays}</td>
                                <td className="cell-number">{row.occasions}</td>
                                <td>
                                    <div className="cycle-info">
                                        <span className="cycle-days">
                                            {row.cycleInfo.daysUsed}/{row.cycleInfo.daysUsed + row.cycleInfo.daysRemaining} days
                                        </span>
                                        <span className="cycle-reset">
                                            resets {formatDate(row.cycleInfo.cycleEndDate)}
                                        </span>
                                    </div>
                                </td>
                                <td className="cell-number">{row.absenteeismRate.toFixed(2)}%</td>
                                <td>
                                    <ComplianceIndicators
                                        flags={row.flags}
                                        unauthorizedAbsenceCount={row.unauthorizedAbsenceCount}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="table-pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

// Icon Components
function SortIcon({ direction }: { direction: SortDirection }) {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
            {direction === 'asc' ? (
                <polyline points="18 15 12 9 6 15" />
            ) : (
                <polyline points="6 9 12 15 18 9" />
            )}
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
