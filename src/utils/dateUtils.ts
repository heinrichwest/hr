// ============================================================
// DATE UTILITY FUNCTIONS
// ============================================================

import type { LeaveRequest } from '../types/leave';
import type { Timestamp } from 'firebase/firestore';

/**
 * Calculate business days in a date range excluding weekends and public holidays
 * @param startDate - Start date of range
 * @param endDate - End date of range
 * @param publicHolidays - Array of public holiday dates
 * @returns Number of business days
 */
export function getBusinessDaysInRange(
    startDate: Date,
    endDate: Date,
    publicHolidays: Date[] = []
): number {
    const holidaySet = buildHolidayLookupSet(publicHolidays);
    let businessDays = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
        const dateString = formatDateYYYYMMDD(current);
        const isPublicHoliday = holidaySet.has(dateString);

        if (!isWeekend && !isPublicHoliday) {
            businessDays++;
        }

        current.setDate(current.getDate() + 1);
    }

    return businessDays;
}

/**
 * Check if a leave request spans 2+ consecutive calendar days
 * Excludes weekends from consecutive count (Friday + Monday = consecutive)
 * @param leaveRequest - Leave request to check
 * @returns True if 2+ consecutive days
 */
export function isConsecutiveSickLeave(leaveRequest: LeaveRequest): boolean {
    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);

    // Calculate calendar days between dates
    const daysDifference = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If same day, not consecutive
    if (daysDifference === 0) {
        return false;
    }

    // If 1 day apart (e.g., Monday to Tuesday), consecutive
    if (daysDifference === 1) {
        return true;
    }

    // Check if Friday to Monday (weekend between)
    const startDay = start.getDay();
    const endDay = end.getDay();

    // Friday (5) to Monday (1) with 3 days difference = consecutive
    if (startDay === 5 && endDay === 1 && daysDifference === 3) {
        return true;
    }

    // Thursday (4) to Monday (1) with 4 days difference = consecutive (long weekend)
    if (startDay === 4 && endDay === 1 && daysDifference === 4) {
        return true;
    }

    // Friday (5) to Tuesday (2) with 4 days difference = consecutive
    if (startDay === 5 && endDay === 2 && daysDifference === 4) {
        return true;
    }

    // Otherwise, check if more than 1 business day apart
    return daysDifference >= 2;
}

/**
 * Count distinct sick leave occasions in a time window
 * Groups consecutive leave days into single occasion
 * @param leaveRequests - Array of sick leave requests
 * @param windowStart - Start of window
 * @param windowEnd - End of window
 * @returns Number of distinct occasions
 */
export function getOccasionsInWindow(
    leaveRequests: LeaveRequest[],
    windowStart: Date,
    windowEnd: Date
): number {
    // Filter requests within window
    const requestsInWindow = leaveRequests.filter(req => {
        const reqStart = new Date(req.startDate);
        const reqEnd = new Date(req.endDate);
        return (reqStart >= windowStart && reqStart <= windowEnd) ||
               (reqEnd >= windowStart && reqEnd <= windowEnd) ||
               (reqStart <= windowStart && reqEnd >= windowEnd);
    });

    if (requestsInWindow.length === 0) {
        return 0;
    }

    // Sort by start date
    const sorted = requestsInWindow
        .map(req => ({
            start: new Date(req.startDate),
            end: new Date(req.endDate)
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    let occasions = 1;
    let currentEnd = sorted[0].end;

    for (let i = 1; i < sorted.length; i++) {
        const daysBetween = Math.ceil(
            (sorted[i].start.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24)
        );

        // If more than 3 days between (allowing for weekend), count as new occasion
        if (daysBetween > 3) {
            occasions++;
        }

        // Update current end to latest
        if (sorted[i].end > currentEnd) {
            currentEnd = sorted[i].end;
        }
    }

    return occasions;
}

/**
 * Build a Set of date strings (YYYY-MM-DD) for fast lookup
 * @param publicHolidays - Array of public holiday dates
 * @returns Set of date strings
 */
export function buildHolidayLookupSet(publicHolidays: Date[]): Set<string> {
    return new Set(publicHolidays.map(date => formatDateYYYYMMDD(date)));
}

/**
 * Format date as YYYY-MM-DD string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calculate date N months in the future
 * @param startDate - Starting date
 * @param months - Number of months to add
 * @returns New date
 */
export function addMonths(startDate: Date, months: number): Date {
    const result = new Date(startDate);
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * Check if date is a weekend (Saturday or Sunday)
 * @param date - Date to check
 * @returns True if weekend
 */
export function isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Get the previous business day
 * @param date - Starting date
 * @returns Previous business day
 */
export function getPreviousBusinessDay(date: Date): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - 1);

    while (isWeekend(result)) {
        result.setDate(result.getDate() - 1);
    }

    return result;
}

/**
 * Get the next business day
 * @param date - Starting date
 * @returns Next business day
 */
export function getNextBusinessDay(date: Date): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);

    while (isWeekend(result)) {
        result.setDate(result.getDate() + 1);
    }

    return result;
}

/**
 * Format timestamp as relative time string (e.g., "2 min ago", "Yesterday")
 * @param timestamp - Firestore Timestamp or Date object
 * @returns Relative time string
 */
export function getRelativeTime(timestamp: Timestamp | Date): string {
    // Convert Firestore Timestamp to Date if needed
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Less than 1 minute
    if (diffInMinutes < 1) {
        return 'Just now';
    }

    // Less than 60 minutes
    if (diffInMinutes < 60) {
        return `${diffInMinutes} min ago`;
    }

    // Less than 24 hours
    if (diffInHours < 24) {
        return `${diffInHours} hr ago`;
    }

    // Yesterday
    if (diffInDays === 1) {
        return 'Yesterday';
    }

    // More than 2 days
    if (diffInDays >= 2) {
        return `${diffInDays} days ago`;
    }

    // Fallback (should not reach here)
    return 'Recently';
}
