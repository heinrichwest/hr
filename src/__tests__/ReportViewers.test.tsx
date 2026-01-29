// ============================================================
// TASK GROUP 6 TESTS: REPORT VIEWERS
// 8 focused tests for additional report viewer components
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BasicEmployeeInfoViewer } from '../components/reports/BasicEmployeeInfoViewer';
import { WorkforceProfileViewer } from '../components/reports/WorkforceProfileViewer';
import { LeaveMovementViewer } from '../components/reports/LeaveMovementViewer';
import { ReportContainer } from '../components/reports/ReportContainer';
import type { BasicEmployeeInfoReport, WorkforceProfileReport, LeaveMovementReport } from '../types/adminReports';

// Mock data
const mockBasicEmployeeInfo: BasicEmployeeInfoReport = {
    reportType: 'basic-employee-info',
    metadata: {
        reportId: 'test-1',
        reportType: 'basic-employee-info',
        companyId: 'company-1',
        companyName: 'Test Company',
        periodType: 'monthly',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
        generatedBy: 'user-1',
        generatedByName: 'Test User',
        generatedAt: new Date()
    },
    employees: [
        {
            employeeId: 'emp-1',
            employeeNumber: 'E001',
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            idNumber: '9001015800081',
            email: 'john@test.com',
            phone: '0821234567',
            dateOfBirth: new Date('1990-01-01'),
            age: 36,
            departmentId: 'dept-1',
            department: 'IT Department',
            jobTitleId: 'jt-1',
            jobTitle: 'Software Developer',
            contractType: 'Permanent',
            employmentStatus: 'Active',
            startDate: new Date('2020-01-01'),
            yearsOfService: 6,
            residentialAddress: '123 Main St, Cape Town'
        }
    ],
    summary: {
        totalEmployees: 1,
        byDepartment: { 'IT Department': 1 },
        byContractType: { 'Permanent': 1 },
        byStatus: { 'Active': 1 }
    }
};

const mockWorkforceProfile: WorkforceProfileReport = {
    reportType: 'workforce-profile',
    metadata: {
        reportId: 'test-2',
        reportType: 'workforce-profile',
        companyId: 'company-1',
        companyName: 'Test Company',
        periodType: 'monthly',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
        generatedBy: 'user-1',
        generatedByName: 'Test User',
        generatedAt: new Date()
    },
    headcountSummary: {
        total: 10,
        byDepartment: [
            { departmentId: 'dept-1', departmentName: 'IT Department', count: 5, percentage: 50 },
            { departmentId: 'dept-2', departmentName: 'HR Department', count: 5, percentage: 50 }
        ],
        byBranch: [],
        byJobGrade: []
    },
    employeeTypeDistribution: {
        permanent: 8,
        fixedTerm: 2,
        partTime: 0,
        temporary: 0,
        contractor: 0,
        intern: 0,
        total: 10
    },
    demographics: {
        ageGroups: [
            { label: '26-35', count: 5, percentage: 50 },
            { label: '36-45', count: 5, percentage: 50 }
        ],
        genderDistribution: [
            { gender: 'Male', count: 6, percentage: 60 },
            { gender: 'Female', count: 4, percentage: 40 }
        ],
        raceDistribution: [],
        nationalityDistribution: []
    },
    rawData: []
};

const mockLeaveMovement: LeaveMovementReport = {
    reportType: 'leave-movement',
    metadata: {
        reportId: 'test-3',
        reportType: 'leave-movement',
        companyId: 'company-1',
        companyName: 'Test Company',
        periodType: 'monthly',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
        generatedBy: 'user-1',
        generatedByName: 'Test User',
        generatedAt: new Date()
    },
    balancesByType: [
        {
            leaveTypeId: 'lt-1',
            leaveTypeName: 'Annual Leave',
            leaveTypeCode: 'ANNUAL',
            totalEntitlement: 150,
            totalTaken: 50,
            totalPending: 10,
            totalBalance: 90,
            totalCarriedForward: 20,
            averageEntitlement: 15,
            averageBalance: 9,
            employeeCount: 10
        }
    ],
    leaveTakenRecords: [],
    employeeBalances: [
        {
            employeeId: 'emp-1',
            employeeNumber: 'E001',
            employeeName: 'John Doe',
            department: 'IT Department',
            leaveBalances: [
                {
                    leaveTypeId: 'lt-1',
                    leaveTypeName: 'Annual Leave',
                    entitlement: 15,
                    taken: 5,
                    pending: 1,
                    balance: -2,
                    carriedForward: 2,
                    hasNegativeBalance: true
                }
            ],
            hasAnyNegativeBalance: true,
            totalLeaveTaken: 5
        }
    ],
    usageTrends: [
        {
            period: 'Jan 2026',
            periodStart: new Date('2026-01-01'),
            periodEnd: new Date('2026-01-31'),
            annualLeaveDays: 20,
            sickLeaveDays: 5,
            familyResponsibilityDays: 2,
            maternityDays: 0,
            paternityDays: 0,
            otherDays: 0,
            totalDays: 27
        }
    ],
    summary: {
        totalLeaveDaysTaken: 50,
        totalLeaveDaysPending: 10,
        totalLeaveBalance: 90,
        employeesWithNegativeBalances: 1,
        mostUsedLeaveType: 'Annual Leave',
        averageLeaveDaysPerEmployee: 5
    }
};

describe('Report Viewers - Task Group 6', () => {
    // Test 1: BasicEmployeeInfoViewer renders employee table
    it('renders employee table with all required columns', () => {
        render(<BasicEmployeeInfoViewer report={mockBasicEmployeeInfo} />);

        expect(screen.getByText('Basic Employee Information')).toBeInTheDocument();
        expect(screen.getByText('E001')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Software Developer')).toBeInTheDocument();
        // Check for table header instead of duplicate data
        expect(screen.getByText('Department')).toBeInTheDocument();
    });

    // Test 2: BasicEmployeeInfoViewer displays export buttons
    it('displays export buttons for Basic Employee Info', () => {
        render(<BasicEmployeeInfoViewer report={mockBasicEmployeeInfo} />);

        const exportButtons = screen.getAllByRole('button', { name: /export/i });
        expect(exportButtons.length).toBeGreaterThan(0);
    });

    // Test 3: WorkforceProfileViewer renders headcount summary
    it('renders headcount summary and department breakdown', () => {
        render(<WorkforceProfileViewer report={mockWorkforceProfile} />);

        expect(screen.getByText('Workforce Profile')).toBeInTheDocument();
        expect(screen.getByText(/total headcount/i)).toBeInTheDocument();
        expect(screen.getByText('IT Department')).toBeInTheDocument();
        expect(screen.getByText('HR Department')).toBeInTheDocument();
    });

    // Test 4: WorkforceProfileViewer renders employee type distribution
    it('renders employee type distribution data', () => {
        render(<WorkforceProfileViewer report={mockWorkforceProfile} />);

        // Use getAllByText for potentially duplicate text
        const permanentElements = screen.getAllByText(/permanent/i);
        expect(permanentElements.length).toBeGreaterThan(0);

        const fixedTermElements = screen.getAllByText(/fixed term/i);
        expect(fixedTermElements.length).toBeGreaterThan(0);
    });

    // Test 5: LeaveMovementViewer renders leave balance summary
    it('renders leave balance summary by type', () => {
        render(<LeaveMovementViewer report={mockLeaveMovement} />);

        expect(screen.getByText('Employee Leave Movement')).toBeInTheDocument();

        // Use getAllByText for potentially duplicate text
        const annualLeaveElements = screen.getAllByText(/annual leave/i);
        expect(annualLeaveElements.length).toBeGreaterThan(0);

        // Look for "Total Employees" in the meta section
        expect(screen.getByText(/Total Employees:/)).toBeInTheDocument();
    });

    // Test 6: LeaveMovementViewer flags negative balances
    it('flags employees with negative leave balances', () => {
        render(<LeaveMovementViewer report={mockLeaveMovement} />);

        // Check for employee with negative balance
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        // Badge should be present for negative balance
        expect(screen.getByText('Negative Balance')).toBeInTheDocument();
    });

    // Test 7: ReportContainer switches between viewer types
    it('renders correct viewer based on report type', () => {
        const { rerender } = render(
            <ReportContainer
                reportType="basic-employee-info"
                report={mockBasicEmployeeInfo}
            />
        );

        expect(screen.getByText('Basic Employee Information')).toBeInTheDocument();

        rerender(
            <ReportContainer
                reportType="workforce-profile"
                report={mockWorkforceProfile}
            />
        );

        expect(screen.getByText('Workforce Profile')).toBeInTheDocument();
    });

    // Test 8: ReportContainer shows empty state when no data
    it('shows empty state when no report data provided', () => {
        render(<ReportContainer reportType="basic-employee-info" report={null} />);

        expect(screen.getByText(/no report generated/i)).toBeInTheDocument();
    });
});
