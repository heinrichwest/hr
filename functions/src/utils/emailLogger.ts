// ============================================================
// EMAIL LOGGER UTILITY
// Creates audit log entries for all sent emails
// ============================================================

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { CreateEmailLogData, EmailLog, DeliveryStatus } from '../types/emailLog';

/** Collection name for email logs */
const EMAIL_LOGS_COLLECTION = 'emailLogs';

/**
 * Creates a log entry for an email in the emailLogs collection.
 * Used for audit trail and delivery tracking.
 *
 * @param emailData - Data for the email log entry
 * @returns Promise<string> - The ID of the created log entry
 *
 * @example
 * ```typescript
 * const logId = await logEmail({
 *   recipientEmail: 'user@example.com',
 *   recipientUserId: 'user-123',
 *   emailType: 'leave_approved',
 *   subject: 'Your Leave Request Has Been Approved',
 *   companyId: 'company-456',
 *   deliveryStatus: 'pending',
 *   relatedDocumentId: 'leave-request-789',
 *   relatedCollection: 'leaveRequests',
 * });
 * ```
 */
export async function logEmail(emailData: CreateEmailLogData): Promise<string> {
    const db = getFirestore();

    // Create the email log document
    const logRef = db.collection(EMAIL_LOGS_COLLECTION).doc();

    const emailLogEntry: Omit<EmailLog, 'sentAt'> & { sentAt: FieldValue } = {
        id: logRef.id,
        recipientEmail: emailData.recipientEmail.toLowerCase(),
        recipientUserId: emailData.recipientUserId,
        emailType: emailData.emailType,
        subject: emailData.subject,
        sentAt: FieldValue.serverTimestamp(),
        companyId: emailData.companyId,
        deliveryStatus: emailData.deliveryStatus,
        relatedDocumentId: emailData.relatedDocumentId,
        relatedCollection: emailData.relatedCollection,
        errorMessage: emailData.errorMessage ?? null,
    };

    await logRef.set(emailLogEntry);

    return logRef.id;
}

/**
 * Updates the delivery status of an existing email log entry.
 * Called when the email delivery status changes (e.g., delivered, failed).
 *
 * @param logId - The ID of the email log entry to update
 * @param status - The new delivery status
 * @param errorMessage - Optional error message if delivery failed
 *
 * @example
 * ```typescript
 * await updateEmailStatus('log-123', 'delivered');
 * // or on failure:
 * await updateEmailStatus('log-123', 'failed', 'SMTP connection refused');
 * ```
 */
export async function updateEmailStatus(
    logId: string,
    status: DeliveryStatus,
    errorMessage?: string
): Promise<void> {
    const db = getFirestore();

    const updateData: { deliveryStatus: DeliveryStatus; errorMessage?: string } = {
        deliveryStatus: status,
    };

    if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
    }

    await db.collection(EMAIL_LOGS_COLLECTION).doc(logId).update(updateData);
}

/**
 * Retrieves an email log entry by ID.
 *
 * @param logId - The ID of the email log entry
 * @returns Promise<EmailLog | null> - The email log entry or null if not found
 */
export async function getEmailLog(logId: string): Promise<EmailLog | null> {
    const db = getFirestore();

    const docRef = await db.collection(EMAIL_LOGS_COLLECTION).doc(logId).get();

    if (!docRef.exists) {
        return null;
    }

    return docRef.data() as EmailLog;
}

/**
 * Retrieves recent email logs for a company.
 * Useful for admin dashboards and audit reviews.
 *
 * @param companyId - The company ID to filter by
 * @param limit - Maximum number of logs to return (default 50)
 * @returns Promise<EmailLog[]> - Array of email log entries
 */
export async function getRecentEmailLogs(
    companyId: string,
    limit: number = 50
): Promise<EmailLog[]> {
    const db = getFirestore();

    const snapshot = await db
        .collection(EMAIL_LOGS_COLLECTION)
        .where('companyId', '==', companyId)
        .orderBy('sentAt', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs.map((doc) => doc.data() as EmailLog);
}
