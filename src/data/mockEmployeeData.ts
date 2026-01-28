// ============================================================
// MOCK EMPLOYEE DATA
// Sample data for Employee role preview in dashboard switcher
// ============================================================

export interface MockLeaveBalance {
    id: string;
    leaveTypeName: string;
    currentBalance: number;
    taken: number;
    pending: number;
}

export interface MockPayslip {
    id: string;
    periodDescription: string;
    payDate: string;
    grossPay: number;
    deductions: number;
    netPay: number;
}

export interface MockEmployee {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    jobTitle: string;
    startDate: string;
    email: string;
}

export interface MockLeaveRequest {
    id: string;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

// Mock employee info - clearly sample data
export const MOCK_EMPLOYEE: MockEmployee = {
    employeeNumber: 'EMP001',
    firstName: 'Sample',
    lastName: 'Employee',
    department: 'IT Development',
    jobTitle: 'Software Developer',
    startDate: '2023-01-15',
    email: 'sample.employee@example.com',
};

// Mock leave balances
export const MOCK_LEAVE_BALANCES: MockLeaveBalance[] = [
    {
        id: 'lb-1',
        leaveTypeName: 'Annual Leave',
        currentBalance: 15,
        taken: 5,
        pending: 0,
    },
    {
        id: 'lb-2',
        leaveTypeName: 'Sick Leave',
        currentBalance: 8,
        taken: 2,
        pending: 0,
    },
    {
        id: 'lb-3',
        leaveTypeName: 'Family Responsibility',
        currentBalance: 3,
        taken: 0,
        pending: 1,
    },
];

// Mock payslip summaries (last 3 months)
export const MOCK_PAYSLIPS: MockPayslip[] = [
    {
        id: 'ps-1',
        periodDescription: 'December 2025',
        payDate: '2025-12-25',
        grossPay: 45000,
        deductions: 12500,
        netPay: 32500,
    },
    {
        id: 'ps-2',
        periodDescription: 'November 2025',
        payDate: '2025-11-25',
        grossPay: 45000,
        deductions: 12500,
        netPay: 32500,
    },
    {
        id: 'ps-3',
        periodDescription: 'October 2025',
        payDate: '2025-10-25',
        grossPay: 45000,
        deductions: 12500,
        netPay: 32500,
    },
];

// Mock recent leave requests
export const MOCK_LEAVE_REQUESTS: MockLeaveRequest[] = [
    {
        id: 'lr-1',
        leaveTypeName: 'Annual Leave',
        startDate: '2026-01-15',
        endDate: '2026-01-17',
        workingDays: 3,
        status: 'approved',
    },
    {
        id: 'lr-2',
        leaveTypeName: 'Family Responsibility',
        startDate: '2026-01-20',
        endDate: '2026-01-20',
        workingDays: 1,
        status: 'pending',
    },
];

// Note: This is sample/mock data for demonstration purposes only
// It is used when System Admin previews the Employee role dashboard
