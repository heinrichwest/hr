// ============================================================
// REPORT EXPORT SERVICE
// Task Group 7: Excel and CSV export functionality
// ============================================================

import * as XLSX from 'xlsx';
import type { UI19Report } from '../types/ui19';
import type { BasicEmployeeInfoReport, WorkforceProfileReport, LeaveMovementReport, AdminReport, ReportType } from '../types/adminReports';
import { TERMINATION_REASON_LABELS, NON_CONTRIBUTOR_REASON_LABELS } from '../types/ui19';

interface ExportMetadata {
    companyName: string;
    periodDescription: string;
}

export const ReportExportService = {
    /**
     * Generate standardized filename for report exports
     * Format: ReportType_CompanyName_Period_GeneratedDate.ext
     */
    generateFilename(reportType: ReportType, companyName: string, period: string, extension: string): string {
        // Sanitize company name for filename
        const sanitizedCompany = companyName
            .replace(/[^a-zA-Z0-9\s]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_')
            .trim();

        // Sanitize period
        const sanitizedPeriod = period
            .replace(/[^a-zA-Z0-9\s]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_')
            .trim();

        // Format report type for filename
        const reportTypeMap: Record<ReportType, string> = {
            'ui-19': 'UI19',
            'basic-employee-info': 'BasicEmployeeInfo',
            'workforce-profile': 'WorkforceProfile',
            'leave-movement': 'LeaveMovement'
        };
        const reportTypeStr = reportTypeMap[reportType] || reportType;

        // Add timestamp
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .slice(0, 15);

        return `${reportTypeStr}_${sanitizedCompany}_${sanitizedPeriod}_${timestamp}.${extension}`;
    },

    /**
     * Export report to Excel format with proper formatting
     */
    exportToExcel(report: AdminReport, reportType: ReportType, metadata: ExportMetadata): Blob {
        const workbook = XLSX.utils.book_new();

        // Add metadata sheet - extract generatedAt from report structure
        const generatedAt = 'generatedAt' in report ? report.generatedAt :
                          ('metadata' in report ? report.metadata.generatedAt : new Date());
        const generatedByName = 'generatedByName' in report ? report.generatedByName :
                              ('metadata' in report ? report.metadata.generatedByName : 'Unknown');

        const metadataSheet = this.createMetadataSheet(generatedAt, generatedByName, reportType, metadata);
        XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Report Info');

        // Add report-specific sheets
        switch (reportType) {
            case 'ui-19':
                this.addUI19Sheets(workbook, report as UI19Report);
                break;
            case 'basic-employee-info':
                this.addBasicEmployeeInfoSheets(workbook, report as BasicEmployeeInfoReport);
                break;
            case 'workforce-profile':
                this.addWorkforceProfileSheets(workbook, report as WorkforceProfileReport);
                break;
            case 'leave-movement':
                this.addLeaveMovementSheets(workbook, report as LeaveMovementReport);
                break;
        }

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    },

    /**
     * Export report to CSV format with UTF-8 encoding
     */
    exportToCSV(report: AdminReport, reportType: ReportType, metadata: ExportMetadata): Blob {
        let csvContent = '';

        // Add metadata header
        const generatedAt = 'generatedAt' in report ? report.generatedAt :
                          ('metadata' in report ? report.metadata.generatedAt : new Date());
        const generatedByName = 'generatedByName' in report ? report.generatedByName :
                              ('metadata' in report ? report.metadata.generatedByName : 'Unknown');

        csvContent += this.createCSVMetadataHeader(generatedAt, generatedByName, reportType, metadata);
        csvContent += '\n\n';

        // Add report-specific data
        switch (reportType) {
            case 'ui-19':
                csvContent += this.generateUI19CSV(report as UI19Report);
                break;
            case 'basic-employee-info':
                csvContent += this.generateBasicEmployeeInfoCSV(report as BasicEmployeeInfoReport);
                break;
            case 'workforce-profile':
                csvContent += this.generateWorkforceProfileCSV(report as WorkforceProfileReport);
                break;
            case 'leave-movement':
                csvContent += this.generateLeaveMovementCSV(report as LeaveMovementReport);
                break;
        }

        // Create Blob with UTF-8 encoding
        return new Blob(['\ufeff' + csvContent], {
            type: 'text/csv;charset=utf-8;'
        });
    },

    /**
     * Download file to browser
     */
    downloadFile(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    // ============================================================
    // METADATA HELPERS
    // ============================================================

    createMetadataSheet(generatedAt: Date, generatedByName: string, reportType: ReportType, metadata: ExportMetadata): XLSX.WorkSheet {
        const data = [
            ['Report Information'],
            [''],
            ['Company', metadata.companyName],
            ['Period', metadata.periodDescription],
            ['Generated At', generatedAt.toLocaleString()],
            ['Generated By', generatedByName],
            ['Report Type', reportType]
        ];

        return XLSX.utils.aoa_to_sheet(data);
    },

    createCSVMetadataHeader(generatedAt: Date, generatedByName: string, reportType: ReportType, metadata: ExportMetadata): string {
        const lines = [
            'Report Information',
            '',
            `Company,${this.escapeCSV(metadata.companyName)}`,
            `Period,${this.escapeCSV(metadata.periodDescription)}`,
            `Generated At,${generatedAt.toLocaleString()}`,
            `Generated By,${this.escapeCSV(generatedByName)}`,
            `Report Type,${reportType}`
        ];
        return lines.join('\n');
    },

    // ============================================================
    // UI-19 EXPORT (MATCHES OFFICIAL FORM STRUCTURE)
    // ============================================================

    addUI19Sheets(workbook: XLSX.WorkBook, report: UI19Report): void {
        const data: any[][] = [];

        // Title
        data.push(['UIF EMPLOYER\'S DECLARATION - UI-19']);
        data.push(['']);

        // Section 1: Employer Details
        data.push(['SECTION 1: EMPLOYER DETAILS']);
        data.push(['UIF Employer Reference No.', report.employerDetails.uifEmployerReference]);
        data.push(['PAYE Reference No.', report.employerDetails.payeReference || '']);
        data.push(['Trading Name', report.employerDetails.tradingName]);

        const physAddr = report.employerDetails.physicalAddress;
        data.push(['Physical Address', `${physAddr.line1}${physAddr.line2 ? ', ' + physAddr.line2 : ''}, ${physAddr.city}, ${physAddr.province}, ${physAddr.postalCode}`]);

        if (report.employerDetails.postalAddress) {
            const postAddr = report.employerDetails.postalAddress;
            data.push(['Postal Address', `${postAddr.line1}${postAddr.line2 ? ', ' + postAddr.line2 : ''}, ${postAddr.city}, ${postAddr.province}, ${postAddr.postalCode}`]);
        }

        data.push(['Company Registration No.', report.employerDetails.companyRegistrationNumber]);
        data.push(['Email', report.employerDetails.email || '']);
        data.push(['Phone', report.employerDetails.phone || '']);
        data.push(['Authorised Person', report.employerDetails.authorisedPersonName || '']);
        data.push(['']);

        // Section 2: Employee Details
        data.push(['SECTION 2: EMPLOYEE DETAILS']);
        data.push(['Month', new Date(report.reportingPeriod.year, report.reportingPeriod.month - 1, 1).toLocaleString('default', { month: 'long' })]);
        data.push(['Year', report.reportingPeriod.year.toString()]);
        data.push(['']);

        // Column headers (A-J)
        data.push([
            'A: Surname',
            'B: Initials',
            'C: ID Number',
            'D: Gross Remuneration (R)',
            'E: Hours Worked',
            'F: Commencement Date',
            'G: Termination Date',
            'H: Termination Reason',
            'I: Contributor',
            'J: Non-Contributor Reason'
        ]);

        // Employee rows
        report.employees.forEach(emp => {
            data.push([
                emp.surname,
                emp.initials,
                emp.idNumber,
                emp.grossRemuneration,
                emp.hoursWorked,
                this.formatDateDDMMYY(emp.commencementDate),
                emp.terminationDate ? this.formatDateDDMMYY(emp.terminationDate) : '',
                emp.terminationReasonCode ? `${emp.terminationReasonCode} - ${TERMINATION_REASON_LABELS[emp.terminationReasonCode]}` : '',
                emp.isContributor ? 'YES' : 'NO',
                emp.nonContributorReasonCode ? `${emp.nonContributorReasonCode} - ${NON_CONTRIBUTOR_REASON_LABELS[emp.nonContributorReasonCode]}` : ''
            ]);
        });

        data.push(['']);
        data.push(['']);

        // Declaration
        data.push(['DECLARATION']);
        data.push([report.declaration.statement]);
        data.push(['']);
        data.push(['Authorised Person Name', report.declaration.authorisedPersonName]);
        data.push(['Signature Date', report.declaration.signatureDate ? this.formatDateDDMMYY(report.declaration.signatureDate) : '']);

        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // Apply formatting
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        // Format currency column (D)
        for (let row = range.s.r + 16; row <= range.e.r; row++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: 3 });
            if (worksheet[cellAddress] && typeof worksheet[cellAddress].v === 'number') {
                worksheet[cellAddress].z = '"R"#,##0.00';
            }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, 'UI-19 Declaration');
    },

    generateUI19CSV(report: UI19Report): string {
        const lines: string[] = [];

        // Section 1: Employer Details
        lines.push('UIF EMPLOYER\'S DECLARATION - UI-19');
        lines.push('');
        lines.push('SECTION 1: EMPLOYER DETAILS');
        lines.push(`UIF Employer Reference No.,${this.escapeCSV(report.employerDetails.uifEmployerReference)}`);
        lines.push(`PAYE Reference No.,${this.escapeCSV(report.employerDetails.payeReference || '')}`);
        lines.push(`Trading Name,${this.escapeCSV(report.employerDetails.tradingName)}`);

        const physAddr = report.employerDetails.physicalAddress;
        lines.push(`Physical Address,${this.escapeCSV(`${physAddr.line1}${physAddr.line2 ? ', ' + physAddr.line2 : ''}, ${physAddr.city}, ${physAddr.province}, ${physAddr.postalCode}`)}`);

        lines.push(`Company Registration No.,${this.escapeCSV(report.employerDetails.companyRegistrationNumber)}`);
        lines.push(`Email,${this.escapeCSV(report.employerDetails.email || '')}`);
        lines.push(`Phone,${this.escapeCSV(report.employerDetails.phone || '')}`);
        lines.push('');

        // Section 2: Employee Details
        lines.push('SECTION 2: EMPLOYEE DETAILS');
        lines.push(`Month,${new Date(report.reportingPeriod.year, report.reportingPeriod.month - 1, 1).toLocaleString('default', { month: 'long' })}`);
        lines.push(`Year,${report.reportingPeriod.year}`);
        lines.push('');

        // Headers
        lines.push('A: Surname,B: Initials,C: ID Number,D: Gross Remuneration (R),E: Hours Worked,F: Commencement Date,G: Termination Date,H: Termination Reason,I: Contributor,J: Non-Contributor Reason');

        // Employee rows
        report.employees.forEach(emp => {
            const row = [
                this.escapeCSV(emp.surname),
                this.escapeCSV(emp.initials),
                this.escapeCSV(emp.idNumber),
                emp.grossRemuneration.toFixed(2),
                emp.hoursWorked.toString(),
                this.formatDateDDMMYY(emp.commencementDate),
                emp.terminationDate ? this.formatDateDDMMYY(emp.terminationDate) : '',
                emp.terminationReasonCode ? this.escapeCSV(`${emp.terminationReasonCode} - ${TERMINATION_REASON_LABELS[emp.terminationReasonCode]}`) : '',
                emp.isContributor ? 'YES' : 'NO',
                emp.nonContributorReasonCode ? this.escapeCSV(`${emp.nonContributorReasonCode} - ${NON_CONTRIBUTOR_REASON_LABELS[emp.nonContributorReasonCode]}`) : ''
            ];
            lines.push(row.join(','));
        });

        return lines.join('\n');
    },

    // ============================================================
    // BASIC EMPLOYEE INFO EXPORT
    // ============================================================

    addBasicEmployeeInfoSheets(workbook: XLSX.WorkBook, report: BasicEmployeeInfoReport): void {
        const headers = [
            'Employee Number',
            'Full Name',
            'ID Number',
            'Email',
            'Phone',
            'Date of Birth',
            'Department',
            'Job Title',
            'Manager',
            'Status',
            'Contract Type',
            'Start Date'
        ];

        const data = report.employees.map(emp => [
            emp.employeeNumber,
            emp.fullName,
            emp.idNumber,
            emp.email || '',
            emp.phone || '',
            emp.dateOfBirth ? this.formatDateDDMMYY(emp.dateOfBirth) : '',
            emp.department,
            emp.jobTitle,
            emp.managerName || '',
            emp.employmentStatus,
            emp.contractType,
            this.formatDateDDMMYY(emp.startDate)
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee List');
    },

    generateBasicEmployeeInfoCSV(report: BasicEmployeeInfoReport): string {
        const lines: string[] = [];

        // Headers
        lines.push('Employee Number,Full Name,ID Number,Email,Phone,Date of Birth,Department,Job Title,Manager,Status,Contract Type,Start Date');

        // Data rows
        report.employees.forEach(emp => {
            const row = [
                this.escapeCSV(emp.employeeNumber),
                this.escapeCSV(emp.fullName),
                this.escapeCSV(emp.idNumber),
                this.escapeCSV(emp.email || ''),
                this.escapeCSV(emp.phone || ''),
                emp.dateOfBirth ? this.formatDateDDMMYY(emp.dateOfBirth) : '',
                this.escapeCSV(emp.department),
                this.escapeCSV(emp.jobTitle),
                this.escapeCSV(emp.managerName || ''),
                emp.employmentStatus,
                emp.contractType,
                this.formatDateDDMMYY(emp.startDate)
            ];
            lines.push(row.join(','));
        });

        return lines.join('\n');
    },

    // ============================================================
    // WORKFORCE PROFILE EXPORT
    // ============================================================

    addWorkforceProfileSheets(workbook: XLSX.WorkBook, report: WorkforceProfileReport): void {
        // Summary sheet
        const summaryData = [
            ['Workforce Profile Summary'],
            [''],
            ['Total Employees', report.headcountSummary.total],
            [''],
            ['By Department'],
            ['Department', 'Count', 'Percentage'],
            ...report.headcountSummary.byDepartment.map(d => [d.departmentName, d.count, d.percentage.toFixed(1) + '%']),
            [''],
            ['By Job Grade'],
            ['Grade', 'Count', 'Percentage'],
            ...report.headcountSummary.byJobGrade.map(g => [g.gradeName, g.count, g.percentage.toFixed(1) + '%'])
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Demographics sheet
        if (report.demographics) {
            const demoData = [
                ['Demographics Breakdown'],
                [''],
                ['By Gender'],
                ['Gender', 'Count', 'Percentage'],
                ...report.demographics.genderDistribution.map(g => [g.gender, g.count, g.percentage.toFixed(1) + '%']),
                [''],
                ['By Age Group'],
                ['Age Group', 'Count', 'Percentage'],
                ...report.demographics.ageGroups.map(a => [a.label, a.count, a.percentage.toFixed(1) + '%'])
            ];
            const demoSheet = XLSX.utils.aoa_to_sheet(demoData);
            XLSX.utils.book_append_sheet(workbook, demoSheet, 'Demographics');
        }
    },

    generateWorkforceProfileCSV(report: WorkforceProfileReport): string {
        const lines: string[] = [];

        lines.push('Workforce Profile Summary');
        lines.push('');
        lines.push(`Total Employees,${report.headcountSummary.total}`);
        lines.push('');

        lines.push('By Department');
        lines.push('Department,Count,Percentage');
        report.headcountSummary.byDepartment.forEach(d => {
            lines.push(`${this.escapeCSV(d.departmentName)},${d.count},${d.percentage.toFixed(1)}%`);
        });

        return lines.join('\n');
    },

    // ============================================================
    // LEAVE MOVEMENT EXPORT
    // ============================================================

    addLeaveMovementSheets(workbook: XLSX.WorkBook, report: LeaveMovementReport): void {
        const headers = [
            'Employee Number',
            'Employee Name',
            'Department',
            'Leave Type',
            'Entitlement',
            'Taken',
            'Pending',
            'Balance'
        ];

        const data: any[][] = [];
        report.employeeBalances.forEach(emp => {
            emp.leaveBalances.forEach(lb => {
                data.push([
                    emp.employeeNumber,
                    emp.employeeName,
                    emp.department,
                    lb.leaveTypeName,
                    lb.entitlement,
                    lb.taken,
                    lb.pending,
                    lb.balance
                ]);
            });
        });

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Movement');
    },

    generateLeaveMovementCSV(report: LeaveMovementReport): string {
        const lines: string[] = [];

        lines.push('Employee Number,Employee Name,Department,Leave Type,Entitlement,Taken,Pending,Balance');

        report.employeeBalances.forEach(emp => {
            emp.leaveBalances.forEach(lb => {
                const row = [
                    this.escapeCSV(emp.employeeNumber),
                    this.escapeCSV(emp.employeeName),
                    this.escapeCSV(emp.department),
                    this.escapeCSV(lb.leaveTypeName),
                    lb.entitlement.toString(),
                    lb.taken.toString(),
                    lb.pending.toString(),
                    lb.balance.toString()
                ];
                lines.push(row.join(','));
            });
        });

        return lines.join('\n');
    },

    // ============================================================
    // UTILITIES
    // ============================================================

    /**
     * Format date as DD/MM/YY
     */
    formatDateDDMMYY(date: Date): string {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    },

    /**
     * Escape CSV field value
     */
    escapeCSV(value: string): string {
        if (!value) return '';

        // If value contains comma, newline, or quote, wrap in quotes and escape quotes
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
        }

        return value;
    }
};
