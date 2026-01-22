// ============================================================
// LEAVE SUBMITTED EMAIL TEMPLATE
// Notification sent to manager when employee submits leave request
// ============================================================

import { renderBaseTemplate, BRAND_COLOURS } from './baseTemplate';
import { formatDate, formatDateRange } from '../utils/formatDate';

/**
 * Data required to render the leave submitted email
 */
export interface LeaveSubmittedEmailData {
    /** Name of the employee submitting the request */
    employeeName: string;
    /** Type of leave being requested */
    leaveType: string;
    /** Start date of the leave */
    startDate: Date | { seconds: number; nanoseconds: number } | string;
    /** End date of the leave */
    endDate: Date | { seconds: number; nanoseconds: number } | string;
    /** Total number of leave days */
    totalDays: number;
    /** Reason for the leave request (optional) */
    reason?: string;
}

/**
 * Generates the subject line for leave submitted email.
 *
 * @param employeeName - Name of the employee
 * @returns Email subject line
 */
export function getLeaveSubmittedSubject(employeeName: string): string {
    return `Leave Request Submitted: ${employeeName}`;
}

/**
 * Renders the leave submitted email HTML.
 * Sent to the manager when an employee submits a leave request.
 *
 * @param data - Leave request data
 * @returns Complete HTML email string
 *
 * @example
 * ```typescript
 * const html = renderLeaveSubmittedEmail({
 *   employeeName: 'John Smith',
 *   leaveType: 'Annual Leave',
 *   startDate: new Date('2026-01-20'),
 *   endDate: new Date('2026-01-24'),
 *   totalDays: 5,
 *   reason: 'Family holiday',
 * });
 * ```
 */
export function renderLeaveSubmittedEmail(data: LeaveSubmittedEmailData): string {
    const {
        employeeName,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
    } = data;

    const dateRange = formatDateRange(startDate, endDate);
    const daysText = totalDays === 1 ? '1 day' : `${totalDays} days`;

    const content = `
        <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: ${BRAND_COLOURS.primaryBlue};">
            New Leave Request
        </h2>

        <p style="margin: 0 0 16px 0;">
            <strong>${employeeName}</strong> has submitted a leave request that requires your review.
        </p>

        <!-- Leave details table -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #F9FAFB; border-radius: 8px;">
            <tr>
                <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Leave Type</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${leaveType}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Dates</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${dateRange}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Duration</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${daysText}</strong>
                            </td>
                        </tr>
                        ${reason ? `
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Reason</span>
                            </td>
                            <td style="padding: 8px 0; text-align: right;">
                                <span style="color: ${BRAND_COLOURS.textDark};">${reason}</span>
                            </td>
                        </tr>
                        ` : ''}
                    </table>
                </td>
            </tr>
        </table>

        <p style="margin: 16px 0 0 0; color: ${BRAND_COLOURS.textLight}; font-size: 14px;">
            Please review and respond to this request at your earliest convenience.
        </p>
    `;

    return renderBaseTemplate(content, {
        text: 'Review Request',
        url: '/leave/approvals',
    });
}
