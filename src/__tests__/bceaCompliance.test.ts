// ============================================================
// BCEA COMPLIANCE TESTS
// ============================================================

import { describe, it, expect } from 'vitest';
import type { LeaveRequest } from '../types/leave';
import { validateMedicalCertificate, detectUnauthorizedAbsence } from '../services/bceaComplianceService';
import { isConsecutiveSickLeave, getOccasionsInWindow, getBusinessDaysInRange } from '../utils/dateUtils';
import { isAdjacentToPublicHoliday } from '../utils/publicHolidayUtils';

// ============================================================
// Test 1: BCEA 36-month cycle calculation
// ============================================================
describe('BCEA Sick Leave Cycle', () => {
    it('should correctly calculate 36-month rolling cycle from hire date', () => {
        const hireDate = new Date('2023-01-15');
        const cycleEndDate = new Date(hireDate);
        cycleEndDate.setMonth(cycleEndDate.getMonth() + 36);

        expect(cycleEndDate.getFullYear()).toBe(2026);
        expect(cycleEndDate.getMonth()).toBe(0); // January (0-indexed)
        expect(cycleEndDate.getDate()).toBe(15);
    });
});

// ============================================================
// Test 2: Medical certificate validation for 2+ consecutive days (Rule 1)
// ============================================================
describe('BCEA Rule 1: Consecutive Days Medical Certificate', () => {
    it('should flag 2+ consecutive sick days without medical certificate', () => {
        const leaveRequest: LeaveRequest = {
            id: 'test-001',
            employeeId: 'emp-001',
            companyId: 'comp-001',
            leaveTypeId: 'sick',
            leaveTypeName: 'Sick Leave',
            startDate: new Date('2026-01-20'),
            endDate: new Date('2026-01-21'),
            isHalfDay: false,
            totalDays: 2,
            workingDays: 2,
            status: 'approved',
            approvalHistory: [],
            createdBy: 'emp-001',
            createdAt: new Date(),
            attachments: [] // No certificate
        };

        const isConsecutive = isConsecutiveSickLeave(leaveRequest);
        expect(isConsecutive).toBe(true);

        const flags = validateMedicalCertificate(leaveRequest, []);
        expect(flags.length).toBeGreaterThan(0);
        expect(flags[0].type).toBe('medical_certificate_required');
        expect(flags[0].ruleTriggered).toContain('Rule 1');
    });

    it('should NOT flag single day sick leave without certificate', () => {
        const leaveRequest: LeaveRequest = {
            id: 'test-002',
            employeeId: 'emp-001',
            companyId: 'comp-001',
            leaveTypeId: 'sick',
            leaveTypeName: 'Sick Leave',
            startDate: new Date('2026-01-20'),
            endDate: new Date('2026-01-20'), // Same day
            isHalfDay: false,
            totalDays: 1,
            workingDays: 1,
            status: 'approved',
            approvalHistory: [],
            createdBy: 'emp-001',
            createdAt: new Date(),
            attachments: []
        };

        const isConsecutive = isConsecutiveSickLeave(leaveRequest);
        expect(isConsecutive).toBe(false);

        const flags = validateMedicalCertificate(leaveRequest, []);
        // Should not flag for Rule 1 (single day)
        const rule1Flags = flags.filter(f => f.ruleTriggered.includes('Rule 1'));
        expect(rule1Flags.length).toBe(0);
    });
});

// ============================================================
// Test 3: Public holiday adjacency check (Rule 2)
// ============================================================
describe('BCEA Rule 2: Public Holiday Adjacency', () => {
    it('should flag sick leave day before public holiday without certificate', () => {
        const publicHoliday = new Date('2026-01-21'); // Wednesday
        const sickLeaveDate = new Date('2026-01-20'); // Tuesday

        const isAdjacent = isAdjacentToPublicHoliday(sickLeaveDate, [publicHoliday]);
        expect(isAdjacent).toBe(true);
    });

    it('should flag sick leave day after public holiday without certificate', () => {
        const publicHoliday = new Date('2026-01-21'); // Wednesday
        const sickLeaveDate = new Date('2026-01-22'); // Thursday

        const isAdjacent = isAdjacentToPublicHoliday(sickLeaveDate, [publicHoliday]);
        expect(isAdjacent).toBe(true);
    });

    it('should flag Friday sick leave before Monday public holiday', () => {
        const publicHoliday = new Date('2026-01-26'); // Monday
        const sickLeaveDate = new Date('2026-01-23'); // Friday

        const isAdjacent = isAdjacentToPublicHoliday(sickLeaveDate, [publicHoliday]);
        expect(isAdjacent).toBe(true);
    });

    it('should NOT flag sick leave 2+ business days away from public holiday', () => {
        const publicHoliday = new Date('2026-01-21'); // Wednesday
        const sickLeaveDate = new Date('2026-01-27'); // Tuesday (following week)

        const isAdjacent = isAdjacentToPublicHoliday(sickLeaveDate, [publicHoliday]);
        expect(isAdjacent).toBe(false);
    });
});

// ============================================================
// Test 4: Business days calculation (excludes weekends and holidays)
// ============================================================
describe('Business Days Calculation', () => {
    it('should correctly exclude weekends from business days count', () => {
        const startDate = new Date('2026-01-19'); // Monday
        const endDate = new Date('2026-01-23'); // Friday
        const publicHolidays: Date[] = [];

        const businessDays = getBusinessDaysInRange(startDate, endDate, publicHolidays);
        expect(businessDays).toBe(5); // Mon-Fri = 5 business days
    });

    it('should correctly exclude weekends and public holidays', () => {
        const startDate = new Date('2026-01-19'); // Monday
        const endDate = new Date('2026-01-23'); // Friday
        const publicHoliday = new Date('2026-01-21'); // Wednesday

        const businessDays = getBusinessDaysInRange(startDate, endDate, [publicHoliday]);
        expect(businessDays).toBe(4); // Mon, Tue, Thu, Fri = 4 business days
    });

    it('should return 0 for weekend-only range', () => {
        const startDate = new Date('2026-01-24'); // Saturday
        const endDate = new Date('2026-01-25'); // Sunday
        const publicHolidays: Date[] = [];

        const businessDays = getBusinessDaysInRange(startDate, endDate, publicHolidays);
        expect(businessDays).toBe(0);
    });
});

// ============================================================
// Test 5: Occasions count in 8-week window (Rule 3)
// ============================================================
describe('BCEA Rule 3: Occasions in 8-Week Window', () => {
    it('should count 2 separate occasions correctly', () => {
        const leaveRequests: LeaveRequest[] = [
            {
                id: 'req-001',
                employeeId: 'emp-001',
                companyId: 'comp-001',
                leaveTypeId: 'sick',
                leaveTypeName: 'Sick Leave',
                startDate: new Date('2026-01-05'),
                endDate: new Date('2026-01-05'),
                isHalfDay: false,
                totalDays: 1,
                workingDays: 1,
                status: 'approved',
                approvalHistory: [],
                createdBy: 'emp-001',
                createdAt: new Date()
            },
            {
                id: 'req-002',
                employeeId: 'emp-001',
                companyId: 'comp-001',
                leaveTypeId: 'sick',
                leaveTypeName: 'Sick Leave',
                startDate: new Date('2026-01-20'), // 15 days later
                endDate: new Date('2026-01-20'),
                isHalfDay: false,
                totalDays: 1,
                workingDays: 1,
                status: 'approved',
                approvalHistory: [],
                createdBy: 'emp-001',
                createdAt: new Date()
            }
        ];

        const windowStart = new Date('2026-01-01');
        const windowEnd = new Date('2026-02-28'); // 8 weeks

        const occasions = getOccasionsInWindow(leaveRequests, windowStart, windowEnd);
        expect(occasions).toBe(2);
    });

    it('should count consecutive days as 1 occasion', () => {
        const leaveRequests: LeaveRequest[] = [
            {
                id: 'req-001',
                employeeId: 'emp-001',
                companyId: 'comp-001',
                leaveTypeId: 'sick',
                leaveTypeName: 'Sick Leave',
                startDate: new Date('2026-01-20'),
                endDate: new Date('2026-01-21'),
                isHalfDay: false,
                totalDays: 2,
                workingDays: 2,
                status: 'approved',
                approvalHistory: [],
                createdBy: 'emp-001',
                createdAt: new Date()
            }
        ];

        const windowStart = new Date('2026-01-01');
        const windowEnd = new Date('2026-02-28');

        const occasions = getOccasionsInWindow(leaveRequests, windowStart, windowEnd);
        expect(occasions).toBe(1);
    });
});

// ============================================================
// Test 6: Unauthorized absence detection
// ============================================================
describe('Unauthorized Absence Detection', () => {
    it('should count absences without required certificates as unauthorized', () => {
        const publicHoliday = new Date('2026-01-21');
        const leaveRequests: LeaveRequest[] = [
            {
                id: 'req-001',
                employeeId: 'emp-001',
                companyId: 'comp-001',
                leaveTypeId: 'sick',
                leaveTypeName: 'Sick Leave',
                startDate: new Date('2026-01-20'), // Day before holiday
                endDate: new Date('2026-01-20'),
                isHalfDay: false,
                totalDays: 1,
                workingDays: 1,
                status: 'approved',
                approvalHistory: [],
                createdBy: 'emp-001',
                createdAt: new Date(),
                attachments: [] // No certificate - should be unauthorized
            }
        ];

        const unauthorizedCount = detectUnauthorizedAbsence(leaveRequests, [publicHoliday]);
        expect(unauthorizedCount).toBeGreaterThan(0);
    });

    it('should NOT count absences with certificates as unauthorized', () => {
        const publicHoliday = new Date('2026-01-21');
        const leaveRequests: LeaveRequest[] = [
            {
                id: 'req-001',
                employeeId: 'emp-001',
                companyId: 'comp-001',
                leaveTypeId: 'sick',
                leaveTypeName: 'Sick Leave',
                startDate: new Date('2026-01-20'), // Day before holiday
                endDate: new Date('2026-01-20'),
                isHalfDay: false,
                totalDays: 1,
                workingDays: 1,
                status: 'approved',
                approvalHistory: [],
                createdBy: 'emp-001',
                createdAt: new Date(),
                attachments: [
                    {
                        id: 'cert-001',
                        fileName: 'medical_certificate.pdf',
                        fileType: 'application/pdf',
                        fileSize: 12345,
                        fileUrl: 'https://example.com/cert.pdf',
                        uploadedBy: 'emp-001',
                        uploadedAt: new Date()
                    }
                ] // Has certificate - should NOT be unauthorized
            }
        ];

        const unauthorizedCount = detectUnauthorizedAbsence(leaveRequests, [publicHoliday]);
        expect(unauthorizedCount).toBe(0);
    });
});
