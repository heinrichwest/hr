// ============================================================
// ADMIN REPORT SERVICE TESTS
// Task Group 2: Report Service Layer - UI-19 Priority
// Limited to 2-8 highly focused tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminReportService } from '../services/adminReportService';
import type { UI19Report } from '../types/ui19';

// Mock Firestore
vi.mock('../firebase', () => ({
    db: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    Timestamp: {
        fromDate: vi.fn((date) => ({ toDate: () => date }))
    },
    orderBy: vi.fn(),
    limit: vi.fn()
}));

describe('AdminReportService - UI-19 Report Generation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate UI-19 report with correct structure', async () => {
        // This test verifies the UI-19 report structure matches official form requirements
        const { getDocs, getDoc } = await import('firebase/firestore');

        // Mock company data
        vi.mocked(getDoc).mockResolvedValueOnce({
            exists: () => true,
            id: 'company123',
            data: () => ({
                legalName: 'Test Company Ltd',
                tradingName: 'Test Co',
                registrationNumber: '2023/123456/07',
                uifReference: 'U123456',
                payeReference: '7123456789',
                physicalAddress: {
                    line1: '123 Test Street',
                    city: 'Johannesburg',
                    province: 'Gauteng',
                    postalCode: '2000',
                    country: 'South Africa'
                },
                authorisedPersonName: 'John Doe',
                authorisedPersonIdNumber: '8001015800080'
            })
        } as any);

        // Mock employees data
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'emp1',
                    data: () => ({
                        firstName: 'Jane',
                        lastName: 'Smith',
                        idNumber: '9001015800081',
                        startDate: new Date('2023-01-01'),
                        status: 'active',
                        uifContributor: true,
                        departmentId: 'dept1',
                        jobTitleId: 'job1',
                        contractType: 'permanent'
                    })
                }
            ]
        } as any);

        // Mock pay runs data (empty for simplicity)
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: []
        } as any);

        const report = await AdminReportService.generateUI19Report('company123', new Date('2024-01-15'));

        // Verify report structure
        expect(report).toBeDefined();
        expect(report.reportingPeriod.month).toBe(1);
        expect(report.reportingPeriod.year).toBe(2024);
        expect(report.employerDetails.uifEmployerReference).toBe('U123456');
        expect(report.employerDetails.payeReference).toBe('7123456789');
        expect(report.employees).toHaveLength(1);
        expect(report.employees[0].surname).toBe('Smith');
        expect(report.employees[0].isContributor).toBe(true);
    });

    it('should correctly map termination reason codes for UI-19', async () => {
        // This test verifies termination code mapping (codes 2-19)
        const { getDocs, getDoc } = await import('firebase/firestore');

        vi.mocked(getDoc).mockResolvedValueOnce({
            exists: () => true,
            id: 'company123',
            data: () => ({
                legalName: 'Test Company',
                uifReference: 'U123',
                physicalAddress: {
                    line1: 'Test',
                    city: 'Test',
                    province: 'Test',
                    postalCode: '0000',
                    country: 'SA'
                }
            })
        } as any);

        // Employee with termination code 6 (Resigned)
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'emp1',
                    data: () => ({
                        firstName: 'Test',
                        lastName: 'Employee',
                        idNumber: '9001015800081',
                        startDate: new Date('2023-01-01'),
                        endDate: new Date('2024-01-15'),
                        status: 'resigned',
                        terminationReasonCode: 6, // Resigned
                        uifContributor: true
                    })
                }
            ]
        } as any);

        vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);

        const report = await AdminReportService.generateUI19Report('company123', new Date('2024-01-15'));

        expect(report.employees[0].terminationReasonCode).toBe(6);
        expect(report.employees[0].terminationDate).toBeDefined();
    });

    it('should handle UIF non-contributor reason codes correctly', async () => {
        // This test verifies non-contributor reason codes (1-3)
        const { getDocs, getDoc } = await import('firebase/firestore');

        vi.mocked(getDoc).mockResolvedValueOnce({
            exists: () => true,
            id: 'company123',
            data: () => ({
                legalName: 'Test Company',
                uifReference: 'U123',
                physicalAddress: {
                    line1: 'Test',
                    city: 'Test',
                    province: 'Test',
                    postalCode: '0000',
                    country: 'SA'
                }
            })
        } as any);

        // Non-contributor employee with reason code 1 (Temporary)
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'emp1',
                    data: () => ({
                        firstName: 'Temp',
                        lastName: 'Worker',
                        idNumber: '9001015800081',
                        startDate: new Date('2024-01-01'),
                        status: 'active',
                        uifContributor: false,
                        uifNonContributorReason: 1, // Temporary employees
                        contractType: 'temporary'
                    })
                }
            ]
        } as any);

        vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);

        const report = await AdminReportService.generateUI19Report('company123', new Date('2024-01-15'));

        expect(report.employees[0].isContributor).toBe(false);
        expect(report.employees[0].nonContributorReasonCode).toBe(1);
    });

    it('should aggregate payroll data for gross remuneration column', async () => {
        // This test verifies gross remuneration calculation from payroll
        const { getDocs, getDoc } = await import('firebase/firestore');

        vi.mocked(getDoc).mockResolvedValueOnce({
            exists: () => true,
            id: 'company123',
            data: () => ({
                legalName: 'Test Company',
                uifReference: 'U123',
                physicalAddress: {
                    line1: 'Test',
                    city: 'Test',
                    province: 'Test',
                    postalCode: '0000',
                    country: 'SA'
                }
            })
        } as any);

        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'emp1',
                    data: () => ({
                        firstName: 'John',
                        lastName: 'Doe',
                        idNumber: '8001015800080',
                        startDate: new Date('2023-01-01'),
                        status: 'active',
                        uifContributor: true
                    })
                }
            ]
        } as any);

        // Mock pay runs
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'payrun1',
                    data: () => ({
                        periodStartDate: new Date('2024-01-01'),
                        periodEndDate: new Date('2024-01-31')
                    })
                }
            ]
        } as any);

        // Mock pay run lines with gross remuneration
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'line1',
                    data: () => ({
                        employeeId: 'emp1',
                        grossEarnings: 25000,
                        hoursWorked: 160
                    })
                }
            ]
        } as any);

        const report = await AdminReportService.generateUI19Report('company123', new Date('2024-01-15'));

        expect(report.employees[0].grossRemuneration).toBe(25000);
        expect(report.employees[0].hoursWorked).toBe(160);
    });

    it('should save report history with correct metadata', async () => {
        // This test verifies report history tracking
        const { setDoc } = await import('firebase/firestore');

        const historyEntry = {
            companyId: 'company123',
            companyName: 'Test Company',
            reportType: 'ui-19' as const,
            reportTypeName: 'UI-19 - UIF Employer\'s Declaration',
            periodType: 'monthly' as const,
            periodStart: new Date('2024-01-01'),
            periodEnd: new Date('2024-01-31'),
            generatedBy: 'user123',
            generatedByName: 'Admin User',
            generatedAt: new Date(),
            rowCount: 10
        };

        await AdminReportService.saveReportHistory(historyEntry);

        expect(setDoc).toHaveBeenCalled();
    });

    it('should generate Basic Employee Info report with demographics', async () => {
        // This test verifies basic employee info report generation
        const { getDocs, getDoc } = await import('firebase/firestore');

        vi.mocked(getDoc).mockResolvedValueOnce({
            exists: () => true,
            id: 'company123',
            data: () => ({
                legalName: 'Test Company'
            })
        } as any);

        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'emp1',
                    data: () => ({
                        employeeNumber: 'EMP001',
                        firstName: 'Jane',
                        lastName: 'Smith',
                        idNumber: '9001015800081',
                        email: 'jane@test.com',
                        phone: '0821234567',
                        dateOfBirth: new Date('1990-01-01'),
                        gender: 'female',
                        nationality: 'South African',
                        departmentId: 'dept1',
                        department: 'Sales',
                        jobTitleId: 'job1',
                        jobTitle: 'Sales Manager',
                        contractType: 'permanent',
                        status: 'active',
                        startDate: new Date('2020-01-01'),
                        residentialAddress: {
                            line1: '123 Main St',
                            city: 'Johannesburg',
                            postalCode: '2000'
                        }
                    })
                }
            ]
        } as any);

        const report = await AdminReportService.generateBasicEmployeeInfoReport('company123');

        expect(report.employees).toHaveLength(1);
        expect(report.employees[0].fullName).toBe('Jane Smith');
        expect(report.summary.totalEmployees).toBe(1);
        expect(report.summary.byDepartment['Sales']).toBe(1);
    });

    it('should generate Workforce Profile with headcount and demographics', async () => {
        // This test verifies workforce profile aggregation
        const { getDocs, getDoc } = await import('firebase/firestore');

        vi.mocked(getDoc).mockResolvedValueOnce({
            exists: () => true,
            id: 'company123',
            data: () => ({
                legalName: 'Test Company'
            })
        } as any);

        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'emp1',
                    data: () => ({
                        employeeNumber: 'EMP001',
                        firstName: 'John',
                        lastName: 'Doe',
                        dateOfBirth: new Date('1985-06-15'), // Age ~38
                        gender: 'male',
                        race: 'african',
                        nationality: 'South African',
                        departmentId: 'dept1',
                        department: 'IT',
                        contractType: 'permanent',
                        status: 'active',
                        jobTitleId: 'job1',
                        jobTitle: 'Developer'
                    })
                },
                {
                    id: 'emp2',
                    data: () => ({
                        employeeNumber: 'EMP002',
                        firstName: 'Jane',
                        lastName: 'Smith',
                        dateOfBirth: new Date('1992-03-20'), // Age ~31
                        gender: 'female',
                        race: 'white',
                        nationality: 'South African',
                        departmentId: 'dept1',
                        department: 'IT',
                        contractType: 'fixed_term',
                        status: 'active',
                        jobTitleId: 'job2',
                        jobTitle: 'Designer'
                    })
                }
            ]
        } as any);

        const report = await AdminReportService.generateWorkforceProfileReport('company123', new Date());

        expect(report.headcountSummary.total).toBe(2);
        expect(report.headcountSummary.byDepartment[0].departmentName).toBe('IT');
        expect(report.headcountSummary.byDepartment[0].count).toBe(2);
        expect(report.employeeTypeDistribution.permanent).toBe(1);
        expect(report.employeeTypeDistribution.fixedTerm).toBe(1);
        expect(report.demographics.genderDistribution).toHaveLength(2);
    });

    it('should generate Leave Movement report with balances and trends', async () => {
        // This test verifies leave movement report generation
        const { getDocs, getDoc } = await import('firebase/firestore');

        vi.mocked(getDoc).mockResolvedValueOnce({
            exists: () => true,
            id: 'company123',
            data: () => ({
                legalName: 'Test Company'
            })
        } as any);

        // Mock leave types
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'annual',
                    data: () => ({
                        name: 'Annual Leave',
                        code: 'annual',
                        defaultDaysPerYear: 15
                    })
                }
            ]
        } as any);

        // Mock leave balances
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'bal1',
                    data: () => ({
                        employeeId: 'emp1',
                        leaveTypeId: 'annual',
                        taken: 5,
                        pending: 2,
                        currentBalance: 8,
                        carriedForward: 0
                    })
                }
            ]
        } as any);

        // Mock employees
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'emp1',
                    data: () => ({
                        employeeNumber: 'EMP001',
                        firstName: 'John',
                        lastName: 'Doe',
                        department: 'IT'
                    })
                }
            ]
        } as any);

        // Mock leave requests
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: []
        } as any);

        const report = await AdminReportService.generateLeaveMovementReport(
            'company123',
            new Date('2024-01-01'),
            new Date('2024-01-31')
        );

        expect(report.balancesByType).toHaveLength(1);
        expect(report.balancesByType[0].leaveTypeName).toBe('Annual Leave');
        expect(report.balancesByType[0].totalTaken).toBe(5);
        expect(report.employeeBalances).toHaveLength(1);
        expect(report.employeeBalances[0].leaveBalances[0].balance).toBe(8);
    });
});
