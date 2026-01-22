// ============================================================
// EMAIL TEMPLATES TESTS
// Tests for Task Group 2: HTML Email Templates (SpecCon Branded)
// ============================================================

import { describe, it, expect } from 'vitest';

// Import base template
import { renderBaseTemplate, BRAND_COLOURS, APP_BASE_URL, CTAButton } from '../templates/baseTemplate';

// Import email templates
import {
    renderLeaveSubmittedEmail,
    getLeaveSubmittedSubject,
    LeaveSubmittedEmailData,
} from '../templates/leaveSubmitted';

import {
    renderLeaveApprovedEmail,
    getLeaveApprovedSubject,
    LeaveApprovedEmailData,
} from '../templates/leaveApproved';

import {
    renderLeaveRejectedEmail,
    getLeaveRejectedSubject,
    LeaveRejectedEmailData,
} from '../templates/leaveRejected';

import {
    renderPayslipAvailableEmail,
    getPayslipAvailableSubject,
    PayslipAvailableEmailData,
} from '../templates/payslipAvailable';

// Import utilities
import { formatZAR, formatZARAmount } from '../utils/formatCurrency';
import { formatDate, formatDateRange, formatPayPeriod } from '../utils/formatDate';

// ============================================================
// Test 1: Base template renders with SpecCon branding
// ============================================================
describe('Base Email Template', () => {
    it('should render with SpecCon branding colours', () => {
        // Use a CTA button to ensure accent orange is in the output
        const html = renderBaseTemplate('<p>Test content</p>', { text: 'Test', url: '/test' });

        // Check Primary Blue (#12265E) is present
        expect(html).toContain('#12265E');

        // Check Accent Orange (#FFA600) for CTA buttons
        expect(html).toContain('#FFA600');

        // Check Support Blue (#92ABC4) for footer
        expect(html).toContain('#92ABC4');

        // Check white background
        expect(html).toContain('#FFFFFF');
    });

    it('should include SpecCon branding elements', () => {
        const html = renderBaseTemplate('<p>Test</p>');

        // Check for SPECCON text logo
        expect(html).toContain('SPECCON');

        // Check for HR System subtitle
        expect(html).toContain('HR System');

        // Check for support email
        expect(html).toContain('hr@speccon.co.za');

        // Check for company name
        expect(html).toContain('SpecCon Holdings (Pty) Ltd');
    });

    it('should use Roboto font family', () => {
        const html = renderBaseTemplate('<p>Test</p>');

        // Check font-family includes Roboto
        expect(html).toContain("'Roboto'");
    });

    it('should render CTA button with correct styling', () => {
        const ctaButton: CTAButton = {
            text: 'Click Here',
            url: '/test-path',
        };
        const html = renderBaseTemplate('<p>Test</p>', ctaButton);

        // Check button text is present
        expect(html).toContain('Click Here');

        // Check full URL is constructed correctly
        expect(html).toContain(`${APP_BASE_URL}/test-path`);

        // Check button has accent orange background
        expect(html).toContain(BRAND_COLOURS.accentOrange);

        // Check button has border-radius
        expect(html).toContain('border-radius: 8px');
    });

    it('should be mobile-responsive with max-width 600px container', () => {
        const html = renderBaseTemplate('<p>Test</p>');

        // Check for max-width: 600px
        expect(html).toContain('max-width: 600px');

        // Check for mobile-specific CSS class
        expect(html).toContain('.email-container');

        // Check for responsive media query
        expect(html).toContain('@media screen and (max-width: 600px)');
    });

    it('should include proper HTML5 email structure', () => {
        const html = renderBaseTemplate('<p>Test</p>');

        // Check DOCTYPE
        expect(html).toContain('<!DOCTYPE html>');

        // Check meta viewport for mobile
        expect(html).toContain('viewport');

        // Check charset
        expect(html).toContain('charset="utf-8"');
    });
});

// ============================================================
// Test 2: Leave submitted template includes all required fields
// ============================================================
describe('Leave Submitted Email Template', () => {
    const testData: LeaveSubmittedEmailData = {
        employeeName: 'John Smith',
        leaveType: 'Annual Leave',
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-01-24'),
        totalDays: 5,
        reason: 'Family holiday',
    };

    it('should generate correct subject line with employee name', () => {
        const subject = getLeaveSubmittedSubject(testData.employeeName);

        expect(subject).toBe('Leave Request Submitted: John Smith');
    });

    it('should include all required fields in email body', () => {
        const html = renderLeaveSubmittedEmail(testData);

        // Check employee name
        expect(html).toContain('John Smith');

        // Check leave type
        expect(html).toContain('Annual Leave');

        // Check dates are formatted (formatDateRange output)
        expect(html).toContain('20 - 24 January 2026');

        // Check total days
        expect(html).toContain('5 days');

        // Check reason
        expect(html).toContain('Family holiday');
    });

    it('should include Review Request CTA button linking to approvals page', () => {
        const html = renderLeaveSubmittedEmail(testData);

        // Check button text
        expect(html).toContain('Review Request');

        // Check URL path
        expect(html).toContain('/leave/approvals');
    });

    it('should handle single day leave correctly', () => {
        const singleDayData: LeaveSubmittedEmailData = {
            ...testData,
            endDate: testData.startDate,
            totalDays: 1,
        };
        const html = renderLeaveSubmittedEmail(singleDayData);

        expect(html).toContain('1 day');
    });

    it('should handle missing reason gracefully', () => {
        const noReasonData: LeaveSubmittedEmailData = {
            employeeName: 'Jane Doe',
            leaveType: 'Sick Leave',
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-02-02'),
            totalDays: 2,
        };
        const html = renderLeaveSubmittedEmail(noReasonData);

        // Should render without error
        expect(html).toContain('Jane Doe');
        expect(html).toContain('Sick Leave');
        // Should not contain reason row if no reason provided
        expect(html).not.toContain('Reason</span>');
    });
});

// ============================================================
// Test 3: Leave approved template includes all required fields
// ============================================================
describe('Leave Approved Email Template', () => {
    const testData: LeaveApprovedEmailData = {
        employeeName: 'John Smith',
        leaveType: 'Annual Leave',
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-01-24'),
        approverName: 'Jane Manager',
        comments: 'Enjoy your holiday!',
    };

    it('should generate correct subject line', () => {
        const subject = getLeaveApprovedSubject();

        expect(subject).toBe('Your Leave Request Has Been Approved');
    });

    it('should include all required fields in email body', () => {
        const html = renderLeaveApprovedEmail(testData);

        // Check employee name
        expect(html).toContain('John Smith');

        // Check leave type
        expect(html).toContain('Annual Leave');

        // Check approved dates
        expect(html).toContain('20 - 24 January 2026');

        // Check approver name
        expect(html).toContain('Jane Manager');

        // Check comments
        expect(html).toContain('Enjoy your holiday!');
    });

    it('should include View Leave Balance CTA button', () => {
        const html = renderLeaveApprovedEmail(testData);

        // Check button text
        expect(html).toContain('View Leave Balance');

        // Check URL path
        expect(html).toContain('/leave/balance');
    });

    it('should have positive/green accent for approval confirmation', () => {
        const html = renderLeaveApprovedEmail(testData);

        // Check for green colour (approval green #059669)
        expect(html).toContain('#059669');

        // Check for green background (light green)
        expect(html).toContain('#D1FAE5');

        // Check for checkmark symbol
        expect(html).toContain('&#10003;');
    });

    it('should handle missing comments gracefully', () => {
        const noCommentsData: LeaveApprovedEmailData = {
            ...testData,
            comments: undefined,
        };
        const html = renderLeaveApprovedEmail(noCommentsData);

        // Should render without error
        expect(html).toContain('John Smith');
        // Comments section should not be present
        expect(html).not.toContain('Comments from');
    });
});

// ============================================================
// Test 4: Leave rejected template includes all required fields
// ============================================================
describe('Leave Rejected Email Template', () => {
    const testData: LeaveRejectedEmailData = {
        employeeName: 'John Smith',
        leaveType: 'Annual Leave',
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-01-24'),
        approverName: 'Jane Manager',
        comments: 'Critical project deadline during this period.',
    };

    it('should generate correct subject line', () => {
        const subject = getLeaveRejectedSubject();

        expect(subject).toBe('Your Leave Request Was Not Approved');
    });

    it('should include all required fields in email body', () => {
        const html = renderLeaveRejectedEmail(testData);

        // Check employee name
        expect(html).toContain('John Smith');

        // Check leave type
        expect(html).toContain('Annual Leave');

        // Check requested dates
        expect(html).toContain('20 - 24 January 2026');

        // Check approver name
        expect(html).toContain('Jane Manager');

        // Check rejection reason/comments
        expect(html).toContain('Critical project deadline during this period.');
    });

    it('should include Submit New Request CTA button', () => {
        const html = renderLeaveRejectedEmail(testData);

        // Check button text
        expect(html).toContain('Submit New Request');

        // Check URL path
        expect(html).toContain('/leave/request');
    });

    it('should use neutral tone (not red/negative) for rejection messaging', () => {
        const html = renderLeaveRejectedEmail(testData);

        // Should NOT contain typical error/danger red colours
        expect(html).not.toContain('#DC2626'); // Red-600
        expect(html).not.toContain('#EF4444'); // Red-500
        expect(html).not.toContain('#FEE2E2'); // Red-100

        // Should contain neutral colours instead
        expect(html).toContain('#64748B'); // Slate-500 (neutral)

        // Check for neutral heading (not "rejected" but "update")
        expect(html).toContain('Leave Request Update');
    });

    it('should handle missing comments gracefully', () => {
        const noCommentsData: LeaveRejectedEmailData = {
            ...testData,
            comments: undefined,
        };
        const html = renderLeaveRejectedEmail(noCommentsData);

        // Should render without error
        expect(html).toContain('John Smith');
        // Feedback section should not be present
        expect(html).not.toContain('Feedback from');
    });
});

// ============================================================
// Test 5: Payslip available template includes all required fields
// ============================================================
describe('Payslip Available Email Template', () => {
    const testData: PayslipAvailableEmailData = {
        employeeName: 'John Smith',
        periodDescription: 'January 2026',
        payDate: new Date('2026-01-25'),
        netPay: 25750.5,
    };

    it('should generate correct subject line with period', () => {
        const subject = getPayslipAvailableSubject(testData.periodDescription);

        expect(subject).toBe('Your Payslip for January 2026 is Available');
    });

    it('should include all required fields in email body', () => {
        const html = renderPayslipAvailableEmail(testData);

        // Check employee name
        expect(html).toContain('John Smith');

        // Check period description
        expect(html).toContain('January 2026');

        // Check pay date (formatted)
        expect(html).toContain('25 January 2026');

        // Check net pay is present (the actual formatted value)
        // Use the actual formatted value from formatZAR
        const formattedNetPay = formatZAR(testData.netPay);
        expect(html).toContain(formattedNetPay);
    });

    it('should include View Payslip CTA button', () => {
        const html = renderPayslipAvailableEmail(testData);

        // Check button text
        expect(html).toContain('View Payslip');

        // Check URL path
        expect(html).toContain('/payslips');
    });

    it('should format net pay prominently', () => {
        const html = renderPayslipAvailableEmail(testData);

        // Check for large font size on net pay
        expect(html).toContain('font-size: 24px');
    });
});

// ============================================================
// Test 6: Currency formatting utility
// ============================================================
describe('Currency Formatting Utility', () => {
    it('should format positive numbers correctly', () => {
        // Test format matches expected pattern: R followed by formatted number
        const result = formatZAR(12345.67);
        expect(result).toMatch(/^R\s/); // Starts with "R "
        expect(result).toContain('12'); // Contains the number parts
        expect(result).toContain('345');
        expect(result).toContain(',67'); // Uses comma as decimal separator

        // Test other values
        const result1000 = formatZAR(1000);
        expect(result1000).toMatch(/^R\s/);
        expect(result1000).toContain('1');
        expect(result1000).toContain('000');
        expect(result1000).toContain(',00');

        const result099 = formatZAR(0.99);
        expect(result099).toMatch(/^R\s0,99$/);
    });

    it('should format negative numbers correctly', () => {
        const result = formatZAR(-500);
        expect(result).toMatch(/^-R\s/); // Starts with "-R "
        expect(result).toContain('500');
        expect(result).toContain(',00');

        const resultLarge = formatZAR(-12345.67);
        expect(resultLarge).toMatch(/^-R\s/);
        expect(resultLarge).toContain('12');
        expect(resultLarge).toContain('345');
        expect(resultLarge).toContain(',67');
    });

    it('should handle zero correctly', () => {
        const result = formatZAR(0);
        expect(result).toBe('R 0,00');
    });

    it('should handle large numbers correctly', () => {
        const resultMillion = formatZAR(1000000);
        expect(resultMillion).toMatch(/^R\s/);
        expect(resultMillion).toContain('1');
        expect(resultMillion).toContain('000');
        expect(resultMillion).toContain(',00');

        const resultBillion = formatZAR(999999999.99);
        expect(resultBillion).toMatch(/^R\s/);
        expect(resultBillion).toContain('999');
        expect(resultBillion).toContain(',99');
    });

    it('should handle edge cases', () => {
        // NaN should return default value
        const result = formatZAR(NaN);
        expect(result).toBe('R 0.00');
    });

    it('should format amount without currency symbol', () => {
        const result = formatZARAmount(12345.67);
        expect(result).not.toMatch(/^R/); // Should not start with R
        expect(result).toContain('12');
        expect(result).toContain('345');
        expect(result).toContain(',67');
    });
});

// ============================================================
// Test 7: Date formatting utility
// ============================================================
describe('Date Formatting Utility', () => {
    it('should format date as DD Month YYYY', () => {
        const date = new Date('2026-01-15T12:00:00Z');
        const formatted = formatDate(date);

        expect(formatted).toContain('15');
        expect(formatted).toContain('January');
        expect(formatted).toContain('2026');
    });

    it('should format date range in same month', () => {
        const start = new Date('2026-01-15T12:00:00Z');
        const end = new Date('2026-01-20T12:00:00Z');
        const formatted = formatDateRange(start, end);

        // Should be "15 - 20 January 2026"
        expect(formatted).toContain('15 - 20 January 2026');
    });

    it('should format date range across months', () => {
        const start = new Date('2026-01-28T12:00:00Z');
        const end = new Date('2026-02-05T12:00:00Z');
        const formatted = formatDateRange(start, end);

        // Should be "28 January - 5 February 2026"
        expect(formatted).toContain('January');
        expect(formatted).toContain('February');
        expect(formatted).toContain('2026');
    });

    it('should format date range across years', () => {
        const start = new Date('2025-12-28T12:00:00Z');
        const end = new Date('2026-01-05T12:00:00Z');
        const formatted = formatDateRange(start, end);

        // Should include both years
        expect(formatted).toContain('2025');
        expect(formatted).toContain('2026');
    });

    it('should handle single day range', () => {
        const date = new Date('2026-01-15T12:00:00Z');
        const formatted = formatDateRange(date, date);

        // Should be just "15 January 2026" without range
        expect(formatted).toBe('15 January 2026');
    });

    it('should format pay period as Month YYYY', () => {
        const date = new Date('2026-01-15T12:00:00Z');
        const formatted = formatPayPeriod(date);

        expect(formatted).toBe('January 2026');
    });

    it('should handle Firestore Timestamp format', () => {
        const timestamp = { seconds: 1768435200, nanoseconds: 0 }; // ~Jan 15, 2026
        const formatted = formatDate(timestamp);

        // Should parse and format correctly
        expect(formatted).toContain('January');
        expect(formatted).toContain('2026');
    });

    it('should handle invalid dates', () => {
        const formatted = formatDate('invalid');
        expect(formatted).toBe('Invalid date');

        const rangeFormatted = formatDateRange('invalid', 'also-invalid');
        expect(rangeFormatted).toBe('Invalid date range');
    });
});

// ============================================================
// Test 8: Brand colours are exported correctly
// ============================================================
describe('Brand Colours Export', () => {
    it('should export correct SpecCon brand colours', () => {
        expect(BRAND_COLOURS.primaryBlue).toBe('#12265E');
        expect(BRAND_COLOURS.accentOrange).toBe('#FFA600');
        expect(BRAND_COLOURS.supportBlue).toBe('#92ABC4');
        expect(BRAND_COLOURS.white).toBe('#FFFFFF');
        expect(BRAND_COLOURS.textDark).toBe('#333333');
    });

    it('should export correct app base URL', () => {
        expect(APP_BASE_URL).toBe('https://hr-system-9dfae.web.app');
    });
});
