// ============================================================
// SEND EMAIL UTILITY
// Creates mail documents for Firebase Trigger Email extension
// ============================================================

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { MailDocument, CreateEmailLogData, EmailType } from '../types/emailLog';
import { checkRateLimit } from './rateLimiter';
import { logEmail, updateEmailStatus } from './emailLogger';

/** From email address for HR notifications */
const FROM_EMAIL = 'hr@speccon.co.za';

/** Collection name for mail documents (Firebase Trigger Email extension) */
const MAIL_COLLECTION = 'mail';

/** Maximum retry attempts for transient failures */
const MAX_RETRIES = 3;

/** Base delay for exponential backoff in milliseconds */
const BASE_RETRY_DELAY_MS = 1000;

/**
 * Configuration for sending an email
 */
export interface SendEmailConfig {
    /** Recipient email address */
    to: string;
    /** Email subject line */
    subject: string;
    /** HTML email body content */
    html: string;
    /** Type of email notification */
    emailType: EmailType;
    /** Recipient user ID (for logging) */
    recipientUserId: string;
    /** Company ID (for logging and tenant isolation) */
    companyId: string;
    /** ID of the related document that triggered the email */
    relatedDocumentId: string;
    /** Collection name of the related document */
    relatedCollection: string;
}

/**
 * Result of an email send operation
 */
export interface SendEmailResult {
    /** Whether the email was successfully queued */
    success: boolean;
    /** ID of the mail document created (if successful) */
    mailDocId?: string;
    /** ID of the email log entry */
    logId?: string;
    /** Error message if sending failed */
    error?: string;
    /** Whether the email was rate limited */
    rateLimited?: boolean;
}

/**
 * Sends an email by creating a document in the mail collection.
 * The Firebase Trigger Email extension picks up documents from this collection
 * and sends the emails via the configured SMTP server.
 *
 * Features:
 * - Rate limit checking before sending
 * - Automatic email logging
 * - Retry logic with exponential backoff for transient failures
 *
 * @param config - Email configuration
 * @returns Promise<SendEmailResult> - Result of the send operation
 *
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'employee@example.com',
 *   subject: 'Your Payslip is Ready',
 *   html: '<p>Your payslip for January is available.</p>',
 *   emailType: 'payslip_available',
 *   recipientUserId: 'user-123',
 *   companyId: 'company-456',
 *   relatedDocumentId: 'payslip-789',
 *   relatedCollection: 'payslips',
 * });
 *
 * if (result.success) {
 *   console.log('Email queued:', result.mailDocId);
 * }
 * ```
 */
export async function sendEmail(config: SendEmailConfig): Promise<SendEmailResult> {
    const {
        to,
        subject,
        html,
        emailType,
        recipientUserId,
        companyId,
        relatedDocumentId,
        relatedCollection,
    } = config;

    // Normalize email to lowercase
    const normalizedTo = to.toLowerCase();

    // Check rate limit before sending
    const canSend = await checkRateLimit(normalizedTo);
    if (!canSend) {
        console.warn(`Rate limit exceeded for recipient: ${normalizedTo}`);

        // Log the rate-limited attempt
        const logId = await logEmail({
            recipientEmail: normalizedTo,
            recipientUserId,
            emailType,
            subject,
            companyId,
            deliveryStatus: 'failed',
            relatedDocumentId,
            relatedCollection,
            errorMessage: 'Rate limit exceeded',
        });

        return {
            success: false,
            logId,
            error: 'Rate limit exceeded',
            rateLimited: true,
        };
    }

    // Log the email attempt (pending status)
    const logId = await logEmail({
        recipientEmail: normalizedTo,
        recipientUserId,
        emailType,
        subject,
        companyId,
        deliveryStatus: 'pending',
        relatedDocumentId,
        relatedCollection,
    });

    // Attempt to create mail document with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const mailDocId = await createMailDocument(normalizedTo, subject, html);

            // Update log status to sent
            await updateEmailStatus(logId, 'sent');

            console.log(
                `Email queued successfully: type=${emailType}, to=${normalizedTo}, mailDocId=${mailDocId}`
            );

            return {
                success: true,
                mailDocId,
                logId,
            };
        } catch (error) {
            lastError = error as Error;
            console.error(
                `Failed to create mail document (attempt ${attempt}/${MAX_RETRIES}):`,
                error
            );

            if (attempt < MAX_RETRIES) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                await sleep(delay);
            }
        }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'Unknown error';
    await updateEmailStatus(logId, 'failed', errorMessage);

    console.error(
        `Failed to send email after ${MAX_RETRIES} attempts: type=${emailType}, to=${normalizedTo}`
    );

    return {
        success: false,
        logId,
        error: errorMessage,
    };
}

/**
 * Creates a document in the mail collection for the Trigger Email extension.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML email body
 * @returns Promise<string> - ID of the created mail document
 */
async function createMailDocument(
    to: string,
    subject: string,
    html: string
): Promise<string> {
    const db = getFirestore();

    const mailDoc: MailDocument & { createdAt: FieldValue } = {
        to: [to],
        message: {
            subject,
            html,
        },
        from: FROM_EMAIL,
        createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(MAIL_COLLECTION).add(mailDoc);
    return docRef.id;
}

/**
 * Utility function to sleep for a specified duration.
 * Used for retry backoff.
 *
 * @param ms - Duration to sleep in milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exposed configuration for testing
 */
export const SEND_EMAIL_CONFIG = {
    fromEmail: FROM_EMAIL,
    mailCollection: MAIL_COLLECTION,
    maxRetries: MAX_RETRIES,
    baseRetryDelayMs: BASE_RETRY_DELAY_MS,
} as const;
