// ============================================================
// RATE LIMITER UTILITY
// Prevents email flooding by limiting emails per recipient
// ============================================================

import { getFirestore } from 'firebase-admin/firestore';

/** Maximum emails allowed per recipient per minute */
const MAX_EMAILS_PER_MINUTE = 10;

/** Rate limit window in milliseconds (1 minute) */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/**
 * Checks if an email can be sent to the recipient based on rate limits.
 * Queries the emailLogs collection for recent emails to the recipient
 * within the rate limit window.
 *
 * @param recipientEmail - The email address of the intended recipient
 * @returns Promise<boolean> - True if email can be sent, false if rate limited
 *
 * @example
 * ```typescript
 * const canSend = await checkRateLimit('user@example.com');
 * if (canSend) {
 *   // Proceed with sending email
 * } else {
 *   // Log rate limit hit and skip email
 * }
 * ```
 */
export async function checkRateLimit(recipientEmail: string): Promise<boolean> {
    const db = getFirestore();
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    try {
        // Query recent emails to this recipient within the rate limit window
        const recentEmailsQuery = db
            .collection('emailLogs')
            .where('recipientEmail', '==', recipientEmail.toLowerCase())
            .where('sentAt', '>=', windowStart)
            .orderBy('sentAt', 'desc')
            .limit(MAX_EMAILS_PER_MINUTE);

        const snapshot = await recentEmailsQuery.get();
        const recentCount = snapshot.size;

        // Allow email if under the rate limit
        return recentCount < MAX_EMAILS_PER_MINUTE;
    } catch (error) {
        // If there's an error checking rate limits, log it but allow the email
        // This prevents rate limiting failures from blocking all emails
        console.error('Error checking rate limit:', error);
        return true;
    }
}

/**
 * Gets the number of emails sent to a recipient in the current rate limit window.
 * Useful for debugging and monitoring.
 *
 * @param recipientEmail - The email address to check
 * @returns Promise<number> - Count of emails sent in the current window
 */
export async function getRecentEmailCount(recipientEmail: string): Promise<number> {
    const db = getFirestore();
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    try {
        const recentEmailsQuery = db
            .collection('emailLogs')
            .where('recipientEmail', '==', recipientEmail.toLowerCase())
            .where('sentAt', '>=', windowStart);

        const snapshot = await recentEmailsQuery.get();
        return snapshot.size;
    } catch (error) {
        console.error('Error getting recent email count:', error);
        return 0;
    }
}

/**
 * Rate limit configuration constants exposed for testing
 */
export const RATE_LIMIT_CONFIG = {
    maxEmailsPerMinute: MAX_EMAILS_PER_MINUTE,
    windowMs: RATE_LIMIT_WINDOW_MS,
} as const;
