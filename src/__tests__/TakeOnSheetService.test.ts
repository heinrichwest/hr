// ============================================================
// TAKE-ON SHEET SERVICE TESTS
// Tests for TakeOnSheetService CRUD and state transition operations
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TakeOnSheetService } from '../services/takeOnSheetService';
import type {
    TakeOnSheet,
    TakeOnSheetStatus,
    CreateTakeOnSheetData,
    EmploymentInfo,
} from '../types/takeOnSheet';

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => ({ id: 'mock-doc-id' })),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(() => ({})),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
}));

// Helper to create mock employment info
const createMockEmploymentInfo = (): EmploymentInfo => ({
    employmentType: 'permanent',
    isContract: false,
    jobTitleId: 'job-123',
    departmentId: 'dept-456',
    salary: 50000,
    currency: 'ZAR',
    dateOfEmployment: new Date(),
    reportsTo: 'manager-789',
});

// Helper to create mock take-on sheet
const createMockTakeOnSheet = (overrides?: Partial<TakeOnSheet>): TakeOnSheet => ({
    id: 'sheet-123',
    companyId: 'company-456',
    status: 'draft',
    employmentInfo: createMockEmploymentInfo(),
    personalDetails: {
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
    },
    systemAccess: {
        ess: false,
        mss: false,
        zoho: false,
        lms: false,
        sophos: false,
        msOffice: false,
        bizvoip: false,
        email: false,
        teams: false,
        mimecast: false,
    },
    documents: {},
    statusHistory: [],
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'user-123',
    ...overrides,
});

describe('TakeOnSheetService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTakeOnSheet', () => {
        it('should create a document with draft status and companyId', async () => {
            const { setDoc, doc, collection } = await import('firebase/firestore');

            const mockDocRef = { id: 'new-sheet-id' };
            vi.mocked(doc).mockReturnValue(mockDocRef as never);
            vi.mocked(collection).mockReturnValue({} as never);
            vi.mocked(setDoc).mockResolvedValue(undefined);

            const createData: CreateTakeOnSheetData = {
                companyId: 'company-123',
                createdBy: 'manager-456',
                employmentInfo: createMockEmploymentInfo(),
            };

            const result = await TakeOnSheetService.createTakeOnSheet(createData);

            expect(result).toBe('new-sheet-id');
            expect(setDoc).toHaveBeenCalledTimes(1);

            // Verify the document was created with correct structure
            const setDocCall = vi.mocked(setDoc).mock.calls[0];
            const documentData = setDocCall[1] as TakeOnSheet;

            expect(documentData.status).toBe('draft');
            expect(documentData.companyId).toBe('company-123');
            expect(documentData.createdBy).toBe('manager-456');
            expect(documentData.statusHistory).toEqual([]);
        });
    });

    describe('getTakeOnSheetById', () => {
        it('should return correct data when sheet exists', async () => {
            const { getDoc, doc } = await import('firebase/firestore');

            const mockSheet = createMockTakeOnSheet();
            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => true,
                data: () => mockSheet,
            } as never);

            const result = await TakeOnSheetService.getTakeOnSheetById('sheet-123');

            expect(result).toEqual(mockSheet);
            expect(result?.id).toBe('sheet-123');
            expect(result?.companyId).toBe('company-456');
        });

        it('should return null when sheet does not exist', async () => {
            const { getDoc, doc } = await import('firebase/firestore');

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => false,
            } as never);

            const result = await TakeOnSheetService.getTakeOnSheetById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('updateTakeOnSheet', () => {
        it('should update only specified fields', async () => {
            const { getDoc, updateDoc, doc } = await import('firebase/firestore');

            const mockSheet = createMockTakeOnSheet();
            const updatedSheet = {
                ...mockSheet,
                employmentInfo: { ...mockSheet.employmentInfo, salary: 60000 },
            };

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc)
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => mockSheet,
                } as never)
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => updatedSheet,
                } as never);
            vi.mocked(updateDoc).mockResolvedValue(undefined);

            const result = await TakeOnSheetService.updateTakeOnSheet('sheet-123', {
                updatedBy: 'user-456',
                employmentInfo: { salary: 60000 },
            });

            expect(updateDoc).toHaveBeenCalledTimes(1);
            expect(result.employmentInfo.salary).toBe(60000);
        });
    });

    describe('transitionStatus', () => {
        it('should enforce valid state transitions (no skipping)', async () => {
            const { getDoc, updateDoc, doc } = await import('firebase/firestore');

            const mockSheet = createMockTakeOnSheet({ status: 'draft' });
            const transitionedSheet = {
                ...mockSheet,
                status: 'pending_hr_review' as TakeOnSheetStatus,
            };

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc)
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => mockSheet,
                } as never)
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => transitionedSheet,
                } as never);
            vi.mocked(updateDoc).mockResolvedValue(undefined);

            // Valid transition: draft -> pending_hr_review
            const result = await TakeOnSheetService.transitionStatus(
                'sheet-123',
                'pending_hr_review',
                'user-123'
            );

            expect(result.status).toBe('pending_hr_review');
            expect(updateDoc).toHaveBeenCalled();
        });

        it('should block invalid transitions (e.g., draft to complete)', async () => {
            const { getDoc, doc } = await import('firebase/firestore');

            const mockSheet = createMockTakeOnSheet({ status: 'draft' });

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => true,
                data: () => mockSheet,
            } as never);

            // Invalid transition: draft -> complete (skips pending_hr_review and pending_it_setup)
            await expect(
                TakeOnSheetService.transitionStatus('sheet-123', 'complete', 'user-123')
            ).rejects.toThrow('Invalid status transition');
        });
    });

    describe('getTakeOnSheetsByCompany', () => {
        it('should filter by companyId for tenant isolation', async () => {
            const { getDocs, query, where, collection, orderBy } = await import('firebase/firestore');

            const mockSheets = [
                createMockTakeOnSheet({ id: 'sheet-1', companyId: 'company-123' }),
                createMockTakeOnSheet({ id: 'sheet-2', companyId: 'company-123' }),
            ];

            vi.mocked(collection).mockReturnValue({} as never);
            vi.mocked(where).mockReturnValue({} as never);
            vi.mocked(orderBy).mockReturnValue({} as never);
            vi.mocked(query).mockReturnValue({} as never);
            vi.mocked(getDocs).mockResolvedValue({
                docs: mockSheets.map(sheet => ({
                    data: () => sheet,
                })),
            } as never);

            const result = await TakeOnSheetService.getTakeOnSheetsByCompany('company-123');

            expect(result).toHaveLength(2);
            expect(where).toHaveBeenCalledWith('companyId', '==', 'company-123');
            result.forEach(sheet => {
                expect(sheet.companyId).toBe('company-123');
            });
        });
    });
});
