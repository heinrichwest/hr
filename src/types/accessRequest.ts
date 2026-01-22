// ============================================================
// ACCESS REQUEST TYPES
// Types for user sign-up access requests and approval workflow
// ============================================================

import { Timestamp } from 'firebase/firestore';
import type { UserRole } from './user';

/**
 * Status of an access request
 */
export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * Access Request interface
 * Represents a user's request for system access, pending admin approval
 */
export interface AccessRequest {
    /** Unique identifier for the access request */
    id: string;

    /** Email address of the user requesting access */
    email: string;

    /** First name of the user */
    firstName: string;

    /** Last name of the user */
    lastName: string;

    /** Hashed password (stored securely until approval) */
    passwordHash: string;

    /** Current status of the request */
    status: AccessRequestStatus;

    /** Timestamp when the request was created */
    createdAt: Timestamp;

    /** Timestamp when the request was reviewed (approved/rejected) */
    reviewedAt: Timestamp | null;

    /** User ID of the admin who reviewed the request */
    reviewedBy: string | null;

    /** Role assigned upon approval */
    assignedRole: UserRole | null;

    /** Company ID assigned upon approval */
    assignedCompanyId: string | null;

    /** Optional employee record ID linked upon approval */
    linkedEmployeeId: string | null;

    /** Optional take-on sheet ID linked for onboarding */
    takeOnSheetId?: string | null;
}

/**
 * Data required to create a new access request
 */
export interface CreateAccessRequestData {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
}

/**
 * Data required when approving an access request
 */
export interface ApproveAccessRequestData {
    /** ID of the admin approving the request */
    reviewerId: string;

    /** Role to assign to the user */
    assignedRole: UserRole;

    /** Company to assign the user to */
    assignedCompanyId: string;

    /** Optional employee record to link */
    linkedEmployeeId?: string | null;
}
