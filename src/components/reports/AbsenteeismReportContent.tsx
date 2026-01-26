// ============================================================
// ABSENTEEISM REPORT CONTENT COMPONENT
// ============================================================

import { useState, useEffect } from 'react';
import { AbsenteeismFilters } from './AbsenteeismFilters';
import { AbsenteeismReportTable } from './AbsenteeismReportTable';
import { AbsenteeismExportButton } from './AbsenteeismExportButton';
import { generateAbsenteeismReport } from '../../services/absenteeismReportService';
import type { AbsenteeismFilters as AbsenteeismFiltersType, AbsenteeismReportData } from '../../types/reports';

interface AbsenteeismReportContentProps {
    companyId: string;
}

export function AbsenteeismReportContent({ companyId }: AbsenteeismReportContentProps) {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<AbsenteeismReportData[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Initialize filters with default values (current month, sick leave only)
    const now = new Date();
    const [filters, setFilters] = useState<AbsenteeismFiltersType>({
        employeeId: undefined,
        dateRange: {
            startDate: new Date(now.getFullYear(), now.getMonth(), 1),
            endDate: now
        },
        leaveTypeMode: 'sick_only'
    });

    useEffect(() => {
        loadReport();
    }, [filters, companyId]);

    const loadReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await generateAbsenteeismReport(companyId, filters);
            setReportData(data);
        } catch (err) {
            console.error('Error loading absenteeism report:', err);
            setError('Failed to load report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFiltersChange = (newFilters: AbsenteeismFiltersType) => {
        setFilters(newFilters);
    };

    if (error) {
        return (
            <div className="report-error">
                <div className="report-error-icon">
                    <AlertCircleIcon />
                </div>
                <p className="report-error-text">{error}</p>
                <button
                    className="report-error-button"
                    onClick={loadReport}
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <>
            <AbsenteeismFilters
                companyId={companyId}
                filters={filters}
                onFiltersChange={handleFiltersChange}
            />

            {/* Export Actions */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '1rem 0',
                gap: '0.5rem'
            }}>
                <AbsenteeismExportButton
                    data={reportData}
                    filters={filters}
                    companyName={companyId}
                />
            </div>

            <div className="report-viewer-content">
                <AbsenteeismReportTable data={reportData} loading={loading} />
            </div>
        </>
    );
}

// Icon Component
function AlertCircleIcon() {
    return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
