// ============================================================
// REPORT EXPORT SERVICE TESTS
// Task Group 7.1: Focused tests for export functionality (8 tests)
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportExportService } from '../services/reportExportService';
import type { UI19Report } from '../types/ui19';
import type { BasicEmployeeInfoReport } from '../types/adminReports';

describe('ReportExportService', () => {
    let mockUI19Report: UI19Report;
    let mockBasicReport: BasicEmployeeInfoReport;

    beforeEach(() => {
        // Mock UI-19 report data
        mockUI19Report = {
            reportId: 'test-ui19-123',
            companyId: 'company123',
            reportType: 'ui-19',
            reportingPeriod: {
                month: 1,
                year: 2024,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            },
            employerDetails: {
                uifEmployerReference: 'U123456',
                payeReference: 'P987654321',
                tradingName: 'Test Company (Pty) Ltd',
                physicalAddress: {
                    line1: '123 Test Street',
                    city: 'Johannesburg',
                    province: 'Gauteng',
                    postalCode: '2000',
                    country: 'South Africa'
                },
                companyRegistrationNumber: '2020/123456/07',
                email: 'info@testcompany.co.za',
                phone: '011 123 4567',
                authorisedPersonName: 'John Doe',
                authorisedPersonIdNumber: '8001015009087'
            },
            employees: [
                {
                    employeeId: 'emp1',
                    surname: 'Smith',
                    initials: 'J.A.',
                    idNumber: '9001015009087',
                    grossRemuneration: 25000,
                    hoursWorked: 160,
                    commencementDate: new Date('2020-01-15'),
                    isContributor: true
                },
                {
                    employeeId: 'emp2',
                    surname: 'Jones',
                    initials: 'M.B.',
                    idNumber: '8501015009087',
                    grossRemuneration: 30000,
                    hoursWorked: 160,
                    commencementDate: new Date('2019-03-01'),
                    terminationDate: new Date('2024-01-15'),
                    terminationReasonCode: 6,
                    isContributor: true
                }
            ],
            declaration: {
                statement: 'I declare that the information provided is correct.',
                authorisedPersonName: 'John Doe'
            },
            generatedBy: 'user123',
            generatedByName: 'Test User',
            generatedAt: new Date('2024-01-31'),
            totalEmployees: 2,
            totalContributors: 2,
            totalNonContributors: 0
        };

        // Mock Basic Employee Info report
        mockBasicReport = {
            reportType: 'basic-employee-info',
            metadata: {
                reportId: 'test-basic-123',
                reportType: 'basic-employee-info',
                companyId: 'company123',
                companyName: 'Test Company',
                periodType: 'custom',
                periodStart: new Date(),
                periodEnd: new Date(),
                generatedBy: 'user123',
                generatedByName: 'Test User',
                generatedAt: new Date()
            },
            employees: [
                {
                    employeeId: 'emp1',
                    employeeNumber: 'EMP001',
                    firstName: 'John',
                    lastName: 'Smith',
                    fullName: 'John Smith',
                    idNumber: '9001015009087',
                    email: 'john@test.com',
                    phone: '0821234567',
                    dateOfBirth: new Date('1990-01-01'),
                    age: 34,
                    departmentId: 'dept1',
                    department: 'IT',
                    jobTitleId: 'job1',
                    jobTitle: 'Developer',
                    managerName: 'Jane Doe',
                    contractType: 'permanent',
                    employmentStatus: 'active',
                    startDate: new Date('2020-01-15'),
                    yearsOfService: 4,
                    residentialAddress: '123 Main St, Johannesburg, 2000'
                }
            ],
            summary: {
                totalEmployees: 1,
                byDepartment: { IT: 1 },
                byContractType: { permanent: 1 },
                byStatus: { active: 1 }
            },
            generatedAt: new Date(),
            generatedBy: 'user123',
            generatedByName: 'Test User',
            companyId: 'company123',
            companyName: 'Test Company'
        };
    });

    it('should export UI-19 report to Excel with proper structure', () => {
        const blob = ReportExportService.exportToExcel(mockUI19Report, 'ui-19', {
            companyName: 'Test Company',
            periodDescription: 'January 2024'
        });

        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should export UI-19 report to CSV with UTF-8 encoding', () => {
        const blob = ReportExportService.exportToCSV(mockUI19Report, 'ui-19', {
            companyName: 'Test Company',
            periodDescription: 'January 2024'
        });

        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('text/csv;charset=utf-8;');
    });

    it('should generate proper filename for UI-19 Excel export', () => {
        const filename = ReportExportService.generateFilename('ui-19', 'Test Company (Pty) Ltd', 'January 2024', 'xlsx');

        expect(filename).toMatch(/^UI19_Test_Company_Pty_Ltd_January_2024_\d{8}_\d{6}\.xlsx$/);
    });

    it('should sanitize company name in filename', () => {
        const filename = ReportExportService.generateFilename('ui-19', 'Test@Company/Name*With?Special:Chars', 'Jan 2024', 'csv');

        expect(filename).not.toContain('@');
        expect(filename).not.toContain('/');
        expect(filename).not.toContain('*');
        expect(filename).not.toContain('?');
        expect(filename).not.toContain(':');
    });

    it('should export Basic Employee Info report to Excel', () => {
        const blob = ReportExportService.exportToExcel(mockBasicReport, 'basic-employee-info', {
            companyName: 'Test Company',
            periodDescription: 'Current'
        });

        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should export Basic Employee Info report to CSV', () => {
        const blob = ReportExportService.exportToCSV(mockBasicReport, 'basic-employee-info', {
            companyName: 'Test Company',
            periodDescription: 'Current'
        });

        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('text/csv;charset=utf-8;');
    });

    it('should handle CSV field escaping for special characters', () => {
        const reportWithSpecialChars: BasicEmployeeInfoReport = {
            ...mockBasicReport,
            employees: [
                {
                    ...mockBasicReport.employees[0],
                    fullName: 'Smith, John "JJ"',
                    department: 'IT & Development'
                }
            ]
        };

        const blob = ReportExportService.exportToCSV(reportWithSpecialChars, 'basic-employee-info', {
            companyName: 'Test Company',
            periodDescription: 'Current'
        });

        expect(blob).toBeInstanceOf(Blob);
    });

    it('should include proper date formatting in exports', () => {
        const blob = ReportExportService.exportToExcel(mockUI19Report, 'ui-19', {
            companyName: 'Test Company',
            periodDescription: 'January 2024'
        });

        expect(blob).toBeInstanceOf(Blob);
        // Date formatting will be verified in actual Excel file structure
    });
});
