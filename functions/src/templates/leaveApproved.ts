// ============================================================
// LEAVE APPROVED EMAIL TEMPLATE
// Notification sent to employee when leave request is approved
// ============================================================

import { renderBaseTemplate, BRAND_COLOURS } from './baseTemplate';
import { formatDateRange } from '../utils/formatDate';

/**
 * Data required to render the leave approved email
 */
export interface LeaveApprovedEmailData {
    /** Name of the employee whose leave was approved */
    employeeName: string;
    /** Type of leave that was approved */
    leaveType: string;
    /** Start date of the approved leave */
    startDate: Date | { seconds: number; nanoseconds: number } | string;
    /** End date of the approved leave */
    endDate: Date | { seconds: number; nanoseconds: number } | string;
    /** Name of the approving manager */
    approverName: string;
    /** Optional comments from the approver */
    comments?: string;
}

/**
 * Generates the subject line for leave approved email.
 *
 * @returns Email subject line
 */
export function getLeaveApprovedSubject(): string {
    return 'Your Leave Request Has Been Approved';
}

/**
 * Renders the leave approved email HTML.
 * Sent to the employee when their leave request is approved.
 *
 * @param data - Approval data
 * @returns Complete HTML email string
 *
 * @example
 * ```typescript
 * const html = renderLeaveApprovedEmail({
 *   employeeName: 'John Smith',
 *   leaveType: 'Annual Leave',
 *   startDate: new Date('2026-01-20'),
 *   endDate: new Date('2026-01-24'),
 *   approverName: 'Jane Manager',
 *   comments: 'Enjoy your holiday!',
 * });
 * ```
 */
export function renderLeaveApprovedEmail(data: LeaveApprovedEmailData): string {
    const {
        employeeName,
        leaveType,
        startDate,
        endDate,
        approverName,
        comments,
    } = data;

    const dateRange = formatDateRange(startDate, endDate);

    // Green checkmark colour for approval
    const approvalGreen = '#059669';

    const content = `
        <!-- Approval icon -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
            <tr>
                <td style="width: 64px; height: 64px; background-color: #D1FAE5; border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-size: 32px; color: ${approvalGreen};">&#10003;</span>
                </td>
            </tr>
        </table>

        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: ${approvalGreen}; text-align: center;">
            Leave Request Approved
        </h2>

        <p style="margin: 0 0 24px 0; text-align: center;">
            Good news, <strong>${employeeName}</strong>! Your leave request has been approved.
        </p>

        <!-- Leave details table -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #ECFDF5; border-radius: 8px; border: 1px solid #A7F3D0;">
            <tr>
                <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #A7F3D0;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Leave Type</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #A7F3D0; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${leaveType}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #A7F3D0;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Approved Dates</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #A7F3D0; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${dateRange}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Approved By</span>
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
        <!-- Approver comments -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
            <tr>
                <td style="padding: 16px; background-color: #F9FAFB; border-left: 4px solid ${approvalGreen}; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: ${BRAND_COLOURS.textLight}; text-transform: uppercase; letter-spacing: 0.5px;">
                        Comments from ${approverName}
                    </p>
                    <p style="margin: 0; color: ${BRAND_COLOURS.textDark};">
                        "${comments}"
                    </p>
                </td>
            </tr>
        </table>
        ` : ''}

        <p style="margin: 0; color: ${BRAND_COLOURS.textLight}; font-size: 14px; text-align: center;">
            View your updated leave balance in the HR system.
        </p>
    `;

    return renderBaseTemplate(content, {
        text: 'View Leave Balance',
        url: '/leave/balance',
    });
}
