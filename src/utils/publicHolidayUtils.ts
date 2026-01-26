// ============================================================
// PUBLIC HOLIDAY UTILITY FUNCTIONS
// ============================================================

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { PublicHoliday } from '../types/company';
import { formatDateYYYYMMDD, buildHolidayLookupSet } from './dateUtils';

/**
 * Fetch public holidays for a specific company and year
 * @param companyId - Company ID
 * @param year - Year to fetch holidays for
 * @returns Array of public holiday dates
 */
export async function fetchPublicHolidays(
    companyId: string,
    year: number
): Promise<Date[]> {
    const q = query(
        collection(db, 'publicHolidays'),
        where('companyId', '==', companyId),
        where('year', '==', year)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data() as PublicHoliday;
        return data.date instanceof Timestamp
            ? data.date.toDate()
            : new Date(data.date);
    });
}

/**
 * Check if a date is adjacent to (day before or after) a public holiday
 * Handles weekends between holiday and date (checks consecutive business days)
 * @param date - Date to check
 * @param publicHolidays - Array of public holiday dates
 * @returns True if adjacent to public holiday
 */
export function isAdjacentToPublicHoliday(
    date: Date,
    publicHolidays: Date[]
): boolean {
    const holidaySet = buildHolidayLookupSet(publicHolidays);
    const dateString = formatDateYYYYMMDD(date);

    // Don't flag if date itself is a holiday
    if (holidaySet.has(dateString)) {
        return false;
    }

    // Check day before
    const dayBefore = new Date(date);
    dayBefore.setDate(dayBefore.getDate() - 1);
    if (holidaySet.has(formatDateYYYYMMDD(dayBefore))) {
        return true;
    }

    // Check day after
    const dayAfter = new Date(date);
    dayAfter.setDate(dayAfter.getDate() + 1);
    if (holidaySet.has(formatDateYYYYMMDD(dayAfter))) {
        return true;
    }

    // Check Friday before Monday date (holiday on Friday, sick leave on Monday)
    if (date.getDay() === 1) { // Monday
        const friday = new Date(date);
        friday.setDate(friday.getDate() - 3);
        if (holidaySet.has(formatDateYYYYMMDD(friday))) {
            return true;
        }
    }

    // Check Monday after Friday date (holiday on Monday, sick leave on Friday)
    if (date.getDay() === 5) { // Friday
        const monday = new Date(date);
        monday.setDate(monday.getDate() + 3);
        if (holidaySet.has(formatDateYYYYMMDD(monday))) {
            return true;
        }
    }

    // Check Thursday before Monday date (holiday on Thursday, sick leave on Monday - long weekend)
    if (date.getDay() === 1) { // Monday
        const thursday = new Date(date);
        thursday.setDate(thursday.getDate() - 4);
        if (holidaySet.has(formatDateYYYYMMDD(thursday))) {
            return true;
        }
    }

    // Check Tuesday after Friday date (holiday on Tuesday, sick leave on Friday - long weekend)
    if (date.getDay() === 5) { // Friday
        const tuesday = new Date(date);
        tuesday.setDate(tuesday.getDate() + 4);
        if (holidaySet.has(formatDateYYYYMMDD(tuesday))) {
            return true;
        }
    }

    return false;
}

/**
 * Fetch public holidays for a date range (handles multi-year ranges)
 * @param companyId - Company ID
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array of public holiday dates
 */
export async function fetchPublicHolidaysForRange(
    companyId: string,
    startDate: Date,
    endDate: Date
): Promise<Date[]> {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
        years.push(year);
    }

    // Fetch holidays for all years in range
    const allHolidays: Date[] = [];
    for (const year of years) {
        const holidays = await fetchPublicHolidays(companyId, year);
        allHolidays.push(...holidays);
    }

    // Filter to date range
    return allHolidays.filter(holiday => holiday >= startDate && holiday <= endDate);
}
