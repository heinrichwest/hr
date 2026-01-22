// ============================================================
// TAKE-ON SHEET SERVICE
// Service for managing employee take-on sheet workflow
// ============================================================

import { db } from '../firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import type {
    TakeOnSheet,
    TakeOnSheetStatus,
    CreateTakeOnSheetData,
    UpdateTakeOnSheetData,
    StatusChange,
    TakeOnSheetSection,
} from '../types/takeOnSheet';
import type { UserRole } from '../types/user';

/** Firestore collection name for take-on sheets */
const COLLECTION_NAME = 'takeOnSheets';

/**
 * Valid status transitions - forward only
 */
const VALID_TRANSITIONS: Record<TakeOnSheetStatus, TakeOnSheetStatus[]> = {
    draft: ['pending_hr_review'],
    pending_hr_review: ['pending_it_setup'],
    pending_it_setup: ['complete'],
    complete: [],
};

/**
 * Section edit permissions by role and status
 */
const EDIT_PERMISSIONS: Record<string, Record<TakeOnSheetSection, TakeOnSheetStatus[]>> = {
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
    'IR Manager': {
        employment: [],
        personal: [],
        documents: [],
        systemAccess: [],
    },
    'Recruitment Manager': {
        employment: ['draft'],
        personal: [],
        documents: [],
        systemAccess: [],
    },
    'Training Manager': {
        employment: [],
        personal: [],
        documents: [],
        systemAccess: [],
    },
};

export const TakeOnSheetService = {
    /**
     * Create a new take-on sheet
     * @param data - Initial creation data from manager
     * @returns The ID of the created take-on sheet
     */
    async createTakeOnSheet(data: CreateTakeOnSheetData): Promise<string> {
        const docRef = doc(collection(db, COLLECTION_NAME));

        const takeOnSheet: TakeOnSheet = {
            id: docRef.id,
            companyId: data.companyId,
            status: 'draft',
            employmentInfo: data.employmentInfo,
            personalDetails: {
                title: 'Mr',
                firstName: '',
                lastName: '',
                race: 'African',
                physicalAddress: {
                    line1: '',
                    city: '',
                    province: '',
                    postalCode: '',
                    country: 'South Africa',
                },
                postalAddress: {
                    line1: '',
                    city: '',
                    province: '',
                    postalCode: '',
                    country: 'South Africa',
                },
                postalSameAsPhysical: true,
                idNumber: '',
                contactNumber: '',
                hasDisability: false,
                employeeAcknowledgement: false,
            },
            systemAccess: {
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
            },
            documents: {},
            statusHistory: [],
            createdBy: data.createdBy,
            createdAt: serverTimestamp() as unknown as Date,
            updatedAt: serverTimestamp() as unknown as Date,
            updatedBy: data.createdBy,
            accessRequestId: data.accessRequestId,
        };

        await setDoc(docRef, takeOnSheet);

        return docRef.id;
    },

    /**
     * Get a take-on sheet by ID
     * @param sheetId - The take-on sheet document ID
     * @returns The take-on sheet or null if not found
     */
    async getTakeOnSheetById(sheetId: string): Promise<TakeOnSheet | null> {
        const docRef = doc(db, COLLECTION_NAME, sheetId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as TakeOnSheet;
        }

        return null;
    },

    /**
     * Update a take-on sheet with partial data
     * @param sheetId - The take-on sheet document ID
     * @param data - The fields to update
     * @returns The updated take-on sheet
     */
    async updateTakeOnSheet(
        sheetId: string,
        data: UpdateTakeOnSheetData
    ): Promise<TakeOnSheet> {
        const docRef = doc(db, COLLECTION_NAME, sheetId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Take-on sheet not found.');
        }

        const currentSheet = docSnap.data() as TakeOnSheet;

        // Build update object
        const updateData: Record<string, unknown> = {
            updatedAt: serverTimestamp(),
            updatedBy: data.updatedBy,
        };

        // Merge employment info if provided
        if (data.employmentInfo) {
            updateData.employmentInfo = {
                ...currentSheet.employmentInfo,
                ...data.employmentInfo,
            };
        }

        // Merge personal details if provided
        if (data.personalDetails) {
            updateData.personalDetails = {
                ...currentSheet.personalDetails,
                ...data.personalDetails,
            };
        }

        // Merge system access if provided
        if (data.systemAccess) {
            updateData.systemAccess = {
                ...currentSheet.systemAccess,
                ...data.systemAccess,
            };
        }

        await updateDoc(docRef, updateData);

        // Fetch and return updated document
        const updatedSnap = await getDoc(docRef);
        return updatedSnap.data() as TakeOnSheet;
    },

    /**
     * Delete a take-on sheet (draft only)
     * @param sheetId - The take-on sheet document ID
     */
    async deleteTakeOnSheet(sheetId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, sheetId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Take-on sheet not found.');
        }

        const sheet = docSnap.data() as TakeOnSheet;

        if (sheet.status !== 'draft') {
            throw new Error('Can only delete take-on sheets in draft status.');
        }

        await deleteDoc(docRef);
    },

    /**
     * Get all take-on sheets for a company
     * @param companyId - The company ID for tenant isolation
     * @returns Array of take-on sheets
     */
    async getTakeOnSheetsByCompany(companyId: string): Promise<TakeOnSheet[]> {
        const sheetsRef = collection(db, COLLECTION_NAME);
        const companyQuery = query(
            sheetsRef,
            where('companyId', '==', companyId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(companyQuery);
        return snapshot.docs.map(doc => doc.data() as TakeOnSheet);
    },

    /**
     * Get take-on sheets by status for a company
     * @param companyId - The company ID for tenant isolation
     * @param status - The status to filter by
     * @returns Array of take-on sheets
     */
    async getTakeOnSheetsByStatus(
        companyId: string,
        status: TakeOnSheetStatus
    ): Promise<TakeOnSheet[]> {
        const sheetsRef = collection(db, COLLECTION_NAME);
        const statusQuery = query(
            sheetsRef,
            where('companyId', '==', companyId),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(statusQuery);
        return snapshot.docs.map(doc => doc.data() as TakeOnSheet);
    },

    /**
     * Get a take-on sheet by access request ID
     * @param accessRequestId - The linked access request ID
     * @returns The take-on sheet or null
     */
    async getTakeOnSheetByAccessRequestId(
        accessRequestId: string
    ): Promise<TakeOnSheet | null> {
        const sheetsRef = collection(db, COLLECTION_NAME);
        const accessQuery = query(
            sheetsRef,
            where('accessRequestId', '==', accessRequestId)
        );

        const snapshot = await getDocs(accessQuery);

        if (snapshot.empty) {
            return null;
        }

        return snapshot.docs[0].data() as TakeOnSheet;
    },

    /**
     * Get take-on sheets created by a specific user
     * @param companyId - The company ID for tenant isolation
     * @param userId - The user who created the sheets
     * @returns Array of take-on sheets
     */
    async getTakeOnSheetsByCreator(
        companyId: string,
        userId: string
    ): Promise<TakeOnSheet[]> {
        const sheetsRef = collection(db, COLLECTION_NAME);
        const creatorQuery = query(
            sheetsRef,
            where('companyId', '==', companyId),
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(creatorQuery);
        return snapshot.docs.map(doc => doc.data() as TakeOnSheet);
    },

    /**
     * Transition the status of a take-on sheet
     * Enforces valid forward-only transitions
     * @param sheetId - The take-on sheet document ID
     * @param newStatus - The new status to transition to
     * @param userId - The user making the transition
     * @param notes - Optional notes about the transition
     * @returns The updated take-on sheet
     */
    async transitionStatus(
        sheetId: string,
        newStatus: TakeOnSheetStatus,
        userId: string,
        notes?: string
    ): Promise<TakeOnSheet> {
        const docRef = doc(db, COLLECTION_NAME, sheetId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Take-on sheet not found.');
        }

        const sheet = docSnap.data() as TakeOnSheet;
        const currentStatus = sheet.status;

        // Validate transition
        const validNextStatuses = VALID_TRANSITIONS[currentStatus];
        if (!validNextStatuses.includes(newStatus)) {
            throw new Error(
                `Invalid status transition from '${currentStatus}' to '${newStatus}'. ` +
                `Valid transitions from '${currentStatus}': ${validNextStatuses.join(', ') || 'none'}`
            );
        }

        // Create status change record
        const statusChange: StatusChange = {
            fromStatus: currentStatus,
            toStatus: newStatus,
            changedBy: userId,
            changedAt: new Date(),
            notes,
        };

        // Update document
        const updateData = {
            status: newStatus,
            statusHistory: [...sheet.statusHistory, statusChange],
            updatedAt: serverTimestamp(),
            updatedBy: userId,
        };

        await updateDoc(docRef, updateData);

        // Fetch and return updated document
        const updatedSnap = await getDoc(docRef);
        return updatedSnap.data() as TakeOnSheet;
    },

    /**
     * Link a take-on sheet to a created employee
     * Sets the employeeId field after employee record is created
     * @param sheetId - The take-on sheet document ID
     * @param employeeId - The created employee ID
     * @param userId - The user making the update
     * @returns The updated take-on sheet
     */
    async linkToEmployee(
        sheetId: string,
        employeeId: string,
        userId: string
    ): Promise<TakeOnSheet> {
        const docRef = doc(db, COLLECTION_NAME, sheetId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Take-on sheet not found.');
        }

        const sheet = docSnap.data() as TakeOnSheet;

        // Only allow linking if status is complete
        if (sheet.status !== 'complete') {
            throw new Error('Can only link employee to a completed take-on sheet.');
        }

        // Check if already linked
        if (sheet.employeeId) {
            throw new Error(`Take-on sheet is already linked to employee ${sheet.employeeId}.`);
        }

        await updateDoc(docRef, {
            employeeId,
            updatedAt: serverTimestamp(),
            updatedBy: userId,
        });

        // Fetch and return updated document
        const updatedSnap = await getDoc(docRef);
        return updatedSnap.data() as TakeOnSheet;
    },

    /**
     * Check if a user can edit a specific section
     * @param userRole - The user's role
     * @param section - The section to check
     * @param sheetStatus - The current status of the sheet
     * @returns Whether the user can edit the section
     */
    canEditSection(
        userRole: UserRole,
        section: TakeOnSheetSection,
        sheetStatus: TakeOnSheetStatus
    ): boolean {
        const rolePermissions = EDIT_PERMISSIONS[userRole];
        if (!rolePermissions) {
            return false;
        }

        const allowedStatuses = rolePermissions[section];
        return allowedStatuses.includes(sheetStatus);
    },

    /**
     * Check if a user can transition to a specific status
     * @param userRole - The user's role
     * @param fromStatus - The current status
     * @param toStatus - The target status
     * @returns Whether the user can make the transition
     */
    canTransitionStatus(
        userRole: UserRole,
        fromStatus: TakeOnSheetStatus,
        toStatus: TakeOnSheetStatus
    ): boolean {
        // First check if the transition is valid
        const validNextStatuses = VALID_TRANSITIONS[fromStatus];
        if (!validNextStatuses.includes(toStatus)) {
            return false;
        }

        // System Admin and HR Admin can make any valid transition
        if (userRole === 'System Admin' || userRole === 'HR Admin') {
            return true;
        }

        // HR Manager can transition draft -> pending_hr_review and pending_hr_review -> pending_it_setup
        if (userRole === 'HR Manager') {
            return (
                (fromStatus === 'draft' && toStatus === 'pending_hr_review') ||
                (fromStatus === 'pending_hr_review' && toStatus === 'pending_it_setup')
            );
        }

        // Line Manager can only submit for HR review
        if (userRole === 'Line Manager') {
            return fromStatus === 'draft' && toStatus === 'pending_hr_review';
        }

        return false;
    },

    /**
     * Check if a take-on sheet is complete and ready for employee creation
     * @param sheetId - The take-on sheet document ID
     * @returns Whether the sheet is complete
     */
    async isComplete(sheetId: string): Promise<boolean> {
        const sheet = await this.getTakeOnSheetById(sheetId);
        return sheet?.status === 'complete';
    },

    /**
     * Check if a take-on sheet can have an employee created from it
     * @param sheet - The take-on sheet
     * @returns Object with canCreate flag and reason if not
     */
    canCreateEmployee(sheet: TakeOnSheet): { canCreate: boolean; reason?: string } {
        if (sheet.status !== 'complete') {
            return {
                canCreate: false,
                reason: 'Take-on sheet must be completed before creating an employee.',
            };
        }

        if (sheet.employeeId) {
            return {
                canCreate: false,
                reason: `An employee has already been created from this take-on sheet (Employee ID: ${sheet.employeeId}).`,
            };
        }

        // Check required personal details
        if (!sheet.personalDetails.firstName || !sheet.personalDetails.lastName) {
            return {
                canCreate: false,
                reason: 'Employee first name and last name are required.',
            };
        }

        if (!sheet.personalDetails.idNumber) {
            return {
                canCreate: false,
                reason: 'Employee ID number is required.',
            };
        }

        return { canCreate: true };
    },

    /**
     * Get the count of take-on sheets by status for a company
     * @param companyId - The company ID
     * @returns Count object by status
     */
    async getCountsByStatus(
        companyId: string
    ): Promise<Record<TakeOnSheetStatus, number>> {
        const sheets = await this.getTakeOnSheetsByCompany(companyId);

        const counts: Record<TakeOnSheetStatus, number> = {
            draft: 0,
            pending_hr_review: 0,
            pending_it_setup: 0,
            complete: 0,
        };

        sheets.forEach(sheet => {
            counts[sheet.status]++;
        });

        return counts;
    },
};
