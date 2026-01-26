// ============================================================
// REPORT HISTORY TABLE COMPONENT
// Task Group 7.5: Display and download previous reports
// ============================================================

import { useState, useEffect } from 'react';
import { Button } from '../Button/Button';
import type { ReportHistoryEntry, ReportType } from '../../types/adminReports';
import { REPORT_TYPE_LABELS } from '../../types/adminReports';
import './ReportHistoryTable.css';

interface ReportHistoryTableProps {
    companyId?: string;
    onDownload: (entry: ReportHistoryEntry) => void;
    history: ReportHistoryEntry[];
    loading?: boolean;
}

export function ReportHistoryTable({
    companyId,
    onDownload,
    history,
    loading = false
}: ReportHistoryTableProps) {
    const [filteredHistory, setFilteredHistory] = useState<ReportHistoryEntry[]>(history);
    const [filterReportType, setFilterReportType] = useState<ReportType | 'all'>('all');
    const [sortField, setSortField] = useState<'generatedAt' | 'reportType' | 'companyName'>('generatedAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Apply filters and sorting
    useEffect(() => {
        let filtered = [...history];

        // Filter by company if specified
        if (companyId) {
            filtered = filtered.filter(entry => entry.companyId === companyId);
        }

        // Filter by report type
        if (filterReportType !== 'all') {
            filtered = filtered.filter(entry => entry.reportType === filterReportType);
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'generatedAt':
                    comparison = new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
                    break;
                case 'reportType':
                    comparison = a.reportType.localeCompare(b.reportType);
                    break;
                case 'companyName':
                    comparison = a.companyName.localeCompare(b.companyName);
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        setFilteredHistory(filtered);
        setCurrentPage(1); // Reset to first page when filtering changes
    }, [history, companyId, filterReportType, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const paginatedHistory = filteredHistory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPeriod = (start: Date, end: Date): string => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (startDate.toDateString() === endDate.toDateString()) {
            return startDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
        }

        return `${startDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}`;
    };

    if (loading) {
        return (
            <div className="report-history-loading">
                <div className="skeleton-row"></div>
                <div className="skeleton-row"></div>
                <div className="skeleton-row"></div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="report-history-empty">
                <p>No reports have been generated yet.</p>
                <p className="empty-subtitle">Generate your first report to see it appear here.</p>
            </div>
        );
    }

    return (
        <div className="report-history-container">
            <div className="report-history-header">
                <h3>Report History</h3>

                <div className="history-filters">
                    <label>
                        Filter by Type:
                        <select
                            value={filterReportType}
                            onChange={(e) => setFilterReportType(e.target.value as ReportType | 'all')}
                            className="filter-select"
                        >
                            <option value="all">All Reports</option>
                            <option value="ui-19">{REPORT_TYPE_LABELS['ui-19']}</option>
                            <option value="basic-employee-info">{REPORT_TYPE_LABELS['basic-employee-info']}</option>
                            <option value="workforce-profile">{REPORT_TYPE_LABELS['workforce-profile']}</option>
                            <option value="leave-movement">{REPORT_TYPE_LABELS['leave-movement']}</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="report-history-table-wrapper">
                <table className="report-history-table">
                    <thead>
                        <tr>
                            <th
                                onClick={() => handleSort('reportType')}
                                className="sortable"
                            >
                                Report Type
                                {sortField === 'reportType' && (
                                    <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                                )}
                            </th>
                            {!companyId && (
                                <th
                                    onClick={() => handleSort('companyName')}
                                    className="sortable"
                                >
                                    Company
                                    {sortField === 'companyName' && (
                                        <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                                    )}
                                </th>
                            )}
                            <th>Period</th>
                            <th
                                onClick={() => handleSort('generatedAt')}
                                className="sortable"
                            >
                                Generated
                                {sortField === 'generatedAt' && (
                                    <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                                )}
                            </th>
                            <th>Generated By</th>
                            <th className="actions-column">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedHistory.map((entry) => (
                            <tr key={entry.id}>
                                <td>{REPORT_TYPE_LABELS[entry.reportType]}</td>
                                {!companyId && <td>{entry.companyName}</td>}
                                <td>{formatPeriod(entry.periodStart, entry.periodEnd)}</td>
                                <td>{formatDate(entry.generatedAt)}</td>
                                <td>{entry.generatedByName}</td>
                                <td className="actions-column">
                                    <Button
                                        variant="secondary"
                                        size="small"
                                        onClick={() => onDownload(entry)}
                                    >
                                        Download
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="history-pagination">
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages} ({filteredHistory.length} reports)
                    </span>
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
