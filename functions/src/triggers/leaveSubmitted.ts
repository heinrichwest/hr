// ============================================================
// LEAVE SUBMITTED TRIGGER
// Sends notification to manager when employee submits leave request
// ============================================================

import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import { getUserEmailByUserId, clearUserCache } from '../utils/userLookup';
import { sendEmail } from '../utils/sendEmail';
import {
    renderLeaveSubmittedEmail,
    getLeaveSubmittedSubject,
} from '../templates/leaveSubmitted';

/**
 * Firestore timestamp type from leave request document
 */
interface FirestoreTimestamp {
    seconds: number;
    nanoseconds: number;
}

/**
 * Leave request data structure from Firestore
 */
interface LeaveRequestData {
    status: string;
    employeeId: string;
    employeeName?: string;
    companyId: string;
    currentApprover?: string;
    leaveTypeName?: string;
    startDate: Date | FirestoreTimestamp;
    endDate: Date | FirestoreTimestamp;
    totalDays: number;
    workingDays?: number;
    reason?: string;
}

/**
 * Result of the leave submitted handler
 */
export interface LeaveSubmittedResult {
    success: boolean;
    emailSent?: boolean;
    skipped?: boolean;
    reason?: string;
    error?: string;
    mailDocId?: string;
    logId?: string;
}

/**
 * Handler function for leave submitted trigger.
 * Extracted for testability.
 *
 * @param event - Firestore document created event
 * @returns Promise<LeaveSubmittedResult>
 */
export async function handleLeaveSubmitted(
    event: FirestoreEvent<QueryDocumentSnapshot | undefined, { requestId: string }>
): Promise<LeaveSubmittedResult> {
    const requestId = event.params.requestId;
    const snapshot = event.data;

    if (!snapshot) {
        console.error(`No data for leave request ${requestId}`);
        return { success: false, error: 'No document data' };
    }

    // Clear user cache at start of function execution
    clearUserCache();

    const leaveRequest = snapshot.data() as LeaveRequestData;

    // Only send notification for pending status
    if (leaveRequest.status !== 'pending') {
        console.log(`Skipping notification for leave request ${requestId}: status is ${leaveRequest.status}`);
        return { success: true, skipped: true, reason: 'Status is not pending' };
    }

    // Get manager (current approver) to notify
    const approverId = leaveRequest.currentApprover;
    if (!approverId) {
        console.warn(`Leave request ${requestId} has no currentApprover assigned`);
        return { success: true, skipped: true, reason: 'No approver assigned' };
    }

    // Look up manager email
    const managerResult = await getUserEmailByUserId(approverId);
    if (!managerResult.found || !managerResult.email) {
        console.warn(`Could not find email for approver ${approverId}`);
        return { success: true, skipped: true, reason: 'Approver email not found' };
    }

    // Extract leave request details
    const employeeName = leaveRequest.employeeName || 'An employee';
    const leaveType = leaveRequest.leaveTypeName || 'Leave';
    const startDate = leaveRequest.startDate;
    const endDate = leaveRequest.endDate;
    const totalDays = leaveRequest.totalDays || leaveRequest.workingDays || 1;
    const reason = leaveRequest.reason;

    // Generate email content
    const subject = getLeaveSubmittedSubject(employeeName);
    const html = renderLeaveSubmittedEmail({
        employeeName,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
    });

    // Send email
    const emailResult = await sendEmail({
        to: managerResult.email,
        subject,
        html,
        emailType: 'leave_submitted',
        recipientUserId: approverId,
        companyId: leaveRequest.companyId,
        relatedDocumentId: requestId,
        relatedCollection: 'leaveRequests',
    });

    if (emailResult.success) {
        console.log(
            `Leave submitted notification sent for request ${requestId} to ${managerResult.email}`
        );
        return {
            success: true,
            emailSent: true,
            mailDocId: emailResult.mailDocId,
            logId: emailResult.logId,
        };
    } else {
        console.error(
            `Failed to send leave submitted notification for request ${requestId}: ${emailResult.error}`
        );
        return {
            success: false,
            emailSent: false,
            error: emailResult.error,
            logId: emailResult.logId,
        };
    }
}

/**
 * Cloud Function trigger for new leave requests.
 * Fires when a document is created in the leaveRequests collection.
 * Sends notification to the assigned approver (manager) for pending requests.
 */
export const onLeaveRequestCreated = onDocumentCreated(
    'leaveRequests/{requestId}',
    handleLeaveSubmitted
);
