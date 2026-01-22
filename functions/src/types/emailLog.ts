// ============================================================
// EMAIL LOG TYPE DEFINITIONS
// Types for email notification logging and tracking
// ============================================================

import type { Timestamp } from 'firebase-admin/firestore';

/**
 * Supported email notification types in the HR system
 */
export type EmailType =
    | 'leave_submitted'
    | 'leave_approved'
    | 'leave_rejected'
    | 'payslip_available';

/**
 * Email delivery status tracking
 */
export type DeliveryStatus =
    | 'pending'
    | 'sent'
    | 'delivered'
    | 'failed'
    | 'bounced';

/**
 * Email log entry stored in the emailLogs collection
 * Used for audit trail and delivery tracking
 */
export interface EmailLog {
    /** Unique identifier for the email log entry */
    id: string;

    /** Recipient's email address */
    recipientEmail: string;

    /** User ID of the recipient (from users collection) */
    recipientUserId: string;

    /** Type of email notification sent */
    emailType: EmailType;

    /** Email subject line */
    subject: string;

    /** Timestamp when the email was sent/attempted */
    sentAt: Timestamp;

    /** Company ID for multi-tenant isolation */
    companyId: string;

    /** Current delivery status of the email */
    deliveryStatus: DeliveryStatus;

    /** ID of the related document that triggered the email */
    relatedDocumentId: string;

    /** Collection name of the related document */
    relatedCollection: string;

    /** Error message if delivery failed, null otherwise */
    errorMessage: string | null;
}

/**
 * Data required to create a new email log entry
 * Excludes id and sentAt which are generated automatically
 */
export interface CreateEmailLogData {
    recipientEmail: string;
    recipientUserId: string;
    emailType: EmailType;
    subject: string;
    companyId: string;
    deliveryStatus: DeliveryStatus;
    relatedDocumentId: string;
    relatedCollection: string;
    errorMessage?: string | null;
}

/**
 * Mail document structure for Firebase Trigger Email extension
 * Documents in the 'mail' collection are processed by the extension
 */
export interface MailDocument {
    /** Array of recipient email addresses */
    to: string[];

    /** Email message content */
    message: {
        /** Email subject line */
        subject: string;
        /** HTML email body content */
        html: string;
    };

    /** Sender email address (optional, uses extension default) */
    from?: string;

    /** Delivery information (added by extension after processing) */
    delivery?: {
        state: 'PENDING' | 'SUCCESS' | 'ERROR';
        attempts: number;
        error?: string;
    };
}
