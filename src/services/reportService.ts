// ============================================================
// REPORT SERVICE - Data aggregation and report generation
// ============================================================

import {
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Employee, EmploymentStatus, ContractType } from '../types/employee';
import type { LeaveBalance, LeaveRequest, LeaveType } from '../types/leave';
import type { PayRun, PayRunLine } from '../types/payroll';
import type { IRCase, Warning } from '../types/ir';
import type {
    HeadcountSummary,
    EmployeeReportRow,
    ProbationReport,
    ServiceAnniversaryReport,
    LeaveBalanceSummary,
    LeaveBalanceReport,
    LeaveRequestsReport,
    PayrollSummary,
    PayrollRegisterReport,
    IRCaseSummary,
    IRCasesReport,
    WarningsReport,
    DashboardMetrics
} from '../types/reports';

export const ReportService = {
    // ============================================================
    // EMPLOYEE REPORTS
    // ============================================================

    async getHeadcountSummary(companyId: string): Promise<HeadcountSummary> {
        const employeesRef = collection(db, `companies/${companyId}/employees`);
        const snapshot = await getDocs(employeesRef);

        const employees = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Employee[];

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Count by status
        const statusCounts: Record<string, number> = {};
        const departmentCounts: Record<string, number> = {};
        const contractTypeCounts: Record<string, number> = {};
        const genderCounts: Record<string, number> = {};

        let activeCount = 0;
        let onLeaveCount = 0;
        let probationCount = 0;
        let terminatedThisPeriod = 0;
        let hiredThisPeriod = 0;

        employees.forEach(emp => {
            // Status counts
            const status = emp.status || 'active';
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            if (status === 'active' || status === 'probation') activeCount++;
            if (status === 'on_leave') onLeaveCount++;
            if (status === 'probation') probationCount++;

            // Department counts (only active)
            if (status === 'active' || status === 'probation' || status === 'on_leave') {
                const dept = emp.department || 'Unassigned';
                departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

                // Contract type counts
                const contract = emp.contractType || 'permanent';
                contractTypeCounts[contract] = (contractTypeCounts[contract] || 0) + 1;

                // Gender counts
                if (emp.gender) {
                    genderCounts[emp.gender] = (genderCounts[emp.gender] || 0) + 1;
                }
            }

            // Terminated in period
            if ((status === 'terminated' || status === 'resigned' || status === 'retrenched') && emp.endDate) {
                const endDate = emp.endDate instanceof Timestamp
                    ? emp.endDate.toDate()
                    : new Date(emp.endDate);
                if (endDate >= thirtyDaysAgo) {
                    terminatedThisPeriod++;
                }
            }

            // Hired in period
            const startDate = emp.startDate instanceof Timestamp
                ? emp.startDate.toDate()
                : new Date(emp.startDate);
            if (startDate >= thirtyDaysAgo) {
                hiredThisPeriod++;
            }
        });

        const totalActive = activeCount + onLeaveCount;
        const turnoverRate = totalActive > 0
            ? (terminatedThisPeriod / totalActive) * 100
            : 0;

        return {
            totalEmployees: employees.length,
            activeEmployees: activeCount,
            onLeaveEmployees: onLeaveCount,
            probationEmployees: probationCount,
            terminatedThisPeriod,
            hiredThisPeriod,
            turnoverRate: Math.round(turnoverRate * 10) / 10,
            byDepartment: Object.entries(departmentCounts)
                .map(([department, count]) => ({ department, count }))
                .sort((a, b) => b.count - a.count),
            byContractType: Object.entries(contractTypeCounts)
                .map(([type, count]) => ({ type, count })),
            byStatus: Object.entries(statusCounts)
                .map(([status, count]) => ({ status, count })),
            byGender: Object.entries(genderCounts)
                .map(([gender, count]) => ({ gender, count }))
        };
    },

    async getEmployeeList(
        companyId: string,
        filters?: {
            departmentId?: string;
            status?: EmploymentStatus;
            contractType?: ContractType;
        }
    ): Promise<EmployeeReportRow[]> {
        let q = query(collection(db, `companies/${companyId}/employees`));

        if (filters?.status) {
            q = query(q, where('status', '==', filters.status));
        }
        if (filters?.departmentId) {
            q = query(q, where('departmentId', '==', filters.departmentId));
        }
        if (filters?.contractType) {
            q = query(q, where('contractType', '==', filters.contractType));
        }

        const snapshot = await getDocs(q);
        const now = new Date();

        return snapshot.docs.map(doc => {
            const data = doc.data() as Employee;
            const startDate = data.startDate instanceof Timestamp
                ? data.startDate.toDate()
                : new Date(data.startDate);

            const yearsOfService = Math.floor(
                (now.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
            );

            return {
                id: doc.id,
                employeeNumber: data.employeeNumber,
                fullName: `${data.firstName} ${data.lastName}`,
                department: data.department || '-',
                jobTitle: data.jobTitle || '-',
                startDate,
                status: data.status,
                contractType: data.contractType,
                managerName: data.managerName,
                yearsOfService: Math.max(0, yearsOfService)
            };
        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
    },

    async getProbationReport(companyId: string): Promise<ProbationReport> {
        const q = query(
            collection(db, `companies/${companyId}/employees`),
            where('status', '==', 'probation')
        );

        const snapshot = await getDocs(q);
        const now = new Date();

        const employeesOnProbation = snapshot.docs.map(doc => {
            const data = doc.data() as Employee;
            const probationEndDate = data.probationEndDate instanceof Timestamp
                ? data.probationEndDate.toDate()
                : data.probationEndDate ? new Date(data.probationEndDate) : null;

            const startDate = data.startDate instanceof Timestamp
                ? data.startDate.toDate()
                : new Date(data.startDate);

            // Default 3 months probation if not set
            const endDate = probationEndDate || new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

            return {
                employeeId: doc.id,
                employeeName: `${data.firstName} ${data.lastName}`,
                employeeNumber: data.employeeNumber,
                department: data.department || '-',
                startDate,
                probationEndDate: endDate,
                daysRemaining: Math.max(0, daysRemaining),
                isExtended: data.probationExtended || false
            };
        }).sort((a, b) => a.daysRemaining - b.daysRemaining);

        return { employeesOnProbation };
    },

    async getServiceAnniversaries(
        companyId: string,
        daysAhead: number = 30
    ): Promise<ServiceAnniversaryReport> {
        const q = query(
            collection(db, `companies/${companyId}/employees`),
            where('status', 'in', ['active', 'on_leave', 'probation'])
        );

        const snapshot = await getDocs(q);
        const now = new Date();
        const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

        const upcomingAnniversaries = snapshot.docs
            .map(doc => {
                const data = doc.data() as Employee;
                const startDate = data.startDate instanceof Timestamp
                    ? data.startDate.toDate()
                    : new Date(data.startDate);

                // Find next anniversary
                const nextAnniversary = new Date(startDate);
                nextAnniversary.setFullYear(now.getFullYear());

                if (nextAnniversary < now) {
                    nextAnniversary.setFullYear(now.getFullYear() + 1);
                }

                const yearsOfService = nextAnniversary.getFullYear() - startDate.getFullYear();

                return {
                    employeeId: doc.id,
                    employeeName: `${data.firstName} ${data.lastName}`,
                    employeeNumber: data.employeeNumber,
                    department: data.department || '-',
                    anniversaryDate: nextAnniversary,
                    yearsOfService
                };
            })
            .filter(emp => emp.anniversaryDate >= now && emp.anniversaryDate <= futureDate)
            .sort((a, b) => a.anniversaryDate.getTime() - b.anniversaryDate.getTime());

        return { upcomingAnniversaries };
    },

    // ============================================================
    // LEAVE REPORTS
    // ============================================================

    async getLeaveBalanceSummary(companyId: string): Promise<LeaveBalanceSummary> {
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

        // Aggregate by leave type
        const byType: Record<string, {
            totalEntitlement: number;
            totalTaken: number;
            totalPending: number;
            totalBalance: number;
            count: number;
        }> = {};

        let lowBalanceCount = 0;
        let excessBalanceCount = 0;

        // Use demo data if no balances exist
        if (balances.length === 0) {
            return {
                companyId,
                asAtDate: new Date(),
                byLeaveType: [
                    {
                        leaveTypeId: 'demo-annual',
                        leaveTypeName: 'Annual Leave',
                        totalEntitlement: 360,
                        totalTaken: 145,
                        totalPending: 28,
                        totalBalance: 187,
                        averageBalance: 7.8
                    },
                    {
                        leaveTypeId: 'demo-sick',
                        leaveTypeName: 'Sick Leave',
                        totalEntitlement: 240,
                        totalTaken: 62,
                        totalPending: 8,
                        totalBalance: 170,
                        averageBalance: 7.1
                    },
                    {
                        leaveTypeId: 'demo-family',
                        leaveTypeName: 'Family Responsibility',
                        totalEntitlement: 72,
                        totalTaken: 31,
                        totalPending: 4,
                        totalBalance: 37,
                        averageBalance: 1.5
                    },
                    {
                        leaveTypeId: 'demo-maternity',
                        leaveTypeName: 'Maternity Leave',
                        totalEntitlement: 120,
                        totalTaken: 120,
                        totalPending: 0,
                        totalBalance: 0,
                        averageBalance: 0
                    },
                    {
                        leaveTypeId: 'demo-study',
                        leaveTypeName: 'Study Leave',
                        totalEntitlement: 48,
                        totalTaken: 12,
                        totalPending: 5,
                        totalBalance: 31,
                        averageBalance: 1.3
                    }
                ],
                employeesWithLowBalance: 3,
                employeesWithExcessBalance: 2
            };
        }

        balances.forEach(balance => {
            const typeId = balance.leaveTypeId;
            if (!byType[typeId]) {
                byType[typeId] = {
                    totalEntitlement: 0,
                    totalTaken: 0,
                    totalPending: 0,
                    totalBalance: 0,
                    count: 0
                };
            }

            const leaveType = leaveTypes.get(typeId);
            const entitlement = leaveType?.defaultDaysPerYear || 0;

            byType[typeId].totalEntitlement += entitlement;
            byType[typeId].totalTaken += balance.taken;
            byType[typeId].totalPending += balance.pending;
            byType[typeId].totalBalance += balance.currentBalance;
            byType[typeId].count++;

            // Check for low/excess balance (for annual leave)
            if (leaveType?.code === 'annual') {
                if (balance.currentBalance < 5) lowBalanceCount++;
                if (balance.currentBalance > entitlement * 1.5) excessBalanceCount++;
            }
        });

        return {
            companyId,
            asAtDate: new Date(),
            byLeaveType: Object.entries(byType).map(([typeId, data]) => ({
                leaveTypeId: typeId,
                leaveTypeName: leaveTypes.get(typeId)?.name || 'Unknown',
                totalEntitlement: data.totalEntitlement,
                totalTaken: data.totalTaken,
                totalPending: data.totalPending,
                totalBalance: data.totalBalance,
                averageBalance: data.count > 0 ? Math.round(data.totalBalance / data.count * 10) / 10 : 0
            })),
            employeesWithLowBalance: lowBalanceCount,
            employeesWithExcessBalance: excessBalanceCount
        };
    },

    async getLeaveBalanceReport(
        companyId: string,
        filters?: { departmentId?: string; leaveTypeId?: string }
    ): Promise<LeaveBalanceReport> {
        // Get employees
        let empQuery = query(
            collection(db, `companies/${companyId}/employees`),
            where('status', 'in', ['active', 'on_leave', 'probation'])
        );

        if (filters?.departmentId) {
            empQuery = query(empQuery, where('departmentId', '==', filters.departmentId));
        }

        const empSnapshot = await getDocs(empQuery);
        const employees = new Map<string, Employee>();
        empSnapshot.docs.forEach(doc => {
            employees.set(doc.id, { id: doc.id, ...doc.data() } as Employee);
        });

        // Get leave types
        const leaveTypesSnapshot = await getDocs(
            collection(db, `companies/${companyId}/leaveTypes`)
        );
        const leaveTypes = new Map<string, LeaveType>();
        leaveTypesSnapshot.docs.forEach(doc => {
            leaveTypes.set(doc.id, { id: doc.id, ...doc.data() } as LeaveType);
        });

        // Get balances
        let balQuery = query(collection(db, `companies/${companyId}/leaveBalances`));
        if (filters?.leaveTypeId) {
            balQuery = query(balQuery, where('leaveTypeId', '==', filters.leaveTypeId));
        }

        const balSnapshot = await getDocs(balQuery);

        let balances = balSnapshot.docs
            .map(doc => {
                const data = doc.data() as LeaveBalance;
                const employee = employees.get(data.employeeId);
                const leaveType = leaveTypes.get(data.leaveTypeId);

                if (!employee) return null;

                return {
                    employeeId: data.employeeId,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    employeeNumber: employee.employeeNumber,
                    department: employee.department || '-',
                    leaveTypeId: data.leaveTypeId,
                    leaveTypeName: leaveType?.name || '-',
                    entitlement: leaveType?.defaultDaysPerYear || 0,
                    taken: data.taken,
                    pending: data.pending,
                    balance: data.currentBalance,
                    carriedForward: data.carriedForward
                };
            })
            .filter((b): b is NonNullable<typeof b> => b !== null)
            .sort((a, b) => a.employeeName.localeCompare(b.employeeName));

        // Use demo data if no balances exist
        if (balances.length === 0) {
            balances = [
                {
                    employeeId: 'demo-emp-001',
                    employeeName: 'Zanele Nel',
                    employeeNumber: 'EMP001',
                    department: 'Human Resources',
                    leaveTypeId: 'demo-annual',
                    leaveTypeName: 'Annual Leave',
                    entitlement: 15,
                    taken: 5,
                    pending: 2,
                    balance: 8,
                    carriedForward: 0
                },
                {
                    employeeId: 'demo-emp-001',
                    employeeName: 'Zanele Nel',
                    employeeNumber: 'EMP001',
                    department: 'Human Resources',
                    leaveTypeId: 'demo-sick',
                    leaveTypeName: 'Sick Leave',
                    entitlement: 10,
                    taken: 2,
                    pending: 0,
                    balance: 8,
                    carriedForward: 0
                },
                {
                    employeeId: 'demo-emp-002',
                    employeeName: 'Thabo Mokoena',
                    employeeNumber: 'EMP002',
                    department: 'IT',
                    leaveTypeId: 'demo-annual',
                    leaveTypeName: 'Annual Leave',
                    entitlement: 15,
                    taken: 8,
                    pending: 0,
                    balance: 7,
                    carriedForward: 0
                },
                {
                    employeeId: 'demo-emp-002',
                    employeeName: 'Thabo Mokoena',
                    employeeNumber: 'EMP002',
                    department: 'IT',
                    leaveTypeId: 'demo-sick',
                    leaveTypeName: 'Sick Leave',
                    entitlement: 10,
                    taken: 3,
                    pending: 1,
                    balance: 6,
                    carriedForward: 0
                },
                {
                    employeeId: 'demo-emp-003',
                    employeeName: 'Lerato Dlamini',
                    employeeNumber: 'EMP003',
                    department: 'Finance',
                    leaveTypeId: 'demo-annual',
                    leaveTypeName: 'Annual Leave',
                    entitlement: 15,
                    taken: 3,
                    pending: 5,
                    balance: 7,
                    carriedForward: 0
                },
                {
                    employeeId: 'demo-emp-003',
                    employeeName: 'Lerato Dlamini',
                    employeeNumber: 'EMP003',
                    department: 'Finance',
                    leaveTypeId: 'demo-family',
                    leaveTypeName: 'Family Responsibility',
                    entitlement: 3,
                    taken: 1,
                    pending: 0,
                    balance: 2,
                    carriedForward: 0
                },
                {
                    employeeId: 'demo-emp-004',
                    employeeName: 'Sipho Khumalo',
                    employeeNumber: 'EMP004',
                    department: 'Operations',
                    leaveTypeId: 'demo-annual',
                    leaveTypeName: 'Annual Leave',
                    entitlement: 15,
                    taken: 12,
                    pending: 0,
                    balance: 3,
                    carriedForward: 0
                },
                {
                    employeeId: 'demo-emp-004',
                    employeeName: 'Sipho Khumalo',
                    employeeNumber: 'EMP004',
                    department: 'Operations',
                    leaveTypeId: 'demo-sick',
                    leaveTypeName: 'Sick Leave',
                    entitlement: 10,
                    taken: 1,
                    pending: 0,
                    balance: 9,
                    carriedForward: 0
                },
                {
                    employeeId: 'demo-emp-005',
                    employeeName: 'Nombuso Zulu',
                    employeeNumber: 'EMP005',
                    department: 'Marketing',
                    leaveTypeId: 'demo-annual',
                    leaveTypeName: 'Annual Leave',
                    entitlement: 15,
                    taken: 6,
                    pending: 3,
                    balance: 6,
                    carriedForward: 0
                },
                {
                    employeeId: 'demo-emp-005',
                    employeeName: 'Nombuso Zulu',
                    employeeNumber: 'EMP005',
                    department: 'Marketing',
                    leaveTypeId: 'demo-study',
                    leaveTypeName: 'Study Leave',
                    entitlement: 2,
                    taken: 0,
                    pending: 0,
                    balance: 2,
                    carriedForward: 0
                }
            ];
        }

        return {
            balances,
            generatedAt: new Date()
        };
    },

    async getLeaveRequestsReport(
        companyId: string,
        startDate: Date,
        endDate: Date,
        filters?: { departmentId?: string; status?: string; leaveTypeId?: string }
    ): Promise<LeaveRequestsReport> {
        let q = query(
            collection(db, `companies/${companyId}/leaveRequests`),
            where('startDate', '>=', Timestamp.fromDate(startDate)),
            where('startDate', '<=', Timestamp.fromDate(endDate))
        );

        if (filters?.status) {
            q = query(q, where('status', '==', filters.status));
        }
        if (filters?.leaveTypeId) {
            q = query(q, where('leaveTypeId', '==', filters.leaveTypeId));
        }

        const snapshot = await getDocs(q);

        const statusCounts = { total: 0, approved: 0, pending: 0, rejected: 0, cancelled: 0 };

        let requests = snapshot.docs.map(doc => {
            const data = doc.data() as LeaveRequest;
            statusCounts.total++;
            if (data.status === 'approved') statusCounts.approved++;
            if (data.status === 'pending') statusCounts.pending++;
            if (data.status === 'rejected') statusCounts.rejected++;
            if (data.status === 'cancelled') statusCounts.cancelled++;

            const lastApproval = data.approvalHistory?.slice(-1)[0];

            return {
                id: doc.id,
                employeeName: data.employeeName || '-',
                employeeNumber: '',
                department: '',
                leaveType: data.leaveTypeName || '-',
                startDate: data.startDate instanceof Timestamp
                    ? data.startDate.toDate()
                    : new Date(data.startDate),
                endDate: data.endDate instanceof Timestamp
                    ? data.endDate.toDate()
                    : new Date(data.endDate),
                workingDays: data.workingDays,
                status: data.status,
                requestedDate: data.submittedDate instanceof Timestamp
                    ? data.submittedDate.toDate()
                    : data.submittedDate ? new Date(data.submittedDate) : new Date(data.createdAt as unknown as Date),
                approvedBy: lastApproval?.approverName,
                approvedDate: lastApproval?.actionDate instanceof Timestamp
                    ? lastApproval.actionDate.toDate()
                    : lastApproval?.actionDate ? new Date(lastApproval.actionDate) : undefined
            };
        });

        // Use demo data if no requests exist
        if (requests.length === 0) {
            const demoDate = new Date();
            requests = [
                {
                    id: 'demo-req-001',
                    employeeName: 'Zanele Nel',
                    employeeNumber: 'EMP001',
                    department: 'Human Resources',
                    leaveType: 'Annual Leave',
                    startDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 15),
                    endDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 19),
                    workingDays: 5,
                    status: 'approved',
                    requestedDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 2, 10),
                    approvedBy: 'HR Manager',
                    approvedDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 2, 11)
                },
                {
                    id: 'demo-req-002',
                    employeeName: 'Thabo Mokoena',
                    employeeNumber: 'EMP002',
                    department: 'IT',
                    leaveType: 'Sick Leave',
                    startDate: new Date(demoDate.getFullYear(), demoDate.getMonth(), 5),
                    endDate: new Date(demoDate.getFullYear(), demoDate.getMonth(), 7),
                    workingDays: 3,
                    status: 'approved',
                    requestedDate: new Date(demoDate.getFullYear(), demoDate.getMonth(), 4),
                    approvedBy: 'Line Manager',
                    approvedDate: new Date(demoDate.getFullYear(), demoDate.getMonth(), 4)
                },
                {
                    id: 'demo-req-003',
                    employeeName: 'Lerato Dlamini',
                    employeeNumber: 'EMP003',
                    department: 'Finance',
                    leaveType: 'Annual Leave',
                    startDate: new Date(demoDate.getFullYear(), demoDate.getMonth() + 1, 1),
                    endDate: new Date(demoDate.getFullYear(), demoDate.getMonth() + 1, 5),
                    workingDays: 5,
                    status: 'pending',
                    requestedDate: new Date(demoDate.getFullYear(), demoDate.getMonth(), 10),
                    approvedBy: undefined,
                    approvedDate: undefined
                },
                {
                    id: 'demo-req-004',
                    employeeName: 'Sipho Khumalo',
                    employeeNumber: 'EMP004',
                    department: 'Operations',
                    leaveType: 'Family Responsibility',
                    startDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 22),
                    endDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 22),
                    workingDays: 1,
                    status: 'approved',
                    requestedDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 20),
                    approvedBy: 'Line Manager',
                    approvedDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 20)
                },
                {
                    id: 'demo-req-005',
                    employeeName: 'Nombuso Zulu',
                    employeeNumber: 'EMP005',
                    department: 'Marketing',
                    leaveType: 'Annual Leave',
                    startDate: new Date(demoDate.getFullYear(), demoDate.getMonth() + 1, 10),
                    endDate: new Date(demoDate.getFullYear(), demoDate.getMonth() + 1, 12),
                    workingDays: 3,
                    status: 'pending',
                    requestedDate: new Date(demoDate.getFullYear(), demoDate.getMonth(), 15),
                    approvedBy: undefined,
                    approvedDate: undefined
                },
                {
                    id: 'demo-req-006',
                    employeeName: 'Thabo Mokoena',
                    employeeNumber: 'EMP002',
                    department: 'IT',
                    leaveType: 'Annual Leave',
                    startDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 2, 5),
                    endDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 2, 9),
                    workingDays: 5,
                    status: 'approved',
                    requestedDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 3, 20),
                    approvedBy: 'HR Manager',
                    approvedDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 3, 21)
                },
                {
                    id: 'demo-req-007',
                    employeeName: 'Zanele Nel',
                    employeeNumber: 'EMP001',
                    department: 'Human Resources',
                    leaveType: 'Sick Leave',
                    startDate: new Date(demoDate.getFullYear(), demoDate.getMonth(), 18),
                    endDate: new Date(demoDate.getFullYear(), demoDate.getMonth(), 19),
                    workingDays: 2,
                    status: 'pending',
                    requestedDate: new Date(demoDate.getFullYear(), demoDate.getMonth(), 17),
                    approvedBy: undefined,
                    approvedDate: undefined
                },
                {
                    id: 'demo-req-008',
                    employeeName: 'Lerato Dlamini',
                    employeeNumber: 'EMP003',
                    department: 'Finance',
                    leaveType: 'Study Leave',
                    startDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 8),
                    endDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 8),
                    workingDays: 1,
                    status: 'rejected',
                    requestedDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 1),
                    approvedBy: 'Line Manager',
                    approvedDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 1, 2)
                },
                {
                    id: 'demo-req-009',
                    employeeName: 'Sipho Khumalo',
                    employeeNumber: 'EMP004',
                    department: 'Operations',
                    leaveType: 'Annual Leave',
                    startDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 3, 12),
                    endDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 3, 19),
                    workingDays: 6,
                    status: 'cancelled',
                    requestedDate: new Date(demoDate.getFullYear(), demoDate.getMonth() - 4, 25),
                    approvedBy: undefined,
                    approvedDate: undefined
                }
            ];

            // Update status counts for demo data
            statusCounts.total = requests.length;
            statusCounts.approved = requests.filter(r => r.status === 'approved').length;
            statusCounts.pending = requests.filter(r => r.status === 'pending').length;
            statusCounts.rejected = requests.filter(r => r.status === 'rejected').length;
            statusCounts.cancelled = requests.filter(r => r.status === 'cancelled').length;
        }

        return {
            requests,
            summary: statusCounts,
            generatedAt: new Date()
        };
    },

    // ============================================================
    // PAYROLL REPORTS
    // ============================================================

    async getPayrollSummary(payRunId: string, companyId: string): Promise<PayrollSummary | null> {
        // Get pay run
        const payRunsSnapshot = await getDocs(
            query(
                collection(db, `companies/${companyId}/payRuns`),
                where('__name__', '==', payRunId)
            )
        );

        if (payRunsSnapshot.empty) return null;

        const payRun = payRunsSnapshot.docs[0].data() as PayRun;

        // Get pay run lines
        const linesSnapshot = await getDocs(
            collection(db, `companies/${companyId}/payRuns/${payRunId}/payRunLines`)
        );

        const lines = linesSnapshot.docs.map(doc => doc.data() as PayRunLine);

        // Aggregate by department
        const byDept: Record<string, { count: number; gross: number; net: number }> = {};
        const byCostCentre: Record<string, { count: number; gross: number; net: number }> = {};

        lines.forEach(line => {
            const dept = line.departmentName || 'Unassigned';
            const cc = line.costCentreName || 'Unassigned';

            if (!byDept[dept]) byDept[dept] = { count: 0, gross: 0, net: 0 };
            byDept[dept].count++;
            byDept[dept].gross += line.grossEarnings;
            byDept[dept].net += line.netPay;

            if (!byCostCentre[cc]) byCostCentre[cc] = { count: 0, gross: 0, net: 0 };
            byCostCentre[cc].count++;
            byCostCentre[cc].gross += line.grossEarnings;
            byCostCentre[cc].net += line.netPay;
        });

        const payDate = payRun.payDate instanceof Timestamp
            ? payRun.payDate.toDate()
            : new Date(payRun.payDate);

        return {
            payRunId,
            periodDescription: `Period ${payRun.periodNumber} - ${payRun.taxYear}`,
            payDate,
            employeeCount: payRun.employeeCount,
            totalGross: payRun.totalGrossEarnings,
            totalDeductions: payRun.totalDeductions,
            totalNet: payRun.totalNetPay,
            totalPaye: payRun.totalPaye,
            totalUif: payRun.totalUif,
            totalSdl: payRun.totalSdl,
            totalEmployerCost: payRun.totalGrossEarnings + payRun.totalEmployerContributions,
            byDepartment: Object.entries(byDept).map(([department, data]) => ({
                department,
                employeeCount: data.count,
                grossAmount: data.gross,
                netAmount: data.net
            })),
            byCostCentre: Object.entries(byCostCentre).map(([costCentre, data]) => ({
                costCentre,
                employeeCount: data.count,
                grossAmount: data.gross,
                netAmount: data.net
            }))
        };
    },

    async getPayrollRegister(payRunId: string, companyId: string): Promise<PayrollRegisterReport | null> {
        // Get pay run
        const payRunsSnapshot = await getDocs(
            query(
                collection(db, `companies/${companyId}/payRuns`),
                where('__name__', '==', payRunId)
            )
        );

        if (payRunsSnapshot.empty) return null;

        const payRun = payRunsSnapshot.docs[0].data() as PayRun;

        // Get pay run lines
        const linesSnapshot = await getDocs(
            collection(db, `companies/${companyId}/payRuns/${payRunId}/payRunLines`)
        );

        const totals = {
            basicSalary: 0,
            grossEarnings: 0,
            paye: 0,
            uif: 0,
            otherDeductions: 0,
            totalDeductions: 0,
            netPay: 0
        };

        const employees = linesSnapshot.docs.map(doc => {
            const line = doc.data() as PayRunLine;

            const otherDeductions = line.totalDeductions - line.paye - line.uifEmployee;

            totals.basicSalary += line.basicSalary;
            totals.grossEarnings += line.grossEarnings;
            totals.paye += line.paye;
            totals.uif += line.uifEmployee;
            totals.otherDeductions += otherDeductions;
            totals.totalDeductions += line.totalDeductions;
            totals.netPay += line.netPay;

            return {
                employeeNumber: line.employeeNumber,
                employeeName: line.employeeName,
                department: line.departmentName || '-',
                basicSalary: line.basicSalary,
                grossEarnings: line.grossEarnings,
                paye: line.paye,
                uif: line.uifEmployee,
                otherDeductions,
                totalDeductions: line.totalDeductions,
                netPay: line.netPay
            };
        }).sort((a, b) => a.employeeName.localeCompare(b.employeeName));

        return {
            payRunId,
            periodDescription: `Period ${payRun.periodNumber} - ${payRun.taxYear}`,
            employees,
            totals,
            generatedAt: new Date()
        };
    },

    // ============================================================
    // IR REPORTS
    // ============================================================

    async getIRCaseSummary(
        companyId: string,
        startDate: Date,
        endDate: Date
    ): Promise<IRCaseSummary> {
        const q = query(
            collection(db, `companies/${companyId}/irCases`),
            where('dateOpened', '>=', Timestamp.fromDate(startDate)),
            where('dateOpened', '<=', Timestamp.fromDate(endDate))
        );

        const snapshot = await getDocs(q);
        const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IRCase[];

        const byType: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        const byOutcome: Record<string, number> = {};
        const byDepartment: Record<string, number> = {};

        let openCount = 0;
        let closedCount = 0;
        let totalResolutionDays = 0;
        let resolvedCount = 0;

        cases.forEach(c => {
            // By type
            byType[c.caseType] = (byType[c.caseType] || 0) + 1;

            // By status
            byStatus[c.status] = (byStatus[c.status] || 0) + 1;

            if (c.status === 'closed' || c.status === 'withdrawn') {
                closedCount++;
                if (c.dateClosed && c.dateOpened) {
                    const opened = c.dateOpened instanceof Timestamp
                        ? c.dateOpened.toDate()
                        : new Date(c.dateOpened);
                    const closed = c.dateClosed instanceof Timestamp
                        ? c.dateClosed.toDate()
                        : new Date(c.dateClosed);
                    totalResolutionDays += Math.ceil((closed.getTime() - opened.getTime()) / (24 * 60 * 60 * 1000));
                    resolvedCount++;
                }
            } else {
                openCount++;
            }

            // By outcome
            if (c.outcome) {
                byOutcome[c.outcome] = (byOutcome[c.outcome] || 0) + 1;
            }

            // By department
            const dept = c.departmentName || 'Unassigned';
            byDepartment[dept] = (byDepartment[dept] || 0) + 1;
        });

        return {
            period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
            periodStart: startDate,
            periodEnd: endDate,
            totalCases: cases.length,
            openCases: openCount,
            closedCases: closedCount,
            averageResolutionDays: resolvedCount > 0 ? Math.round(totalResolutionDays / resolvedCount) : 0,
            byCaseType: Object.entries(byType).map(([type, count]) => ({ type, count })),
            byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
            byOutcome: Object.entries(byOutcome).map(([outcome, count]) => ({ outcome, count })),
            byDepartment: Object.entries(byDepartment).map(([department, count]) => ({ department, count }))
        };
    },

    async getIRCasesReport(
        companyId: string,
        filters?: { status?: string; caseType?: string; departmentId?: string }
    ): Promise<IRCasesReport> {
        let q = query(
            collection(db, `companies/${companyId}/irCases`),
            orderBy('dateOpened', 'desc')
        );

        if (filters?.status) {
            q = query(q, where('status', '==', filters.status));
        }
        if (filters?.caseType) {
            q = query(q, where('caseType', '==', filters.caseType));
        }

        const snapshot = await getDocs(q);
        const now = new Date();

        const cases = snapshot.docs.map(doc => {
            const data = doc.data() as IRCase;
            const dateOpened = data.dateOpened instanceof Timestamp
                ? data.dateOpened.toDate()
                : new Date(data.dateOpened);
            const incidentDate = data.incidentDate instanceof Timestamp
                ? data.incidentDate.toDate()
                : new Date(data.incidentDate);
            const dateClosed = data.dateClosed instanceof Timestamp
                ? data.dateClosed.toDate()
                : data.dateClosed ? new Date(data.dateClosed) : undefined;

            const daysOpen = data.status === 'closed'
                ? 0
                : Math.ceil((now.getTime() - dateOpened.getTime()) / (24 * 60 * 60 * 1000));

            return {
                caseNumber: data.caseNumber,
                caseType: data.caseType,
                employeeName: data.employeeName || '-',
                employeeNumber: data.employeeNumber || '-',
                department: data.departmentName || '-',
                incidentDate,
                dateOpened,
                status: data.status,
                assignedTo: data.assignedToName || '-',
                daysOpen,
                outcome: data.outcome,
                dateClosed
            };
        });

        return {
            cases,
            generatedAt: new Date()
        };
    },

    async getWarningsReport(
        companyId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<WarningsReport> {
        let q = query(collection(db, `companies/${companyId}/warnings`));

        if (startDate && endDate) {
            q = query(
                q,
                where('issueDate', '>=', Timestamp.fromDate(startDate)),
                where('issueDate', '<=', Timestamp.fromDate(endDate))
            );
        }

        const snapshot = await getDocs(q);
        const now = new Date();

        const byType: Record<string, number> = {};
        let activeCount = 0;
        let expiredCount = 0;

        const warnings = snapshot.docs.map(doc => {
            const data = doc.data() as Warning;
            const issueDate = data.issueDate instanceof Timestamp
                ? data.issueDate.toDate()
                : new Date(data.issueDate);
            const expiryDate = data.expiryDate instanceof Timestamp
                ? data.expiryDate.toDate()
                : new Date(data.expiryDate);

            const isActive = data.isActive && !data.isExpired && expiryDate > now;
            if (isActive) activeCount++;
            else expiredCount++;

            byType[data.warningType] = (byType[data.warningType] || 0) + 1;

            return {
                warningNumber: data.warningNumber,
                warningType: data.warningType,
                employeeName: data.employeeName || '-',
                employeeNumber: '',
                department: '',
                issueDate,
                expiryDate,
                offenceCategory: data.offenceCategory,
                isActive,
                issuedBy: data.issuedByName || '-'
            };
        });

        return {
            period: startDate && endDate
                ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                : 'All Time',
            warnings,
            summary: {
                total: warnings.length,
                active: activeCount,
                expired: expiredCount,
                byType: Object.entries(byType).map(([type, count]) => ({ type, count }))
            }
        };
    },

    // ============================================================
    // DASHBOARD METRICS
    // ============================================================

    async getDashboardMetrics(companyId: string): Promise<DashboardMetrics> {
        // Get headcount
        const headcount = await this.getHeadcountSummary(companyId);

        // Get open IR cases
        const irCasesSnapshot = await getDocs(
            query(
                collection(db, `companies/${companyId}/irCases`),
                where('status', 'not-in', ['closed', 'withdrawn'])
            )
        );
        const openCases = irCasesSnapshot.docs.map(doc => doc.data() as IRCase);
        const urgentCases = openCases.filter(c => c.priority === 'urgent' || c.priority === 'high').length;

        // Get leave balance summary
        const leaveSummary = await this.getLeaveBalanceSummary(companyId);
        const annualLeave = leaveSummary.byLeaveType.find(t => t.leaveTypeName.toLowerCase().includes('annual'));

        // Get recent payroll (mock for now - would need to query last 2 pay runs)
        const payrollCost = {
            currentMonth: 0,
            previousMonth: 0,
            change: 0
        };

        return {
            headcount: {
                total: headcount.totalEmployees,
                change: headcount.hiredThisPeriod - headcount.terminatedThisPeriod,
                changePercentage: headcount.totalEmployees > 0
                    ? ((headcount.hiredThisPeriod - headcount.terminatedThisPeriod) / headcount.totalEmployees) * 100
                    : 0
            },
            turnover: {
                rate: headcount.turnoverRate,
                trend: headcount.turnoverRate > 5 ? 'up' : headcount.turnoverRate < 2 ? 'down' : 'stable'
            },
            absenteeism: {
                rate: 0, // Would calculate from leave data
                trend: 'stable'
            },
            leaveUtilization: {
                rate: annualLeave
                    ? (annualLeave.totalTaken / (annualLeave.totalTaken + annualLeave.totalBalance)) * 100
                    : 0,
                averageBalance: annualLeave?.averageBalance || 0
            },
            openIRCases: {
                count: openCases.length,
                urgent: urgentCases
            },
            payrollCost
        };
    }
};
