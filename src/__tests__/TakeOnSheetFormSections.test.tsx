// ============================================================
// TAKE-ON SHEET FORM SECTIONS TESTS
// Tests for form section components
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmploymentInfoSection } from '../components/TakeOnSheet/EmploymentInfoSection';
import { PersonalDetailsSection } from '../components/TakeOnSheet/PersonalDetailsSection';
import { PayrollDocumentsSection } from '../components/TakeOnSheet/PayrollDocumentsSection';
import { SystemAccessSection } from '../components/TakeOnSheet/SystemAccessSection';
import type { EmploymentInfo, PersonalDetails, SystemAccess, TakeOnDocument, TakeOnDocumentType } from '../types/takeOnSheet';

// Mock data
const mockEmploymentInfo: EmploymentInfo = {
    employmentType: 'permanent',
    isContract: false,
    jobTitleId: 'job-123',
    departmentId: 'dept-456',
    salary: 50000,
    currency: 'ZAR',
    dateOfEmployment: new Date(),
    reportsTo: 'manager-789',
};

const mockPersonalDetails: PersonalDetails = {
    title: 'Mr',
    firstName: 'John',
    lastName: 'Doe',
    race: 'African',
    physicalAddress: {
        line1: '123 Main St',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        country: 'South Africa',
    },
    postalAddress: {
        line1: '123 Main St',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        country: 'South Africa',
    },
    postalSameAsPhysical: true,
    idNumber: '9001015800087',
    contactNumber: '0821234567',
    hasDisability: false,
    employeeAcknowledgement: false,
};

const mockSystemAccess: SystemAccess = {
    ess: true,
    mss: false,
    zoho: true,
    lms: false,
    sophos: true,
    msOffice: true,
    bizvoip: false,
    email: true,
    teams: true,
    mimecast: false,
};

const mockDocuments: Partial<Record<TakeOnDocumentType, TakeOnDocument>> = {};

describe('TakeOnSheet Form Sections', () => {
    describe('EmploymentInfoSection', () => {
        it('should render all fields (employment type, contract, job details)', () => {
            render(
                <EmploymentInfoSection
                    data={mockEmploymentInfo}
                    onChange={vi.fn()}
                    isEditable={true}
                    jobTitles={[{ id: 'job-123', name: 'Software Developer', companyId: 'c1', code: 'SD', isActive: true, createdAt: new Date() }]}
                    departments={[{ id: 'dept-456', name: 'Engineering', companyId: 'c1', code: 'ENG', isActive: true, createdAt: new Date() }]}
                    employees={[{ id: 'manager-789', firstName: 'Jane', lastName: 'Manager' }]}
                />
            );

            // Employment type options - use getAllByText since "Permanent" appears multiple times
            expect(screen.getAllByText(/permanent/i).length).toBeGreaterThan(0);

            // Check for label elements using getAllByText
            expect(screen.getAllByText(/job title/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/department/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/salary/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/date of employment/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/reports to/i).length).toBeGreaterThan(0);
        });
    });

    describe('PersonalDetailsSection', () => {
        it('should render address fields using Address interface', () => {
            render(
                <PersonalDetailsSection
                    data={mockPersonalDetails}
                    onChange={vi.fn()}
                    isEditable={true}
                />
            );

            // Physical address fields - use getAllByText for elements that may appear multiple times
            expect(screen.getAllByText(/physical address/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/city/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/province/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/postal code/i).length).toBeGreaterThan(0);

            // Personal info fields
            expect(screen.getAllByText(/first name/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/last name/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/id number/i).length).toBeGreaterThan(0);
        });
    });

    describe('PayrollDocumentsSection', () => {
        it('should render 7 document upload slots', () => {
            render(
                <PayrollDocumentsSection
                    documents={mockDocuments}
                    onUpload={vi.fn()}
                    onDelete={vi.fn()}
                    isEditable={true}
                />
            );

            // Check for all 7 document types
            expect(screen.getByText(/SARS Letter/i)).toBeInTheDocument();
            expect(screen.getByText(/Proof of Bank Account/i)).toBeInTheDocument();
            expect(screen.getByText(/Certified ID Copy/i)).toBeInTheDocument();
            expect(screen.getByText(/Signed Contract/i)).toBeInTheDocument();
            expect(screen.getByText(/CV and Qualifications/i)).toBeInTheDocument();
            expect(screen.getByText(/MARISIT/i)).toBeInTheDocument();
            expect(screen.getByText(/EAA1 Form/i)).toBeInTheDocument();
        });
    });

    describe('SystemAccessSection', () => {
        it('should render 10 checkbox options grouped logically', () => {
            render(
                <SystemAccessSection
                    data={mockSystemAccess}
                    onChange={vi.fn()}
                    isEditable={true}
                />
            );

            // HR Systems - use getAllByText since labels and descriptions may include these terms
            expect(screen.getAllByText(/ESS/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/MSS/i).length).toBeGreaterThan(0);

            // Business Applications
            expect(screen.getAllByText(/ZOHO/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/LMS/i).length).toBeGreaterThan(0);

            // Security
            expect(screen.getAllByText(/SOPHOS/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Mimecast/i).length).toBeGreaterThan(0);

            // Productivity
            expect(screen.getAllByText(/MS Office/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Email/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Microsoft Teams/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Bizvoip/i).length).toBeGreaterThan(0);
        });
    });

    describe('Read-only state', () => {
        it('should make form sections read-only when user lacks edit permission', () => {
            render(
                <EmploymentInfoSection
                    data={mockEmploymentInfo}
                    onChange={vi.fn()}
                    isEditable={false}
                    jobTitles={[]}
                    departments={[]}
                    employees={[]}
                />
            );

            // All radio buttons should be disabled
            const radios = screen.getAllByRole('radio');
            radios.forEach(radio => {
                expect(radio).toBeDisabled();
            });

            // All select dropdowns should be disabled
            const selects = screen.getAllByRole('combobox');
            selects.forEach(select => {
                expect(select).toBeDisabled();
            });

            // Checkbox should be disabled
            const checkboxes = screen.getAllByRole('checkbox');
            checkboxes.forEach(checkbox => {
                expect(checkbox).toBeDisabled();
            });
        });
    });

    describe('Form validation', () => {
        it('should prevent submission with missing required fields', () => {
            const emptyPersonalDetails: PersonalDetails = {
                title: 'Mr',
                firstName: '',
                lastName: '',
                race: 'African',
                physicalAddress: {
                    line1: '',
                    city: '',
                    province: '',
                    postalCode: '',
                    country: 'South Africa',
                },
                postalAddress: {
                    line1: '',
                    city: '',
                    province: '',
                    postalCode: '',
                    country: 'South Africa',
                },
                postalSameAsPhysical: true,
                idNumber: '',
                contactNumber: '',
                hasDisability: false,
                employeeAcknowledgement: false,
            };

            render(
                <PersonalDetailsSection
                    data={emptyPersonalDetails}
                    onChange={vi.fn()}
                    isEditable={true}
                    showValidation={true}
                />
            );

            // Should show validation messages for required fields
            expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        });
    });
});
