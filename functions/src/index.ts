// ============================================================
// FIREBASE CLOUD FUNCTIONS - ENTRY POINT
// HR System Email Notifications
// ============================================================

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This is required before using any Firebase services
admin.initializeApp();

// Export types for use across the project
export * from './types/emailLog';

// Export utilities
export { checkRateLimit, RATE_LIMIT_CONFIG } from './utils/rateLimiter';
export { logEmail, updateEmailStatus, getEmailLog, getRecentEmailLogs } from './utils/emailLogger';
export { sendEmail, SEND_EMAIL_CONFIG } from './utils/sendEmail';
export { getUserEmailByUserId, getUserEmailByEmployeeId, getUserEmail, clearUserCache } from './utils/userLookup';

// ============================================================
// Cloud Function Triggers
// ============================================================

// Leave notification triggers (Task Group 3)
export { onLeaveRequestCreated } from './triggers/leaveSubmitted';
export { onLeaveStatusChanged } from './triggers/leaveStatusChanged';

// Payslip notification triggers (Task Group 4)
export { onPayslipCreated, PAYSLIP_TRIGGER_CONFIG } from './triggers/payslipCreated';

/**
 * Placeholder function to verify deployment
 * This can be removed once actual triggers are implemented
 */
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
    };
};
