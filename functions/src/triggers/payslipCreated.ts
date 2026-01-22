// ============================================================
// PAYSLIP CREATED TRIGGER
// Sends email notification when a new payslip is created
// ============================================================

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { getUserEmailByEmployeeId } from '../utils/userLookup';
import { sendEmail } from '../utils/sendEmail';
import { formatZAR } from '../utils/formatCurrency';
import {
    renderPayslipAvailableEmail,
    getPayslipAvailableSubject,
} from '../templates/payslipAvailable';

/**
 * Payslip document structure (subset of fields needed for notification)
 */
interface PayslipData {
    /** Employee ID the payslip belongs to */
    employeeId: string;
    /** Company ID for tenant isolation */
    companyId: string;
    /** Description of the pay period (e.g., "January 2026") */
    periodDescription: string;
    /** Date the payment was/will be made */
    payDate: Date | { seconds: number; nanoseconds: number };
    /** Net pay amount */
    netPay: number;
    /** Name of the employee */
    employeeName: string;
    /** Pay run ID this payslip belongs to */
    payRunId?: string;
}

/**
 * Batch processing configuration
 */
const BATCH_CONFIG = {
    /** Delay between individual payslip emails (ms) */
    delayBetweenEmails: 100,
    /** Collection name for payslips */
    collection: 'payslips',
};

/**
 * Metrics for batch processing logging
 */
interface BatchMetrics {
    payslipId: string;
    payRunId?: string;
    emailSent: boolean;
    error?: string;
    processingTimeMs: number;
}

/**
 * Cloud Function trigger for new payslip documents.
 * Sends an email notification to the employee when their payslip is created.
 *
 * This function is designed to handle batch processing gracefully:
 * - Adds a small delay between emails to avoid rate limiting
 * - Logs batch processing metrics for monitoring
 * - Handles partial failures without blocking other payslips
 *
 * @example
 * When a payslip document is created in Firestore at `payslips/{payslipId}`,
 * this function will:
 * 1. Look up the employee's email address
 * 2. Generate the payslip available email using the template
 * 3. Create a mail document for the Trigger Email extension
 * 4. Log the email in the emailLogs collection
 */
export const onPayslipCreated = onDocumentCreated(
    'payslips/{payslipId}',
    async (event) => {
        const startTime = Date.now();
        const payslipId = event.params.payslipId;

        logger.info(`Processing payslip created event: ${payslipId}`);

        // Get payslip data from the created document
        const snapshot = event.data;
        if (!snapshot) {
            logger.error(`No data found for payslip: ${payslipId}`);
            return;
        }

        const payslipData = snapshot.data() as PayslipData;

        // Validate required fields
        if (!payslipData.employeeId || !payslipData.companyId) {
            logger.error(
                `Missing required fields for payslip ${payslipId}: employeeId or companyId`
            );
            return;
        }

        // Initialize metrics
        const metrics: BatchMetrics = {
            payslipId,
            payRunId: payslipData.payRunId,
            emailSent: false,
            processingTimeMs: 0,
        };

        try {
            // Look up employee email
            const userResult = await getUserEmailByEmployeeId(
                payslipData.employeeId,
                payslipData.companyId
            );

            if (!userResult.found || !userResult.email) {
                logger.warn(
                    `No email found for employee ${payslipData.employeeId} in company ${payslipData.companyId}`
                );
                metrics.error = 'Employee email not found';
                logBatchMetrics(metrics, startTime);
                return;
            }

            // Add small delay for batch processing consideration
            // This helps prevent rate limiting when many payslips are created at once
            await delay(BATCH_CONFIG.delayBetweenEmails);

            // Generate email content
            const emailData = {
                employeeName: payslipData.employeeName,
                periodDescription: payslipData.periodDescription,
                payDate: payslipData.payDate,
                netPay: payslipData.netPay,
            };

            const subject = getPayslipAvailableSubject(payslipData.periodDescription);
            const html = renderPayslipAvailableEmail(emailData);

            // Send the email
            const sendResult = await sendEmail({
                to: userResult.email,
                subject,
                html,
                emailType: 'payslip_available',
                recipientUserId: userResult.userId || payslipData.employeeId,
                companyId: payslipData.companyId,
                relatedDocumentId: payslipId,
                relatedCollection: BATCH_CONFIG.collection,
            });

            if (sendResult.success) {
                metrics.emailSent = true;
                logger.info(
                    `Payslip notification sent: payslipId=${payslipId}, to=${userResult.email}, netPay=${formatZAR(payslipData.netPay)}`
                );
            } else {
                metrics.error = sendResult.error;
                if (sendResult.rateLimited) {
                    logger.warn(
                        `Rate limited: payslipId=${payslipId}, employee=${payslipData.employeeId}`
                    );
                } else {
                    logger.error(
                        `Failed to send payslip notification: payslipId=${payslipId}, error=${sendResult.error}`
                    );
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            metrics.error = errorMessage;
            logger.error(
                `Exception processing payslip notification: payslipId=${payslipId}, error=${errorMessage}`,
                error
            );
        }

        logBatchMetrics(metrics, startTime);
    }
);

/**
 * Logs batch processing metrics for monitoring and debugging.
 *
 * @param metrics - Metrics collected during processing
 * @param startTime - Processing start timestamp
 */
function logBatchMetrics(metrics: BatchMetrics, startTime: number): void {
    metrics.processingTimeMs = Date.now() - startTime;

    logger.info('Payslip notification batch metrics', {
        payslipId: metrics.payslipId,
        payRunId: metrics.payRunId || 'N/A',
        emailSent: metrics.emailSent,
        error: metrics.error || 'none',
        processingTimeMs: metrics.processingTimeMs,
    });
}

/**
 * Utility function to delay execution.
 * Used for batch processing to avoid rate limiting.
 *
 * @param ms - Delay duration in milliseconds
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exported configuration for testing
 */
export const PAYSLIP_TRIGGER_CONFIG = {
    delayBetweenEmails: BATCH_CONFIG.delayBetweenEmails,
    collection: BATCH_CONFIG.collection,
} as const;
