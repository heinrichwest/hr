// ============================================================
// EMPLOYEE MASTER DATA TYPES
// ============================================================

import type { PayFrequency, Address } from './company';
import type { TerminationReasonCode, NonContributorReasonCode } from './ui19';

export type EmploymentStatus =
    | 'active'
    | 'suspended'
    | 'on_leave'
    | 'probation'
    | 'terminated'
    | 'resigned'
    | 'retrenched';

export type ContractType =
    | 'permanent'
    | 'fixed_term'
    | 'part_time'
    | 'temporary'
    | 'contractor'
    | 'intern';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type MaritalStatus =
    | 'single'
    | 'married'
    | 'divorced'
    | 'widowed'
    | 'separated'
    | 'domestic_partnership';

export type IdType = 'sa_id' | 'passport';

export interface Employee {
    id: string;
    companyId: string;
    employeeNumber: string;

    // Personal Details
    firstName: string;
    lastName: string;
    middleName?: string;
    preferredName?: string;
    idType: IdType;
    idNumber: string;
    passportCountry?: string;
    dateOfBirth: Date;
    gender?: Gender;
    nationality?: string;
    maritalStatus?: MaritalStatus;

    // Contact Details
    email: string;
    personalEmail?: string;
    phone: string;
    alternatePhone?: string;
    residentialAddress: Address;
    postalAddress?: Address;

    // Emergency Contact
    emergencyContact?: EmergencyContact;
    nextOfKin?: NextOfKin;

    // Employment Details
    startDate: Date;
    endDate?: Date;
    status: EmploymentStatus;
    contractType: ContractType;
    jobTitleId: string;
    jobTitle?: string; // Denormalized for display
    gradeId?: string;
    grade?: string;
    departmentId: string;
    department?: string;
    branchId?: string;
    branch?: string;
    costCentreId?: string;
    costCentre?: string;
    managerId?: string;
    managerName?: string;
    workScheduleId?: string;

    // Probation
    probationStartDate?: Date;
    probationEndDate?: Date;
    probationExtended?: boolean;

    // Payroll Details (Sensitive)
    payFrequency: PayFrequency;
    salaryType: 'monthly' | 'hourly';
    basicSalary?: number;
    hourlyRate?: number;
    standardHoursPerWeek?: number;
    taxNumber?: string;
    isUifApplicable: boolean;

    // UIF Tracking (for UI-19 reporting)
    uifContributor?: boolean; // Whether employee contributes to UIF
    uifNonContributorReason?: NonContributorReasonCode; // Reason code if not contributing
    terminationReasonCode?: TerminationReasonCode; // Termination reason code for UI-19

    // Race for Employment Equity reporting
    race?: 'african' | 'coloured' | 'indian' | 'white' | 'asian' | 'other' | 'prefer_not_to_say';

    // Bank Details (Sensitive)
    bankDetails?: BankDetails;

    // System fields
    userId?: string; // Link to user account if exists
    avatar?: string;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
}

// Re-export Address from company.ts for convenience
export type { Address } from './company';

export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string;
    email?: string;
}

export interface NextOfKin {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: Address;
}

export interface BankDetails {
    accountHolderName: string;
    bankName: string;
    branchCode: string;
    branchName?: string;
    accountNumber: string;
    accountType: 'savings' | 'current' | 'transmission';
    isVerified: boolean;
    verifiedDate?: Date;
}

// ============================================================
// EMPLOYMENT HISTORY & CHANGES
// ============================================================

export type EmploymentChangeType =
    | 'hire'
    | 'promotion'
    | 'demotion'
    | 'transfer'
    | 'salary_change'
    | 'department_change'
    | 'manager_change'
    | 'contract_change'
    | 'status_change'
    | 'termination';

export interface EmploymentHistory {
    id: string;
    employeeId: string;
    changeType: EmploymentChangeType;
    effectiveDate: Date;

    // What changed
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;

    // For position changes
    previousJobTitleId?: string;
    newJobTitleId?: string;
    previousGradeId?: string;
    newGradeId?: string;
    previousDepartmentId?: string;
    newDepartmentId?: string;
    previousBranchId?: string;
    newBranchId?: string;
    previousManagerId?: string;
    newManagerId?: string;

    // For salary changes
    previousSalary?: number;
    newSalary?: number;
    salaryChangePercentage?: number;

    // Approval
    reason?: string;
    notes?: string;
    approvedBy?: string;
    approvalDate?: Date;

    createdBy: string;
    createdAt: Date;
}

// ============================================================
// TERMINATION
// ============================================================

export type TerminationType =
    | 'resignation'
    | 'dismissal'
    | 'retrenchment'
    | 'retirement'
    | 'death'
    | 'contract_end'
    | 'mutual_separation'
    | 'absconded';

export interface Termination {
    id: string;
    employeeId: string;
    type: TerminationType;
    terminationDate: Date;
    lastWorkingDay: Date;
    noticePeriodDays: number;
    noticePeriodServed: boolean;
    reasonCategory: string;
    reasonDetails?: string;

    // Final pay
    leavePayoutDays?: number;
    leavePayoutAmount?: number;
    noticePayout?: number;
    otherPayouts?: number;
    deductions?: number;

    // Documentation
    exitInterviewCompleted: boolean;
    exitInterviewNotes?: string;
    documentsReturned?: string[];

    // Approval
    approvedBy?: string;
    approvalDate?: Date;

    // Final payroll link
    finalPayrollId?: string;

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// EMPLOYEE DOCUMENTS
// ============================================================

export type DocumentCategory =
    | 'identity'
    | 'contract'
    | 'qualification'
    | 'medical'
    | 'bank_proof'
    | 'tax'
    | 'warning'
    | 'performance'
    | 'training'
    | 'other';

export type DocumentAccessLevel = 'employee' | 'hr' | 'payroll' | 'ir' | 'restricted';

export interface EmployeeDocument {
    id: string;
    employeeId: string;
    companyId: string;

    name: string;
    description?: string;
    category: DocumentCategory;
    accessLevel: DocumentAccessLevel;

    // File details
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;

    // Expiry tracking
    hasExpiry: boolean;
    expiryDate?: Date;
    expiryReminderSent?: boolean;

    // Verification
    isVerified: boolean;
    verifiedBy?: string;
    verifiedDate?: Date;

    // Metadata
    tags?: string[];
    notes?: string;

    uploadedBy: string;
    uploadedAt: Date;
    updatedAt?: Date;
}

// ============================================================
// ONBOARDING
// ============================================================

export interface OnboardingChecklist {
    id: string;
    employeeId: string;
    companyId: string;
    templateId?: string;

    name: string;
    dueDate?: Date;
    completedDate?: Date;
    status: 'pending' | 'in_progress' | 'completed';

    items: OnboardingChecklistItem[];

    assignedTo?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface OnboardingChecklistItem {
    id: string;
    name: string;
    description?: string;
    category: string;
    isRequired: boolean;
    requiresDocument: boolean;
    documentCategory?: DocumentCategory;
    dueDate?: Date;

    isCompleted: boolean;
    completedBy?: string;
    completedDate?: Date;
    documentId?: string;
    notes?: string;

    sortOrder: number;
}

// ============================================================
// EMPLOYEE PAY ELEMENTS (Individual assignments)
// ============================================================

export interface EmployeePayElement {
    id: string;
    employeeId: string;
    payElementId: string;
    payElementName?: string; // Denormalized

    amount?: number;
    percentage?: number;

    isRecurring: boolean;
    startDate?: Date;
    endDate?: Date;

    notes?: string;

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// LOANS & GARNISHEES
// ============================================================

export interface EmployeeLoan {
    id: string;
    employeeId: string;
    companyId: string;

    loanType: 'company_loan' | 'advance' | 'other';
    description: string;

    principalAmount: number;
    interestRate: number;
    instalmentAmount: number;
    totalInstalments: number;
    remainingInstalments: number;
    outstandingBalance: number;

    startDate: Date;
    endDate?: Date;

    status: 'active' | 'completed' | 'written_off' | 'suspended';

    notes?: string;
    approvedBy?: string;
    approvalDate?: Date;

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Garnishee {
    id: string;
    employeeId: string;
    companyId: string;

    caseNumber: string;
    courtOrder?: string;
    creditorName: string;
    creditorReference?: string;

    garnisheeType: 'emoluments_attachment' | 'administration_order' | 'maintenance' | 'other';

    totalAmount?: number;
    instalmentAmount: number;
    remainingBalance?: number;

    priority: number; // Order of deduction

    startDate: Date;
    endDate?: Date;

    status: 'active' | 'completed' | 'suspended';

    // Payment details
    paymentMethod?: string;
    paymentReference?: string;

    notes?: string;

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}
