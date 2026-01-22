// ============================================================
// LEAVE STATUS CHANGED TRIGGER
// Sends notification to employee when leave request is approved/rejected
// ============================================================

import { onDocumentUpdated, FirestoreEvent, Change, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import { getUserEmailByEmployeeId, clearUserCache } from '../utils/userLookup';
import { sendEmail } from '../utils/sendEmail';
import {
    renderLeaveApprovedEmail,
    getLeaveApprovedSubject,
} from '../templates/leaveApproved';
import {
    renderLeaveRejectedEmail,
    getLeaveRejectedSubject,
} from '../templates/leaveRejected';
import type { EmailType } from '../types/emailLog';

/**
 * Firestore timestamp type from leave request document
 */
interface FirestoreTimestamp {
    seconds: number;
    nanoseconds: number;
}

/**
 * Approval record from leave request
 */
interface ApprovalRecord {
    id?: string;
    approverId?: string;
    approverName?: string;
    approverRole?: string;
    action: 'approved' | 'rejected' | 'escalated';
    comments?: string;
    actionDate?: Date | FirestoreTimestamp;
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
    totalDays?: number;
    workingDays?: number;
    reason?: string;
    approvalHistory?: ApprovalRecord[];
}

/**
 * Result of the leave status changed handler
 */
export interface LeaveStatusChangedResult {
    success: boolean;
    emailType?: EmailType;
    skipped?: boolean;
    reason?: string;
    error?: string;
    mailDocId?: string;
    logId?: string;
}

/**
 * Gets the latest approval record from the approval history
 */
function getLatestApprovalRecord(approvalHistory?: ApprovalRecord[]): ApprovalRecord | null {
    if (!approvalHistory || approvalHistory.length === 0) {
        return null;
    }
    // Return the last item in the array (most recent)
    return approvalHistory[approvalHistory.length - 1];
}

/**
 * Handler function for leave status changed trigger.
 * Extracted for testability.
 *
 * @param event - Firestore document updated event
 * @returns Promise<LeaveStatusChangedResult>
 */
export async function handleLeaveStatusChanged(
    event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { requestId: string }>
): Promise<LeaveStatusChangedResult> {
    const requestId = event.params.requestId;
    const change = event.data;

    if (!change) {
        console.error(`No data for leave request ${requestId}`);
        return { success: false, error: 'No document data' };
    }

    const beforeData = change.before.data() as LeaveRequestData;
    const afterData = change.after.data() as LeaveRequestData;

    const previousStatus = beforeData.status;
    const newStatus = afterData.status;

    // Only proceed if status changed
    if (previousStatus === newStatus) {
        console.log(`No status change for leave request ${requestId}`);
        return { success: true, skipped: true, reason: 'Status did not change' };
    }

    // Only send notifications for approved or rejected status changes from pending
    if (previousStatus !== 'pending') {
        console.log(`Skipping notification: previous status was ${previousStatus}, not pending`);
        return { success: true, skipped: true, reason: 'Previous status was not pending' };
    }

    if (newStatus !== 'approved' && newStatus !== 'rejected') {
        console.log(`Skipping notification: new status is ${newStatus}`);
        return { success: true, skipped: true, reason: `New status ${newStatus} does not require notification` };
    }

    // Clear user cache at start of function execution
    clearUserCache();

    // Look up employee email
    const employeeId = afterData.employeeId;
    const companyId = afterData.companyId;

    const employeeResult = await getUserEmailByEmployeeId(employeeId, companyId);
    if (!employeeResult.found || !employeeResult.email) {
        console.warn(`Could not find email for employee ${employeeId}`);
        return { success: true, skipped: true, reason: 'Employee email not found' };
    }

    // Extract leave request details
    const employeeName = afterData.employeeName || 'Employee';
    const leaveType = afterData.leaveTypeName || 'Leave';
    const startDate = afterData.startDate;
    const endDate = afterData.endDate;

    // Get approval details from the latest approval record
    const latestApproval = getLatestApprovalRecord(afterData.approvalHistory);
    const approverName = latestApproval?.approverName || 'Your manager';
    const comments = latestApproval?.comments;

    // Determine email type and generate content
    let subject: string;
    let html: string;
    let emailType: EmailType;

    if (newStatus === 'approved') {
        emailType = 'leave_approved';
        subject = getLeaveApprovedSubject();
        html = renderLeaveApprovedEmail({
            employeeName,
            leaveType,
            startDate,
            endDate,
            approverName,
            comments,
        });
    } else {
        // rejected
        emailType = 'leave_rejected';
        subject = getLeaveRejectedSubject();
        html = renderLeaveRejectedEmail({
            employeeName,
            leaveType,
            startDate,
            endDate,
            approverName,
            comments,
        });
    }

    // Send email
    const emailResult = await sendEmail({
        to: employeeResult.email,
        subject,
        html,
        emailType,
        recipientUserId: employeeResult.userId || employeeId,
        companyId,
        relatedDocumentId: requestId,
        relatedCollection: 'leaveRequests',
    });

    if (emailResult.success) {
        console.log(
            `Leave ${newStatus} notification sent for request ${requestId} to ${employeeResult.email}`
        );
        return {
            success: true,
            emailType,
            mailDocId: emailResult.mailDocId,
            logId: emailResult.logId,
        };
    } else {
        console.error(
            `Failed to send leave ${newStatus} notification for request ${requestId}: ${emailResult.error}`
        );
        return {
            success: false,
            emailType,
            error: emailResult.error,
            logId: emailResult.logId,
        };
    }
}

/**
 * Cloud Function trigger for leave request updates.
 * Fires when a document is updated in the leaveRequests collection.
 * Sends notification to the employee when status changes to approved or rejected.
 */
export const onLeaveStatusChanged = onDocumentUpdated(
    'leaveRequests/{requestId}',
    handleLeaveStatusChanged
);
