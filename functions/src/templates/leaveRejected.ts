// ============================================================
// LEAVE REJECTED EMAIL TEMPLATE
// Notification sent to employee when leave request is rejected
// Uses neutral tone (not red/negative) as per requirements
// ============================================================

import { renderBaseTemplate, BRAND_COLOURS } from './baseTemplate';
import { formatDateRange } from '../utils/formatDate';

/**
 * Data required to render the leave rejected email
 */
export interface LeaveRejectedEmailData {
    /** Name of the employee whose leave was not approved */
    employeeName: string;
    /** Type of leave that was requested */
    leaveType: string;
    /** Start date of the requested leave */
    startDate: Date | { seconds: number; nanoseconds: number } | string;
    /** End date of the requested leave */
    endDate: Date | { seconds: number; nanoseconds: number } | string;
    /** Name of the manager who reviewed the request */
    approverName: string;
    /** Reason/comments for the rejection */
    comments?: string;
}

/**
 * Generates the subject line for leave rejected email.
 *
 * @returns Email subject line
 */
export function getLeaveRejectedSubject(): string {
    return 'Your Leave Request Was Not Approved';
}

/**
 * Renders the leave rejected email HTML.
 * Sent to the employee when their leave request is not approved.
 * Uses neutral messaging tone as per requirements.
 *
 * @param data - Rejection data
 * @returns Complete HTML email string
 *
 * @example
 * ```typescript
 * const html = renderLeaveRejectedEmail({
 *   employeeName: 'John Smith',
 *   leaveType: 'Annual Leave',
 *   startDate: new Date('2026-01-20'),
 *   endDate: new Date('2026-01-24'),
 *   approverName: 'Jane Manager',
 *   comments: 'Unfortunately we have a critical deadline during this period. Please consider alternative dates.',
 * });
 * ```
 */
export function renderLeaveRejectedEmail(data: LeaveRejectedEmailData): string {
    const {
        employeeName,
        leaveType,
        startDate,
        endDate,
        approverName,
        comments,
    } = data;

    const dateRange = formatDateRange(startDate, endDate);

    // Neutral colour (not red) for rejection - using a muted grey-blue
    const neutralColour = '#64748B';

    const content = `
        <!-- Info icon (neutral, not negative) -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
            <tr>
                <td style="width: 64px; height: 64px; background-color: #F1F5F9; border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-size: 28px; color: ${neutralColour};">&#9432;</span>
                </td>
            </tr>
        </table>

        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: ${BRAND_COLOURS.primaryBlue}; text-align: center;">
            Leave Request Update
        </h2>

        <p style="margin: 0 0 24px 0; text-align: center;">
            Hello <strong>${employeeName}</strong>, your leave request was not approved at this time.
        </p>

        <!-- Leave details table -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
            <tr>
                <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Leave Type</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${leaveType}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Requested Dates</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${dateRange}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Reviewed By</span>
                            </td>
                            <td style="padding: 8px 0; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${approverName}</strong>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        ${comments ? `
        <!-- Feedback from reviewer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
            <tr>
                <td style="padding: 16px; background-color: #F8FAFC; border-left: 4px solid ${BRAND_COLOURS.supportBlue}; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: ${BRAND_COLOURS.textLight}; text-transform: uppercase; letter-spacing: 0.5px;">
                        Feedback from ${approverName}
                    </p>
                    <p style="margin: 0; color: ${BRAND_COLOURS.textDark};">
                        "${comments}"
                    </p>
                </td>
            </tr>
        </table>
        ` : ''}

        <p style="margin: 0; color: ${BRAND_COLOURS.textLight}; font-size: 14px; text-align: center;">
            You may submit a new request with different dates if needed.
        </p>
    `;

    return renderBaseTemplate(content, {
        text: 'Submit New Request',
        url: '/leave/request',
    });
}
