// ============================================================
// DASHBOARD PREVIEWS TESTS
// Tests for dashboard preview components
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
    EmployeeDashboardPreview,
    HRDashboardPreview,
    PayrollDashboardPreview,
    FinanceDashboardPreview,
    LineManagerDashboardPreview,
    IRDashboardPreview,
    getDashboardPreviewComponent,
    ROLE_DASHBOARD_MAP,
} from '../components/DashboardPreviews';
import { MOCK_EMPLOYEE, MOCK_LEAVE_BALANCES, MOCK_PAYSLIPS } from '../data/mockEmployeeData';

describe('Dashboard Preview Components', () => {
    describe('EmployeeDashboardPreview', () => {
        it('should render with mock employee data', () => {
            render(<EmployeeDashboardPreview />);

            // Check for employee info
            expect(screen.getByText(MOCK_EMPLOYEE.employeeNumber)).toBeInTheDocument();
            expect(screen.getByText(MOCK_EMPLOYEE.department)).toBeInTheDocument();
            expect(screen.getByText(MOCK_EMPLOYEE.jobTitle)).toBeInTheDocument();
        });

        it('should display mock leave balances', () => {
            render(<EmployeeDashboardPreview />);

            // Check for leave balance types
            MOCK_LEAVE_BALANCES.forEach((balance) => {
                expect(screen.getByText(balance.leaveTypeName)).toBeInTheDocument();
            });
        });

        it('should display mock payslips', () => {
            render(<EmployeeDashboardPreview />);

            // Check for payslip periods
            MOCK_PAYSLIPS.forEach((payslip) => {
                expect(screen.getByText(payslip.periodDescription)).toBeInTheDocument();
            });
        });

        it('should show sample data notice', () => {
            render(<EmployeeDashboardPreview />);

            expect(screen.getByText(/preview with sample data/i)).toBeInTheDocument();
        });
    });

    describe('HRDashboardPreview', () => {
        it('should render HR dashboard content', () => {
            render(<HRDashboardPreview />);

            expect(screen.getByText('HR Dashboard')).toBeInTheDocument();
            expect(screen.getByText(/pending leave requests/i)).toBeInTheDocument();
            expect(screen.getByText(/recent hires/i)).toBeInTheDocument();
        });

        it('should show sample data notice', () => {
            render(<HRDashboardPreview />);

            expect(screen.getByText(/preview with placeholder data/i)).toBeInTheDocument();
        });
    });

    describe('PayrollDashboardPreview', () => {
        it('should render Payroll dashboard content', () => {
            render(<PayrollDashboardPreview />);

            expect(screen.getByText('Payroll Dashboard')).toBeInTheDocument();
            expect(screen.getByText(/pending calculations/i)).toBeInTheDocument();
        });
    });

    describe('FinanceDashboardPreview', () => {
        it('should render Finance dashboard content', () => {
            render(<FinanceDashboardPreview />);

            expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
            expect(screen.getByText(/pending approvals/i)).toBeInTheDocument();
        });
    });

    describe('LineManagerDashboardPreview', () => {
        it('should render Line Manager dashboard content', () => {
            render(<LineManagerDashboardPreview />);

            expect(screen.getByText('Team Dashboard')).toBeInTheDocument();
            expect(screen.getByText(/team members/i)).toBeInTheDocument();
        });
    });

    describe('IRDashboardPreview', () => {
        it('should render IR dashboard content', () => {
            render(<IRDashboardPreview />);

            expect(screen.getByText('IR Dashboard')).toBeInTheDocument();
            expect(screen.getByText(/active cases/i)).toBeInTheDocument();
        });
    });

    describe('ROLE_DASHBOARD_MAP', () => {
        it('should map System Admin to null (original dashboard)', () => {
            expect(ROLE_DASHBOARD_MAP['System Admin']).toBeNull();
        });

        it('should map HR roles to HRDashboardPreview', () => {
            expect(ROLE_DASHBOARD_MAP['HR Admin']).toBe(HRDashboardPreview);
            expect(ROLE_DASHBOARD_MAP['HR Manager']).toBe(HRDashboardPreview);
        });

        it('should map Payroll roles to PayrollDashboardPreview', () => {
            expect(ROLE_DASHBOARD_MAP['Payroll Admin']).toBe(PayrollDashboardPreview);
            expect(ROLE_DASHBOARD_MAP['Payroll Manager']).toBe(PayrollDashboardPreview);
        });

        it('should map Finance roles to FinanceDashboardPreview', () => {
            expect(ROLE_DASHBOARD_MAP['Finance Approver']).toBe(FinanceDashboardPreview);
            expect(ROLE_DASHBOARD_MAP['Finance Read-Only']).toBe(FinanceDashboardPreview);
        });

        it('should map Line Manager to LineManagerDashboardPreview', () => {
            expect(ROLE_DASHBOARD_MAP['Line Manager']).toBe(LineManagerDashboardPreview);
        });

        it('should map IR roles to IRDashboardPreview', () => {
            expect(ROLE_DASHBOARD_MAP['IR Officer']).toBe(IRDashboardPreview);
            expect(ROLE_DASHBOARD_MAP['IR Manager']).toBe(IRDashboardPreview);
        });

        it('should map Employee to EmployeeDashboardPreview', () => {
            expect(ROLE_DASHBOARD_MAP['Employee']).toBe(EmployeeDashboardPreview);
        });
    });

    describe('getDashboardPreviewComponent', () => {
        it('should return correct component for each role', () => {
            expect(getDashboardPreviewComponent('Employee')).toBe(EmployeeDashboardPreview);
            expect(getDashboardPreviewComponent('HR Admin')).toBe(HRDashboardPreview);
            expect(getDashboardPreviewComponent('Payroll Admin')).toBe(PayrollDashboardPreview);
            expect(getDashboardPreviewComponent('Finance Approver')).toBe(FinanceDashboardPreview);
            expect(getDashboardPreviewComponent('Line Manager')).toBe(LineManagerDashboardPreview);
            expect(getDashboardPreviewComponent('IR Officer')).toBe(IRDashboardPreview);
        });

        it('should return null for System Admin', () => {
            expect(getDashboardPreviewComponent('System Admin')).toBeNull();
        });
    });
});
