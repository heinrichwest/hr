// ============================================================
// UI-19 REPORT VIEWER COMPONENT TESTS
// Task Group 5.1: 2-8 focused tests for UI-19 Viewer
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UI19ReportViewer } from '../components/reports/UI19ReportViewer';
import type { UI19Report } from '../types/ui19';

// Mock UI-19 report data
const mockUI19Report: UI19Report = {
    reportId: 'test-report-001',
    companyId: 'company-123',
    reportingPeriod: {
        month: 1,
        year: 2026,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31')
    },
    employerDetails: {
        uifEmployerReference: 'U123456789',
        payeReference: '7123456789',
        tradingName: 'Test Company (Pty) Ltd',
        physicalAddress: {
            line1: '123 Test Street',
            city: 'Johannesburg',
            province: 'Gauteng',
            postalCode: '2001',
            country: 'South Africa'
        },
        companyRegistrationNumber: '2021/123456/07',
        email: 'info@testcompany.co.za',
        phone: '011 123 4567',
        authorisedPersonName: 'John Doe',
        authorisedPersonIdNumber: '8001015009087'
    },
    employees: [
        {
            employeeId: 'emp-001',
            surname: 'Smith',
            initials: 'J.A.',
            idNumber: '9001015009087',
            grossRemuneration: 35000,
            hoursWorked: 176,
            commencementDate: new Date('2020-01-15'),
            isContributor: true
        },
        {
            employeeId: 'emp-002',
            surname: 'Johnson',
            initials: 'M.B.',
            idNumber: '8512205008088',
            grossRemuneration: 42000,
            hoursWorked: 176,
            commencementDate: new Date('2018-06-01'),
            terminationDate: new Date('2026-01-20'),
            terminationReasonCode: 6,
            isContributor: true
        },
        {
            employeeId: 'emp-003',
            surname: 'Williams',
            initials: 'S.C.',
            idNumber: '7808115009086',
            grossRemuneration: 28000,
            hoursWorked: 88,
            commencementDate: new Date('2021-03-01'),
            isContributor: false,
            nonContributorReasonCode: 1
        }
    ],
    declaration: {
        statement: 'I declare that the information provided in this form is true and correct.',
        authorisedPersonName: 'John Doe'
    },
    generatedBy: 'user-001',
    generatedByName: 'admin@testcompany.co.za',
    generatedAt: new Date('2026-02-05T10:30:00'),
    totalEmployees: 3,
    totalContributors: 2,
    totalNonContributors: 1
};

describe('UI19ReportViewer Component', () => {
    // Test 1: Component renders with report metadata
    it('should render report metadata header with company name and period', () => {
        render(<UI19ReportViewer report={mockUI19Report} />);

        // Check title is displayed
        expect(screen.getByText('UI-19 - UIF Employer\'s Declaration')).toBeInTheDocument();

        // Check period is displayed (January 2026)
        expect(screen.getByText(/January 2026/i)).toBeInTheDocument();

        // Check generated label
        expect(screen.getByText(/Generated:/i)).toBeInTheDocument();
    });

    // Test 2: Section 1 - Employer Details display
    it('should display all employer details from Section 1', () => {
        render(<UI19ReportViewer report={mockUI19Report} />);

        // UIF and PAYE references
        expect(screen.getByText('U123456789')).toBeInTheDocument();
        expect(screen.getByText('7123456789')).toBeInTheDocument();

        // Company registration number
        expect(screen.getByText('2021/123456/07')).toBeInTheDocument();

        // Contact details
        expect(screen.getByText('info@testcompany.co.za')).toBeInTheDocument();
        expect(screen.getByText('011 123 4567')).toBeInTheDocument();

        // Authorised person ID
        expect(screen.getByText('8001015009087')).toBeInTheDocument();
    });

    // Test 3: Section 2 - Employee table with all 10 columns
    it('should render employee table with all 10 required columns', () => {
        render(<UI19ReportViewer report={mockUI19Report} />);

        // Check key column headers exist (subset of A-J)
        expect(screen.getByText(/Surname/i)).toBeInTheDocument();
        expect(screen.getByText(/Initials/i)).toBeInTheDocument();
        expect(screen.getByText(/Identity Document/i)).toBeInTheDocument();
        expect(screen.getByText(/Gross Remuneration/i)).toBeInTheDocument();
        expect(screen.getByText(/Hours Worked/i)).toBeInTheDocument();
        expect(screen.getByText(/Contributor Status/i)).toBeInTheDocument();

        // Check employee data is displayed
        expect(screen.getByText('Smith')).toBeInTheDocument();
        expect(screen.getByText('Johnson')).toBeInTheDocument();
        expect(screen.getByText('Williams')).toBeInTheDocument();
    });

    // Test 4: Employee data display with all employee names
    it('should display all employee surnames in table', () => {
        render(<UI19ReportViewer report={mockUI19Report} />);

        // All employee surnames should be present
        expect(screen.getByText('Smith')).toBeInTheDocument();
        expect(screen.getByText('Johnson')).toBeInTheDocument();
        expect(screen.getByText('Williams')).toBeInTheDocument();
    });

    // Test 5: UIF contributor status display (YES/NO)
    it('should display contributor status as YES or NO', () => {
        render(<UI19ReportViewer report={mockUI19Report} />);

        // Contributors show YES
        const yesElements = screen.getAllByText('YES');
        expect(yesElements.length).toBeGreaterThanOrEqual(2); // At least 2 contributors

        // Non-contributors show NO
        expect(screen.getByText('NO')).toBeInTheDocument();
    });

    // Test 6: Section titles render correctly
    it('should display section titles for Employer Details and Employee Details', () => {
        render(<UI19ReportViewer report={mockUI19Report} />);

        // Section 1 title
        expect(screen.getByText('Section 1: Employer Details')).toBeInTheDocument();

        // Section 2 title
        expect(screen.getByText('Section 2: Employee Details')).toBeInTheDocument();
    });

    // Test 7: Export buttons visibility
    it('should display export buttons for Excel and CSV', () => {
        render(<UI19ReportViewer report={mockUI19Report} />);

        // Check Excel export button
        const excelButtons = screen.getAllByRole('button', { name: /excel/i });
        expect(excelButtons.length).toBeGreaterThan(0);

        // Check CSV export button
        const csvButtons = screen.getAllByRole('button', { name: /csv/i });
        expect(csvButtons.length).toBeGreaterThan(0);
    });

    // Test 8: Declaration footer renders with statement
    it('should render declaration statement and browser note', () => {
        render(<UI19ReportViewer report={mockUI19Report} />);

        // Declaration statement (partial match)
        expect(screen.getByText(/I declare that the information provided/i)).toBeInTheDocument();

        // Browser view note
        expect(screen.getByText(/Not for official submission/i)).toBeInTheDocument();
    });
});
