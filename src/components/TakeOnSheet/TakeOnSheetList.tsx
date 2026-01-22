// ============================================================
// TAKE-ON SHEET LIST
// List component showing take-on sheets for a company
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TakeOnSheetService } from '../../services/takeOnSheetService';
import type { TakeOnSheet, TakeOnSheetStatus } from '../../types/takeOnSheet';
import './TakeOnSheetList.css';

interface TakeOnSheetListProps {
    companyId: string;
}

const STATUS_LABELS_MAP: Record<TakeOnSheetStatus, string> = {
    draft: 'Draft',
    pending_hr_review: 'Pending HR Review',
    pending_it_setup: 'Pending IT Setup',
    complete: 'Complete',
};

const STATUS_COLORS: Record<TakeOnSheetStatus, string> = {
    draft: 'draft',
    pending_hr_review: 'pending',
    pending_it_setup: 'pending',
    complete: 'complete',
};

export function TakeOnSheetList({ companyId }: TakeOnSheetListProps) {
    const navigate = useNavigate();
    const [sheets, setSheets] = useState<TakeOnSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<TakeOnSheetStatus | 'all'>('all');

    useEffect(() => {
        loadSheets();
    }, [companyId, statusFilter]);

    const loadSheets = async () => {
        try {
            setLoading(true);
            setError(null);

            let loadedSheets: TakeOnSheet[];
            if (statusFilter === 'all') {
                loadedSheets = await TakeOnSheetService.getTakeOnSheetsByCompany(companyId);
            } else {
                loadedSheets = await TakeOnSheetService.getTakeOnSheetsByStatus(companyId, statusFilter);
            }

            setSheets(loadedSheets);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load take-on sheets.');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (sheetId: string) => {
        navigate(`/take-on-sheets/${sheetId}`);
    };

    const formatDate = (date: Date | undefined): string => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getEmployeeName = (sheet: TakeOnSheet): string => {
        const { firstName, lastName } = sheet.personalDetails;
        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        }
        return 'Not specified';
    };

    if (loading) {
        return (
            <div className="tos-list tos-list--loading">
                <div className="tos-list__skeleton">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="tos-list__skeleton-row" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tos-list tos-list--error">
                <p>{error}</p>
                <button onClick={loadSheets}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="tos-list">
            <div className="tos-list__filters">
                <label className="tos-list__filter">
                    <span>Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as TakeOnSheetStatus | 'all')}
                        className="tos-list__filter-select"
                    >
                        <option value="all">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="pending_hr_review">Pending HR Review</option>
                        <option value="pending_it_setup">Pending IT Setup</option>
                        <option value="complete">Complete</option>
                    </select>
                </label>
            </div>

            {sheets.length === 0 ? (
                <div className="tos-list__empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10,9 9,9 8,9" />
                    </svg>
                    <p>No take-on sheets found</p>
                    <span>Create a new take-on sheet to start onboarding employees</span>
                </div>
            ) : (
                <table className="tos-list__table">
                    <thead>
                        <tr>
                            <th>Employee Name</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th>Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sheets.map(sheet => (
                            <tr
                                key={sheet.id}
                                onClick={() => handleRowClick(sheet.id)}
                                className="tos-list__row"
                            >
                                <td className="tos-list__name-cell">
                                    <span className="tos-list__name">{getEmployeeName(sheet)}</span>
                                    <span className="tos-list__job">
                                        {sheet.employmentInfo.jobTitleId ? 'Position assigned' : 'No position yet'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`tos-list__status tos-list__status--${STATUS_COLORS[sheet.status]}`}>
                                        {STATUS_LABELS_MAP[sheet.status]}
                                    </span>
                                </td>
                                <td>{formatDate(sheet.createdAt)}</td>
                                <td>{formatDate(sheet.updatedAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
