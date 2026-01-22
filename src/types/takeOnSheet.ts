// ============================================================
// TAKE-ON SHEET TYPES
// Types for employee onboarding take-on sheet workflow
// ============================================================

import type { Address } from './company';
import type { UserRole } from './user';

/**
 * Status of a take-on sheet in the onboarding workflow
 * - draft: Initial creation by manager, can be edited
 * - pending_hr_review: Submitted for HR to review and complete documents
 * - pending_it_setup: HR approved, waiting for IT to configure system access
 * - complete: All sections completed, ready for employee creation
 */
export type TakeOnSheetStatus = 'draft' | 'pending_hr_review' | 'pending_it_setup' | 'complete';

/**
 * Employment type for the new employee
 */
export type EmploymentType = 'fixed' | 'pwe' | 'permanent';

/**
 * Document types required for payroll/HR
 */
export type TakeOnDocumentType =
    | 'sarsLetter'
    | 'bankProof'
    | 'certifiedId'
    | 'signedContract'
    | 'cvQualifications'
    | 'marisit'
    | 'eaa1Form';

/**
 * Title options for personal details
 */
export type PersonTitle = 'Mr' | 'Mrs' | 'Miss' | 'Ms';

/**
 * Race classification options (SA Employment Equity)
 */
export type RaceClassification = 'African' | 'Asian' | 'Coloured' | 'Chinese' | 'European' | 'Indian';

/**
 * Document metadata for uploaded files
 */
export interface TakeOnDocument {
    /** Original file name */
    fileName: string;

    /** Firebase Storage path */
    storagePath: string;

    /** Timestamp when uploaded */
    uploadedAt: Date;

    /** User ID who uploaded */
    uploadedBy: string;

    /** File size in bytes */
    fileSize: number;

    /** MIME type (application/pdf, image/jpeg, image/png) */
    mimeType: string;

    /** Download URL (optional, generated on read) */
    downloadUrl?: string;
}

/**
 * System access options for new employee
 * 10 boolean fields for each system
 */
export interface SystemAccess {
    /** Employee Self Service portal */
    ess: boolean;

    /** Manager Self Service portal */
    mss: boolean;

    /** ZOHO business applications */
    zoho: boolean;

    /** Learning Management System */
    lms: boolean;

    /** SOPHOS security software */
    sophos: boolean;

    /** Microsoft Office suite */
    msOffice: boolean;

    /** Bizvoip phone system */
    bizvoip: boolean;

    /** Email account */
    email: boolean;

    /** Microsoft Teams */
    teams: boolean;

    /** Mimecast email security */
    mimecast: boolean;
}

/**
 * Status change record for audit trail
 */
export interface StatusChange {
    /** Previous status */
    fromStatus: TakeOnSheetStatus;

    /** New status */
    toStatus: TakeOnSheetStatus;

    /** User ID who made the change */
    changedBy: string;

    /** Timestamp of change */
    changedAt: Date;

    /** Optional notes about the transition */
    notes?: string;
}

/**
 * Employment information section
 */
export interface EmploymentInfo {
    /** Type of employment */
    employmentType: EmploymentType;

    /** Is this a contract position */
    isContract: boolean;

    /** Contract period in months (if isContract) */
    contractPeriodMonths?: number;

    /** Job title ID from jobTitles collection */
    jobTitleId: string;

    /** Department ID from departments collection */
    departmentId: string;

    /** Monthly salary amount */
    salary: number;

    /** Salary currency (default ZAR) */
    currency: string;

    /** Employment start date */
    dateOfEmployment: Date;

    /** Manager/Reports to employee ID */
    reportsTo: string;
}

/**
 * Personal details section
 */
export interface PersonalDetails {
    /** Title (Mr, Mrs, Miss, Ms) */
    title: PersonTitle;

    /** First name */
    firstName: string;

    /** Last name */
    lastName: string;

    /** Race classification for Employment Equity */
    race: RaceClassification;

    /** Physical/residential address */
    physicalAddress: Address;

    /** Postal address */
    postalAddress: Address;

    /** Use physical address as postal address */
    postalSameAsPhysical: boolean;

    /** South African ID number */
    idNumber: string;

    /** Contact phone number */
    contactNumber: string;

    /** Does the employee have a disability */
    hasDisability: boolean;

    /** Disability details (if hasDisability) */
    disabilityDetails?: string;

    /** Employee acknowledgement checkbox */
    employeeAcknowledgement: boolean;
}

/**
 * Main Take-On Sheet interface
 * Represents a complete onboarding form for a new employee
 */
export interface TakeOnSheet {
    /** Unique identifier */
    id: string;

    /** Company/Tenant ID for isolation */
    companyId: string;

    /** Current workflow status */
    status: TakeOnSheetStatus;

    /** Employment information section */
    employmentInfo: EmploymentInfo;

    /** Personal details section */
    personalDetails: PersonalDetails;

    /** System access requirements */
    systemAccess: SystemAccess;

    /** Uploaded documents keyed by document type */
    documents: Partial<Record<TakeOnDocumentType, TakeOnDocument>>;

    /** Status change history for audit trail */
    statusHistory: StatusChange[];

    /** User ID who created the sheet (usually manager) */
    createdBy: string;

    /** Creation timestamp */
    createdAt: Date;

    /** Last update timestamp */
    updatedAt: Date;

    /** User ID who last updated */
    updatedBy: string;

    /** Linked access request ID (for sign-up approval flow) */
    accessRequestId?: string;

    /** Linked employee ID (after employee creation) */
    employeeId?: string;
}

/**
 * Data required to create a new take-on sheet
 * Manager provides initial employment info
 */
export interface CreateTakeOnSheetData {
    /** Company/Tenant ID */
    companyId: string;

    /** User ID of creator (manager) */
    createdBy: string;

    /** Initial employment information */
    employmentInfo: EmploymentInfo;

    /** Optional access request ID to link */
    accessRequestId?: string;
}

/**
 * Data for updating a take-on sheet
 * Partial updates to any section
 */
export interface UpdateTakeOnSheetData {
    /** User ID making the update */
    updatedBy: string;

    /** Employment info updates */
    employmentInfo?: Partial<EmploymentInfo>;

    /** Personal details updates */
    personalDetails?: Partial<PersonalDetails>;

    /** System access updates */
    systemAccess?: Partial<SystemAccess>;
}

/**
 * Data for transitioning status
 */
export interface TransitionTakeOnSheetData {
    /** New status to transition to */
    newStatus: TakeOnSheetStatus;

    /** User ID making the transition */
    userId: string;

    /** Optional notes about the transition */
    notes?: string;
}

/**
 * Valid status transitions map
 * Defines which statuses can transition to which
 */
export const VALID_STATUS_TRANSITIONS: Record<TakeOnSheetStatus, TakeOnSheetStatus[]> = {
    draft: ['pending_hr_review'],
    pending_hr_review: ['pending_it_setup'],
    pending_it_setup: ['complete'],
    complete: [],
};

/**
 * Section names for permission checking
 */
export type TakeOnSheetSection = 'employment' | 'personal' | 'documents' | 'systemAccess';

/**
 * Permission matrix for editing sections
 * Maps role -> section -> allowed statuses
 */
export const SECTION_EDIT_PERMISSIONS: Record<UserRole, Record<TakeOnSheetSection, TakeOnSheetStatus[]>> = {
    'System Admin': {
        employment: ['draft', 'pending_hr_review', 'pending_it_setup'],
        personal: ['draft', 'pending_hr_review', 'pending_it_setup'],
        documents: ['draft', 'pending_hr_review', 'pending_it_setup'],
        systemAccess: ['draft', 'pending_hr_review', 'pending_it_setup'],
    },
    'HR Admin': {
        employment: ['draft', 'pending_hr_review'],
        personal: ['draft', 'pending_hr_review'],
        documents: ['draft', 'pending_hr_review', 'pending_it_setup'],
        systemAccess: ['draft', 'pending_hr_review', 'pending_it_setup'],
    },
    'HR Manager': {
        employment: ['draft', 'pending_hr_review'],
        personal: ['draft', 'pending_hr_review'],
        documents: ['draft', 'pending_hr_review', 'pending_it_setup'],
        systemAccess: ['draft', 'pending_hr_review', 'pending_it_setup'],
    },
    'Line Manager': {
        employment: ['draft'],
        personal: [],
        documents: [],
        systemAccess: [],
    },
    'Employee': {
        employment: [],
        personal: ['draft', 'pending_hr_review'],
        documents: [],
        systemAccess: [],
    },
    'Payroll Admin': {
        employment: [],
        personal: [],
        documents: ['draft', 'pending_hr_review'],
        systemAccess: [],
    },
    'Payroll Manager': {
        employment: [],
        personal: [],
        documents: ['draft', 'pending_hr_review'],
        systemAccess: [],
    },
    'Finance Approver': {
        employment: [],
        personal: [],
        documents: [],
        systemAccess: [],
    },
    'Finance Read-Only': {
        employment: [],
        personal: [],
        documents: [],
        systemAccess: [],
    },
    'IR Officer': {
        employment: [],
        personal: [],
        documents: [],
        systemAccess: [],
    },
    'IR Manager': {
        employment: [],
        personal: [],
        documents: [],
        systemAccess: [],
    },
};

/**
 * Default system access (all false)
 */
export const DEFAULT_SYSTEM_ACCESS: SystemAccess = {
    ess: false,
    mss: false,
    zoho: false,
    lms: false,
    sophos: false,
    msOffice: false,
    bizvoip: false,
    email: false,
    teams: false,
    mimecast: false,
};

/**
 * Document type labels for display
 */
export const DOCUMENT_TYPE_LABELS: Record<TakeOnDocumentType, string> = {
    sarsLetter: 'SARS Letter',
    bankProof: 'Proof of Bank Account',
    certifiedId: 'Certified ID Copy',
    signedContract: 'Signed Contract',
    cvQualifications: 'CV and Qualifications',
    marisit: 'MARISIT',
    eaa1Form: 'EAA1 Form',
};

/**
 * Status labels for display
 */
export const STATUS_LABELS: Record<TakeOnSheetStatus, string> = {
    draft: 'Draft',
    pending_hr_review: 'Pending HR Review',
    pending_it_setup: 'Pending IT Setup',
    complete: 'Complete',
};
