// ============================================================
// FINANCIAL SYSTEM EXPORT SERVICE
// Task Group 7.7: System-specific CSV export mappings
// ============================================================

import type { AdminReport } from '../types/adminReports';
import type { UI19Report } from '../types/ui19';

export type FinancialSystem =
    | 'sage'
    | 'psiber'
    | 'sars'
    | 'xero'
    | 'kerridge'
    | 'automate'
    | 'quickbooks';

export const FINANCIAL_SYSTEM_LABELS: Record<FinancialSystem, string> = {
    sage: 'Sage Pastel Payroll',
    psiber: 'Psiber Payroll',
    sars: 'SARS eFiling',
    xero: 'Xero Payroll',
    kerridge: 'Kerridge KCS',
    automate: 'Automate',
    quickbooks: 'QuickBooks Payroll'
};

export const FinancialExportService = {
    /**
     * Export report data in system-specific CSV format
     */
    exportForFinancialSystem(report: AdminReport, system: FinancialSystem): Blob {
        let csvContent = '';

        switch (system) {
            case 'sage':
                csvContent = this.exportToSage(report);
                break;
            case 'psiber':
                csvContent = this.exportToPsiber(report);
                break;
            case 'sars':
                csvContent = this.exportToSARS(report);
                break;
            case 'xero':
                csvContent = this.exportToXero(report);
                break;
            case 'kerridge':
                csvContent = this.exportToKerridge(report);
                break;
            case 'automate':
                csvContent = this.exportToAutomate(report);
                break;
            case 'quickbooks':
                csvContent = this.exportToQuickBooks(report);
                break;
            default:
                throw new Error(`Unsupported financial system: ${system}`);
        }

        // Create Blob with UTF-8 encoding
        return new Blob(['\ufeff' + csvContent], {
            type: 'text/csv;charset=utf-8;'
        });
    },

    /**
     * Generate filename for financial system export
     */
    generateFinancialFilename(system: FinancialSystem, companyName: string, period: string): string {
        const sanitizedCompany = companyName
            .replace(/[^a-zA-Z0-9\s]/g, '_')
            .replace(/\s+/g, '_')
            .trim();

        const sanitizedPeriod = period
            .replace(/[^a-zA-Z0-9\s]/g, '_')
            .replace(/\s+/g, '_')
            .trim();

        const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);

        return `${system.toUpperCase()}_${sanitizedCompany}_${sanitizedPeriod}_${timestamp}.csv`;
    },

    // ============================================================
    // SAGE PASTEL EXPORT FORMAT
    // ============================================================

    exportToSage(report: AdminReport): string {
        if (report.reportType !== 'ui-19') {
            throw new Error('Sage export only supports UI-19 reports');
        }

        const ui19 = report as UI19Report;
        const lines: string[] = [];

        // Sage format: Employee Code, Surname, Initials, ID Number, Start Date, End Date, Termination Code, UIF Status, Gross Pay
        lines.push('EmployeeCode,Surname,Initials,IDNumber,StartDate,EndDate,TerminationCode,UIFStatus,GrossPay');

        ui19.employees.forEach((emp, index) => {
            const row = [
                this.pad((index + 1).toString(), 5),
                this.escapeCSV(emp.surname),
                this.escapeCSV(emp.initials),
                emp.idNumber,
                this.formatDateYYYYMMDD(emp.commencementDate),
                emp.terminationDate ? this.formatDateYYYYMMDD(emp.terminationDate) : '',
                emp.terminationReasonCode?.toString() || '',
                emp.isContributor ? 'Y' : 'N',
                emp.grossRemuneration.toFixed(2)
            ];
            lines.push(row.join(','));
        });

        return lines.join('\n');
    },

    // ============================================================
    // PSIBER EXPORT FORMAT
    // ============================================================

    exportToPsiber(report: AdminReport): string {
        if (report.reportType !== 'ui-19') {
            throw new Error('Psiber export only supports UI-19 reports');
        }

        const ui19 = report as UI19Report;
        const lines: string[] = [];

        // Psiber format: ID Number|Surname|Initials|Basic Pay|Hours|Start Date|End Date|Term Code|UIF
        lines.push('IDNumber|Surname|Initials|BasicPay|Hours|StartDate|EndDate|TermCode|UIF');

        ui19.employees.forEach(emp => {
            const row = [
                emp.idNumber,
                emp.surname,
                emp.initials,
                emp.grossRemuneration.toFixed(2),
                emp.hoursWorked.toString(),
                this.formatDateDDMMYYYY(emp.commencementDate),
                emp.terminationDate ? this.formatDateDDMMYYYY(emp.terminationDate) : '',
                emp.terminationReasonCode?.toString() || '',
                emp.isContributor ? '1' : '0'
            ];
            lines.push(row.join('|'));
        });

        return lines.join('\n');
    },

    // ============================================================
    // SARS eFILING EXPORT FORMAT
    // ============================================================

    exportToSARS(report: AdminReport): string {
        if (report.reportType !== 'ui-19') {
            throw new Error('SARS export only supports UI-19 reports');
        }

        const ui19 = report as UI19Report;
        const lines: string[] = [];

        // SARS format for UIF declaration
        lines.push('H|' + ui19.employerDetails.uifEmployerReference + '|' + ui19.reportingPeriod.year + '|' + this.pad(ui19.reportingPeriod.month.toString(), 2));

        ui19.employees.forEach(emp => {
            // D line: Detail record
            const row = [
                'D',
                emp.idNumber,
                emp.surname.toUpperCase(),
                emp.initials.toUpperCase(),
                emp.isContributor ? 'Y' : 'N',
                emp.nonContributorReasonCode?.toString() || '',
                emp.grossRemuneration.toFixed(2),
                this.formatDateYYYYMMDD(emp.commencementDate),
                emp.terminationDate ? this.formatDateYYYYMMDD(emp.terminationDate) : '',
                emp.terminationReasonCode?.toString() || ''
            ];
            lines.push(row.join('|'));
        });

        // T line: Trailer record
        lines.push('T|' + ui19.employees.length);

        return lines.join('\n');
    },

    // ============================================================
    // XERO EXPORT FORMAT
    // ============================================================

    exportToXero(report: AdminReport): string {
        if (report.reportType !== 'ui-19') {
            throw new Error('Xero export only supports UI-19 reports');
        }

        const ui19 = report as UI19Report;
        const lines: string[] = [];

        // Xero format: Employee ID, First Name, Last Name, Email, Tax Number, Start Date, End Date, Gross Earnings
        lines.push('EmployeeID,FirstName,LastName,Email,TaxNumber,StartDate,EndDate,GrossEarnings');

        ui19.employees.forEach(emp => {
            // Split initials to approximate first name
            const firstInitial = emp.initials.split('.')[0] || emp.initials.charAt(0);

            const row = [
                emp.employeeId,
                firstInitial,
                this.escapeCSV(emp.surname),
                '', // Email not in UI-19
                emp.idNumber,
                this.formatDateDDMMYYYY(emp.commencementDate),
                emp.terminationDate ? this.formatDateDDMMYYYY(emp.terminationDate) : '',
                emp.grossRemuneration.toFixed(2)
            ];
            lines.push(row.join(','));
        });

        return lines.join('\n');
    },

    // ============================================================
    // KERRIDGE KCS EXPORT FORMAT
    // ============================================================

    exportToKerridge(report: AdminReport): string {
        if (report.reportType !== 'ui-19') {
            throw new Error('Kerridge export only supports UI-19 reports');
        }

        const ui19 = report as UI19Report;
        const lines: string[] = [];

        // Kerridge format: Fixed-width fields
        // Positions: 1-5 Emp Code, 6-25 Surname, 26-30 Initials, 31-43 ID, 44-51 Start, 52-59 End, 60-61 Term, 62 UIF, 63-74 Gross
        ui19.employees.forEach((emp, index) => {
            const empCode = this.pad((index + 1).toString(), 5);
            const surname = this.pad(emp.surname, 20);
            const initials = this.pad(emp.initials, 5);
            const idNumber = this.pad(emp.idNumber, 13);
            const startDate = this.formatDateYYYYMMDD(emp.commencementDate);
            const endDate = emp.terminationDate ? this.formatDateYYYYMMDD(emp.terminationDate) : this.pad('', 8);
            const termCode = this.pad(emp.terminationReasonCode?.toString() || '', 2);
            const uifStatus = emp.isContributor ? 'Y' : 'N';
            const gross = this.pad(emp.grossRemuneration.toFixed(2), 12, true);

            const line = empCode + surname + initials + idNumber + startDate + endDate + termCode + uifStatus + gross;
            lines.push(line);
        });

        return lines.join('\n');
    },

    // ============================================================
    // AUTOMATE EXPORT FORMAT
    // ============================================================

    exportToAutomate(report: AdminReport): string {
        if (report.reportType !== 'ui-19') {
            throw new Error('Automate export only supports UI-19 reports');
        }

        const ui19 = report as UI19Report;
        const lines: string[] = [];

        // Automate format: Tab-delimited
        lines.push('Emp No\tSurname\tInitials\tID Number\tStart Date\tEnd Date\tTerm Code\tUIF\tGross Pay\tHours');

        ui19.employees.forEach((emp, index) => {
            const row = [
                (index + 1).toString(),
                emp.surname,
                emp.initials,
                emp.idNumber,
                this.formatDateDDMMYYYY(emp.commencementDate),
                emp.terminationDate ? this.formatDateDDMMYYYY(emp.terminationDate) : '',
                emp.terminationReasonCode?.toString() || '',
                emp.isContributor ? 'Yes' : 'No',
                emp.grossRemuneration.toFixed(2),
                emp.hoursWorked.toString()
            ];
            lines.push(row.join('\t'));
        });

        return lines.join('\n');
    },

    // ============================================================
    // QUICKBOOKS EXPORT FORMAT
    // ============================================================

    exportToQuickBooks(report: AdminReport): string {
        if (report.reportType !== 'ui-19') {
            throw new Error('QuickBooks export only supports UI-19 reports');
        }

        const ui19 = report as UI19Report;
        const lines: string[] = [];

        // QuickBooks format: Standard CSV with specific column order
        lines.push('Employee ID,Last Name,First Name,Tax ID,Hire Date,Release Date,Gross Pay,Hours Worked,UIF Contributor');

        ui19.employees.forEach(emp => {
            const firstInitial = emp.initials.split('.')[0] || emp.initials.charAt(0);

            const row = [
                emp.employeeId,
                this.escapeCSV(emp.surname),
                firstInitial,
                emp.idNumber,
                this.formatDateMMDDYYYY(emp.commencementDate),
                emp.terminationDate ? this.formatDateMMDDYYYY(emp.terminationDate) : '',
                emp.grossRemuneration.toFixed(2),
                emp.hoursWorked.toString(),
                emp.isContributor ? 'Yes' : 'No'
            ];
            lines.push(row.join(','));
        });

        return lines.join('\n');
    },

    // ============================================================
    // UTILITIES
    // ============================================================

    /**
     * Pad string to fixed width
     */
    pad(value: string, width: number, rightAlign: boolean = false): string {
        const str = value.toString();
        if (str.length >= width) {
            return str.substring(0, width);
        }
        const padding = ' '.repeat(width - str.length);
        return rightAlign ? padding + str : str + padding;
    },

    /**
     * Format date as YYYY-MM-DD
     */
    formatDateYYYYMMDD(date: Date): string {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Format date as DD/MM/YYYY
     */
    formatDateDDMMYYYY(date: Date): string {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    },

    /**
     * Format date as MM/DD/YYYY (US format for QuickBooks)
     */
    formatDateMMDDYYYY(date: Date): string {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
    },

    /**
     * Escape CSV field value
     */
    escapeCSV(value: string): string {
        if (!value) return '';

        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
        }

        return value;
    }
};
