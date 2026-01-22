// ============================================================
// DATE FORMATTING UTILITY
// Formats dates for South African locale (SAST timezone)
// ============================================================

/**
 * South African Standard Time (SAST) timezone identifier.
 * SAST is UTC+2 and does not observe daylight saving time.
 */
const SAST_TIMEZONE = 'Africa/Johannesburg';

/**
 * Month names for formatting.
 */
const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

/**
 * Converts a date input to a Date object.
 * Handles Date objects, timestamps, and ISO strings.
 *
 * @param date - Date input (Date, Timestamp, or string)
 * @returns Date object
 */
function toDate(date: Date | { seconds: number; nanoseconds: number } | string | number): Date {
    if (date instanceof Date) {
        return date;
    }

    // Handle Firestore Timestamp
    if (typeof date === 'object' && 'seconds' in date) {
        return new Date(date.seconds * 1000);
    }

    // Handle string or number
    return new Date(date);
}

/**
 * Gets date components in SAST timezone.
 *
 * @param date - Date to extract components from
 * @returns Object with day, month, year, monthName
 */
function getDateParts(date: Date): { day: number; month: number; year: number; monthName: string } {
    // Format date in SAST timezone
    const formatter = new Intl.DateTimeFormat('en-ZA', {
        timeZone: SAST_TIMEZONE,
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    });

    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);
    const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
    const year = parseInt(parts.find((p) => p.type === 'year')?.value || '2000', 10);

    return {
        day,
        month,
        year,
        monthName: MONTHS[month - 1],
    };
}

/**
 * Formats a date as "DD Month YYYY" (e.g., "15 January 2026").
 * Uses South African Standard Time (SAST) timezone.
 *
 * @param date - Date to format (Date, Firestore Timestamp, or ISO string)
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate(new Date('2026-01-15'));  // "15 January 2026"
 * formatDate({ seconds: 1768435200, nanoseconds: 0 });  // Firestore Timestamp
 * formatDate('2026-01-15T00:00:00Z');  // ISO string
 * ```
 */
export function formatDate(
    date: Date | { seconds: number; nanoseconds: number } | string | number
): string {
    const dateObj = toDate(date);

    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }

    const { day, monthName, year } = getDateParts(dateObj);

    return `${day} ${monthName} ${year}`;
}

/**
 * Formats a date range as "DD - DD Month YYYY" or "DD Month - DD Month YYYY"
 * depending on whether the dates are in the same month.
 *
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @returns Formatted date range string
 *
 * @example
 * ```typescript
 * // Same month
 * formatDateRange(new Date('2026-01-15'), new Date('2026-01-20'));
 * // "15 - 20 January 2026"
 *
 * // Different months
 * formatDateRange(new Date('2026-01-28'), new Date('2026-02-05'));
 * // "28 January - 5 February 2026"
 *
 * // Different years
 * formatDateRange(new Date('2025-12-28'), new Date('2026-01-05'));
 * // "28 December 2025 - 5 January 2026"
 * ```
 */
export function formatDateRange(
    startDate: Date | { seconds: number; nanoseconds: number } | string | number,
    endDate: Date | { seconds: number; nanoseconds: number } | string | number
): string {
    const startObj = toDate(startDate);
    const endObj = toDate(endDate);

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
        return 'Invalid date range';
    }

    const start = getDateParts(startObj);
    const end = getDateParts(endObj);

    // Same day
    if (start.day === end.day && start.month === end.month && start.year === end.year) {
        return `${start.day} ${start.monthName} ${start.year}`;
    }

    // Same month and year
    if (start.month === end.month && start.year === end.year) {
        return `${start.day} - ${end.day} ${start.monthName} ${start.year}`;
    }

    // Same year, different month
    if (start.year === end.year) {
        return `${start.day} ${start.monthName} - ${end.day} ${end.monthName} ${start.year}`;
    }

    // Different years
    return `${start.day} ${start.monthName} ${start.year} - ${end.day} ${end.monthName} ${end.year}`;
}

/**
 * Formats a date for pay period display (e.g., "January 2026").
 *
 * @param date - Date to format
 * @returns Month and year string
 *
 * @example
 * ```typescript
 * formatPayPeriod(new Date('2026-01-15'));  // "January 2026"
 * ```
 */
export function formatPayPeriod(
    date: Date | { seconds: number; nanoseconds: number } | string | number
): string {
    const dateObj = toDate(date);

    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }

    const { monthName, year } = getDateParts(dateObj);

    return `${monthName} ${year}`;
}
