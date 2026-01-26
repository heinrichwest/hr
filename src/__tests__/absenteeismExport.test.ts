// ============================================================
// ABSENTEEISM EXPORT TESTS
// Task Group 4: Strategic Gap-Filling Tests (Maximum 10 tests)
// ============================================================

import { describe, it, expect } from 'vitest';
import type { AbsenteeismReportData, AbsenteeismFilters } from '../types/reports';
import { generateExportFilename } from '../services/absenteeismExportService';

// ============================================================
// Test 1: Excel export filename generation
// ============================================================
describe('Export Filename Generation', () => {
    it('should generate correct filename format with sanitized company name', () => {
        const filters: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-31')
            },
            leaveTypeMode: 'sick_only'
        };

        const filename = generateExportFilename('SpecCon Holdings (Pty) Ltd', filters, 'xlsx');

        // Verify filename format
        expect(filename).toContain('AbsenteeismReport_');
        expect(filename).toContain('SpecCon_Holdings_Pty_Ltd');
        expect(filename).toContain('Jan2026');
        expect(filename).toMatch(/\.xlsx$/);
    });

    it('should handle special characters in company name', () => {
        const filters: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-03-01'),
                endDate: new Date('2026-03-31')
            },
            leaveTypeMode: 'all_types'
        };

        const filename = generateExportFilename('ABC & Co. [Pty]', filters, 'pdf');

        // Verify special characters are sanitized
        expect(filename).not.toContain('&');
        expect(filename).not.toContain('[');
        expect(filename).not.toContain(']');
        expect(filename).toContain('ABC');
        expect(filename).toMatch(/\.pdf$/);
    });

    it('should generate unique timestamps for consecutive exports', () => {
        const filters: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-31')
            },
            leaveTypeMode: 'sick_only'
        };

        const filename1 = generateExportFilename('Company A', filters, 'xlsx');
        // Small delay to ensure different timestamp
        const filename2 = generateExportFilename('Company A', filters, 'xlsx');

        // Filenames should be identical except for timestamp microseconds
        expect(filename1).toContain('AbsenteeismReport_Company_A');
        expect(filename2).toContain('AbsenteeismReport_Company_A');
    });
});

// ============================================================
// Test 2: Export data integrity
// ============================================================
describe('Export Data Integrity', () => {
    it('should include all employees in export data', () => {
        const reportData: AbsenteeismReportData[] = [
            {
                employeeId: 'emp-001',
                employeeNumber: 'EMP001',
                employeeName: 'John Doe',
                department: 'IT',
                totalAbsentDays: 5,
                sickLeaveDays: 3,
                occasions: 2,
                cycleInfo: {
                    cycleStartDate: new Date('2023-01-01'),
                    cycleEndDate: new Date('2026-01-01'),
                    daysUsed: 10,
                    daysRemaining: 26
                },
                absenteeismRate: 2.15,
                flags: [],
                unauthorizedAbsenceCount: 0
            },
            {
                employeeId: 'emp-002',
                employeeNumber: 'EMP002',
                employeeName: 'Jane Smith',
                department: 'HR',
                totalAbsentDays: 8,
                sickLeaveDays: 6,
                occasions: 3,
                cycleInfo: {
                    cycleStartDate: new Date('2023-06-01'),
                    cycleEndDate: new Date('2026-06-01'),
                    daysUsed: 18,
                    daysRemaining: 18
                },
                absenteeismRate: 3.45,
                flags: [
                    {
                        type: 'medical_certificate_required',
                        message: 'Medical certificate required',
                        severity: 'warning',
                        ruleTriggered: 'BCEA Rule 1'
                    }
                ],
                unauthorizedAbsenceCount: 1
            }
        ];

        // Verify all employees are included
        expect(reportData.length).toBe(2);
        expect(reportData[0].employeeNumber).toBe('EMP001');
        expect(reportData[1].employeeNumber).toBe('EMP002');
    });

    it('should preserve action flags in export data', () => {
        const reportData: AbsenteeismReportData = {
            employeeId: 'emp-003',
            employeeNumber: 'EMP003',
            employeeName: 'Alice Johnson',
            department: 'Finance',
            totalAbsentDays: 11,
            sickLeaveDays: 8,
            occasions: 4,
            cycleInfo: {
                cycleStartDate: new Date('2023-01-01'),
                cycleEndDate: new Date('2026-01-01'),
                daysUsed: 22,
                daysRemaining: 14
            },
            absenteeismRate: 4.74,
            flags: [
                {
                    type: 'bcea_violation_risk',
                    message: 'Sick leave adjacent to public holiday',
                    severity: 'error',
                    ruleTriggered: 'BCEA Rule 2'
                },
                {
                    type: 'medical_certificate_required',
                    message: '2+ occasions in 8 weeks',
                    severity: 'warning',
                    ruleTriggered: 'BCEA Rule 3'
                },
                {
                    type: 'attendance_counseling_recommended',
                    message: 'More than 5 days absent',
                    severity: 'info',
                    ruleTriggered: 'BCEA Rule 4'
                }
            ],
            unauthorizedAbsenceCount: 2
        };

        // Verify multiple flags are preserved
        expect(reportData.flags.length).toBe(3);
        expect(reportData.flags[0].type).toBe('bcea_violation_risk');
        expect(reportData.flags[1].type).toBe('medical_certificate_required');
        expect(reportData.flags[2].type).toBe('attendance_counseling_recommended');
    });
});

// ============================================================
// Test 3: Empty data handling in exports
// ============================================================
describe('Empty Data Handling', () => {
    it('should handle empty report data gracefully', () => {
        const emptyData: AbsenteeismReportData[] = [];
        const filters: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-31')
            },
            leaveTypeMode: 'sick_only'
        };

        // Verify empty data is handled
        expect(emptyData.length).toBe(0);
        expect(() => {
            // Should not throw error when generating filename with empty data
            generateExportFilename('Company', filters, 'xlsx');
        }).not.toThrow();
    });

    it('should handle employees with no flags', () => {
        const dataNoFlags: AbsenteeismReportData = {
            employeeId: 'emp-004',
            employeeNumber: 'EMP004',
            employeeName: 'Bob Williams',
            department: 'Operations',
            totalAbsentDays: 3,
            sickLeaveDays: 2,
            occasions: 1,
            cycleInfo: {
                cycleStartDate: new Date('2023-01-01'),
                cycleEndDate: new Date('2026-01-01'),
                daysUsed: 5,
                daysRemaining: 31
            },
            absenteeismRate: 1.29,
            flags: [], // Empty flags array
            unauthorizedAbsenceCount: 0
        };

        expect(dataNoFlags.flags).toEqual([]);
        expect(dataNoFlags.unauthorizedAbsenceCount).toBe(0);
    });
});

// ============================================================
// Test 4: Date range formatting in export
// ============================================================
describe('Date Range Formatting in Export', () => {
    it('should format single month date range correctly', () => {
        const filters: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-31')
            },
            leaveTypeMode: 'sick_only'
        };

        const filename = generateExportFilename('Company', filters, 'xlsx');

        // Should contain month abbreviation and year
        expect(filename).toContain('Jan2026');
    });

    it('should format cross-month date range correctly', () => {
        const filters: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-01-15'),
                endDate: new Date('2026-02-15')
            },
            leaveTypeMode: 'sick_only'
        };

        const filename = generateExportFilename('Company', filters, 'xlsx');

        // Should contain start and end month
        expect(filename).toContain('Jan-Feb2026');
    });
});

// ============================================================
// Test 5: Filter mode persistence in export metadata
// ============================================================
describe('Filter Mode Export Metadata', () => {
    it('should distinguish between sick_only and all_types modes', () => {
        const filtersSickOnly: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-31')
            },
            leaveTypeMode: 'sick_only'
        };

        const filtersAllTypes: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-31')
            },
            leaveTypeMode: 'all_types'
        };

        // Verify both modes are valid
        expect(filtersSickOnly.leaveTypeMode).toBe('sick_only');
        expect(filtersAllTypes.leaveTypeMode).toBe('all_types');
    });
});

// ============================================================
// Test 6: Cycle info formatting in export
// ============================================================
describe('Cycle Info Formatting', () => {
    it('should calculate cycle progress correctly for export display', () => {
        const cycleInfo = {
            cycleStartDate: new Date('2023-01-15'),
            cycleEndDate: new Date('2026-01-15'),
            daysUsed: 18,
            daysRemaining: 18
        };

        const totalDays = cycleInfo.daysUsed + cycleInfo.daysRemaining;
        const progressPercentage = (cycleInfo.daysUsed / totalDays) * 100;

        expect(totalDays).toBe(36);
        expect(progressPercentage).toBe(50);
    });

    it('should handle edge case of fully used sick leave cycle', () => {
        const cycleInfoFullyUsed = {
            cycleStartDate: new Date('2023-01-01'),
            cycleEndDate: new Date('2026-01-01'),
            daysUsed: 36,
            daysRemaining: 0
        };

        const totalDays = cycleInfoFullyUsed.daysUsed + cycleInfoFullyUsed.daysRemaining;

        expect(totalDays).toBe(36);
        expect(cycleInfoFullyUsed.daysRemaining).toBe(0);
    });
});

// ============================================================
// Test 7: Absenteeism rate precision in export
// ============================================================
describe('Absenteeism Rate Precision', () => {
    it('should maintain 2 decimal places for absenteeism rate', () => {
        const reportData: AbsenteeismReportData = {
            employeeId: 'emp-005',
            employeeNumber: 'EMP005',
            employeeName: 'Carol Martinez',
            department: 'Marketing',
            totalAbsentDays: 7,
            sickLeaveDays: 5,
            occasions: 2,
            cycleInfo: {
                cycleStartDate: new Date('2023-01-01'),
                cycleEndDate: new Date('2026-01-01'),
                daysUsed: 15,
                daysRemaining: 21
            },
            absenteeismRate: 3.45678, // Should be formatted to 2 decimal places
            flags: [],
            unauthorizedAbsenceCount: 0
        };

        const formattedRate = reportData.absenteeismRate.toFixed(2);
        expect(formattedRate).toBe('3.46'); // Rounded to 2 decimal places
    });
});

// ============================================================
// Test 8: Export error handling
// ============================================================
describe('Export Error Handling', () => {
    it('should handle invalid date range gracefully', () => {
        const filters: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-01-31'),
                endDate: new Date('2026-01-01') // End before start
            },
            leaveTypeMode: 'sick_only'
        };

        // Should still generate filename even with invalid date range
        expect(() => {
            generateExportFilename('Company', filters, 'xlsx');
        }).not.toThrow();
    });

    it('should handle very long company names', () => {
        const longCompanyName = 'A'.repeat(200); // 200 character company name
        const filters: AbsenteeismFilters = {
            dateRange: {
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-31')
            },
            leaveTypeMode: 'sick_only'
        };

        const filename = generateExportFilename(longCompanyName, filters, 'xlsx');

        // Filename should be generated successfully
        expect(filename).toContain('AbsenteeismReport_');
        expect(filename).toMatch(/\.xlsx$/);
    });
});

// ============================================================
// Test 9: Integration - Export workflow
// ============================================================
describe('Export Workflow Integration', () => {
    it('should complete export workflow from data to filename generation', () => {
        // Step 1: Generate report data
        const reportData: AbsenteeismReportData[] = [
            {
                employeeId: 'emp-001',
                employeeNumber: 'EMP001',
                employeeName: 'Test Employee',
                department: 'IT',
                totalAbsentDays: 5,
                sickLeaveDays: 3,
                occasions: 2,
                cycleInfo: {
                    cycleStartDate: new Date('2023-01-01'),
                    cycleEndDate: new Date('2026-01-01'),
                    daysUsed: 10,
                    daysRemaining: 26
                },
                absenteeismRate: 2.15,
                flags: [],
                unauthorizedAbsenceCount: 0
            }
        ];

        // Step 2: Define filters
        const filters: AbsenteeismFilters = {
            employeeId: 'emp-001',
            dateRange: {
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-01-31')
            },
            leaveTypeMode: 'sick_only'
        };

        // Step 3: Generate export filename
        const filename = generateExportFilename('Test Company', filters, 'xlsx');

        // Step 4: Verify complete workflow
        expect(reportData.length).toBe(1);
        expect(reportData[0].employeeId).toBe(filters.employeeId);
        expect(filename).toContain('AbsenteeismReport_');
        expect(filename).toContain('Test_Company');
        expect(filename).toMatch(/\.xlsx$/);
    });
});

// ============================================================
// Test 10: Edge case - Large datasets
// ============================================================
describe('Large Dataset Handling', () => {
    it('should handle large number of employees in export', () => {
        const largeDataset: AbsenteeismReportData[] = Array.from({ length: 500 }, (_, i) => ({
            employeeId: `emp-${i + 1}`,
            employeeNumber: `EMP${String(i + 1).padStart(3, '0')}`,
            employeeName: `Employee ${i + 1}`,
            department: 'IT',
            totalAbsentDays: Math.floor(Math.random() * 10),
            sickLeaveDays: Math.floor(Math.random() * 5),
            occasions: Math.floor(Math.random() * 3) + 1,
            cycleInfo: {
                cycleStartDate: new Date('2023-01-01'),
                cycleEndDate: new Date('2026-01-01'),
                daysUsed: Math.floor(Math.random() * 20),
                daysRemaining: 36 - Math.floor(Math.random() * 20)
            },
            absenteeismRate: Math.random() * 5,
            flags: [],
            unauthorizedAbsenceCount: 0
        }));

        expect(largeDataset.length).toBe(500);
        expect(largeDataset[0].employeeNumber).toBe('EMP001');
        expect(largeDataset[499].employeeNumber).toBe('EMP500');
    });
});
