// ============================================================
// ABSENTEEISM CALCULATION SERVICE
// ============================================================

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { LeaveRequest } from '../types/leave';
import type { Employee } from '../types/employee';
import type { DateRange, LeaveTypeMode } from '../types/reports';
import { getBusinessDaysInRange } from '../utils/dateUtils';
import { fetchPublicHolidaysForRange } from '../utils/publicHolidayUtils';

/**
 * Calculate absenteeism rate for an employee
 * Formula: (Total absent days / Total scheduled working days) × 100
 * @param employeeId - Employee ID
 * @param companyId - Company ID
 * @param dateRange - Date range to calculate for
 * @param leaveTypeMode - 'sick_only' or 'all_types'
 * @returns Absenteeism rate as percentage
 */
export async function calculateAbsenteeismRate(
    employeeId: string,
    companyId: string,
    dateRange: DateRange,
    leaveTypeMode: LeaveTypeMode
): Promise<number> {
    // Get absent days
    const absentDays = await getAbsentDaysInPeriod(
        employeeId,
        companyId,
        dateRange,
        leaveTypeMode
    );

    // Get scheduled working days
    const scheduledWorkingDays = await getScheduledWorkingDays(
        employeeId,
        companyId,
        dateRange
    );

    if (scheduledWorkingDays === 0) {
        return 0;
    }

    const rate = (absentDays / scheduledWorkingDays) * 100;
    return Math.round(rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Get total absent days for an employee in a period
 * Excludes weekends and public holidays
 * @param employeeId - Employee ID
 * @param companyId - Company ID
 * @param dateRange - Date range to calculate for
 * @param leaveTypeMode - 'sick_only' or 'all_types'
 * @returns Total absent days
 */
export async function getAbsentDaysInPeriod(
    employeeId: string,
    companyId: string,
    dateRange: DateRange,
    leaveTypeMode: LeaveTypeMode
): Promise<number> {
    // Query leave requests in date range
    const leaveQuery = query(
        collection(db, `companies/${companyId}/leaveRequests`),
        where('employeeId', '==', employeeId),
        where('status', '==', 'approved'),
        where('startDate', '>=', Timestamp.fromDate(dateRange.startDate)),
        where('startDate', '<=', Timestamp.fromDate(dateRange.endDate))
    );

    const leaveSnapshot = await getDocs(leaveQuery);
    let leaveRequests = leaveSnapshot.docs.map(doc => doc.data() as LeaveRequest);

    // Filter by leave type mode
    if (leaveTypeMode === 'sick_only') {
        leaveRequests = leaveRequests.filter(req => {
            const leaveTypeName = req.leaveTypeName?.toLowerCase() || '';
            return leaveTypeName.includes('sick');
        });
    }

    // Sum working days (already excludes weekends/holidays in LeaveRequest)
    const totalAbsentDays = leaveRequests.reduce((total, req) => {
        return total + (req.workingDays || 0);
    }, 0);

    return totalAbsentDays;
}

/**
 * Get scheduled working days for an employee in a period
 * Excludes weekends, public holidays, and adjusts for hire date
 * @param employeeId - Employee ID
 * @param companyId - Company ID
 * @param dateRange - Date range to calculate for
 * @returns Total scheduled working days
 */
export async function getScheduledWorkingDays(
    employeeId: string,
    companyId: string,
    dateRange: DateRange
): Promise<number> {
    // Fetch employee to check hire date
    const employeeQuery = query(
        collection(db, `companies/${companyId}/employees`),
        where('__name__', '==', employeeId)
    );
    const employeeSnapshot = await getDocs(employeeQuery);

    if (employeeSnapshot.empty) {
        return 0;
    }

    const employeeData = employeeSnapshot.docs[0].data() as Employee;
    const hireDate = employeeData.startDate instanceof Timestamp
        ? employeeData.startDate.toDate()
        : new Date(employeeData.startDate);

    // Adjust start date if hired mid-period
    const effectiveStartDate = hireDate > dateRange.startDate
        ? hireDate
        : dateRange.startDate;

    // If hired after period end, return 0
    if (effectiveStartDate > dateRange.endDate) {
        return 0;
    }

    // Fetch public holidays for the period
    const publicHolidays = await fetchPublicHolidaysForRange(
        companyId,
        effectiveStartDate,
        dateRange.endDate
    );

    // Calculate business days
    const businessDays = getBusinessDaysInRange(
        effectiveStartDate,
        dateRange.endDate,
        publicHolidays
    );

    return businessDays;
}
