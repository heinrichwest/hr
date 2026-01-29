// ============================================================
// ABSENTEEISM REPORT EXPORT SERVICE
// Task Group 4: PDF/Excel Export Functionality
// ============================================================

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import type { AbsenteeismReportData, AbsenteeismFilters, ComplianceFlag } from '../types/reports';

/**
 * Export absenteeism report to Excel format
 * Creates multi-sheet workbook with summary, detailed data, and flags legend
 */
export function exportAbsenteeismReportToExcel(
    data: AbsenteeismReportData[],
    filters: AbsenteeismFilters,
    companyName: string
): Blob {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = createSummarySheet(data, filters, companyName);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sheet 2: Detailed Data
    const detailedData = createDetailedDataSheet(data);
    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Absenteeism Data');

    // Sheet 3: Flags Legend
    const legendData = createFlagsLegendSheet();
    const legendSheet = XLSX.utils.aoa_to_sheet(legendData);
    XLSX.utils.book_append_sheet(workbook, legendSheet, 'Flags Legend');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
}

/**
 * Export absenteeism report to PDF format
 * Includes company logo, metadata, table with all columns, and compliance disclaimer
 */
export function exportAbsenteeismReportToPDF(
    data: AbsenteeismReportData[],
    filters: AbsenteeismFilters,
    companyName: string,
    companyLogo?: string
): Blob {
    // eslint-disable-next-line new-cap
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 40;

    // Add company logo if provided
    if (companyLogo) {
        try {
            doc.addImage(companyLogo, 'PNG', 40, yPosition, 100, 40);
            yPosition += 50;
        } catch (error) {
            console.warn('Failed to add logo to PDF:', error);
        }
    }

    // Report Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Absenteeism Report with BCEA Compliance', 40, yPosition);
    yPosition += 30;

    // Report Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Company: ${companyName}`, 40, yPosition);
    yPosition += 15;
    doc.text(`Period: ${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`, 40, yPosition);
    yPosition += 15;
    doc.text(`Leave Type: ${filters.leaveTypeMode === 'sick_only' ? 'Sick Leave Only' : 'All Absence Types'}`, 40, yPosition);
    yPosition += 15;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, yPosition);
    yPosition += 25;

    // Table Headers
    const headers = [
        'Employee #',
        'Name',
        'Department',
        'Total Absent',
        'Sick Days',
        'Occasions',
        'Cycle',
        'Rate %',
        'Flags'
    ];

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const colWidths = [70, 120, 100, 70, 60, 60, 110, 50, 180];
    let xPosition = 40;

    // Draw header row
    headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
    });

    yPosition += 5;
    doc.line(40, yPosition, pageWidth - 40, yPosition); // Underline headers
    yPosition += 15;

    // Table Data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    data.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 40;
        }

        xPosition = 40;

        // Employee Number
        doc.text(row.employeeNumber, xPosition, yPosition);
        xPosition += colWidths[0];

        // Employee Name (truncate if too long)
        const name = row.employeeName.length > 18 ? row.employeeName.substring(0, 15) + '...' : row.employeeName;
        doc.text(name, xPosition, yPosition);
        xPosition += colWidths[1];

        // Department (truncate if too long)
        const dept = row.department.length > 15 ? row.department.substring(0, 12) + '...' : row.department;
        doc.text(dept, xPosition, yPosition);
        xPosition += colWidths[2];

        // Total Absent Days
        doc.text(row.totalAbsentDays.toString(), xPosition, yPosition);
        xPosition += colWidths[3];

        // Sick Leave Days
        doc.text(row.sickLeaveDays.toString(), xPosition, yPosition);
        xPosition += colWidths[4];

        // Occasions
        doc.text(row.occasions.toString(), xPosition, yPosition);
        xPosition += colWidths[5];

        // Cycle Info
        const cycleText = `${row.cycleInfo.daysUsed}/${row.cycleInfo.daysUsed + row.cycleInfo.daysRemaining}`;
        doc.text(cycleText, xPosition, yPosition);
        xPosition += colWidths[6];

        // Absenteeism Rate
        doc.text(row.absenteeismRate.toFixed(2), xPosition, yPosition);
        xPosition += colWidths[7];

        // Action Flags (use text symbols)
        const flagSymbols = row.flags.map((flag: ComplianceFlag) => {
            switch (flag.severity) {
                case 'error': return '✗';
                case 'warning': return '⚠';
                case 'info': return 'ℹ';
                default: return '';
            }
        }).join(' ');
        doc.text(flagSymbols || '-', xPosition, yPosition);

        yPosition += 15;

        // Add subtle row separator every 5 rows
        if ((rowIndex + 1) % 5 === 0) {
            doc.setDrawColor(230, 230, 230);
            doc.line(40, yPosition - 7, pageWidth - 40, yPosition - 7);
        }
    });

    // Footer with compliance disclaimer
    const footerY = pageHeight - 40;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('BCEA Compliance Report - Factual data only, not legal advice', 40, footerY);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 80, footerY);

    // Return PDF as Blob
    return doc.output('blob');
}

/**
 * Download file to browser
 */
export function downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Generate standardized filename for export
 * Format: AbsenteeismReport_CompanyName_Period_YYYYMMDD_HHMMSS.ext
 */
export function generateExportFilename(
    companyName: string,
    filters: AbsenteeismFilters,
    extension: 'xlsx' | 'pdf'
): string {
    // Sanitize company name
    const sanitizedCompany = companyName
        .replace(/[^a-zA-Z0-9\s]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .trim();

    // Format period
    const startMonth = filters.dateRange.startDate.toLocaleString('default', { month: 'short' });
    const endMonth = filters.dateRange.endDate.toLocaleString('default', { month: 'short' });
    const year = filters.dateRange.endDate.getFullYear();
    const periodLabel = startMonth === endMonth
        ? `${startMonth}${year}`
        : `${startMonth}-${endMonth}${year}`;

    // Add timestamp
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .slice(0, 15);

    return `AbsenteeismReport_${sanitizedCompany}_${periodLabel}_${timestamp}.${extension}`;
}

// ============================================================
// HELPER FUNCTIONS - Sheet Generation
// ============================================================

/**
 * Create summary sheet with report metadata and key statistics
 */
function createSummarySheet(
    data: AbsenteeismReportData[],
    filters: AbsenteeismFilters,
    companyName: string
): unknown[][] {
    const totalEmployees = data.length;
    const totalAbsentDays = data.reduce((sum, emp) => sum + emp.totalAbsentDays, 0);
    const totalSickDays = data.reduce((sum, emp) => sum + emp.sickLeaveDays, 0);
    const avgAbsenteeismRate = totalEmployees > 0
        ? (data.reduce((sum, emp) => sum + emp.absenteeismRate, 0) / totalEmployees).toFixed(2)
        : '0.00';
    const employeesWithFlags = data.filter(emp => emp.flags.length > 0).length;
    const totalUnauthorizedAbsences = data.reduce((sum, emp) => sum + emp.unauthorizedAbsenceCount, 0);

    return [
        ['Absenteeism Report - BCEA Compliance'],
        [''],
        ['Report Information'],
        ['Company', companyName],
        ['Reporting Period', `${formatDate(filters.dateRange.startDate)} to ${formatDate(filters.dateRange.endDate)}`],
        ['Leave Type Filter', filters.leaveTypeMode === 'sick_only' ? 'Sick Leave Only' : 'All Absence Types'],
        ['Employee Filter', filters.employeeId ? `Employee ID: ${filters.employeeId}` : 'All Employees'],
        ['Generated At', new Date().toLocaleString()],
        [''],
        ['Summary Statistics'],
        ['Total Employees Analyzed', totalEmployees],
        ['Total Absent Days', totalAbsentDays],
        ['Total Sick Leave Days', totalSickDays],
        ['Average Absenteeism Rate (%)', avgAbsenteeismRate],
        ['Employees with Compliance Flags', employeesWithFlags],
        ['Total Unauthorized Absences', totalUnauthorizedAbsences],
        [''],
        ['Filters Applied'],
        ['Date Range', `${formatDate(filters.dateRange.startDate)} - ${formatDate(filters.dateRange.endDate)}`],
        ['Leave Type Mode', filters.leaveTypeMode === 'sick_only' ? 'Sick Leave Only' : 'All Absence Types']
    ];
}

/**
 * Create detailed data sheet with all report columns
 */
function createDetailedDataSheet(data: AbsenteeismReportData[]): unknown[][] {
    const headers = [
        'Employee Number',
        'Employee Name',
        'Department',
        'Total Absent Days',
        'Sick Leave Days',
        'Occasions',
        'Cycle Start Date',
        'Cycle End Date',
        'Cycle Days Used',
        'Cycle Days Remaining',
        'Absenteeism Rate (%)',
        'Unauthorized Absence Count',
        'Action Flags'
    ];

    const rows = data.map(emp => [
        emp.employeeNumber,
        emp.employeeName,
        emp.department,
        emp.totalAbsentDays,
        emp.sickLeaveDays,
        emp.occasions,
        formatDate(emp.cycleInfo.cycleStartDate),
        formatDate(emp.cycleInfo.cycleEndDate),
        emp.cycleInfo.daysUsed,
        emp.cycleInfo.daysRemaining,
        emp.absenteeismRate.toFixed(2),
        emp.unauthorizedAbsenceCount,
        emp.flags.map((f: ComplianceFlag) => `${f.type}: ${f.message}`).join('; ') || 'None'
    ]);

    return [headers, ...rows];
}

/**
 * Create flags legend sheet explaining each flag type and BCEA rule
 */
function createFlagsLegendSheet(): unknown[][] {
    return [
        ['BCEA Compliance Flags Legend'],
        [''],
        ['Flag Type', 'Severity', 'Description', 'BCEA Rule Reference'],
        [''],
        ['Medical Certificate Required', 'Warning', 'Sick leave of 2+ consecutive days without medical certificate', 'BCEA Rule 1: Section 22(1)'],
        ['Medical Certificate Required', 'Warning', 'Sick leave taken day before or after public holiday without certificate', 'BCEA Rule 2: Section 22(2)'],
        ['Medical Certificate Required', 'Warning', '2+ sick leave occasions within 8-week period without certificates', 'BCEA Rule 3: Section 22(3)'],
        ['BCEA Violation Risk', 'Error', 'Sick leave adjacent to public holiday without required medical certificate', 'BCEA Section 22(2) - High compliance risk'],
        ['Attendance Counseling Recommended', 'Info', 'Total absent days exceeds 5 in reporting period', 'BCEA Rule 4: Recommended HR intervention threshold'],
        ['Unauthorized Absence', 'Error', 'Sick leave taken without required medical certificate (count)', 'BCEA Section 22 - Potential disciplinary matter'],
        [''],
        ['BCEA Sick Leave Rules Summary'],
        [''],
        ['Rule', 'Description'],
        ['36-Day Cycle', 'Employees entitled to 36 days sick leave over 36-month rolling cycle from hire date'],
        ['Medical Certificate (2+ Days)', 'Medical certificate required for sick leave of 2 or more consecutive days'],
        ['Medical Certificate (Holiday)', 'Medical certificate required if sick leave taken day before/after public holiday'],
        ['Medical Certificate (Occasions)', 'Medical certificate required if employee has 2+ sick leave occasions in 8-week period'],
        ['Cycle Reset', 'Sick leave cycle resets every 36 months, unused days may carry forward (employer discretion)'],
        [''],
        ['Important Notes'],
        ['1. This report provides factual data only and is not legal advice'],
        ['2. Consult with legal counsel or labor relations expert for disciplinary proceedings'],
        ['3. BCEA compliance flags are indicators, not conclusive evidence of violations'],
        ['4. Employer must verify medical certificates are genuine and valid'],
        ['5. Unauthorized absences require proper investigation before disciplinary action']
    ];
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}
