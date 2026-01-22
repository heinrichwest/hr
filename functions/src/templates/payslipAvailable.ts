// ============================================================
// PAYSLIP AVAILABLE EMAIL TEMPLATE
// Notification sent to employee when their payslip is ready
// ============================================================

import { renderBaseTemplate, BRAND_COLOURS } from './baseTemplate';
import { formatDate } from '../utils/formatDate';
import { formatZAR } from '../utils/formatCurrency';

/**
 * Data required to render the payslip available email
 */
export interface PayslipAvailableEmailData {
    /** Name of the employee */
    employeeName: string;
    /** Description of the pay period (e.g., "January 2026") */
    periodDescription: string;
    /** Date the payment was/will be made */
    payDate: Date | { seconds: number; nanoseconds: number } | string;
    /** Net pay amount */
    netPay: number;
}

/**
 * Generates the subject line for payslip available email.
 *
 * @param periodDescription - The pay period (e.g., "January 2026")
 * @returns Email subject line
 */
export function getPayslipAvailableSubject(periodDescription: string): string {
    return `Your Payslip for ${periodDescription} is Available`;
}

/**
 * Renders the payslip available email HTML.
 * Sent to the employee when their payslip is published.
 *
 * @param data - Payslip data
 * @returns Complete HTML email string
 *
 * @example
 * ```typescript
 * const html = renderPayslipAvailableEmail({
 *   employeeName: 'John Smith',
 *   periodDescription: 'January 2026',
 *   payDate: new Date('2026-01-25'),
 *   netPay: 25750.50,
 * });
 * ```
 */
export function renderPayslipAvailableEmail(data: PayslipAvailableEmailData): string {
    const {
        employeeName,
        periodDescription,
        payDate,
        netPay,
    } = data;

    const formattedPayDate = formatDate(payDate);
    const formattedNetPay = formatZAR(netPay);

    const content = `
        <!-- Payslip icon -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
            <tr>
                <td style="width: 64px; height: 64px; background-color: #EEF2FF; border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-size: 28px; color: ${BRAND_COLOURS.primaryBlue};">&#128176;</span>
                </td>
            </tr>
        </table>

        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: ${BRAND_COLOURS.primaryBlue}; text-align: center;">
            Your Payslip is Ready
        </h2>

        <p style="margin: 0 0 24px 0; text-align: center;">
            Hello <strong>${employeeName}</strong>, your payslip for <strong>${periodDescription}</strong> is now available.
        </p>

        <!-- Payslip summary -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #F0F4FF; border-radius: 8px; border: 1px solid #C7D2FE;">
            <tr>
                <td style="padding: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <!-- Pay period -->
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #C7D2FE;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Pay Period</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #C7D2FE; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${periodDescription}</strong>
                            </td>
                        </tr>
                        <!-- Pay date -->
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #C7D2FE;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Pay Date</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #C7D2FE; text-align: right;">
                                <strong style="color: ${BRAND_COLOURS.textDark};">${formattedPayDate}</strong>
                            </td>
                        </tr>
                        <!-- Net pay (highlighted) -->
                        <tr>
                            <td style="padding: 16px 0 8px 0;">
                                <span style="font-size: 14px; color: ${BRAND_COLOURS.textLight};">Net Pay</span>
                            </td>
                            <td style="padding: 16px 0 8px 0; text-align: right;">
                                <strong style="font-size: 24px; color: ${BRAND_COLOURS.primaryBlue};">${formattedNetPay}</strong>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <p style="margin: 0; color: ${BRAND_COLOURS.textLight}; font-size: 14px; text-align: center;">
            Log in to the HR system to view the full breakdown of your payslip.
        </p>
    `;

    return renderBaseTemplate(content, {
        text: 'View Payslip',
        url: '/payslips',
    });
}
