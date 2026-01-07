// ============================================================
// PAYROLL TYPES (South Africa Compliant)
// ============================================================

import type { PayFrequency } from './company';

// ============================================================
// PAY RUN
// ============================================================

export type PayRunStatus =
    | 'draft'
    | 'inputs_locked'
    | 'calculating'
    | 'calculated'
    | 'review'
    | 'pending_approval'
    | 'approved'
    | 'finalising'
    | 'finalised'
    | 'closed';

export interface PayRun {
    id: string;
    companyId: string;

    // Period
    payFrequency: PayFrequency;
    periodNumber: number;
    taxYear: string;            // e.g., "2024/2025"
    periodStart: Date;
    periodEnd: Date;
    cutOffDate: Date;
    payDate: Date;

    // Status
    status: PayRunStatus;

    // Counts
    employeeCount: number;
    processedCount: number;
    exceptionCount: number;

    // Totals
    totalGrossEarnings: number;
    totalDeductions: number;
    totalEmployerContributions: number;
    totalNetPay: number;
    totalPaye: number;
    totalUif: number;
    totalSdl: number;

    // Approvals
    calculatedBy?: string;
    calculatedAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    financeApprovedBy?: string;
    financeApprovedAt?: Date;
    finalisedBy?: string;
    finalisedAt?: Date;

    // Re-open tracking
    reopenedBy?: string;
    reopenedAt?: Date;
    reopenReason?: string;

    // Outputs
    payslipsGenerated: boolean;
    bankFileGenerated: boolean;
    journalGenerated: boolean;

    notes?: string;

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// PAY RUN LINE (Individual Employee Payslip Data)
// ============================================================

export interface PayRunLine {
    id: string;
    payRunId: string;
    employeeId: string;
    companyId: string;

    // Employee snapshot
    employeeNumber: string;
    employeeName: string;
    idNumber: string;
    taxNumber?: string;
    departmentId?: string;
    departmentName?: string;
    costCentreId?: string;
    costCentreName?: string;
    jobTitle?: string;

    // Pay details
    basicSalary: number;
    hourlyRate?: number;
    hoursWorked?: number;
    daysWorked?: number;

    // Breakdown
    earnings: PayRunLineItem[];
    deductions: PayRunLineItem[];
    employerContributions: PayRunLineItem[];

    // Leave
    leaveTaken?: LeaveDeduction[];

    // Totals
    grossEarnings: number;
    totalDeductions: number;
    totalEmployerContributions: number;
    netPay: number;

    // Tax calculations
    taxableIncome: number;
    paye: number;
    uifEmployee: number;
    uifEmployer: number;
    sdl: number;

    // YTD values
    ytdGrossEarnings: number;
    ytdTaxableIncome: number;
    ytdPaye: number;
    ytdUif: number;
    ytdSdl: number;
    ytdNetPay: number;

    // Bank details
    bankAccountHolder?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankBranchCode?: string;

    // Status
    hasExceptions: boolean;
    exceptions?: PayRunException[];
    isIncluded: boolean;
    excludeReason?: string;

    // Adjustments
    hasAdjustments: boolean;
    adjustmentNotes?: string;

    createdAt: Date;
    updatedAt?: Date;
}

export interface PayRunLineItem {
    id: string;
    payElementId: string;
    payElementCode: string;
    payElementName: string;
    type: 'earning' | 'deduction' | 'employer_contribution';

    // Calculation
    rate?: number;
    units?: number;
    percentage?: number;
    amount: number;

    // Tax treatment
    isTaxable: boolean;
    isUifApplicable: boolean;
    isSdlApplicable: boolean;

    // Reference
    reference?: string;         // e.g., loan ID, garnishee case number
    notes?: string;
}

export interface LeaveDeduction {
    leaveTypeId: string;
    leaveTypeName: string;
    days: number;
    amount?: number;            // If unpaid leave
}

export type PayRunExceptionType =
    | 'negative_net_pay'
    | 'missing_bank_details'
    | 'missing_tax_number'
    | 'large_variance'
    | 'missing_id_number'
    | 'salary_change'
    | 'new_employee'
    | 'terminated'
    | 'manual_adjustment'
    | 'garnishee_limit'
    | 'loan_balance';

export interface PayRunException {
    id: string;
    type: PayRunExceptionType;
    severity: 'warning' | 'error';
    message: string;
    details?: string;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    resolution?: string;
}

// ============================================================
// PAYSLIP
// ============================================================

export interface Payslip {
    id: string;
    payRunId: string;
    payRunLineId: string;
    employeeId: string;
    companyId: string;

    // Period
    periodStart: Date;
    periodEnd: Date;
    payDate: Date;
    periodDescription: string;  // e.g., "January 2024"

    // Company details
    companyName: string;
    companyAddress?: string;
    companyPayeRef?: string;

    // Employee details
    employeeNumber: string;
    employeeName: string;
    idNumber: string;
    taxNumber?: string;
    department?: string;
    jobTitle?: string;

    // Pay breakdown
    earnings: PayslipItem[];
    deductions: PayslipItem[];
    employerContributions: PayslipItem[];

    // Leave balances
    leaveBalances?: PayslipLeaveBalance[];

    // Totals
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;

    // YTD
    ytdGross: number;
    ytdPaye: number;
    ytdUif: number;
    ytdNetPay: number;

    // Bank details (masked)
    bankDetails?: string;       // e.g., "****1234"

    // PDF
    pdfUrl?: string;
    pdfGeneratedAt?: Date;

    // Access tracking
    viewedByEmployee: boolean;
    viewedAt?: Date;
    downloadedAt?: Date;

    createdAt: Date;
}

export interface PayslipItem {
    description: string;
    rate?: number;
    units?: number;
    amount: number;
    ytdAmount?: number;
}

export interface PayslipLeaveBalance {
    leaveType: string;
    balance: number;
    unit: 'days' | 'hours';
}

// ============================================================
// ADJUSTMENTS
// ============================================================

export type AdjustmentType = 'once_off' | 'recurring' | 'retro';

export interface PayrollAdjustment {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName?: string;

    payElementId: string;
    payElementName?: string;
    adjustmentType: AdjustmentType;

    amount: number;
    percentage?: number;
    reason: string;
    notes?: string;

    // Effective dates
    effectivePayRunId?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;

    // Retro details
    isRetroactive: boolean;
    retroPeriodStart?: Date;
    retroPeriodEnd?: Date;

    // Approval
    requiresApproval: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'applied';
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// STATUTORY OUTPUTS (South Africa)
// ============================================================

// IRP5 / IT3(a) Certificate
export interface TaxCertificate {
    id: string;
    companyId: string;
    employeeId: string;
    taxYear: string;            // e.g., "2024/2025"
    certificateType: 'IRP5' | 'IT3a';
    certificateNumber: string;

    // Employer details
    employerName: string;
    employerPayeRef: string;
    employerTradingName?: string;
    employerAddress?: string;

    // Employee details
    employeeNumber: string;
    employeeName: string;
    employeeIdNumber: string;
    employeeTaxNumber?: string;
    employeeAddress?: string;

    // Employment period
    employmentStartDate: Date;
    employmentEndDate?: Date;
    periodFrom: Date;
    periodTo: Date;

    // Source codes and amounts
    sourceCodes: TaxCertificateSourceCode[];

    // Totals
    grossRemuneration: number;
    totalDeductions: number;
    taxableIncome: number;
    payeDeducted: number;

    // Status
    status: 'draft' | 'generated' | 'submitted' | 'amended';
    generatedAt?: Date;
    submittedAt?: Date;

    pdfUrl?: string;

    createdAt: Date;
    updatedAt?: Date;
}

export interface TaxCertificateSourceCode {
    code: string;               // e.g., "3601", "4001"
    description: string;
    amount: number;
}

// Common IRP5 Source Codes
export const IRP5_SOURCE_CODES = {
    // Income codes (3000 series)
    '3601': 'Income - Salary',
    '3602': 'Income - Bonus',
    '3605': 'Income - Commission',
    '3606': 'Income - Overtime',
    '3610': 'Annuity from pension fund',
    '3615': 'Annuity from RAF',
    '3616': 'Annuity from provident fund',
    '3701': 'Lump sum from pension fund',
    '3702': 'Lump sum from provident fund',
    '3703': 'Lump sum from RAF',
    '3714': 'Severance benefit',
    '3801': 'Travel allowance',
    '3805': 'Reimbursive travel allowance',
    '3810': 'Other allowances',
    '3813': 'Subsistence allowance',

    // Deduction codes (4000 series)
    '4001': 'Pension fund contributions',
    '4002': 'Provident fund contributions',
    '4003': 'RAF contributions',
    '4005': 'Medical aid contributions',
    '4006': 'Arrear pension fund contributions',
    '4018': 'Donation deduction',
    '4474': 'UIF contributions',
} as const;

// EMP201 Monthly Declaration
export interface EMP201 {
    id: string;
    companyId: string;
    taxYear: string;
    periodMonth: number;        // 1-12
    periodYear: number;

    // Company details
    companyName: string;
    payeReference: string;
    sdlReference?: string;
    uifReference?: string;

    // Employee counts
    employeeCount: number;

    // PAYE
    payeTotal: number;
    payePenalty?: number;
    payeInterest?: number;

    // SDL
    sdlTotal: number;
    sdlPenalty?: number;
    sdlInterest?: number;

    // UIF
    uifEmployeeTotal: number;
    uifEmployerTotal: number;
    uifTotal: number;
    uifPenalty?: number;
    uifInterest?: number;

    // ETI (Employment Tax Incentive)
    etiTotal?: number;

    // Grand total
    totalLiability: number;
    etiOffset?: number;
    netPayable: number;

    // Status
    status: 'draft' | 'generated' | 'submitted' | 'paid';
    generatedAt?: Date;
    submittedAt?: Date;
    paidAt?: Date;
    paymentReference?: string;

    createdAt: Date;
    updatedAt?: Date;
}

// EMP501 Reconciliation
export interface EMP501 {
    id: string;
    companyId: string;
    taxYear: string;

    // Summary by month
    monthlyTotals: EMP501Monthly[];

    // Annual totals
    totalRemuneration: number;
    totalPaye: number;
    totalSdl: number;
    totalUif: number;
    totalEti?: number;

    // Certificates
    certificateCount: number;
    irp5Count: number;
    it3aCount: number;

    // Reconciliation
    payeReconciliation: number; // Difference between EMP201s and IRP5s
    isReconciled: boolean;
    reconciliationNotes?: string;

    // Status
    status: 'draft' | 'generated' | 'submitted';
    generatedAt?: Date;
    submittedAt?: Date;

    createdAt: Date;
    updatedAt?: Date;
}

export interface EMP501Monthly {
    month: number;
    paye: number;
    sdl: number;
    uif: number;
    eti?: number;
}

// ============================================================
// BANK FILE EXPORT
// ============================================================

export interface BankFile {
    id: string;
    payRunId: string;
    companyId: string;

    bankFormat: string;         // e.g., "ABSA", "FNB", "Standard Bank"
    fileName: string;
    fileUrl?: string;

    paymentDate: Date;
    totalAmount: number;
    transactionCount: number;

    status: 'generated' | 'downloaded' | 'submitted' | 'processed';
    generatedAt: Date;
    generatedBy: string;

    // Errors
    hasErrors: boolean;
    errorCount?: number;
    errors?: BankFileError[];
}

export interface BankFileError {
    employeeId: string;
    employeeName: string;
    error: string;
}

// ============================================================
// GL JOURNAL
// ============================================================

export interface GLJournal {
    id: string;
    payRunId: string;
    companyId: string;

    journalDate: Date;
    journalNumber: string;
    description: string;

    entries: GLJournalEntry[];

    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;

    // Export
    exportFormat?: string;      // e.g., "Xero", "Sage", "CSV"
    fileUrl?: string;

    status: 'draft' | 'posted' | 'exported';
    generatedAt: Date;
    generatedBy: string;
}

export interface GLJournalEntry {
    accountCode: string;
    accountName?: string;
    costCentreCode?: string;
    costCentreName?: string;
    description: string;
    debit: number;
    credit: number;
    reference?: string;
}
