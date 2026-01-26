// ============================================================
// SYSTEM ADMIN REPORTS SERVICE
// Phase 1: Individual Company Reports with UI-19 Priority
// ============================================================

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Employee } from '../types/employee';
import type { Company } from '../types/company';
import type { LeaveBalance, LeaveRequest, LeaveType } from '../types/leave';
import type { PayRun, PayRunLine } from '../types/payroll';
import type {
    UI19Report,
    UI19EmployeeRow,
    UI19EmployerDetails,
    TerminationReasonCode,
    NonContributorReasonCode
} from '../types/ui19';
import type {
    BasicEmployeeInfoReport,
    BasicEmployeeInfoRow,
    WorkforceProfileReport,
    LeaveMovementReport,
    LeaveBalanceByType,
    EmployeeLeaveBalance,
    LeaveTakenRecord,
    LeaveUsageTrend,
    ReportMetadata,
    ReportHistoryEntry,
    ReportPeriodType
} from '../types/adminReports';

/**
 * Admin Reports Service
 * Handles generation of all System Admin dashboard reports
 */
export const AdminReportService = {
    // ============================================================
    // UI-19 UIF EMPLOYER'S DECLARATION REPORT
    // ============================================================

    /**
     * Generate UI-19 UIF Employer's Declaration for a specific month
     * @param companyId - Tenant company ID
     * @param month - Reporting month (Date object)
     * @returns Complete UI-19 report structure
     */
    async generateUI19Report(companyId: string, month: Date): Promise<UI19Report> {
        // Calculate period boundaries
        const periodStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const periodEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

        // Fetch company details for employer section
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (!companyDoc.exists()) {
            throw new Error('Company not found');
        }
        const company = { id: companyDoc.id, ...companyDoc.data() } as Company;

        // Build employer details from company profile
        const employerDetails: UI19EmployerDetails = {
            uifEmployerReference: company.uifReference || '',
            payeReference: company.payeReference,
            tradingName: company.tradingName || company.legalName,
            physicalAddress: company.physicalAddress,
            postalAddress: company.postalAddress,
            companyRegistrationNumber: company.registrationNumber,
            email: company.email,
            phone: company.phone,
            fax: company.fax,
            authorisedPersonName: company.authorisedPersonName,
            authorisedPersonIdNumber: company.authorisedPersonIdNumber
        };

        // Query employees - include active, new hires, and terminations during period
        const employeesRef = collection(db, `companies/${companyId}/employees`);
        const employeesSnapshot = await getDocs(employeesRef);

        const employeeRows: UI19EmployeeRow[] = [];
        const employees = employeesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Employee[];

        // Get payroll data for the period
        const payRunsRef = collection(db, `companies/${companyId}/payRuns`);
        const payRunsQuery = query(
            payRunsRef,
            where('periodStartDate', '>=', Timestamp.fromDate(periodStart)),
            where('periodStartDate', '<=', Timestamp.fromDate(periodEnd))
        );
        const payRunsSnapshot = await getDocs(payRunsQuery);

        // Map employee ID to gross remuneration
        const remunerationMap = new Map<string, number>();
        const hoursWorkedMap = new Map<string, number>();

        for (const payRunDoc of payRunsSnapshot.docs) {
            const payRun = payRunDoc.data() as PayRun;

            // Get pay run lines
            const linesRef = collection(db, `companies/${companyId}/payRuns/${payRunDoc.id}/payRunLines`);
            const linesSnapshot = await getDocs(linesRef);

            linesSnapshot.docs.forEach(lineDoc => {
                const line = lineDoc.data() as PayRunLine;
                const currentRemuneration = remunerationMap.get(line.employeeId) || 0;
                const currentHours = hoursWorkedMap.get(line.employeeId) || 0;

                remunerationMap.set(line.employeeId, currentRemuneration + line.grossEarnings);
                hoursWorkedMap.set(line.employeeId, currentHours + (line.hoursWorked || 0));
            });
        }

        // Process each employee
        for (const employee of employees) {
            const startDate = employee.startDate instanceof Timestamp
                ? employee.startDate.toDate()
                : new Date(employee.startDate);

            const endDate = employee.endDate instanceof Timestamp
                ? employee.endDate.toDate()
                : employee.endDate ? new Date(employee.endDate) : null;

            // Include if:
            // 1. Active during the period
            // 2. Started during the period
            // 3. Terminated during the period
            const isActiveInPeriod = startDate <= periodEnd && (!endDate || endDate >= periodStart);

            if (!isActiveInPeriod) {
                continue;
            }

            // Extract initials from first name
            const initials = employee.firstName
                .split(' ')
                .map(name => name.charAt(0).toUpperCase())
                .join('');

            // Determine UIF contributor status
            const isContributor = employee.uifContributor !== false; // Default to true
            const nonContributorReason = employee.uifNonContributorReason;

            // Determine termination details
            const terminationDate = endDate && endDate <= periodEnd ? endDate : undefined;
            const terminationReasonCode = employee.terminationReasonCode as TerminationReasonCode | undefined;

            // Get gross remuneration for the month
            const grossRemuneration = remunerationMap.get(employee.id) || 0;
            const hoursWorked = hoursWorkedMap.get(employee.id) || 0;

            const employeeRow: UI19EmployeeRow = {
                employeeId: employee.id,
                surname: employee.lastName,
                initials,
                idNumber: employee.idNumber,
                grossRemuneration,
                hoursWorked,
                commencementDate: startDate,
                terminationDate,
                terminationReasonCode,
                isContributor,
                nonContributorReasonCode: !isContributor ? nonContributorReason : undefined
            };

            employeeRows.push(employeeRow);
        }

        // Sort by surname
        employeeRows.sort((a, b) => a.surname.localeCompare(b.surname));

        // Calculate totals
        const totalEmployees = employeeRows.length;
        const totalContributors = employeeRows.filter(e => e.isContributor).length;
        const totalNonContributors = totalEmployees - totalContributors;

        // Generate report ID
        const reportId = `ui19_${companyId}_${periodStart.getFullYear()}_${String(periodStart.getMonth() + 1).padStart(2, '0')}`;

        // Build declaration
        const declaration = {
            statement: 'I hereby declare that the information provided in this return is true and correct to the best of my knowledge and belief.',
            authorisedPersonName: company.authorisedPersonName || '',
            authorisedPersonTitle: company.authorisedPersonTitle,
            signatureDate: undefined
        };

        const report: UI19Report = {
            reportId,
            companyId,
            reportingPeriod: {
                month: periodStart.getMonth() + 1,
                year: periodStart.getFullYear(),
                startDate: periodStart,
                endDate: periodEnd
            },
            employerDetails,
            employees: employeeRows,
            declaration,
            generatedBy: '', // Will be set by caller
            generatedByName: '', // Will be set by caller
            generatedAt: new Date(),
            totalEmployees,
            totalContributors,
            totalNonContributors
        };

        return report;
    },

    // ============================================================
    // BASIC EMPLOYEE INFORMATION REPORT
    // ============================================================

    /**
     * Generate Basic Employee Information report
     * @param companyId - Tenant company ID
     * @param filters - Optional filters for department, status
     * @returns Employee demographics and employment details
     */
    async generateBasicEmployeeInfoReport(
        companyId: string,
        filters?: { departmentId?: string; status?: string }
    ): Promise<BasicEmployeeInfoReport> {
        // Query employees
        let employeesQuery = query(collection(db, `companies/${companyId}/employees`));

        if (filters?.status) {
            employeesQuery = query(employeesQuery, where('status', '==', filters.status));
        }
        if (filters?.departmentId) {
            employeesQuery = query(employeesQuery, where('departmentId', '==', filters.departmentId));
        }

        const employeesSnapshot = await getDocs(employeesQuery);
        const employees = employeesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Employee[];

        const now = new Date();
        const employeeRows: BasicEmployeeInfoRow[] = [];

        const byDepartment: Record<string, number> = {};
        const byContractType: Record<string, number> = {};
        const byStatus: Record<string, number> = {};

        for (const employee of employees) {
            const startDate = employee.startDate instanceof Timestamp
                ? employee.startDate.toDate()
                : new Date(employee.startDate);

            const endDate = employee.endDate instanceof Timestamp
                ? employee.endDate.toDate()
                : employee.endDate ? new Date(employee.endDate) : undefined;

            const dob = employee.dateOfBirth instanceof Timestamp
                ? employee.dateOfBirth.toDate()
                : new Date(employee.dateOfBirth);

            const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            const yearsOfService = Math.floor((now.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

            // Build residential address string
            const residentialAddress = `${employee.residentialAddress.line1}, ${employee.residentialAddress.city}, ${employee.residentialAddress.postalCode}`;
            const postalAddress = employee.postalAddress
                ? `${employee.postalAddress.line1}, ${employee.postalAddress.city}, ${employee.postalAddress.postalCode}`
                : undefined;

            const row: BasicEmployeeInfoRow = {
                employeeId: employee.id,
                employeeNumber: employee.employeeNumber,
                firstName: employee.firstName,
                lastName: employee.lastName,
                fullName: `${employee.firstName} ${employee.lastName}`,
                idNumber: employee.idNumber,
                email: employee.email,
                phone: employee.phone,
                dateOfBirth: dob,
                age,
                gender: employee.gender,
                nationality: employee.nationality,
                maritalStatus: employee.maritalStatus,
                departmentId: employee.departmentId,
                department: employee.department || '-',
                branchId: employee.branchId,
                branch: employee.branch,
                jobTitleId: employee.jobTitleId,
                jobTitle: employee.jobTitle || '-',
                gradeId: employee.gradeId,
                grade: employee.grade,
                managerId: employee.managerId,
                managerName: employee.managerName,
                contractType: employee.contractType,
                employmentStatus: employee.status,
                startDate,
                endDate,
                yearsOfService,
                residentialAddress,
                postalAddress
            };

            employeeRows.push(row);

            // Aggregate summaries
            const dept = employee.department || 'Unassigned';
            byDepartment[dept] = (byDepartment[dept] || 0) + 1;

            const contractType = employee.contractType;
            byContractType[contractType] = (byContractType[contractType] || 0) + 1;

            const status = employee.status;
            byStatus[status] = (byStatus[status] || 0) + 1;
        }

        // Sort by full name
        employeeRows.sort((a, b) => a.fullName.localeCompare(b.fullName));

        // Get company details
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        const company = companyDoc.exists() ? ({ id: companyDoc.id, ...companyDoc.data() } as Company) : null;

        const metadata: ReportMetadata = {
            reportId: `basic_employee_info_${companyId}_${Date.now()}`,
            reportType: 'basic-employee-info',
            companyId,
            companyName: company?.legalName || 'Unknown Company',
            periodType: 'custom',
            periodStart: now,
            periodEnd: now,
            generatedBy: '',
            generatedByName: '',
            generatedAt: now
        };

        return {
            metadata,
            employees: employeeRows,
            summary: {
                totalEmployees: employeeRows.length,
                byDepartment,
                byContractType,
                byStatus
            }
        };
    },

    // ============================================================
    // WORKFORCE PROFILE REPORT
    // ============================================================

    /**
     * Generate Workforce Profile report with demographics and charts
     * @param companyId - Tenant company ID
     * @param period - Report period date
     * @returns Headcount summaries, demographics, and chart data
     */
    async generateWorkforceProfileReport(
        companyId: string,
        period: Date
    ): Promise<WorkforceProfileReport> {
        // Query active employees
        const employeesQuery = query(
            collection(db, `companies/${companyId}/employees`),
            where('status', 'in', ['active', 'probation', 'on_leave'])
        );
        const employeesSnapshot = await getDocs(employeesQuery);
        const employees = employeesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Employee[];

        const now = new Date();

        // Initialize aggregation maps
        const departmentMap = new Map<string, { id: string; name: string; count: number }>();
        const branchMap = new Map<string, { id: string; name: string; count: number }>();
        const gradeMap = new Map<string, { id: string; name: string; count: number }>();
        const ageGroups = [
            { label: '18-25', min: 18, max: 25, count: 0 },
            { label: '26-35', min: 26, max: 35, count: 0 },
            { label: '36-45', min: 36, max: 45, count: 0 },
            { label: '46-55', min: 46, max: 55, count: 0 },
            { label: '56+', min: 56, max: 120, count: 0 }
        ];
        const genderMap = new Map<string, number>();
        const raceMap = new Map<string, number>();
        const nationalityMap = new Map<string, number>();

        const employeeTypeDistribution = {
            permanent: 0,
            fixedTerm: 0,
            partTime: 0,
            temporary: 0,
            contractor: 0,
            intern: 0,
            total: 0
        };

        const rawData: WorkforceProfileReport['rawData'] = [];

        for (const employee of employees) {
            const dob = employee.dateOfBirth instanceof Timestamp
                ? employee.dateOfBirth.toDate()
                : new Date(employee.dateOfBirth);
            const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

            // Department aggregation
            const deptId = employee.departmentId;
            const deptName = employee.department || 'Unassigned';
            if (!departmentMap.has(deptId)) {
                departmentMap.set(deptId, { id: deptId, name: deptName, count: 0 });
            }
            departmentMap.get(deptId)!.count++;

            // Branch aggregation
            if (employee.branchId) {
                const branchId = employee.branchId;
                const branchName = employee.branch || 'Unknown Branch';
                if (!branchMap.has(branchId)) {
                    branchMap.set(branchId, { id: branchId, name: branchName, count: 0 });
                }
                branchMap.get(branchId)!.count++;
            }

            // Grade aggregation
            if (employee.gradeId) {
                const gradeId = employee.gradeId;
                const gradeName = employee.grade || 'Unknown Grade';
                if (!gradeMap.has(gradeId)) {
                    gradeMap.set(gradeId, { id: gradeId, name: gradeName, count: 0 });
                }
                gradeMap.get(gradeId)!.count++;
            }

            // Age groups
            const ageGroup = ageGroups.find(g => age >= g.min && age <= g.max);
            if (ageGroup) {
                ageGroup.count++;
            }

            // Gender
            if (employee.gender) {
                genderMap.set(employee.gender, (genderMap.get(employee.gender) || 0) + 1);
            }

            // Race
            if (employee.race) {
                raceMap.set(employee.race, (raceMap.get(employee.race) || 0) + 1);
            }

            // Nationality
            if (employee.nationality) {
                nationalityMap.set(employee.nationality, (nationalityMap.get(employee.nationality) || 0) + 1);
            }

            // Contract type distribution
            employeeTypeDistribution.total++;
            switch (employee.contractType) {
                case 'permanent':
                    employeeTypeDistribution.permanent++;
                    break;
                case 'fixed_term':
                    employeeTypeDistribution.fixedTerm++;
                    break;
                case 'part_time':
                    employeeTypeDistribution.partTime++;
                    break;
                case 'temporary':
                    employeeTypeDistribution.temporary++;
                    break;
                case 'contractor':
                    employeeTypeDistribution.contractor++;
                    break;
                case 'intern':
                    employeeTypeDistribution.intern++;
                    break;
            }

            // Raw data for export
            rawData.push({
                employeeId: employee.id,
                employeeNumber: employee.employeeNumber,
                fullName: `${employee.firstName} ${employee.lastName}`,
                department: employee.department || '-',
                branch: employee.branch || '-',
                jobTitle: employee.jobTitle || '-',
                jobGrade: employee.grade || '-',
                contractType: employee.contractType,
                age,
                gender: employee.gender,
                race: employee.race,
                nationality: employee.nationality
            });
        }

        const total = employees.length;

        // Get company details
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        const company = companyDoc.exists() ? ({ id: companyDoc.id, ...companyDoc.data() } as Company) : null;

        const metadata: ReportMetadata = {
            reportId: `workforce_profile_${companyId}_${Date.now()}`,
            reportType: 'workforce-profile',
            companyId,
            companyName: company?.legalName || 'Unknown Company',
            periodType: 'custom',
            periodStart: period,
            periodEnd: period,
            generatedBy: '',
            generatedByName: '',
            generatedAt: now
        };

        return {
            metadata,
            headcountSummary: {
                total,
                byDepartment: Array.from(departmentMap.values()).map(d => ({
                    departmentId: d.id,
                    departmentName: d.name,
                    count: d.count,
                    percentage: total > 0 ? Math.round((d.count / total) * 100 * 10) / 10 : 0
                })),
                byBranch: Array.from(branchMap.values()).map(b => ({
                    branchId: b.id,
                    branchName: b.name,
                    count: b.count,
                    percentage: total > 0 ? Math.round((b.count / total) * 100 * 10) / 10 : 0
                })),
                byJobGrade: Array.from(gradeMap.values()).map(g => ({
                    gradeId: g.id,
                    gradeName: g.name,
                    count: g.count,
                    percentage: total > 0 ? Math.round((g.count / total) * 100 * 10) / 10 : 0
                }))
            },
            employeeTypeDistribution,
            demographics: {
                ageGroups: ageGroups.map(g => ({
                    label: g.label,
                    count: g.count,
                    percentage: total > 0 ? Math.round((g.count / total) * 100 * 10) / 10 : 0
                })),
                genderDistribution: Array.from(genderMap.entries()).map(([gender, count]) => ({
                    gender,
                    count,
                    percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0
                })),
                raceDistribution: Array.from(raceMap.entries()).map(([race, count]) => ({
                    race,
                    count,
                    percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0
                })),
                nationalityDistribution: Array.from(nationalityMap.entries()).map(([nationality, count]) => ({
                    nationality,
                    count,
                    percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0
                }))
            },
            rawData
        };
    },

    // ============================================================
    // LEAVE MOVEMENT REPORT
    // ============================================================

    /**
     * Generate Leave Movement report
     * @param companyId - Tenant company ID
     * @param startDate - Period start date
     * @param endDate - Period end date
     * @returns Leave balances, usage, and trends
     */
    async generateLeaveMovementReport(
        companyId: string,
        startDate: Date,
        endDate: Date
    ): Promise<LeaveMovementReport> {
        // Get leave types
        const leaveTypesSnapshot = await getDocs(
            collection(db, `companies/${companyId}/leaveTypes`)
        );
        const leaveTypes = new Map<string, LeaveType>();
        leaveTypesSnapshot.docs.forEach(doc => {
            leaveTypes.set(doc.id, { id: doc.id, ...doc.data() } as LeaveType);
        });

        // Get all leave balances
        const balancesSnapshot = await getDocs(
            collection(db, `companies/${companyId}/leaveBalances`)
        );
        const balances = balancesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as LeaveBalance[];

        // Get employees for name lookups
        const employeesSnapshot = await getDocs(
            collection(db, `companies/${companyId}/employees`)
        );
        const employees = new Map<string, Employee>();
        employeesSnapshot.docs.forEach(doc => {
            employees.set(doc.id, { id: doc.id, ...doc.data() } as Employee);
        });

        // Get leave requests in period
        const leaveRequestsQuery = query(
            collection(db, `companies/${companyId}/leaveRequests`),
            where('startDate', '>=', Timestamp.fromDate(startDate)),
            where('startDate', '<=', Timestamp.fromDate(endDate)),
            where('status', '==', 'approved')
        );
        const leaveRequestsSnapshot = await getDocs(leaveRequestsQuery);
        const leaveRequests = leaveRequestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as LeaveRequest[];

        // Aggregate balances by type
        const balancesByTypeMap = new Map<string, LeaveBalanceByType>();

        balances.forEach(balance => {
            const leaveType = leaveTypes.get(balance.leaveTypeId);
            if (!leaveType) return;

            if (!balancesByTypeMap.has(balance.leaveTypeId)) {
                balancesByTypeMap.set(balance.leaveTypeId, {
                    leaveTypeId: balance.leaveTypeId,
                    leaveTypeName: leaveType.name,
                    leaveTypeCode: leaveType.code,
                    totalEntitlement: 0,
                    totalTaken: 0,
                    totalPending: 0,
                    totalBalance: 0,
                    totalCarriedForward: 0,
                    averageEntitlement: 0,
                    averageBalance: 0,
                    employeeCount: 0
                });
            }

            const typeData = balancesByTypeMap.get(balance.leaveTypeId)!;
            const entitlement = leaveType.defaultDaysPerYear || 0;

            typeData.totalEntitlement += entitlement;
            typeData.totalTaken += balance.taken;
            typeData.totalPending += balance.pending;
            typeData.totalBalance += balance.currentBalance;
            typeData.totalCarriedForward += balance.carriedForward;
            typeData.employeeCount++;
        });

        // Calculate averages
        const balancesByType: LeaveBalanceByType[] = Array.from(balancesByTypeMap.values()).map(data => ({
            ...data,
            averageEntitlement: data.employeeCount > 0 ? Math.round((data.totalEntitlement / data.employeeCount) * 10) / 10 : 0,
            averageBalance: data.employeeCount > 0 ? Math.round((data.totalBalance / data.employeeCount) * 10) / 10 : 0
        }));

        // Process leave taken records
        const leaveTakenRecords: LeaveTakenRecord[] = leaveRequests.map(request => {
            const employee = employees.get(request.employeeId);
            const leaveType = leaveTypes.get(request.leaveTypeId);

            return {
                employeeId: request.employeeId,
                employeeNumber: employee?.employeeNumber || '',
                employeeName: employee ? `${employee.firstName} ${employee.lastName}` : request.employeeName || '',
                department: employee?.department || '',
                leaveTypeId: request.leaveTypeId,
                leaveTypeName: leaveType?.name || request.leaveTypeName || '',
                startDate: request.startDate instanceof Timestamp ? request.startDate.toDate() : new Date(request.startDate),
                endDate: request.endDate instanceof Timestamp ? request.endDate.toDate() : new Date(request.endDate),
                workingDays: request.workingDays,
                status: request.status
            };
        });

        // Process employee balances
        const employeeBalanceMap = new Map<string, EmployeeLeaveBalance>();

        balances.forEach(balance => {
            const employee = employees.get(balance.employeeId);
            const leaveType = leaveTypes.get(balance.leaveTypeId);
            if (!employee || !leaveType) return;

            if (!employeeBalanceMap.has(balance.employeeId)) {
                employeeBalanceMap.set(balance.employeeId, {
                    employeeId: balance.employeeId,
                    employeeNumber: employee.employeeNumber,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    department: employee.department || '-',
                    branch: employee.branch,
                    leaveBalances: [],
                    hasAnyNegativeBalance: false,
                    totalLeaveTaken: 0
                });
            }

            const empBalance = employeeBalanceMap.get(balance.employeeId)!;
            const hasNegativeBalance = balance.currentBalance < 0;

            empBalance.leaveBalances.push({
                leaveTypeId: balance.leaveTypeId,
                leaveTypeName: leaveType.name,
                entitlement: leaveType.defaultDaysPerYear || 0,
                taken: balance.taken,
                pending: balance.pending,
                balance: balance.currentBalance,
                carriedForward: balance.carriedForward,
                hasNegativeBalance
            });

            if (hasNegativeBalance) {
                empBalance.hasAnyNegativeBalance = true;
            }

            empBalance.totalLeaveTaken += balance.taken;
        });

        const employeeBalances = Array.from(employeeBalanceMap.values());

        // Generate usage trends (simplified - monthly breakdown)
        const usageTrends: LeaveUsageTrend[] = [];
        // For now, return empty trends - would need more complex logic to break down by week/month

        // Calculate summary statistics
        const totalLeaveDaysTaken = leaveTakenRecords.reduce((sum, record) => sum + record.workingDays, 0);
        const totalLeaveDaysPending = balancesByType.reduce((sum, type) => sum + type.totalPending, 0);
        const totalLeaveBalance = balancesByType.reduce((sum, type) => sum + type.totalBalance, 0);
        const employeesWithNegativeBalances = employeeBalances.filter(e => e.hasAnyNegativeBalance).length;

        let mostUsedLeaveType = '';
        let maxTaken = 0;
        balancesByType.forEach(type => {
            if (type.totalTaken > maxTaken) {
                maxTaken = type.totalTaken;
                mostUsedLeaveType = type.leaveTypeName;
            }
        });

        const averageLeaveDaysPerEmployee = employeeBalances.length > 0
            ? Math.round((totalLeaveDaysTaken / employeeBalances.length) * 10) / 10
            : 0;

        // Get company details
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        const company = companyDoc.exists() ? ({ id: companyDoc.id, ...companyDoc.data() } as Company) : null;

        const metadata: ReportMetadata = {
            reportId: `leave_movement_${companyId}_${Date.now()}`,
            reportType: 'leave-movement',
            companyId,
            companyName: company?.legalName || 'Unknown Company',
            periodType: 'custom',
            periodStart: startDate,
            periodEnd: endDate,
            generatedBy: '',
            generatedByName: '',
            generatedAt: new Date()
        };

        return {
            metadata,
            balancesByType,
            leaveTakenRecords,
            employeeBalances,
            usageTrends,
            summary: {
                totalLeaveDaysTaken,
                totalLeaveDaysPending,
                totalLeaveBalance,
                employeesWithNegativeBalances,
                mostUsedLeaveType,
                averageLeaveDaysPerEmployee
            }
        };
    },

    // ============================================================
    // REPORT HISTORY TRACKING
    // ============================================================

    /**
     * Save report generation to history
     * @param reportEntry - Report history entry metadata
     */
    async saveReportHistory(reportEntry: Omit<ReportHistoryEntry, 'id'>): Promise<void> {
        const historyRef = collection(db, 'reportHistory');
        const historyId = `${reportEntry.companyId}_${reportEntry.reportType}_${Date.now()}`;

        // Filter out undefined values for Firestore
        const dataToSave: Record<string, any> = {
            companyId: reportEntry.companyId,
            companyName: reportEntry.companyName,
            reportType: reportEntry.reportType,
            reportTypeName: reportEntry.reportTypeName,
            periodType: reportEntry.periodType,
            generatedBy: reportEntry.generatedBy,
            generatedByName: reportEntry.generatedByName,
            generatedAt: Timestamp.fromDate(reportEntry.generatedAt),
            periodStart: Timestamp.fromDate(reportEntry.periodStart),
            periodEnd: Timestamp.fromDate(reportEntry.periodEnd)
        };

        // Only add optional fields if they have values
        if (reportEntry.fileSize !== undefined) {
            dataToSave.fileSize = reportEntry.fileSize;
        }
        if (reportEntry.rowCount !== undefined) {
            dataToSave.rowCount = reportEntry.rowCount;
        }
        if (reportEntry.reportDataId !== undefined) {
            dataToSave.reportDataId = reportEntry.reportDataId;
        }

        await setDoc(doc(historyRef, historyId), dataToSave);
    },

    /**
     * Get report history for a company
     * @param companyId - Tenant company ID (optional - if empty, returns all for System Admin)
     * @param filters - Optional filters for report type
     * @returns Report history entries
     */
    async getReportHistory(
        companyId?: string,
        filters?: { reportType?: string }
    ): Promise<ReportHistoryEntry[]> {
        let historyQuery = query(
            collection(db, 'reportHistory'),
            orderBy('generatedAt', 'desc'),
            limit(100)
        );

        if (companyId) {
            historyQuery = query(historyQuery, where('companyId', '==', companyId));
        }

        if (filters?.reportType) {
            historyQuery = query(historyQuery, where('reportType', '==', filters.reportType));
        }

        const historySnapshot = await getDocs(historyQuery);

        return historySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                companyId: data.companyId,
                companyName: data.companyName,
                reportType: data.reportType,
                reportTypeName: data.reportTypeName,
                periodType: data.periodType,
                periodStart: data.periodStart instanceof Timestamp ? data.periodStart.toDate() : new Date(data.periodStart),
                periodEnd: data.periodEnd instanceof Timestamp ? data.periodEnd.toDate() : new Date(data.periodEnd),
                generatedBy: data.generatedBy,
                generatedByName: data.generatedByName,
                generatedAt: data.generatedAt instanceof Timestamp ? data.generatedAt.toDate() : new Date(data.generatedAt),
                fileSize: data.fileSize,
                rowCount: data.rowCount,
                reportDataId: data.reportDataId
            } as ReportHistoryEntry;
        });
    }
};
