// ============================================================
// TAKE-ON SHEET EMPLOYEE INTEGRATION TESTS
// Tests for creating employees from completed take-on sheets
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeService } from '../services/employeeService';
import type { TakeOnSheet } from '../types/takeOnSheet';

// Track addDoc calls
let addDocCalls: Array<{ collection: string; data: any }> = [];

// Mock Firestore
vi.mock('firebase/firestore', () => ({
    collection: vi.fn((_db, name) => name),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
    addDoc: vi.fn((collectionName: string, data: any) => {
        addDocCalls.push({ collection: collectionName, data });
        return Promise.resolve({ id: 'new-employee-id' });
    }),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: vi.fn(() => ({ toDate: () => new Date() })),
        fromDate: vi.fn((date: Date) => ({ toDate: () => date }))
    },
    serverTimestamp: vi.fn(() => new Date())
}));

vi.mock('firebase/storage', () => ({
    ref: vi.fn(() => ({})),
    getBlob: vi.fn(() => Promise.resolve(new Blob(['test'], { type: 'application/pdf' }))),
    uploadBytes: vi.fn(() => Promise.resolve({})),
    getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')),
}));

vi.mock('../firebase', () => ({
    db: {},
    storage: {}
}));

// Helper to create a complete take-on sheet
function createCompleteTakeOnSheet(overrides: Partial<TakeOnSheet> = {}): TakeOnSheet {
    return {
        id: 'tos-123',
        companyId: 'company-1',
        status: 'complete',
        employmentInfo: {
            employmentType: 'permanent',
            isContract: false,
            jobTitleId: 'job-1',
            departmentId: 'dept-1',
            salary: 50000,
            currency: 'ZAR',
            dateOfEmployment: new Date('2024-01-15'),
            reportsTo: 'manager-1',
        },
        personalDetails: {
            title: 'Mr',
            firstName: 'John',
            lastName: 'Doe',
            race: 'African',
            physicalAddress: {
                line1: '123 Main Street',
                city: 'Johannesburg',
                province: 'Gauteng',
                postalCode: '2000',
                country: 'South Africa',
            },
            postalAddress: {
                line1: 'PO Box 456',
                city: 'Johannesburg',
                province: 'Gauteng',
                postalCode: '2001',
                country: 'South Africa',
            },
            postalSameAsPhysical: false,
            idNumber: '9001015800087',
            contactNumber: '0821234567',
            hasDisability: false,
            employeeAcknowledgement: true,
        },
        systemAccess: {
            ess: true,
            mss: false,
            zoho: false,
            lms: false,
            sophos: false,
            msOffice: true,
            bizvoip: false,
            email: true,
            teams: true,
            mimecast: false,
        },
        documents: {},
        statusHistory: [],
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        ...overrides
    } as TakeOnSheet;
}

describe('EmployeeService - Take-On Sheet Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        addDocCalls = [];
    });

    describe('mapEmploymentTypeToContractType', () => {
        it('maps permanent to permanent', () => {
            const result = EmployeeService.mapEmploymentTypeToContractType('permanent');
            expect(result).toBe('permanent');
        });

        it('maps fixed to fixed_term', () => {
            const result = EmployeeService.mapEmploymentTypeToContractType('fixed');
            expect(result).toBe('fixed_term');
        });
    });

    describe('createEmployeeFromTakeOnSheet', () => {
        it('throws error if take-on sheet is not complete', async () => {
            const incompleteTakeOnSheet = createCompleteTakeOnSheet({ status: 'draft' });

            await expect(
                EmployeeService.createEmployeeFromTakeOnSheet(incompleteTakeOnSheet, 'user-1')
            ).rejects.toThrow('Cannot create employee from incomplete take-on sheet');
        });

        it('throws error if take-on sheet is pending HR review', async () => {
            const pendingTakeOnSheet = createCompleteTakeOnSheet({ status: 'pending_hr_review' });

            await expect(
                EmployeeService.createEmployeeFromTakeOnSheet(pendingTakeOnSheet, 'user-1')
            ).rejects.toThrow('Cannot create employee from incomplete take-on sheet');
        });

        it('throws error if take-on sheet is pending IT setup', async () => {
            const pendingITTakeOnSheet = createCompleteTakeOnSheet({ status: 'pending_it_setup' });

            await expect(
                EmployeeService.createEmployeeFromTakeOnSheet(pendingITTakeOnSheet, 'user-1')
            ).rejects.toThrow('Cannot create employee from incomplete take-on sheet');
        });

        it('creates employee with correct personal details from take-on sheet', async () => {
            const takeOnSheet = createCompleteTakeOnSheet();

            const employeeId = await EmployeeService.createEmployeeFromTakeOnSheet(takeOnSheet, 'user-1');

            expect(employeeId).toBe('new-employee-id');
            // First call should be to employees collection
            const employeeCall = addDocCalls.find(c => c.collection === 'employees');
            expect(employeeCall).toBeDefined();
            expect(employeeCall?.data.firstName).toBe('John');
            expect(employeeCall?.data.lastName).toBe('Doe');
            expect(employeeCall?.data.idNumber).toBe('9001015800087');
        });

        it('maps employment info correctly from take-on sheet', async () => {
            const takeOnSheet = createCompleteTakeOnSheet();

            await EmployeeService.createEmployeeFromTakeOnSheet(takeOnSheet, 'user-1');

            const employeeCall = addDocCalls.find(c => c.collection === 'employees');
            expect(employeeCall?.data.contractType).toBe('permanent');
            expect(employeeCall?.data.jobTitleId).toBe('job-1');
            expect(employeeCall?.data.departmentId).toBe('dept-1');
            expect(employeeCall?.data.basicSalary).toBe(50000);
            expect(employeeCall?.data.managerId).toBe('manager-1');
        });

        it('creates employee with addresses from take-on sheet', async () => {
            const takeOnSheet = createCompleteTakeOnSheet();

            await EmployeeService.createEmployeeFromTakeOnSheet(takeOnSheet, 'user-1');

            const employeeCall = addDocCalls.find(c => c.collection === 'employees');
            // Residential address
            expect(employeeCall?.data.residentialAddress).toBeDefined();
            expect(employeeCall?.data.residentialAddress.line1).toBe('123 Main Street');
            expect(employeeCall?.data.residentialAddress.city).toBe('Johannesburg');
            expect(employeeCall?.data.residentialAddress.province).toBe('Gauteng');
            expect(employeeCall?.data.residentialAddress.postalCode).toBe('2000');
            // Postal address (different when postalSameAsPhysical is false)
            expect(employeeCall?.data.postalAddress).toBeDefined();
            expect(employeeCall?.data.postalAddress.line1).toBe('PO Box 456');
            expect(employeeCall?.data.postalAddress.postalCode).toBe('2001');
        });

        it('uses physical address as postal when postalSameAsPhysical is true', async () => {
            const takeOnSheet = createCompleteTakeOnSheet({
                personalDetails: {
                    ...createCompleteTakeOnSheet().personalDetails,
                    postalSameAsPhysical: true,
                }
            });

            await EmployeeService.createEmployeeFromTakeOnSheet(takeOnSheet, 'user-1');

            const employeeCall = addDocCalls.find(c => c.collection === 'employees');
            // Postal address should not be set when postalSameAsPhysical is true
            expect(employeeCall?.data.postalAddress).toBeUndefined();
        });

        it('sets employee status to active', async () => {
            const takeOnSheet = createCompleteTakeOnSheet();

            await EmployeeService.createEmployeeFromTakeOnSheet(takeOnSheet, 'user-1');

            const employeeCall = addDocCalls.find(c => c.collection === 'employees');
            expect(employeeCall?.data.status).toBe('active');
            expect(employeeCall?.data.isActive).toBe(true);
        });

        it('creates employment history record', async () => {
            const takeOnSheet = createCompleteTakeOnSheet();

            await EmployeeService.createEmployeeFromTakeOnSheet(takeOnSheet, 'user-1');

            const historyCall = addDocCalls.find(c => c.collection === 'employmentHistory');
            expect(historyCall).toBeDefined();
            expect(historyCall?.data.changeType).toBe('hire');
            expect(historyCall?.data.reason).toContain('take-on sheet');
        });

        it('sets correct payroll defaults', async () => {
            const takeOnSheet = createCompleteTakeOnSheet();

            await EmployeeService.createEmployeeFromTakeOnSheet(takeOnSheet, 'user-1');

            const employeeCall = addDocCalls.find(c => c.collection === 'employees');
            expect(employeeCall?.data.payFrequency).toBe('monthly');
            expect(employeeCall?.data.salaryType).toBe('monthly');
            expect(employeeCall?.data.isUifApplicable).toBe(true);
        });
    });

    describe('findExistingEmployeeForTakeOnSheet', () => {
        it('returns null if no ID number on take-on sheet', async () => {
            const takeOnSheet = createCompleteTakeOnSheet({
                personalDetails: {
                    ...createCompleteTakeOnSheet().personalDetails,
                    idNumber: ''
                }
            });

            const result = await EmployeeService.findExistingEmployeeForTakeOnSheet(takeOnSheet);
            expect(result).toBeNull();
        });

        it('returns null if no matching employee found', async () => {
            const takeOnSheet = createCompleteTakeOnSheet();

            const { getDocs } = await import('firebase/firestore');
            (getDocs as any).mockResolvedValue({ empty: true, docs: [] });

            const result = await EmployeeService.findExistingEmployeeForTakeOnSheet(takeOnSheet);
            expect(result).toBeNull();
        });
    });

    describe('transferDocumentsFromTakeOnSheet', () => {
        it('transfers documents from take-on sheet to employee', async () => {
            const takeOnSheet = createCompleteTakeOnSheet({
                documents: {
                    certifiedId: {
                        fileName: 'id_copy.pdf',
                        storagePath: 'tenants/company-1/take-on-sheets/tos-123/documents/certifiedId/id_copy.pdf',
                        uploadedAt: new Date(),
                        uploadedBy: 'user-1',
                        fileSize: 1024,
                        mimeType: 'application/pdf',
                    },
                },
            });

            const docIds = await EmployeeService.transferDocumentsFromTakeOnSheet(
                takeOnSheet,
                'new-employee-id',
                'user-1'
            );

            expect(docIds.length).toBe(1);
            const docCall = addDocCalls.find(c => c.collection === 'employeeDocuments');
            expect(docCall).toBeDefined();
            expect(docCall?.data.employeeId).toBe('new-employee-id');
            expect(docCall?.data.companyId).toBe('company-1');
            expect(docCall?.data.category).toBe('identity');
            expect(docCall?.data.name).toBe('Certified ID Copy');
        });

        it('maps document types to correct categories', async () => {
            const takeOnSheet = createCompleteTakeOnSheet({
                documents: {
                    sarsLetter: {
                        fileName: 'sars.pdf',
                        storagePath: 'tenants/company-1/take-on-sheets/tos-123/documents/sarsLetter/sars.pdf',
                        uploadedAt: new Date(),
                        uploadedBy: 'user-1',
                        fileSize: 1024,
                        mimeType: 'application/pdf',
                    },
                    bankProof: {
                        fileName: 'bank.pdf',
                        storagePath: 'tenants/company-1/take-on-sheets/tos-123/documents/bankProof/bank.pdf',
                        uploadedAt: new Date(),
                        uploadedBy: 'user-1',
                        fileSize: 1024,
                        mimeType: 'application/pdf',
                    },
                },
            });

            const docIds = await EmployeeService.transferDocumentsFromTakeOnSheet(
                takeOnSheet,
                'new-employee-id',
                'user-1'
            );

            expect(docIds.length).toBe(2);

            const docCalls = addDocCalls.filter(c => c.collection === 'employeeDocuments');
            expect(docCalls.some(c => c.data.category === 'tax')).toBe(true);
            expect(docCalls.some(c => c.data.category === 'bank_proof')).toBe(true);
        });
    });
});
