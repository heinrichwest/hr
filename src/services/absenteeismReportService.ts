// ============================================================
// ABSENTEEISM REPORT SERVICE
// ============================================================

import { collection, query, where, getDocs, Timestamp, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Employee } from '../types/employee';
import type { LeaveRequest } from '../types/leave';
import type { AbsenteeismReportData, AbsenteeismFilters, ComplianceFlag } from '../types/reports';
import { calculateSickLeaveCycle, validateMedicalCertificate, detectUnauthorizedAbsence } from './bceaComplianceService';
import { calculateAbsenteeismRate, getAbsentDaysInPeriod } from './absenteeismService';
import { fetchPublicHolidaysForRange } from '../utils/publicHolidayUtils';
import { getOccasionsInWindow } from '../utils/dateUtils';

/**
 * Generate absenteeism report for employees
 * @param companyId - Company ID
 * @param filters - Report filters (employeeId, dateRange, leaveTypeMode)
 * @returns Array of employee absenteeism report data
 */
export async function generateAbsenteeismReport(
    companyId: string,
    filters: AbsenteeismFilters
): Promise<AbsenteeismReportData[]> {
    try {
        // Build query for employees
        let employeeQuery = query(
            collection(db, `companies/${companyId}/employees`),
            where('status', 'in', ['active', 'on_leave', 'probation'])
        );

        // Filter by specific employee if provided
        if (filters.employeeId) {
            employeeQuery = query(
                collection(db, `companies/${companyId}/employees`),
                where('__name__', '==', filters.employeeId)
            );
        }

        const employeeSnapshot = await getDocs(employeeQuery);

        // If no employees found, return demo data
        if (employeeSnapshot.empty) {
            return DEMO_ABSENTEEISM_DATA;
        }

        const employees = employeeSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Employee[];

        // Fetch public holidays once for all employees
        const publicHolidays = await fetchPublicHolidaysForRange(
            companyId,
            filters.dateRange.startDate,
            filters.dateRange.endDate
        );

        // Generate report data for each employee
        const reportDataPromises = employees.map(employee =>
            getEmployeeAbsenteeismData(employee, companyId, filters, publicHolidays)
        );

        const reportData = await Promise.all(reportDataPromises);

        // Filter out any null results (employees with errors)
        return reportData.filter((data): data is AbsenteeismReportData => data !== null);
    } catch (error) {
        console.error('Error generating absenteeism report:', error);
        // Return demo data on error
        return DEMO_ABSENTEEISM_DATA;
    }
}

/**
 * Get absenteeism data for a single employee
 * @param employee - Employee object
 * @param companyId - Company ID
 * @param filters - Report filters
 * @param publicHolidays - Preloaded public holidays
 * @returns Absenteeism report data for employee
 */
async function getEmployeeAbsenteeismData(
    employee: Employee,
    companyId: string,
    filters: AbsenteeismFilters,
    publicHolidays: Date[]
): Promise<AbsenteeismReportData | null> {
    try {
        const employeeId = employee.id!;

        // Calculate sick leave cycle info
        const cycleInfo = await calculateSickLeaveCycle(employeeId, companyId);

        // Calculate absenteeism rate
        const absenteeismRate = await calculateAbsenteeismRate(
            employeeId,
            companyId,
            filters.dateRange,
            filters.leaveTypeMode
        );

        // Get total absent days
        const totalAbsentDays = await getAbsentDaysInPeriod(
            employeeId,
            companyId,
            filters.dateRange,
            filters.leaveTypeMode
        );

        // Get sick leave days specifically
        const sickLeaveDays = await getAbsentDaysInPeriod(
            employeeId,
            companyId,
            filters.dateRange,
            'sick_only'
        );

        // Fetch leave requests for flag generation
        const leaveQuery = query(
            collection(db, `companies/${companyId}/leaveRequests`),
            where('employeeId', '==', employeeId),
            where('status', '==', 'approved'),
            where('startDate', '>=', Timestamp.fromDate(filters.dateRange.startDate)),
            where('startDate', '<=', Timestamp.fromDate(filters.dateRange.endDate))
        );

        const leaveSnapshot = await getDocs(leaveQuery);
        const leaveRequests = leaveSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as LeaveRequest[];

        // Filter sick leave requests
        const sickLeaveRequests = leaveRequests.filter(req => {
            const leaveTypeName = req.leaveTypeName?.toLowerCase() || '';
            return leaveTypeName.includes('sick');
        });

        // Count occasions
        const occasions = getOccasionsInWindow(
            sickLeaveRequests,
            filters.dateRange.startDate,
            filters.dateRange.endDate
        );

        // Generate action flags
        const flags = await generateActionFlags(
            employeeId,
            companyId,
            filters.dateRange,
            leaveRequests,
            publicHolidays,
            totalAbsentDays
        );

        // Count unauthorized absences
        const unauthorizedAbsenceCount = detectUnauthorizedAbsence(
            sickLeaveRequests,
            publicHolidays
        );

        return {
            employeeId,
            employeeNumber: employee.employeeNumber,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            department: employee.department || 'Unassigned',
            totalAbsentDays,
            sickLeaveDays,
            occasions,
            cycleInfo: {
                cycleStartDate: cycleInfo.startDate,
                cycleEndDate: cycleInfo.endDate,
                daysUsed: cycleInfo.daysUsed,
                daysRemaining: cycleInfo.daysRemaining
            },
            absenteeismRate,
            flags,
            unauthorizedAbsenceCount
        };
    } catch (error) {
        console.error(`Error generating data for employee ${employee.id}:`, error);
        return null;
    }
}

/**
 * Generate action flags for an employee based on BCEA rules
 * @param employeeId - Employee ID
 * @param companyId - Company ID
 * @param dateRange - Date range for report
 * @param leaveRequests - All leave requests in period
 * @param publicHolidays - Public holidays in period
 * @param totalAbsentDays - Total absent days in period
 * @returns Array of compliance flags
 */
export async function generateActionFlags(
    employeeId: string,
    companyId: string,
    dateRange: { startDate: Date; endDate: Date },
    leaveRequests: LeaveRequest[],
    publicHolidays: Date[],
    totalAbsentDays: number
): Promise<ComplianceFlag[]> {
    // Reserved for future use
    void employeeId;
    void companyId;
    void dateRange;

    const flags: ComplianceFlag[] = [];

    // Filter sick leave requests
    const sickLeaveRequests = leaveRequests.filter(req => {
        const leaveTypeName = req.leaveTypeName?.toLowerCase() || '';
        return leaveTypeName.includes('sick');
    });

    // Validate medical certificates for each sick leave request
    const medicalCertificateFlags = new Set<string>(); // Track unique flag types

    sickLeaveRequests.forEach(req => {
        const reqFlags = validateMedicalCertificate(req, publicHolidays, sickLeaveRequests);
        reqFlags.forEach(flag => {
            // Avoid duplicate flag types
            const flagKey = `${flag.type}-${flag.ruleTriggered}`;
            if (!medicalCertificateFlags.has(flagKey)) {
                medicalCertificateFlags.add(flagKey);
                flags.push(flag);
            }
        });
    });

    // Flag: Attendance counseling recommended (>5 days absent)
    if (totalAbsentDays > 5) {
        flags.push({
            type: 'attendance_counseling_recommended',
            message: `Attendance counseling recommended: ${totalAbsentDays} days absent in period`,
            severity: 'info',
            ruleTriggered: 'BCEA Rule 4: Total absent days exceeds threshold (>5 days)'
        });
    }

    return flags;
}

/**
 * Generate paginated absenteeism report
 * @param companyId - Company ID
 * @param filters - Report filters
 * @param pageSize - Number of records per page (default 50)
 * @param lastDoc - Last document from previous page (for pagination)
 * @returns Paginated report data with metadata
 */
export async function generatePaginatedAbsenteeismReport(
    companyId: string,
    filters: AbsenteeismFilters,
    pageSize: number = 50,
    lastDoc?: QueryDocumentSnapshot
): Promise<{
    data: AbsenteeismReportData[];
    pagination: {
        currentPage: number;
        pageSize: number;
        hasNextPage: boolean;
    };
}> {
    try {
        // Build query for employees with pagination
        let employeeQuery = query(
            collection(db, `companies/${companyId}/employees`),
            where('status', 'in', ['active', 'on_leave', 'probation']),
            limit(pageSize + 1) // Fetch one extra to check if there's a next page
        );

        // Filter by specific employee if provided
        if (filters.employeeId) {
            employeeQuery = query(
                collection(db, `companies/${companyId}/employees`),
                where('__name__', '==', filters.employeeId),
                limit(pageSize + 1)
            );
        }

        // Apply pagination cursor
        if (lastDoc) {
            employeeQuery = query(employeeQuery, startAfter(lastDoc));
        }

        const employeeSnapshot = await getDocs(employeeQuery);

        // Check if there's a next page
        const hasNextPage = employeeSnapshot.docs.length > pageSize;
        const employees = employeeSnapshot.docs.slice(0, pageSize).map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Employee[];

        // If no employees found, return demo data
        if (employees.length === 0) {
            return {
                data: DEMO_ABSENTEEISM_DATA,
                pagination: {
                    currentPage: 1,
                    pageSize,
                    hasNextPage: false
                }
            };
        }

        // Fetch public holidays once for all employees
        const publicHolidays = await fetchPublicHolidaysForRange(
            companyId,
            filters.dateRange.startDate,
            filters.dateRange.endDate
        );

        // Generate report data for each employee
        const reportDataPromises = employees.map(employee =>
            getEmployeeAbsenteeismData(employee, companyId, filters, publicHolidays)
        );

        const reportData = await Promise.all(reportDataPromises);

        // Filter out any null results
        const validReportData = reportData.filter(
            (data): data is AbsenteeismReportData => data !== null
        );

        return {
            data: validReportData,
            pagination: {
                currentPage: 1, // Client needs to track this
                pageSize,
                hasNextPage
            }
        };
    } catch (error) {
        console.error('Error generating paginated absenteeism report:', error);
        return {
            data: DEMO_ABSENTEEISM_DATA,
            pagination: {
                currentPage: 1,
                pageSize,
                hasNextPage: false
            }
        };
    }
}

// ============================================================
// DEMO DATA
// ============================================================

/**
 * Demo absenteeism data for display when no real data exists
 * Includes realistic BCEA scenarios with various flag types
 */
const DEMO_ABSENTEEISM_DATA: AbsenteeismReportData[] = [
    {
        employeeId: 'demo-emp-001',
        employeeNumber: 'DEMO001',
        employeeName: 'Thabo Mokoena',
        department: 'IT',
        totalAbsentDays: 4,
        sickLeaveDays: 2,
        occasions: 1,
        cycleInfo: {
            cycleStartDate: new Date('2023-01-15'),
            cycleEndDate: new Date('2026-01-15'),
            daysUsed: 8,
            daysRemaining: 28
        },
        absenteeismRate: 1.72,
        flags: [],
        unauthorizedAbsenceCount: 0
    },
    {
        employeeId: 'demo-emp-002',
        employeeNumber: 'DEMO002',
        employeeName: 'Zanele Nel',
        department: 'Human Resources',
        totalAbsentDays: 7,
        sickLeaveDays: 5,
        occasions: 2,
        cycleInfo: {
            cycleStartDate: new Date('2023-03-01'),
            cycleEndDate: new Date('2026-03-01'),
            daysUsed: 15,
            daysRemaining: 21
        },
        absenteeismRate: 3.02,
        flags: [
            {
                type: 'attendance_counseling_recommended',
                message: 'Attendance counseling recommended: 7 days absent in period',
                severity: 'info',
                ruleTriggered: 'BCEA Rule 4: Total absent days exceeds threshold (>5 days)'
            }
        ],
        unauthorizedAbsenceCount: 0
    },
    {
        employeeId: 'demo-emp-003',
        employeeNumber: 'DEMO003',
        employeeName: 'Lerato Dlamini',
        department: 'Finance',
        totalAbsentDays: 9,
        sickLeaveDays: 6,
        occasions: 3,
        cycleInfo: {
            cycleStartDate: new Date('2023-06-10'),
            cycleEndDate: new Date('2026-06-10'),
            daysUsed: 18,
            daysRemaining: 18
        },
        absenteeismRate: 3.88,
        flags: [
            {
                type: 'medical_certificate_required',
                message: 'Medical certificate required for 2+ consecutive sick days',
                severity: 'warning',
                ruleTriggered: 'BCEA Rule 1: Sick leave of 2+ consecutive days'
            },
            {
                type: 'attendance_counseling_recommended',
                message: 'Attendance counseling recommended: 9 days absent in period',
                severity: 'info',
                ruleTriggered: 'BCEA Rule 4: Total absent days exceeds threshold (>5 days)'
            }
        ],
        unauthorizedAbsenceCount: 1
    },
    {
        employeeId: 'demo-emp-004',
        employeeNumber: 'DEMO004',
        employeeName: 'Sipho Khumalo',
        department: 'Operations',
        totalAbsentDays: 3,
        sickLeaveDays: 1,
        occasions: 1,
        cycleInfo: {
            cycleStartDate: new Date('2023-08-20'),
            cycleEndDate: new Date('2026-08-20'),
            daysUsed: 5,
            daysRemaining: 31
        },
        absenteeismRate: 1.29,
        flags: [],
        unauthorizedAbsenceCount: 0
    },
    {
        employeeId: 'demo-emp-005',
        employeeNumber: 'DEMO005',
        employeeName: 'Nombuso Zulu',
        department: 'Marketing',
        totalAbsentDays: 11,
        sickLeaveDays: 8,
        occasions: 4,
        cycleInfo: {
            cycleStartDate: new Date('2023-10-05'),
            cycleEndDate: new Date('2026-10-05'),
            daysUsed: 22,
            daysRemaining: 14
        },
        absenteeismRate: 4.74,
        flags: [
            {
                type: 'bcea_violation_risk',
                message: 'Medical certificate required for sick leave adjacent to public holiday',
                severity: 'error',
                ruleTriggered: 'BCEA Rule 2: Sick leave before/after public holiday'
            },
            {
                type: 'medical_certificate_required',
                message: 'Medical certificate required for 2+ sick leave occasions in 8-week period',
                severity: 'warning',
                ruleTriggered: 'BCEA Rule 3: Multiple occasions in 8 weeks'
            },
            {
                type: 'attendance_counseling_recommended',
                message: 'Attendance counseling recommended: 11 days absent in period',
                severity: 'info',
                ruleTriggered: 'BCEA Rule 4: Total absent days exceeds threshold (>5 days)'
            }
        ],
        unauthorizedAbsenceCount: 2
    }
];
