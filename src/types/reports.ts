// ============================================================
// REPORTS & ANALYTICS TYPES
// ============================================================

export type ReportCategory =
    | 'employee'
    | 'leave'
    | 'payroll'
    | 'ir'
    | 'compliance'
    | 'custom';

export type ReportFormat = 'screen' | 'pdf' | 'excel' | 'csv';

export type DateRangePreset =
    | 'today'
    | 'this_week'
    | 'this_month'
    | 'this_quarter'
    | 'this_year'
    | 'last_month'
    | 'last_quarter'
    | 'last_year'
    | 'custom';

// ============================================================
// REPORT DEFINITIONS
// ============================================================

export interface ReportDefinition {
    id: string;
    name: string;
    description: string;
    category: ReportCategory;
    icon?: string;
    parameters: ReportParameter[];
    columns: ReportColumn[];
    defaultSort?: { field: string; direction: 'asc' | 'desc' };
    allowExport: boolean;
    exportFormats: ReportFormat[];
}

export interface ReportParameter {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean' | 'number';
    required: boolean;
    options?: { value: string; label: string }[];
    defaultValue?: unknown;
}

export interface ReportColumn {
    id: string;
    header: string;
    accessor: string;
    type: 'text' | 'number' | 'currency' | 'date' | 'status' | 'percentage';
    sortable: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    format?: string;
}

// ============================================================
// EMPLOYEE REPORTS
// ============================================================

export interface HeadcountSummary {
    totalEmployees: number;
    activeEmployees: number;
    onLeaveEmployees: number;
    probationEmployees: number;
    terminatedThisPeriod: number;
    hiredThisPeriod: number;
    turnoverRate: number;
    byDepartment: { department: string; count: number }[];
    byContractType: { type: string; count: number }[];
    byStatus: { status: string; count: number }[];
    byGender?: { gender: string; count: number }[];
}

export interface EmployeeListReport {
    employees: EmployeeReportRow[];
    totalCount: number;
    generatedAt: Date;
}

export interface EmployeeReportRow {
    id: string;
    employeeNumber: string;
    fullName: string;
    department: string;
    jobTitle: string;
    startDate: Date;
    status: string;
    contractType: string;
    managerName?: string;
    yearsOfService: number;
}

export interface TurnoverReport {
    period: string;
    periodStart: Date;
    periodEnd: Date;
    startingHeadcount: number;
    endingHeadcount: number;
    hires: number;
    terminations: number;
    turnoverRate: number;
    voluntaryTerminations: number;
    involuntaryTerminations: number;
    terminationsByReason: { reason: string; count: number }[];
    terminationsByDepartment: { department: string; count: number }[];
}

export interface ServiceAnniversaryReport {
    upcomingAnniversaries: {
        employeeId: string;
        employeeName: string;
        employeeNumber: string;
        department: string;
        anniversaryDate: Date;
        yearsOfService: number;
    }[];
}

export interface ProbationReport {
    employeesOnProbation: {
        employeeId: string;
        employeeName: string;
        employeeNumber: string;
        department: string;
        startDate: Date;
        probationEndDate: Date;
        daysRemaining: number;
        isExtended: boolean;
    }[];
}

export interface DocumentExpiryReport {
    expiringDocuments: {
        employeeId: string;
        employeeName: string;
        employeeNumber: string;
        documentName: string;
        documentCategory: string;
        expiryDate: Date;
        daysUntilExpiry: number;
    }[];
}

// ============================================================
// LEAVE REPORTS
// ============================================================

export interface LeaveBalanceSummary {
    companyId: string;
    asAtDate: Date;
    byLeaveType: {
        leaveTypeId: string;
        leaveTypeName: string;
        totalEntitlement: number;
        totalTaken: number;
        totalPending: number;
        totalBalance: number;
        averageBalance: number;
    }[];
    employeesWithLowBalance: number;
    employeesWithExcessBalance: number;
}

export interface LeaveBalanceReport {
    balances: {
        employeeId: string;
        employeeName: string;
        employeeNumber: string;
        department: string;
        leaveTypeId: string;
        leaveTypeName: string;
        entitlement: number;
        taken: number;
        pending: number;
        balance: number;
        carriedForward: number;
    }[];
    generatedAt: Date;
}

export interface LeaveRequestsReport {
    requests: {
        id: string;
        employeeName: string;
        employeeNumber: string;
        department: string;
        leaveType: string;
        startDate: Date;
        endDate: Date;
        workingDays: number;
        status: string;
        requestedDate: Date;
        approvedBy?: string;
        approvedDate?: Date;
    }[];
    summary: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
        cancelled: number;
    };
    generatedAt: Date;
}

export interface LeaveUtilizationReport {
    period: string;
    periodStart: Date;
    periodEnd: Date;
    byLeaveType: {
        leaveTypeName: string;
        totalDaysTaken: number;
        employeeCount: number;
        averageDaysPerEmployee: number;
    }[];
    byDepartment: {
        department: string;
        totalDaysTaken: number;
        employeeCount: number;
        averageDaysPerEmployee: number;
    }[];
    byMonth: {
        month: string;
        daysTaken: number;
    }[];
}

export interface AbsenteeismReport {
    period: string;
    periodStart: Date;
    periodEnd: Date;
    totalAbsentDays: number;
    absenteeismRate: number;
    byDepartment: {
        department: string;
        absentDays: number;
        workingDays: number;
        rate: number;
    }[];
    byReason: {
        reason: string;
        days: number;
        percentage: number;
    }[];
    topAbsentees: {
        employeeName: string;
        employeeNumber: string;
        department: string;
        totalDays: number;
    }[];
}

// ============================================================
// PAYROLL REPORTS
// ============================================================

export interface PayrollSummary {
    payRunId: string;
    periodDescription: string;
    payDate: Date;
    employeeCount: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    totalPaye: number;
    totalUif: number;
    totalSdl: number;
    totalEmployerCost: number;
    byDepartment: {
        department: string;
        employeeCount: number;
        grossAmount: number;
        netAmount: number;
    }[];
    byCostCentre: {
        costCentre: string;
        employeeCount: number;
        grossAmount: number;
        netAmount: number;
    }[];
}

export interface PayrollRegisterReport {
    payRunId: string;
    periodDescription: string;
    employees: {
        employeeNumber: string;
        employeeName: string;
        department: string;
        basicSalary: number;
        grossEarnings: number;
        paye: number;
        uif: number;
        otherDeductions: number;
        totalDeductions: number;
        netPay: number;
    }[];
    totals: {
        basicSalary: number;
        grossEarnings: number;
        paye: number;
        uif: number;
        otherDeductions: number;
        totalDeductions: number;
        netPay: number;
    };
    generatedAt: Date;
}

export interface PayrollVarianceReport {
    currentPayRun: string;
    previousPayRun: string;
    variances: {
        employeeNumber: string;
        employeeName: string;
        department: string;
        previousNet: number;
        currentNet: number;
        variance: number;
        variancePercentage: number;
        reason?: string;
    }[];
    summary: {
        employeesWithIncrease: number;
        employeesWithDecrease: number;
        employeesUnchanged: number;
        totalVariance: number;
    };
}

export interface CostToCompanyReport {
    period: string;
    totalCostToCompany: number;
    breakdown: {
        category: string;
        amount: number;
        percentage: number;
    }[];
    byDepartment: {
        department: string;
        employeeCount: number;
        totalCost: number;
        averageCostPerEmployee: number;
    }[];
    trend: {
        period: string;
        totalCost: number;
    }[];
}

export interface StatutoryReport {
    reportType: 'EMP201' | 'EMP501' | 'UIF_Declaration';
    period: string;
    data: Record<string, unknown>;
    generatedAt: Date;
}

// ============================================================
// IR REPORTS
// ============================================================

export interface IRCaseSummary {
    period: string;
    periodStart: Date;
    periodEnd: Date;
    totalCases: number;
    openCases: number;
    closedCases: number;
    averageResolutionDays: number;
    byCaseType: { type: string; count: number }[];
    byStatus: { status: string; count: number }[];
    byOutcome: { outcome: string; count: number }[];
    byDepartment: { department: string; count: number }[];
}

export interface IRCasesReport {
    cases: {
        caseNumber: string;
        caseType: string;
        employeeName: string;
        employeeNumber: string;
        department: string;
        incidentDate: Date;
        dateOpened: Date;
        status: string;
        assignedTo: string;
        daysOpen: number;
        outcome?: string;
        dateClosed?: Date;
    }[];
    generatedAt: Date;
}

export interface WarningsReport {
    period: string;
    warnings: {
        warningNumber: string;
        warningType: string;
        employeeName: string;
        employeeNumber: string;
        department: string;
        issueDate: Date;
        expiryDate: Date;
        offenceCategory: string;
        isActive: boolean;
        issuedBy: string;
    }[];
    summary: {
        total: number;
        active: number;
        expired: number;
        byType: { type: string; count: number }[];
    };
}

export interface DisciplinaryTrendReport {
    period: string;
    periodStart: Date;
    periodEnd: Date;
    trends: {
        month: string;
        casesOpened: number;
        casesClosed: number;
        warningsIssued: number;
        dismissals: number;
    }[];
    repeatOffenders: {
        employeeName: string;
        employeeNumber: string;
        department: string;
        warningCount: number;
        caseCount: number;
    }[];
}

export interface CCMAReport {
    activeCases: {
        ccmaCaseNumber: string;
        internalCaseNumber: string;
        employeeName: string;
        disputeType: string;
        referralDate: Date;
        status: string;
        nextDate?: Date;
    }[];
    outcomes: {
        ccmaCaseNumber: string;
        employeeName: string;
        disputeType: string;
        outcome: string;
        awardAmount?: number;
        settlementAmount?: number;
    }[];
    summary: {
        totalActive: number;
        totalSettled: number;
        totalAwards: number;
        totalCostToCompany: number;
    };
}

// ============================================================
// ANALYTICS & DASHBOARDS
// ============================================================

export interface DashboardMetrics {
    headcount: {
        total: number;
        change: number;
        changePercentage: number;
    };
    turnover: {
        rate: number;
        trend: 'up' | 'down' | 'stable';
    };
    absenteeism: {
        rate: number;
        trend: 'up' | 'down' | 'stable';
    };
    leaveUtilization: {
        rate: number;
        averageBalance: number;
    };
    openIRCases: {
        count: number;
        urgent: number;
    };
    payrollCost: {
        currentMonth: number;
        previousMonth: number;
        change: number;
    };
}

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
    }[];
}

// ============================================================
// SAVED REPORTS
// ============================================================

export interface SavedReport {
    id: string;
    companyId: string;
    userId: string;

    name: string;
    description?: string;
    reportType: string;
    category: ReportCategory;

    parameters: Record<string, unknown>;

    schedule?: ReportSchedule;

    isShared: boolean;
    sharedWith?: string[];

    createdAt: Date;
    updatedAt?: Date;
    lastRunAt?: Date;
}

export interface ReportSchedule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;     // 0-6 for weekly
    dayOfMonth?: number;    // 1-31 for monthly
    time: string;           // HH:mm
    recipients: string[];
    format: ReportFormat;
    isActive: boolean;
}

// ============================================================
// REPORT EXECUTION
// ============================================================

export interface ReportExecution {
    id: string;
    reportType: string;
    parameters: Record<string, unknown>;

    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;

    resultRowCount?: number;
    resultFileUrl?: string;
    error?: string;

    executedBy: string;
}

// ============================================================
// PREDEFINED REPORT LIST
// ============================================================

export const STANDARD_REPORTS: Omit<ReportDefinition, 'columns' | 'parameters'>[] = [
    // Employee Reports
    {
        id: 'employee_list',
        name: 'Employee List',
        description: 'Complete list of employees with key details',
        category: 'employee',
        allowExport: true,
        exportFormats: ['pdf', 'excel', 'csv']
    },
    {
        id: 'headcount_summary',
        name: 'Headcount Summary',
        description: 'Employee headcount breakdown by department, status, and contract type',
        category: 'employee',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'turnover_report',
        name: 'Turnover Report',
        description: 'Employee turnover analysis for the selected period',
        category: 'employee',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'probation_report',
        name: 'Probation Report',
        description: 'Employees currently on probation with end dates',
        category: 'employee',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'service_anniversaries',
        name: 'Service Anniversaries',
        description: 'Upcoming work anniversaries',
        category: 'employee',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'document_expiry',
        name: 'Document Expiry Report',
        description: 'Employee documents expiring soon',
        category: 'employee',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },

    // Leave Reports
    {
        id: 'leave_balances',
        name: 'Leave Balances',
        description: 'Current leave balances for all employees',
        category: 'leave',
        allowExport: true,
        exportFormats: ['pdf', 'excel', 'csv']
    },
    {
        id: 'leave_requests',
        name: 'Leave Requests',
        description: 'Leave requests for the selected period',
        category: 'leave',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'leave_utilization',
        name: 'Leave Utilization',
        description: 'Leave utilization analysis by type and department',
        category: 'leave',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'absenteeism_report',
        name: 'Absenteeism Report',
        description: 'Absenteeism rates and patterns',
        category: 'leave',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },

    // Payroll Reports
    {
        id: 'payroll_summary',
        name: 'Payroll Summary',
        description: 'Summary of payroll costs by department and cost centre',
        category: 'payroll',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'payroll_register',
        name: 'Payroll Register',
        description: 'Detailed payroll register with all employee pay details',
        category: 'payroll',
        allowExport: true,
        exportFormats: ['pdf', 'excel', 'csv']
    },
    {
        id: 'payroll_variance',
        name: 'Payroll Variance',
        description: 'Comparison of current vs previous payroll',
        category: 'payroll',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'cost_to_company',
        name: 'Cost to Company',
        description: 'Total employment cost analysis',
        category: 'payroll',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },

    // IR Reports
    {
        id: 'ir_cases',
        name: 'IR Cases',
        description: 'List of IR cases for the selected period',
        category: 'ir',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'ir_summary',
        name: 'IR Summary',
        description: 'Summary of IR cases by type, status, and outcome',
        category: 'ir',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'warnings_report',
        name: 'Warnings Report',
        description: 'Employee warnings issued in the selected period',
        category: 'ir',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'disciplinary_trends',
        name: 'Disciplinary Trends',
        description: 'Disciplinary action trends over time',
        category: 'ir',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'ccma_report',
        name: 'CCMA Report',
        description: 'CCMA cases and outcomes',
        category: 'ir',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },

    // Compliance Reports
    {
        id: 'bbbee_report',
        name: 'B-BBEE Workforce Report',
        description: 'Employee demographics for B-BBEE reporting',
        category: 'compliance',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    },
    {
        id: 'employment_equity',
        name: 'Employment Equity Report',
        description: 'Workforce demographics for EE reporting',
        category: 'compliance',
        allowExport: true,
        exportFormats: ['pdf', 'excel']
    }
];
