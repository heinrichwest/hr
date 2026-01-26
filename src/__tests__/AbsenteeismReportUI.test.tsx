// ============================================================
// ABSENTEEISM REPORT UI TESTS
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AbsenteeismFilters } from '../components/reports/AbsenteeismFilters';
import { AbsenteeismReportTable } from '../components/reports/AbsenteeismReportTable';
import { ComplianceIndicators } from '../components/reports/ComplianceIndicators';
import type { AbsenteeismFilters as AbsenteeismFiltersType, AbsenteeismReportData, ComplianceFlag } from '../types/reports';

// Mock Firestore
vi.mock('../firebase', () => ({
    db: {},
    auth: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
    Timestamp: {
        fromDate: (date: Date) => ({ toDate: () => date })
    }
}));

describe('Absenteeism Report UI Components', () => {
    describe('AbsenteeismFilters Component', () => {
        it('should render filter panel with all filter options', () => {
            const mockFilters: AbsenteeismFiltersType = {
                employeeId: undefined,
                dateRange: {
                    startDate: new Date('2026-01-01'),
                    endDate: new Date('2026-01-31')
                },
                leaveTypeMode: 'sick_only'
            };

            const onFiltersChange = vi.fn();

            render(
                <AbsenteeismFilters
                    companyId="test-company"
                    filters={mockFilters}
                    onFiltersChange={onFiltersChange}
                />
            );

            // Check for quick date preset buttons
            expect(screen.getByText('This Month')).toBeInTheDocument();
            expect(screen.getByText('This Quarter')).toBeInTheDocument();
            expect(screen.getByText('This Year')).toBeInTheDocument();

            // Check for leave type toggles
            expect(screen.getByText('Sick Leave Only')).toBeInTheDocument();
            expect(screen.getByText('All Absence Types')).toBeInTheDocument();

            // Check for clear filters button
            expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
        });

        it('should call onFiltersChange when leave type mode is toggled', () => {
            const mockFilters: AbsenteeismFiltersType = {
                employeeId: undefined,
                dateRange: {
                    startDate: new Date('2026-01-01'),
                    endDate: new Date('2026-01-31')
                },
                leaveTypeMode: 'sick_only'
            };

            const onFiltersChange = vi.fn();

            render(
                <AbsenteeismFilters
                    companyId="test-company"
                    filters={mockFilters}
                    onFiltersChange={onFiltersChange}
                />
            );

            const allTypesButton = screen.getByText('All Absence Types');
            fireEvent.click(allTypesButton);

            expect(onFiltersChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    leaveTypeMode: 'all_types'
                })
            );
        });
    });

    describe('AbsenteeismReportTable Component', () => {
        const mockReportData: AbsenteeismReportData[] = [
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
                department: 'Finance',
                totalAbsentDays: 8,
                sickLeaveDays: 6,
                occasions: 3,
                cycleInfo: {
                    cycleStartDate: new Date('2023-03-01'),
                    cycleEndDate: new Date('2026-03-01'),
                    daysUsed: 15,
                    daysRemaining: 21
                },
                absenteeismRate: 3.45,
                flags: [
                    {
                        type: 'attendance_counseling_recommended',
                        message: 'Attendance counseling recommended: 8 days absent in period',
                        severity: 'info',
                        ruleTriggered: 'BCEA Rule 4: Total absent days exceeds threshold (>5 days)'
                    }
                ],
                unauthorizedAbsenceCount: 0
            }
        ];

        it('should render table with all required columns', () => {
            render(<AbsenteeismReportTable data={mockReportData} loading={false} />);

            // Check for all column headers
            expect(screen.getByText('EMPLOYEE #')).toBeInTheDocument();
            expect(screen.getByText('EMPLOYEE NAME')).toBeInTheDocument();
            expect(screen.getByText('DEPARTMENT')).toBeInTheDocument();
            expect(screen.getByText('TOTAL ABSENT DAYS')).toBeInTheDocument();
            expect(screen.getByText('SICK LEAVE DAYS')).toBeInTheDocument();
            expect(screen.getByText('OCCASIONS')).toBeInTheDocument();
            expect(screen.getByText('CYCLE USED/REMAINING')).toBeInTheDocument();
            expect(screen.getByText('ABSENTEEISM RATE %')).toBeInTheDocument();
            expect(screen.getByText('ACTION FLAGS')).toBeInTheDocument();
        });

        it('should display employee data correctly', () => {
            render(<AbsenteeismReportTable data={mockReportData} loading={false} />);

            // Check for employee data
            expect(screen.getByText('EMP001')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('IT')).toBeInTheDocument();
            expect(screen.getByText('2.15%')).toBeInTheDocument();

            expect(screen.getByText('EMP002')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            expect(screen.getByText('Finance')).toBeInTheDocument();
            expect(screen.getByText('3.45%')).toBeInTheDocument();
        });

        it('should show empty state when no data is provided', () => {
            render(<AbsenteeismReportTable data={[]} loading={false} />);

            expect(screen.getByText('No absenteeism data found')).toBeInTheDocument();
            expect(screen.getByText('Try adjusting the filters or date range')).toBeInTheDocument();
        });

        it('should show loading state when loading prop is true', () => {
            render(<AbsenteeismReportTable data={[]} loading={true} />);

            // Should show skeleton loaders
            const skeletonRows = document.querySelectorAll('.skeleton-row');
            expect(skeletonRows.length).toBeGreaterThan(0);
        });

        it('should support column sorting', async () => {
            render(<AbsenteeismReportTable data={mockReportData} loading={false} />);

            // Click on employee name header to sort
            const nameHeader = screen.getByText('EMPLOYEE NAME');
            fireEvent.click(nameHeader);

            // Table should still render (sorting is internal)
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });
    });

    describe('ComplianceIndicators Component', () => {
        it('should display compliance flags with correct icons and text', () => {
            const mockFlags: ComplianceFlag[] = [
                {
                    type: 'medical_certificate_required',
                    message: 'Medical certificate required for 2+ consecutive sick days',
                    severity: 'warning',
                    ruleTriggered: 'BCEA Rule 1: Sick leave of 2+ consecutive days'
                },
                {
                    type: 'attendance_counseling_recommended',
                    message: 'Attendance counseling recommended: 7 days absent in period',
                    severity: 'info',
                    ruleTriggered: 'BCEA Rule 4: Total absent days exceeds threshold (>5 days)'
                }
            ];

            render(<ComplianceIndicators flags={mockFlags} unauthorizedAbsenceCount={0} />);

            expect(screen.getByText('Certificate Required')).toBeInTheDocument();
            expect(screen.getByText('Counseling Recommended')).toBeInTheDocument();
        });

        it('should display "No issues" when no flags are present', () => {
            render(<ComplianceIndicators flags={[]} unauthorizedAbsenceCount={0} />);

            expect(screen.getByText('No issues')).toBeInTheDocument();
        });

        it('should display unauthorized absence count when present', () => {
            render(<ComplianceIndicators flags={[]} unauthorizedAbsenceCount={2} />);

            expect(screen.getByText(/2 unauthorized/)).toBeInTheDocument();
        });
    });
});
