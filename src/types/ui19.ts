// ============================================================
// UI-19 UIF EMPLOYER'S DECLARATION TYPES
// ============================================================

/**
 * Termination reason codes as per official UI-19 form
 * Codes 2-19 (Code 1 is reserved/not used)
 */
export type TerminationReasonCode =
    | 2  // Deceased
    | 3  // Retired
    | 4  // Dismissed
    | 5  // Contract expired
    | 6  // Resigned
    | 7  // Constructive dismissal
    | 8  // Insolvency/Liquidation
    | 9  // Maternity/Adoption
    | 10 // Illness/Medically boarded
    | 11 // Retrenched/Staff reduction
    | 12 // Transfer to another Branch
    | 13 // Absconded
    | 14 // Business closed
    | 15 // Death of Domestic Employer
    | 16 // Voluntary severance package
    | 17 // Reduced Work Time
    | 18 // Commissioning Parental
    | 19; // Parental Leave

/**
 * Non-contributor reason codes as per official UI-19 form
 * Codes 1-3
 */
export type NonContributorReasonCode =
    | 1  // Temporary employees
    | 2  // Employees who earn commission only
    | 3; // No income paid for the payroll period

/**
 * Single employee row in UI-19 report
 * Matches all 10 required columns (A-J) from official form
 */
export interface UI19EmployeeRow {
    // Column A: Surname
    surname: string;

    // Column B: Initials
    initials: string;

    // Column C: Identity Document Number (13-digit SA ID)
    idNumber: string;

    // Column D: Total Gross Remuneration Per Month (Rands and Cents)
    grossRemuneration: number;

    // Column E: Total hours worked during month
    hoursWorked: number;

    // Column F: Commencement date of Employment (DD/MM/YY)
    commencementDate: Date;

    // Column G: Termination Date (DD/MM/YY) - Optional
    terminationDate?: Date;

    // Column H: Reasons for Termination - Optional, codes 2-19
    terminationReasonCode?: TerminationReasonCode;

    // Column I: Contributor Status (YES/NO)
    isContributor: boolean;

    // Column J: Non-Contributor Reason - Optional, codes 1-3
    nonContributorReasonCode?: NonContributorReasonCode;

    // Internal reference (not displayed in report)
    employeeId: string;
}

/**
 * Section 1: Employer Details
 * Auto-populated from company/tenant profile
 */
export interface UI19EmployerDetails {
    uifEmployerReference: string;
    payeReference?: string;
    tradingName: string;
    physicalAddress: {
        line1: string;
        line2?: string;
        suburb?: string;
        city: string;
        province: string;
        postalCode: string;
        country: string;
    };
    postalAddress?: {
        line1: string;
        line2?: string;
        suburb?: string;
        city: string;
        province: string;
        postalCode: string;
        country: string;
    };
    companyRegistrationNumber: string;
    email?: string;
    phone?: string;
    fax?: string;
    authorisedPersonName?: string;
    authorisedPersonIdNumber?: string;
}

/**
 * Complete UI-19 Report Structure
 */
export interface UI19Report {
    // Report metadata
    reportId: string;
    reportType: 'ui-19';
    companyId: string;
    reportingPeriod: {
        month: number; // 1-12
        year: number;
        startDate: Date;
        endDate: Date;
    };

    // Section 1: Employer Details
    employerDetails: UI19EmployerDetails;

    // Section 2: Employee Table
    employees: UI19EmployeeRow[];

    // Declaration section
    declaration: {
        statement: string;
        authorisedPersonName: string;
        authorisedPersonTitle?: string;
        signatureDate?: Date;
    };

    // Metadata
    generatedBy: string;
    generatedByName: string;
    generatedAt: Date;
    totalEmployees: number;
    totalContributors: number;
    totalNonContributors: number;
}

/**
 * Termination reason code labels for display
 */
export const TERMINATION_REASON_LABELS: Record<TerminationReasonCode, string> = {
    2: 'Deceased',
    3: 'Retired',
    4: 'Dismissed',
    5: 'Contract expired',
    6: 'Resigned',
    7: 'Constructive dismissal',
    8: 'Insolvency/Liquidation',
    9: 'Maternity/Adoption',
    10: 'Illness/Medically boarded',
    11: 'Retrenched/Staff reduction',
    12: 'Transfer to another Branch',
    13: 'Absconded',
    14: 'Business closed',
    15: 'Death of Domestic Employer',
    16: 'Voluntary severance package',
    17: 'Reduced Work Time',
    18: 'Commissioning Parental',
    19: 'Parental Leave'
};

/**
 * Non-contributor reason code labels for display
 */
export const NON_CONTRIBUTOR_REASON_LABELS: Record<NonContributorReasonCode, string> = {
    1: 'Temporary employees',
    2: 'Employees who earn commission only',
    3: 'No income paid for the payroll period'
};
