// ============================================================
// BCEA COMPLIANCE SERVICE
// ============================================================

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { LeaveRequest } from '../types/leave';
import type { Employee } from '../types/employee';
import type { BCEASickLeaveCycle, ComplianceFlag } from '../types/reports';
import { addMonths } from '../utils/dateUtils';
import { isConsecutiveSickLeave, getOccasionsInWindow } from '../utils/dateUtils';
import { isAdjacentToPublicHoliday } from '../utils/publicHolidayUtils';
import { BCEA_LEAVE_RULES } from '../types/leave';

/**
 * Calculate sick leave cycle for an employee (36 days over 36 months)
 * @param employeeId - Employee ID
 * @param companyId - Company ID
 * @returns Sick leave cycle information
 */
export async function calculateSickLeaveCycle(
    employeeId: string,
    companyId: string
): Promise<BCEASickLeaveCycle> {
    // Fetch employee to get hire date
    const employeeQuery = query(
        collection(db, `companies/${companyId}/employees`),
        where('__name__', '==', employeeId)
    );
    const employeeSnapshot = await getDocs(employeeQuery);

    if (employeeSnapshot.empty) {
        throw new Error(`Employee not found: ${employeeId}`);
    }

    const employeeData = employeeSnapshot.docs[0].data() as Employee;
    const hireDate = employeeData.startDate instanceof Timestamp
        ? employeeData.startDate.toDate()
        : new Date(employeeData.startDate);

    // Calculate current cycle window (rolling 36 months from hire date)
    const today = new Date();
    const cycleMonths = BCEA_LEAVE_RULES.sick.cycleMonths; // 36 months

    // Determine cycle start date (most recent cycle that includes today)
    let cycleStartDate = new Date(hireDate);
    while (addMonths(cycleStartDate, cycleMonths) < today) {
        cycleStartDate = addMonths(cycleStartDate, cycleMonths);
    }

    const cycleEndDate = addMonths(cycleStartDate, cycleMonths);

    // Query approved sick leave within cycle
    const leaveQuery = query(
        collection(db, `companies/${companyId}/leaveRequests`),
        where('employeeId', '==', employeeId),
        where('status', '==', 'approved'),
        where('startDate', '>=', Timestamp.fromDate(cycleStartDate)),
        where('startDate', '<=', Timestamp.fromDate(cycleEndDate))
    );

    const leaveSnapshot = await getDocs(leaveQuery);
    const sickLeaveRequests = leaveSnapshot.docs
        .map(doc => doc.data() as LeaveRequest)
        .filter(req => {
            // Filter by leave type 'sick'
            const leaveTypeName = req.leaveTypeName?.toLowerCase() || '';
            return leaveTypeName.includes('sick');
        });

    // Count total days used
    const daysUsed = sickLeaveRequests.reduce((total, req) => {
        return total + (req.workingDays || 0);
    }, 0);

    // Count occasions
    const occasions = getOccasionsInWindow(
        sickLeaveRequests,
        cycleStartDate,
        cycleEndDate
    );

    const maxDays = BCEA_LEAVE_RULES.sick.cycleDays; // 36 days
    const daysRemaining = Math.max(0, maxDays - daysUsed);

    return {
        employeeId,
        startDate: cycleStartDate,
        endDate: cycleEndDate,
        daysUsed,
        daysRemaining,
        occasions
    };
}

/**
 * Validate medical certificate requirements for a leave request
 * @param leaveRequest - Leave request to validate
 * @param publicHolidays - Array of public holiday dates
 * @param allLeaveRequests - All leave requests for 8-week window check
 * @returns Array of compliance flags
 */
export function validateMedicalCertificate(
    leaveRequest: LeaveRequest,
    publicHolidays: Date[],
    allLeaveRequests: LeaveRequest[] = []
): ComplianceFlag[] {
    const flags: ComplianceFlag[] = [];

    // Check if medical certificate is attached
    const hasCertificate = leaveRequest.attachments && leaveRequest.attachments.length > 0;

    // Rule 1: Flag 2+ consecutive sick days without certificate
    if (isConsecutiveSickLeave(leaveRequest)) {
        if (!hasCertificate) {
            flags.push({
                type: 'medical_certificate_required',
                message: 'Medical certificate required for 2+ consecutive sick days',
                severity: 'warning',
                ruleTriggered: 'BCEA Rule 1: Sick leave of 2+ consecutive days'
            });
        }
    }

    // Rule 2: Flag sick day before/after public holiday without certificate
    const startDate = leaveRequest.startDate instanceof Timestamp
        ? leaveRequest.startDate.toDate()
        : new Date(leaveRequest.startDate);
    const endDate = leaveRequest.endDate instanceof Timestamp
        ? leaveRequest.endDate.toDate()
        : new Date(leaveRequest.endDate);

    if (isAdjacentToPublicHoliday(startDate, publicHolidays) ||
        isAdjacentToPublicHoliday(endDate, publicHolidays)) {
        if (!hasCertificate) {
            flags.push({
                type: 'bcea_violation_risk',
                message: 'Medical certificate required for sick leave adjacent to public holiday',
                severity: 'error',
                ruleTriggered: 'BCEA Rule 2: Sick leave before/after public holiday'
            });
        }
    }

    // Rule 3: Flag 2+ occasions in 8-week window without certificates
    if (allLeaveRequests.length > 0) {
        const windowEnd = new Date(startDate);
        const windowStart = new Date(startDate);
        windowStart.setDate(windowStart.getDate() - 56); // 8 weeks = 56 days

        const occasionsInWindow = getOccasionsInWindow(
            allLeaveRequests,
            windowStart,
            windowEnd
        );

        if (occasionsInWindow >= 2) {
            // Check if any occasion lacks certificate
            const occasionsWithoutCerts = allLeaveRequests.filter(
                req => !req.attachments || req.attachments.length === 0
            );

            if (occasionsWithoutCerts.length > 0) {
                flags.push({
                    type: 'medical_certificate_required',
                    message: 'Medical certificate required for 2+ sick leave occasions in 8-week period',
                    severity: 'warning',
                    ruleTriggered: 'BCEA Rule 3: Multiple occasions in 8 weeks'
                });
            }
        }
    }

    return flags;
}

/**
 * Detect unauthorized absences (sick leave missing required certificates)
 * @param leaveRequests - Array of sick leave requests
 * @param publicHolidays - Array of public holiday dates
 * @returns Count of unauthorized absences
 */
export function detectUnauthorizedAbsence(
    leaveRequests: LeaveRequest[],
    publicHolidays: Date[]
): number {
    let unauthorizedCount = 0;

    leaveRequests.forEach(req => {
        const flags = validateMedicalCertificate(req, publicHolidays, leaveRequests);

        // If any flags raised and no certificate, count as unauthorized
        const hasCertificate = req.attachments && req.attachments.length > 0;
        if (flags.length > 0 && !hasCertificate) {
            unauthorizedCount++;
        }
    });

    return unauthorizedCount;
}
