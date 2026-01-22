// ============================================================
// ACCESS REQUEST SERVICE
// Service for managing user access requests and approval workflow
// ============================================================

import { db } from '../firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    getCountFromServer,
} from 'firebase/firestore';
import type {
    AccessRequest,
    AccessRequestStatus,
    CreateAccessRequestData,
    ApproveAccessRequestData,
} from '../types/accessRequest';

/** Firestore collection name for access requests */
const COLLECTION_NAME = 'access_requests';

export const AccessRequestService = {
    /**
     * Create a new access request
     * @param data - The access request data (email, name, password hash)
     * @returns The ID of the created access request
     * @throws Error if a pending or approved request already exists for the email
     */
    async createAccessRequest(data: CreateAccessRequestData): Promise<string> {
        // Check if there's already a pending or approved request for this email
        const existingRequest = await this.getAccessRequestByEmail(data.email);

        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                throw new Error('An access request for this email is already pending.');
            }
            if (existingRequest.status === 'approved') {
                throw new Error('An account with this email already exists.');
            }
            // If rejected, allow re-submission by creating a new request
        }

        // Generate a new document ID
        const docRef = doc(collection(db, COLLECTION_NAME));

        const accessRequest: Omit<AccessRequest, 'id'> & { id: string } = {
            id: docRef.id,
            email: data.email.toLowerCase().trim(),
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            passwordHash: data.passwordHash,
            status: 'pending',
            createdAt: serverTimestamp() as unknown as AccessRequest['createdAt'],
            reviewedAt: null,
            reviewedBy: null,
            assignedRole: null,
            assignedCompanyId: null,
            linkedEmployeeId: null,
        };

        await setDoc(docRef, accessRequest);

        return docRef.id;
    },

    /**
     * Get an access request by email
     * Returns the most recent non-rejected request, or a rejected one if no others exist
     * @param email - Email address to search for
     * @returns The access request or null if not found
     */
    async getAccessRequestByEmail(email: string): Promise<AccessRequest | null> {
        const normalizedEmail = email.toLowerCase().trim();
        const accessRequestsRef = collection(db, COLLECTION_NAME);

        // First, look for pending or approved requests
        const activeQuery = query(
            accessRequestsRef,
            where('email', '==', normalizedEmail),
            where('status', 'in', ['pending', 'approved'])
        );

        const activeSnapshot = await getDocs(activeQuery);

        if (!activeSnapshot.empty) {
            return activeSnapshot.docs[0].data() as AccessRequest;
        }

        // If no active requests, check for any request (including rejected)
        const allQuery = query(
            accessRequestsRef,
            where('email', '==', normalizedEmail)
        );

        const allSnapshot = await getDocs(allQuery);

        if (!allSnapshot.empty) {
            // Return the most recent one
            const requests = allSnapshot.docs.map(doc => doc.data() as AccessRequest);
            requests.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
            return requests[0];
        }

        return null;
    },

    /**
     * Get an access request by ID
     * @param requestId - The access request document ID
     * @returns The access request or null if not found
     */
    async getAccessRequestById(requestId: string): Promise<AccessRequest | null> {
        const docRef = doc(db, COLLECTION_NAME, requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as AccessRequest;
        }

        return null;
    },

    /**
     * Get all pending access requests
     * @returns Array of pending access requests, sorted by creation date (newest first)
     */
    async getPendingAccessRequests(): Promise<AccessRequest[]> {
        const accessRequestsRef = collection(db, COLLECTION_NAME);
        const pendingQuery = query(
            accessRequestsRef,
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(pendingQuery);
        return snapshot.docs.map(doc => doc.data() as AccessRequest);
    },

    /**
     * Get count of pending access requests
     * Used for displaying badge count in navigation
     * @returns Number of pending requests
     */
    async getPendingRequestsCount(): Promise<number> {
        const accessRequestsRef = collection(db, COLLECTION_NAME);
        const pendingQuery = query(
            accessRequestsRef,
            where('status', '==', 'pending')
        );

        const snapshot = await getCountFromServer(pendingQuery);
        return snapshot.data().count;
    },

    /**
     * Approve an access request
     * Updates the request status and assigns role/company
     * @param requestId - The access request document ID
     * @param approvalData - Data including reviewer ID, role, and company
     * @param skipTakeOnSheetCheck - Skip the take-on sheet check (for legacy requests)
     * @returns The updated access request
     * @throws Error if request not found, not in pending status, or take-on sheet incomplete
     */
    async approveAccessRequest(
        requestId: string,
        approvalData: ApproveAccessRequestData,
        skipTakeOnSheetCheck = false
    ): Promise<AccessRequest> {
        const docRef = doc(db, COLLECTION_NAME, requestId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Access request not found.');
        }

        const currentRequest = docSnap.data() as AccessRequest;

        if (currentRequest.status !== 'pending') {
            throw new Error(`Cannot approve request with status: ${currentRequest.status}`);
        }

        // Check for completed take-on sheet if request has one linked
        if (!skipTakeOnSheetCheck && currentRequest.takeOnSheetId) {
            const takeOnSheetsRef = collection(db, 'takeOnSheets');
            const sheetQuery = query(
                takeOnSheetsRef,
                where('accessRequestId', '==', requestId)
            );

            const sheetSnapshot = await getDocs(sheetQuery);

            if (!sheetSnapshot.empty) {
                const sheet = sheetSnapshot.docs[0].data();
                if (sheet.status !== 'complete') {
                    throw new Error(
                        'Cannot approve access request: Take-on sheet is not complete. ' +
                        `Current status: ${sheet.status}. ` +
                        'Please complete the take-on sheet before approving this request.'
                    );
                }
            }
        }

        const updateData = {
            status: 'approved' as AccessRequestStatus,
            reviewedAt: serverTimestamp(),
            reviewedBy: approvalData.reviewerId,
            assignedRole: approvalData.assignedRole,
            assignedCompanyId: approvalData.assignedCompanyId,
            linkedEmployeeId: approvalData.linkedEmployeeId || null,
        };

        await updateDoc(docRef, updateData);

        // Fetch and return the updated document
        const updatedSnap = await getDoc(docRef);
        return updatedSnap.data() as AccessRequest;
    },

    /**
     * Reject an access request
     * @param requestId - The access request document ID
     * @param reviewerId - The ID of the admin rejecting the request
     * @returns The updated access request
     * @throws Error if request not found or not in pending status
     */
    async rejectAccessRequest(
        requestId: string,
        reviewerId: string
    ): Promise<AccessRequest> {
        const docRef = doc(db, COLLECTION_NAME, requestId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Access request not found.');
        }

        const currentRequest = docSnap.data() as AccessRequest;

        if (currentRequest.status !== 'pending') {
            throw new Error(`Cannot reject request with status: ${currentRequest.status}`);
        }

        const updateData = {
            status: 'rejected' as AccessRequestStatus,
            reviewedAt: serverTimestamp(),
            reviewedBy: reviewerId,
        };

        await updateDoc(docRef, updateData);

        // Fetch and return the updated document
        const updatedSnap = await getDoc(docRef);
        return updatedSnap.data() as AccessRequest;
    },

    /**
     * Get all access requests with a specific status
     * @param status - The status to filter by
     * @returns Array of access requests with the specified status
     */
    async getAccessRequestsByStatus(status: AccessRequestStatus): Promise<AccessRequest[]> {
        const accessRequestsRef = collection(db, COLLECTION_NAME);
        const statusQuery = query(
            accessRequestsRef,
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(statusQuery);
        return snapshot.docs.map(doc => doc.data() as AccessRequest);
    },
};
