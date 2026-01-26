// ============================================================
// COMPANY & ORGANIZATION STRUCTURE TYPES
// ============================================================

export interface Company {
    id: string;
    legalName: string;
    tradingName?: string;
    registrationNumber: string;
    // SA Tax references
    payeReference?: string;
    uifReference?: string;
    sdlReference?: string;
    // Contact & Address
    physicalAddress: Address;
    postalAddress?: Address;
    phone?: string;
    email?: string;
    fax?: string; // Added for UI-19 requirements
    website?: string;
    // Authorised person for UIF declarations (UI-19)
    authorisedPersonName?: string;
    authorisedPersonIdNumber?: string;
    authorisedPersonTitle?: string;
    // Settings
    defaultCurrency: string; // Default: ZAR
    defaultPayFrequency: PayFrequency;
    financialYearEnd: number; // Month (1-12), typically February (2) for SA tax year
    logo?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Address {
    line1: string;
    line2?: string;
    suburb?: string; // Optional suburb field
    city: string;
    province: string;
    postalCode: string;
    country: string; // Default: South Africa
}

export type PayFrequency = 'weekly' | 'fortnightly' | 'monthly';

export interface Branch {
    id: string;
    companyId: string;
    name: string;
    code: string;
    address?: Address;
    phone?: string;
    email?: string;
    managerId?: string;
    isHeadOffice: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Department {
    id: string;
    companyId: string;
    branchId?: string;
    name: string;
    code: string;
    description?: string;
    managerId?: string;
    parentDepartmentId?: string; // For hierarchical departments
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface JobTitle {
    id: string;
    companyId: string;
    name: string;
    code: string;
    description?: string;
    gradeId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface JobGrade {
    id: string;
    companyId: string;
    name: string;
    code: string;
    level: number; // For sorting/hierarchy
    minSalary?: number;
    maxSalary?: number;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface CostCentre {
    id: string;
    companyId: string;
    name: string;
    code: string;
    description?: string;
    departmentId?: string;
    glCode?: string; // General Ledger code for accounting
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// PAYROLL CONFIGURATION TYPES
// ============================================================

export type PayElementType = 'earning' | 'deduction' | 'employer_contribution';
export type CalculationMethod = 'fixed' | 'percentage' | 'hourly' | 'daily' | 'formula';

export interface PayElement {
    id: string;
    companyId: string;
    name: string;
    code: string;
    type: PayElementType;
    calculationMethod: CalculationMethod;
    defaultAmount?: number;
    defaultPercentage?: number;
    // Tax treatment
    isTaxable: boolean;
    isUifApplicable: boolean;
    isSdlApplicable: boolean;
    isPensionApplicable: boolean;
    // Accounting
    glCode?: string;
    costCentreId?: string;
    // Settings
    isRecurring: boolean;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// PUBLIC HOLIDAYS & CALENDARS
// ============================================================

export interface PublicHoliday {
    id: string;
    companyId: string;
    date: Date;
    name: string;
    isNational: boolean; // SA public holiday vs company-specific
    year: number;
    createdAt: Date;
}

export interface WorkSchedule {
    id: string;
    companyId: string;
    name: string;
    code: string;
    description?: string;
    // Weekly hours
    mondayHours: number;
    tuesdayHours: number;
    wednesdayHours: number;
    thursdayHours: number;
    fridayHours: number;
    saturdayHours: number;
    sundayHours: number;
    // Overtime multipliers
    overtimeMultiplier: number; // e.g., 1.5
    sundayMultiplier: number; // e.g., 2.0
    publicHolidayMultiplier: number; // e.g., 2.0
    nightShiftMultiplier?: number;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// PAYROLL CALENDAR
// ============================================================

export interface PayrollPeriod {
    id: string;
    companyId: string;
    payFrequency: PayFrequency;
    periodNumber: number; // e.g., 1-12 for monthly, 1-52 for weekly
    year: number;
    startDate: Date;
    endDate: Date;
    cutOffDate: Date;
    payDate: Date;
    status: PayrollPeriodStatus;
    createdAt: Date;
    updatedAt?: Date;
}

export type PayrollPeriodStatus = 'future' | 'open' | 'processing' | 'approved' | 'finalised' | 'closed';

// ============================================================
// AUDIT LOGGING
// ============================================================

export interface AuditLog {
    id: string;
    companyId: string;
    userId: string;
    userEmail: string;
    action: AuditAction;
    entityType: string; // e.g., 'employee', 'payroll', 'ir_case', 'report'
    entityId: string;
    description: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'view'
    | 'download'
    | 'approve'
    | 'reject'
    | 'finalise'
    | 'reopen'
    | 'login'
    | 'logout'
    | 'export'
    | 'generate_report'; // Added for report generation tracking

// ============================================================
// SOUTH AFRICAN TAX TABLES (Configurable)
// ============================================================

export interface TaxBracket {
    id: string;
    taxYear: string; // e.g., '2024/2025'
    minIncome: number;
    maxIncome: number | null; // null for top bracket
    baseAmount: number;
    rate: number; // Percentage
    isActive: boolean;
}

export interface TaxRebate {
    id: string;
    taxYear: string;
    type: 'primary' | 'secondary' | 'tertiary';
    minAge: number;
    maxAge: number | null;
    amount: number;
    isActive: boolean;
}

export interface TaxThreshold {
    id: string;
    taxYear: string;
    type: 'primary' | 'secondary' | 'tertiary';
    threshold: number;
    isActive: boolean;
}

export interface UifRate {
    id: string;
    effectiveDate: Date;
    employeeRate: number; // Percentage
    employerRate: number; // Percentage
    maxEarningsCeiling: number;
    isActive: boolean;
}

export interface SdlRate {
    id: string;
    effectiveDate: Date;
    rate: number; // Percentage
    exemptionThreshold: number;
    isActive: boolean;
}
