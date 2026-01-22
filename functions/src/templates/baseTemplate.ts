// ============================================================
// BASE EMAIL TEMPLATE
// SpecCon branded HTML email template with inline CSS
// ============================================================

/**
 * SpecCon brand colours
 */
const BRAND_COLOURS = {
    primaryBlue: '#12265E',
    accentOrange: '#FFA600',
    supportBlue: '#92ABC4',
    white: '#FFFFFF',
    textDark: '#333333',
    textLight: '#666666',
    backgroundLight: '#F5F5F5',
};

/**
 * Application base URL for deep links
 */
const APP_BASE_URL = 'https://hr-system-9dfae.web.app';

/**
 * Call-to-action button configuration
 */
export interface CTAButton {
    /** Button text */
    text: string;
    /** URL path (will be appended to APP_BASE_URL) */
    url: string;
}

/**
 * Generates the CTA button HTML with SpecCon branding.
 *
 * @param button - Button configuration
 * @returns HTML string for the button
 */
function renderCTAButton(button: CTAButton): string {
    const fullUrl = `${APP_BASE_URL}${button.url}`;

    return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
            <tr>
                <td style="border-radius: 8px; background-color: ${BRAND_COLOURS.accentOrange};">
                    <a href="${fullUrl}"
                       target="_blank"
                       style="display: inline-block;
                              padding: 14px 32px;
                              font-family: 'Roboto', Arial, sans-serif;
                              font-size: 16px;
                              font-weight: 600;
                              color: ${BRAND_COLOURS.white};
                              text-decoration: none;
                              border-radius: 8px;">
                        ${button.text}
                    </a>
                </td>
            </tr>
        </table>
    `;
}

/**
 * Renders the complete HTML email using the SpecCon branded base template.
 *
 * @param content - The main email body HTML content
 * @param ctaButton - Optional call-to-action button configuration
 * @returns Complete HTML email string
 *
 * @example
 * ```typescript
 * const html = renderBaseTemplate(
 *   '<p>Your leave request has been approved.</p>',
 *   { text: 'View Leave Balance', url: '/leave/balance' }
 * );
 * ```
 */
export function renderBaseTemplate(content: string, ctaButton?: CTAButton): string {
    const ctaHtml = ctaButton ? renderCTAButton(ctaButton) : '';

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>SpecCon HR Notification</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
        }
        /* Mobile styles */
        @media screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .mobile-padding {
                padding-left: 16px !important;
                padding-right: 16px !important;
            }
            .mobile-stack {
                display: block !important;
                width: 100% !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND_COLOURS.backgroundLight}; font-family: 'Roboto', Arial, sans-serif; font-size: 16px; line-height: 1.5; color: ${BRAND_COLOURS.textDark};">
    <!-- Preheader text (hidden) -->
    <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
        SpecCon HR System Notification
    </div>

    <!-- Email wrapper -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND_COLOURS.backgroundLight};">
        <tr>
            <td align="center" style="padding: 24px 16px;">
                <!-- Email container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color: ${BRAND_COLOURS.primaryBlue}; padding: 24px 32px; text-align: center; border-radius: 8px 8px 0 0;">
                            <!-- Logo placeholder - text version for maximum compatibility -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="font-family: 'Times New Roman', Times, serif; font-size: 28px; font-weight: bold; color: ${BRAND_COLOURS.white}; letter-spacing: 2px;">
                                        SPECCON
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: 'Roboto', Arial, sans-serif; font-size: 12px; color: ${BRAND_COLOURS.supportBlue}; text-transform: uppercase; letter-spacing: 1px; padding-top: 4px;">
                                        HR System
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="background-color: ${BRAND_COLOURS.white}; padding: 32px;" class="mobile-padding">
                            <!-- Main content -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="font-family: 'Roboto', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${BRAND_COLOURS.textDark};">
                                        ${content}
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            ${ctaHtml}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: ${BRAND_COLOURS.backgroundLight}; padding: 24px 32px; border-top: 1px solid #E0E0E0; border-radius: 0 0 8px 8px;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <!-- Support contact -->
                                <tr>
                                    <td style="font-family: 'Roboto', Arial, sans-serif; font-size: 14px; color: ${BRAND_COLOURS.textLight}; text-align: center; padding-bottom: 16px;">
                                        Need help? Contact us at
                                        <a href="mailto:hr@speccon.co.za" style="color: ${BRAND_COLOURS.primaryBlue}; text-decoration: underline;">hr@speccon.co.za</a>
                                    </td>
                                </tr>
                                <!-- Company address -->
                                <tr>
                                    <td style="font-family: 'Roboto', Arial, sans-serif; font-size: 12px; color: ${BRAND_COLOURS.supportBlue}; text-align: center; padding-bottom: 12px;">
                                        SpecCon Holdings (Pty) Ltd<br>
                                        South Africa
                                    </td>
                                </tr>
                                <!-- Unsubscribe notice -->
                                <tr>
                                    <td style="font-family: 'Roboto', Arial, sans-serif; font-size: 11px; color: ${BRAND_COLOURS.supportBlue}; text-align: center;">
                                        This is an automated notification from the SpecCon HR System.<br>
                                        You are receiving this email because you are a registered user.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!-- End email container -->
            </td>
        </tr>
    </table>
    <!-- End email wrapper -->
</body>
</html>`;
}

/**
 * Exported brand colours for use in specific templates
 */
export { BRAND_COLOURS, APP_BASE_URL };
