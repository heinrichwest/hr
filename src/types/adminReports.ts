// ============================================================
// SYSTEM ADMIN DASHBOARD REPORTS TYPES
// Phase 1: Individual Company Reports
// ============================================================

import type { UI19Report } from './ui19';

/**
 * Report type identifier for Phase 1 reports
 */
export type ReportType =
    | 'ui-19'
    | 'basic-employee-info'
    | 'workforce-profile'
    | 'leave-movement';

/**
 * Report period type selector
 */
export type ReportPeriodType =
    | 'monthly'
    | 'quarterly'
    | 'annual'
    | 'custom';

/**
 * Report export format
 */
export type ReportExportFormat = 'excel' | 'csv';

/**
 * Report metadata common to all reports
 */
export interface ReportMetadata {
    reportId: string;
    reportType: ReportType;
    companyId: string;
    companyName: string;
    periodType: ReportPeriodType;
    periodStart: Date;
    periodEnd: Date;
    generatedBy: string;
    generatedByName: string;
    generatedAt: Date;
}

// ============================================================
// BASIC EMPLOYEE INFORMATION REPORT
// ============================================================

/**
 * Single employee row in Basic Employee Info report
 */
export interface BasicEmployeeInfoRow {
    employeeId: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    fullName: string;
    idNumber: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    age: number;
    gender?: string;
    nationality?: string;
    maritalStatus?: string;

    // Employment details
    departmentId: string;
    department: string;
    branchId?: string;
    branch?: string;
    jobTitleId: string;
    jobTitle: string;
    gradeId?: string;
    grade?: string;
    managerId?: string;
    managerName?: string;

    // Contract information
    contractType: string;
    employmentStatus: string;
    startDate: Date;
    endDate?: Date;
    yearsOfService: number;

    // Contact details
    residentialAddress: string;
    postalAddress?: string;
}

/**
 * Basic Employee Information Report structure
 */
export interface BasicEmployeeInfoReport {
    metadata: ReportMetadata;
    employees: BasicEmployeeInfoRow[];
    summary: {
        totalEmployees: number;
        byDepartment: Record<string, number>;
        byContractType: Record<string, number>;
        byStatus: Record<string, number>;
    };
}

// ============================================================
// WORKFORCE PROFILE REPORT
// ============================================================

/**
 * Demographics breakdown for Employment Equity compliance
 */
export interface DemographicsBreakdown {
    // Age distribution
    ageGroups: {
        label: string; // e.g., "18-25", "26-35", etc.
        count: number;
        percentage: number;
    }[];

    // Gender distribution
    genderDistribution: {
        gender: string;
        count: number;
        percentage: number;
    }[];

    // Race distribution (for EE compliance)
    raceDistribution: {
        race: string;
        count: number;
        percentage: number;
    }[];

    // Nationality distribution
    nationalityDistribution: {
        nationality: string;
        count: number;
        percentage: number;
    }[];
}

/**
 * Workforce Profile Report structure with chart data
 */
export interface WorkforceProfileReport {
    metadata: ReportMetadata;

    // Headcount summaries
    headcountSummary: {
        total: number;
        byDepartment: {
            departmentId: string;
            departmentName: string;
            count: number;
            percentage: number;
        }[];
        byBranch: {
            branchId: string;
            branchName: string;
            count: number;
            percentage: number;
        }[];
        byJobGrade: {
            gradeId: string;
            gradeName: string;
            count: number;
            percentage: number;
        }[];
    };

    // Employee type distribution
    employeeTypeDistribution: {
        permanent: number;
        fixedTerm: number;
        partTime: number;
        temporary: number;
        contractor: number;
        intern: number;
        total: number;
    };

    // Demographics breakdown
    demographics: DemographicsBreakdown;

    // Raw data for export
    rawData: {
        employeeId: string;
        employeeNumber: string;
        fullName: string;
        department: string;
        branch: string;
        jobTitle: string;
        jobGrade: string;
        contractType: string;
        age: number;
        gender?: string;
        race?: string;
        nationality?: string;
    }[];
}

// ============================================================
// EMPLOYEE LEAVE MOVEMENT REPORT
// ============================================================

/**
 * Leave balance summary by type
 */
export interface LeaveBalanceByType {
    leaveTypeId: string;
    leaveTypeName: string;
    leaveTypeCode: string;

    // Aggregated across all employees
    totalEntitlement: number;
    totalTaken: number;
    totalPending: number;
    totalBalance: number;
    totalCarriedForward: number;

    // Averages
    averageEntitlement: number;
    averageBalance: number;

    // Employee count
    employeeCount: number;
}

/**
 * Individual employee leave balance details
 */
export interface EmployeeLeaveBalance {
    employeeId: string;
    employeeNumber: string;
    employeeName: string;
    department: string;
    branch?: string;

    // Per leave type
    leaveBalances: {
        leaveTypeId: string;
        leaveTypeName: string;
        entitlement: number;
        taken: number;
        pending: number;
        balance: number;
        carriedForward: number;
        hasNegativeBalance: boolean;
    }[];

    // Flags
    hasAnyNegativeBalance: boolean;
    totalLeaveTaken: number;
}

/**
 * Leave taken during the selected period
 */
export interface LeaveTakenRecord {
    employeeId: string;
    employeeNumber: string;
    employeeName: string;
    department: string;
    leaveTypeId: string;
    leaveTypeName: string;
    startDate: Date;
    endDate: Date;
    workingDays: number;
    status: string;
}

/**
 * Leave usage trend data for charts
 */
export interface LeaveUsageTrend {
    period: string; // e.g., "Jan 2026", "Week 1", etc.
    periodStart: Date;
    periodEnd: Date;
    annualLeaveDays: number;
    sickLeaveDays: number;
    familyResponsibilityDays: number;
    maternityDays: number;
    paternityDays: number;
    otherDays: number;
    totalDays: number;
}

/**
 * Employee Leave Movement Report structure
 */
export interface LeaveMovementReport {
    metadata: ReportMetadata;

    // Leave balance summary by type
    balancesByType: LeaveBalanceByType[];

    // Leave taken during period
    leaveTakenRecords: LeaveTakenRecord[];

    // Individual employee balances
    employeeBalances: EmployeeLeaveBalance[];

    // Leave usage trends over time (for line chart)
    usageTrends: LeaveUsageTrend[];

    // Summary statistics
    summary: {
        totalLeaveDaysTaken: number;
        totalLeaveDaysPending: number;
        totalLeaveBalance: number;
        employeesWithNegativeBalances: number;
        mostUsedLeaveType: string;
        averageLeaveDaysPerEmployee: number;
    };
}

// ============================================================
// REPORT HISTORY
// ============================================================

/**
 * Report history entry for tracking generated reports
 */
export interface ReportHistoryEntry {
    id: string;
    companyId: string;
    companyName: string;
    reportType: ReportType;
    reportTypeName: string;
    periodType: ReportPeriodType;
    periodStart: Date;
    periodEnd: Date;
    generatedBy: string;
    generatedByName: string;
    generatedAt: Date;

    // File metadata
    fileSize?: number;
    rowCount?: number;

    // For re-download capability
    reportDataId?: string; // Reference to stored report data if needed
}

// ============================================================
// FINANCIAL SYSTEM EXPORT CONFIGURATION
// ============================================================

/**
 * Supported financial systems for CSV export
 */
export type FinancialSystem =
    | 'sage'
    | 'psiber'
    | 'sars'
    | 'xero'
    | 'kerridge'
    | 'automate'
    | 'quickbooks';

/**
 * Financial system export configuration
 */
export interface FinancialSystemExportConfig {
    system: FinancialSystem;
    systemName: string;
    columnMapping: {
        sourceField: string;
        targetField: string;
        format?: string;
    }[];
    dateFormat: string;
    currencyFormat: string;
    delimiter: ',' | ';' | '\t';
    encoding: 'UTF-8' | 'UTF-16' | 'ISO-8859-1';
}

// ============================================================
// REPORT LABEL MAPPINGS
// ============================================================

/**
 * Report type display names
 */
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    'ui-19': 'UI-19 - UIF Employer\'s Declaration',
    'basic-employee-info': 'Basic Employee Information',
    'workforce-profile': 'Workforce Profile',
    'leave-movement': 'Employee Leave Movement'
};

/**
 * Report period type display names
 */
export const REPORT_PERIOD_TYPE_LABELS: Record<ReportPeriodType, string> = {
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'annual': 'Annual',
    'custom': 'Custom Date Range'
};

/**
 * Financial system display names
 */
export const FINANCIAL_SYSTEM_LABELS: Record<FinancialSystem, string> = {
    'sage': 'Sage',
    'psiber': 'Psiber',
    'sars': 'SARS',
    'xero': 'Xero',
    'kerridge': 'Kerridge Computing',
    'automate': 'Automate',
    'quickbooks': 'QuickBooks'
};

// ============================================================
// UNION TYPE FOR ALL REPORTS
// ============================================================

/**
 * Union type representing any Phase 1 report
 */
export type AdminReport =
    | UI19Report
    | BasicEmployeeInfoReport
    | WorkforceProfileReport
    | LeaveMovementReport;
