// ============================================================
// ABSENTEEISM REPORT PAGE - BCEA Compliance
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { AbsenteeismFilters } from '../../components/reports/AbsenteeismFilters';
import { AbsenteeismReportTable } from '../../components/reports/AbsenteeismReportTable';
import { AbsenteeismExportButton } from '../../components/reports/AbsenteeismExportButton';
import { generateAbsenteeismReport } from '../../services/absenteeismReportService';
import type { AbsenteeismFilters as AbsenteeismFiltersType, AbsenteeismReportData } from '../../types/reports';
import '../reports/Reports.css';

export function AbsenteeismReport() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();

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
    }, [filters, userProfile?.companyId]);

    const loadReport = async () => {
        const companyId = userProfile?.companyId || 'demo-company';

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

    // Use company ID as name for now (company name not in UserProfile type)
    const companyName = userProfile?.companyId || 'Company';

    return (
        <MainLayout>
            {/* Header */}
            <div className="reports-header">
                <div className="reports-header-content">
                    <h1 className="reports-title">Absenteeism Report - BCEA Compliance</h1>
                    <p className="reports-subtitle">
                        Track sick leave compliance and absenteeism patterns with BCEA rule validation
                    </p>
                </div>
                <div className="reports-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/reports/leave')}>
                        <ArrowLeftIcon />
                        Back to Leave Reports
                    </Button>
                </div>
            </div>

            {/* Report Viewer */}
            <div className="report-viewer">
                <div className="report-viewer-header">
                    <h2 className="report-viewer-title">
                        Absenteeism Report
                    </h2>
                    <div className="report-viewer-actions">
                        <Button variant="secondary" size="sm" onClick={loadReport}>
                            <RefreshIcon />
                            Refresh
                        </Button>
                        <AbsenteeismExportButton
                            data={reportData}
                            filters={filters}
                            companyName={companyName}
                        />
                    </div>
                </div>

                {/* Filters */}
                <AbsenteeismFilters
                    companyId={userProfile?.companyId || 'demo-company'}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                />

                {/* Report Content */}
                <div className="report-viewer-content">
                    {error ? (
                        <div className="report-error">
                            <div className="report-error-icon">
                                <AlertCircleIcon />
                            </div>
                            <p className="report-error-text">{error}</p>
                            <Button variant="primary" onClick={loadReport}>
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <AbsenteeismReportTable data={reportData} loading={loading} />
                    )}
                </div>
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

function RefreshIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    );
}

function AlertCircleIcon() {
    return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
