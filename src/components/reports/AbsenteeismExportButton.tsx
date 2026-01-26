// ============================================================
// ABSENTEEISM EXPORT BUTTON COMPONENT
// Task Group 4: Export UI Component
// ============================================================

import { useState } from 'react';
import type { AbsenteeismReportData, AbsenteeismFilters } from '../../types/reports';
import {
    exportAbsenteeismReportToExcel,
    exportAbsenteeismReportToPDF,
    downloadFile,
    generateExportFilename
} from '../../services/absenteeismExportService';

interface AbsenteeismExportButtonProps {
    data: AbsenteeismReportData[];
    filters: AbsenteeismFilters;
    companyName: string;
    companyLogo?: string;
}

export function AbsenteeismExportButton({
    data,
    filters,
    companyName,
    companyLogo
}: AbsenteeismExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const handleExportToExcel = async () => {
        setIsExporting(true);
        setExportError(null);
        setShowDropdown(false);

        try {
            const blob = exportAbsenteeismReportToExcel(data, filters, companyName);
            const filename = generateExportFilename(companyName, filters, 'xlsx');
            downloadFile(blob, filename);
        } catch (error) {
            console.error('Excel export failed:', error);
            setExportError('Failed to export to Excel. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportToPDF = async () => {
        setIsExporting(true);
        setExportError(null);
        setShowDropdown(false);

        try {
            const blob = exportAbsenteeismReportToPDF(data, filters, companyName, companyLogo);
            const filename = generateExportFilename(companyName, filters, 'pdf');
            downloadFile(blob, filename);
        } catch (error) {
            console.error('PDF export failed:', error);
            setExportError('Failed to export to PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="export-button-container">
            {/* Export Button with Dropdown */}
            <div className="export-button-wrapper">
                <button
                    className="export-button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={isExporting || data.length === 0}
                    aria-haspopup="true"
                    aria-expanded={showDropdown}
                >
                    {isExporting ? (
                        <>
                            <LoadingIcon />
                            <span>Exporting...</span>
                        </>
                    ) : (
                        <>
                            <DownloadIcon />
                            <span>Export</span>
                            <ChevronDownIcon />
                        </>
                    )}
                </button>

                {/* Dropdown Menu */}
                {showDropdown && !isExporting && (
                    <div className="export-dropdown">
                        <button
                            className="export-dropdown-item"
                            onClick={handleExportToExcel}
                        >
                            <FileSpreadsheetIcon />
                            <span>Export as Excel</span>
                        </button>
                        <button
                            className="export-dropdown-item"
                            onClick={handleExportToPDF}
                        >
                            <FilePdfIcon />
                            <span>Export as PDF</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Error Toast */}
            {exportError && (
                <div className="export-error-toast">
                    <AlertCircleIcon />
                    <span>{exportError}</span>
                    <button
                        className="export-error-close"
                        onClick={() => setExportError(null)}
                        aria-label="Close error message"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Overlay to close dropdown when clicking outside */}
            {showDropdown && (
                <div
                    className="export-dropdown-overlay"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
}

// ============================================================
// ICON COMPONENTS
// ============================================================

function DownloadIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function FileSpreadsheetIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    );
}

function FilePdfIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="10" y1="13" x2="10" y2="17" />
            <line x1="14" y1="13" x2="14" y2="17" />
        </svg>
    );
}

function LoadingIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spinning-icon">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    );
}

function AlertCircleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
