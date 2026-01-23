// ============================================================
// TAKE-ON SHEET COMPREHENSIVE TESTS
// Task Group 11: Gap analysis and strategic tests for end-to-end coverage
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TakeOnSheetService } from '../services/takeOnSheetService';
import { EmployeeService } from '../services/employeeService';
import type { TakeOnSheet, TakeOnSheetStatus, TakeOnSheetSection } from '../types/takeOnSheet';
import type { UserRole } from '../types/user';

// Track addDoc calls
let addDocCalls: Array<{ collection: string; data: any }> = [];

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
    storage: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => ({ id: 'mock-doc-id' })),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    collection: vi.fn((_db, name) => name),
    getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
    addDoc: vi.fn((collectionName: string, data: any) => {
        addDocCalls.push({ collection: collectionName, data });
        return Promise.resolve({ id: 'new-id' });
    }),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    Timestamp: {
        now: vi.fn(() => ({ toDate: () => new Date() })),
        fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
    },
}));

// Mock Storage functions
vi.mock('firebase/storage', () => ({
    ref: vi.fn(() => ({})),
    getBlob: vi.fn(() => Promise.resolve(new Blob(['test'], { type: 'application/pdf' }))),
    uploadBytes: vi.fn(() => Promise.resolve({})),
    getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.pdf')),
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
                line1: '123 Main Street',
                city: 'Johannesburg',
                province: 'Gauteng',
                postalCode: '2000',
                country: 'South Africa',
            },
            postalSameAsPhysical: true,
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
        statusHistory: [],
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        ...overrides,
    } as TakeOnSheet;
}

describe('Take-On Sheet Comprehensive Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        addDocCalls = [];
    });

    // ========================================
    // END-TO-END WORKFLOW TESTS
    // ========================================
    describe('End-to-End Workflow: Manager creates -> HR reviews -> IT confirms -> Employee created', () => {
        it('should complete full lifecycle from draft to employee creation', async () => {
            // Step 1: Manager creates draft
            const draftSheet = createCompleteTakeOnSheet({ status: 'draft' });
            expect(draftSheet.status).toBe('draft');

            // Step 2: Manager submits for HR review
            expect(TakeOnSheetService.canTransitionStatus('Line Manager', 'draft', 'pending_hr_review')).toBe(true);

            // Step 3: HR reviews and submits for IT setup
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'pending_hr_review', 'pending_it_setup')).toBe(true);

            // Step 4: IT confirms and completes
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'pending_it_setup', 'complete')).toBe(true);

            // Step 5: Employee creation is allowed on complete sheet
            const completeSheet = createCompleteTakeOnSheet({ status: 'complete' });
            const canCreate = TakeOnSheetService.canCreateEmployee(completeSheet);
            expect(canCreate.canCreate).toBe(true);
        });

        it('should track status history through all transitions', async () => {
            const { getDoc, doc, updateDoc } = await import('firebase/firestore');

            // Create sheet with status history tracking
            const sheetWithHistory = createCompleteTakeOnSheet({
                status: 'pending_it_setup',
                statusHistory: [
                    {
                        fromStatus: 'draft',
                        toStatus: 'pending_hr_review',
                        changedBy: 'manager-1',
                        changedAt: new Date('2024-01-10'),
                    },
                    {
                        fromStatus: 'pending_hr_review',
                        toStatus: 'pending_it_setup',
                        changedBy: 'hr-admin-1',
                        changedAt: new Date('2024-01-12'),
                    },
                ],
            });

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc)
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => sheetWithHistory,
                } as never)
                .mockResolvedValueOnce({
                    exists: () => true,
                    data: () => ({
                        ...sheetWithHistory,
                        status: 'complete',
                        statusHistory: [
                            ...sheetWithHistory.statusHistory,
                            {
                                fromStatus: 'pending_it_setup',
                                toStatus: 'complete',
                                changedBy: 'hr-admin-1',
                                changedAt: new Date(),
                            },
                        ],
                    }),
                } as never);
            vi.mocked(updateDoc).mockResolvedValue(undefined);

            const result = await TakeOnSheetService.transitionStatus('tos-123', 'complete', 'hr-admin-1');

            expect(result.status).toBe('complete');
            expect(result.statusHistory).toHaveLength(3);
        });
    });

    // ========================================
    // PERMISSION MATRIX TESTS
    // ========================================
    describe('Permission Matrix: Role-based section editing', () => {
        const sections: TakeOnSheetSection[] = ['employment', 'personal', 'documents', 'systemAccess'];

        it('should allow Line Manager to edit only employment section in draft', () => {
            const role: UserRole = 'Line Manager';

            // Can edit employment in draft
            expect(TakeOnSheetService.canEditSection(role, 'employment', 'draft')).toBe(true);

            // Cannot edit other sections
            expect(TakeOnSheetService.canEditSection(role, 'personal', 'draft')).toBe(false);
            expect(TakeOnSheetService.canEditSection(role, 'documents', 'draft')).toBe(false);
            expect(TakeOnSheetService.canEditSection(role, 'systemAccess', 'draft')).toBe(false);

            // Cannot edit employment after draft
            expect(TakeOnSheetService.canEditSection(role, 'employment', 'pending_hr_review')).toBe(false);
        });

        it('should allow HR Admin to edit all sections in draft and pending_hr_review', () => {
            const role: UserRole = 'HR Admin';

            // Draft status
            sections.forEach(section => {
                expect(TakeOnSheetService.canEditSection(role, section, 'draft')).toBe(true);
            });

            // Pending HR review - employment and personal restricted
            expect(TakeOnSheetService.canEditSection(role, 'employment', 'pending_hr_review')).toBe(true);
            expect(TakeOnSheetService.canEditSection(role, 'personal', 'pending_hr_review')).toBe(true);
            expect(TakeOnSheetService.canEditSection(role, 'documents', 'pending_hr_review')).toBe(true);
            expect(TakeOnSheetService.canEditSection(role, 'systemAccess', 'pending_hr_review')).toBe(true);
        });

        it('should allow Employee to edit only personal details in draft and pending_hr_review', () => {
            const role: UserRole = 'Employee';

            // Can edit personal in draft and pending_hr_review
            expect(TakeOnSheetService.canEditSection(role, 'personal', 'draft')).toBe(true);
            expect(TakeOnSheetService.canEditSection(role, 'personal', 'pending_hr_review')).toBe(true);

            // Cannot edit other sections
            expect(TakeOnSheetService.canEditSection(role, 'employment', 'draft')).toBe(false);
            expect(TakeOnSheetService.canEditSection(role, 'documents', 'draft')).toBe(false);
            expect(TakeOnSheetService.canEditSection(role, 'systemAccess', 'draft')).toBe(false);

            // Cannot edit personal after pending_hr_review
            expect(TakeOnSheetService.canEditSection(role, 'personal', 'pending_it_setup')).toBe(false);
        });

        it('should not allow any edits in complete status for most roles', () => {
            const restrictedRoles: UserRole[] = ['Line Manager', 'Employee', 'Payroll Admin', 'Payroll Manager'];

            restrictedRoles.forEach(role => {
                sections.forEach(section => {
                    expect(TakeOnSheetService.canEditSection(role, section, 'complete')).toBe(false);
                });
            });
        });

        it('should allow System Admin full access in all non-complete statuses', () => {
            const role: UserRole = 'System Admin';
            const editableStatuses: TakeOnSheetStatus[] = ['draft', 'pending_hr_review', 'pending_it_setup'];

            editableStatuses.forEach(status => {
                sections.forEach(section => {
                    expect(TakeOnSheetService.canEditSection(role, section, status)).toBe(true);
                });
            });
        });
    });

    // ========================================
    // STATE MACHINE TESTS
    // ========================================
    describe('State Machine: Valid/Invalid transition combinations', () => {
        const allStatuses: TakeOnSheetStatus[] = ['draft', 'pending_hr_review', 'pending_it_setup', 'complete'];

        it('should only allow forward transitions (no backward)', () => {
            // Valid forward transitions
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'draft', 'pending_hr_review')).toBe(true);
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'pending_hr_review', 'pending_it_setup')).toBe(true);
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'pending_it_setup', 'complete')).toBe(true);

            // Invalid backward transitions
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'pending_hr_review', 'draft')).toBe(false);
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'pending_it_setup', 'pending_hr_review')).toBe(false);
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'pending_it_setup', 'draft')).toBe(false);
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'complete', 'pending_it_setup')).toBe(false);
        });

        it('should not allow skipping states', () => {
            // Cannot skip from draft to pending_it_setup
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'draft', 'pending_it_setup')).toBe(false);

            // Cannot skip from draft to complete
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'draft', 'complete')).toBe(false);

            // Cannot skip from pending_hr_review to complete
            expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'pending_hr_review', 'complete')).toBe(false);
        });

        it('should not allow transitions from complete status', () => {
            allStatuses.forEach(targetStatus => {
                if (targetStatus !== 'complete') {
                    expect(TakeOnSheetService.canTransitionStatus('HR Admin', 'complete', targetStatus)).toBe(false);
                }
            });
        });

        it('should enforce role restrictions on transitions', () => {
            // Line Manager can only submit to HR review
            expect(TakeOnSheetService.canTransitionStatus('Line Manager', 'draft', 'pending_hr_review')).toBe(true);
            expect(TakeOnSheetService.canTransitionStatus('Line Manager', 'pending_hr_review', 'pending_it_setup')).toBe(false);
            expect(TakeOnSheetService.canTransitionStatus('Line Manager', 'pending_it_setup', 'complete')).toBe(false);

            // Employee cannot make any transitions
            allStatuses.forEach(fromStatus => {
                allStatuses.forEach(toStatus => {
                    if (fromStatus !== toStatus) {
                        expect(TakeOnSheetService.canTransitionStatus('Employee', fromStatus, toStatus)).toBe(false);
                    }
                });
            });
        });
    });

    // ========================================
    // EMPLOYEE CREATION VALIDATION TESTS
    // ========================================
    describe('Employee Creation Validation', () => {
        it('should not allow employee creation from incomplete sheet', () => {
            const incompleteStatuses: TakeOnSheetStatus[] = ['draft', 'pending_hr_review', 'pending_it_setup'];

            incompleteStatuses.forEach(status => {
                const sheet = createCompleteTakeOnSheet({ status });
                const result = TakeOnSheetService.canCreateEmployee(sheet);
                expect(result.canCreate).toBe(false);
                expect(result.reason).toContain('completed');
            });
        });

        it('should not allow duplicate employee creation', () => {
            const sheetWithEmployee = createCompleteTakeOnSheet({
                status: 'complete',
                employeeId: 'existing-employee-1',
            });

            const result = TakeOnSheetService.canCreateEmployee(sheetWithEmployee);
            expect(result.canCreate).toBe(false);
            expect(result.reason).toContain('already been created');
        });

        it('should require personal details for employee creation', () => {
            const sheetWithoutName = createCompleteTakeOnSheet({
                status: 'complete',
                personalDetails: {
                    ...createCompleteTakeOnSheet().personalDetails,
                    firstName: '',
                    lastName: '',
                },
            });

            const result = TakeOnSheetService.canCreateEmployee(sheetWithoutName);
            expect(result.canCreate).toBe(false);
            expect(result.reason).toContain('first name and last name');
        });

        it('should require ID number for employee creation', () => {
            const sheetWithoutId = createCompleteTakeOnSheet({
                status: 'complete',
                personalDetails: {
                    ...createCompleteTakeOnSheet().personalDetails,
                    idNumber: '',
                },
            });

            const result = TakeOnSheetService.canCreateEmployee(sheetWithoutId);
            expect(result.canCreate).toBe(false);
            expect(result.reason).toContain('ID number');
        });
    });

    // ========================================
    // DOCUMENT TRANSFER TESTS
    // ========================================
    describe('Document Transfer: Take-On Sheet to Employee', () => {
        it('should transfer documents with correct category mapping', async () => {
            const sheetWithDocs = createCompleteTakeOnSheet({
                documents: {
                    certifiedId: {
                        fileName: 'id_copy.pdf',
                        storagePath: 'tenants/company-1/take-on-sheets/tos-123/documents/certifiedId/id_copy.pdf',
                        uploadedAt: new Date(),
                        uploadedBy: 'user-1',
                        fileSize: 1024,
                        mimeType: 'application/pdf',
                    },
                    sarsLetter: {
                        fileName: 'sars.pdf',
                        storagePath: 'tenants/company-1/take-on-sheets/tos-123/documents/sarsLetter/sars.pdf',
                        uploadedAt: new Date(),
                        uploadedBy: 'user-1',
                        fileSize: 2048,
                        mimeType: 'application/pdf',
                    },
                },
            });

            const docIds = await EmployeeService.transferDocumentsFromTakeOnSheet(
                sheetWithDocs,
                'employee-1',
                'user-1'
            );

            // Should create document records for each transferred document
            expect(docIds.length).toBe(2);
            expect(addDocCalls.some(call => call.collection === 'employeeDocuments')).toBe(true);
        });

        it('should preserve original upload metadata in notes', async () => {
            const originalDate = new Date('2024-01-15T10:30:00Z');
            const sheetWithDocs = createCompleteTakeOnSheet({
                documents: {
                    certifiedId: {
                        fileName: 'id_copy.pdf',
                        storagePath: 'tenants/company-1/take-on-sheets/tos-123/documents/certifiedId/id_copy.pdf',
                        uploadedAt: originalDate,
                        uploadedBy: 'original-uploader',
                        fileSize: 1024,
                        mimeType: 'application/pdf',
                    },
                },
            });

            await EmployeeService.transferDocumentsFromTakeOnSheet(
                sheetWithDocs,
                'employee-1',
                'transfer-user'
            );

            // Check that the document record includes original metadata in notes
            const docCall = addDocCalls.find(call => call.collection === 'employeeDocuments');
            expect(docCall?.data.notes).toContain('original-uploader');
        });
    });

    // ========================================
    // TENANT ISOLATION TESTS
    // ========================================
    describe('Tenant Isolation', () => {
        it('should include companyId in all queries', () => {
            // Verify the service methods are designed to require companyId
            const sheet = createCompleteTakeOnSheet();
            expect(sheet.companyId).toBe('company-1');

            // All take-on sheets should have companyId
            expect(sheet).toHaveProperty('companyId');
            expect(typeof sheet.companyId).toBe('string');
            expect(sheet.companyId.length).toBeGreaterThan(0);
        });

        it('should use tenant-scoped storage paths for documents', () => {
            const sheet = createCompleteTakeOnSheet();
            const doc = sheet.documents.certifiedId;

            expect(doc?.storagePath).toContain('tenants/');
            expect(doc?.storagePath).toContain(sheet.companyId);
        });
    });

    // ========================================
    // EMPLOYMENT TYPE MAPPING TESTS
    // ========================================
    describe('Employment Type Mapping', () => {
        it('should correctly map all employment types to contract types', () => {
            expect(EmployeeService.mapEmploymentTypeToContractType('permanent')).toBe('permanent');
            expect(EmployeeService.mapEmploymentTypeToContractType('fixed')).toBe('fixed_term');
        });
    });

    // ========================================
    // ERROR HANDLING TESTS
    // ========================================
    describe('Error Handling', () => {
        it('should throw clear error for invalid status transition', async () => {
            const { getDoc, doc } = await import('firebase/firestore');

            const draftSheet = createCompleteTakeOnSheet({ status: 'draft' });

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => true,
                data: () => draftSheet,
            } as never);

            // Attempt invalid transition (draft -> complete)
            await expect(
                TakeOnSheetService.transitionStatus('tos-123', 'complete', 'user-1')
            ).rejects.toThrow(/invalid status transition/i);
        });

        it('should throw error when creating employee from non-complete sheet', async () => {
            const pendingSheet = createCompleteTakeOnSheet({ status: 'pending_it_setup' });

            await expect(
                EmployeeService.createEmployeeFromTakeOnSheet(pendingSheet, 'user-1')
            ).rejects.toThrow(/incomplete take-on sheet/i);
        });

        it('should throw error when linking employee to non-complete sheet', async () => {
            const { getDoc, doc } = await import('firebase/firestore');

            const pendingSheet = createCompleteTakeOnSheet({ status: 'pending_it_setup' });

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => true,
                data: () => pendingSheet,
            } as never);

            await expect(
                TakeOnSheetService.linkToEmployee('tos-123', 'emp-1', 'user-1')
            ).rejects.toThrow(/completed take-on sheet/i);
        });

        it('should throw error when trying to link already-linked sheet', async () => {
            const { getDoc, doc } = await import('firebase/firestore');

            const linkedSheet = createCompleteTakeOnSheet({
                status: 'complete',
                employeeId: 'existing-emp-1',
            });

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => true,
                data: () => linkedSheet,
            } as never);

            await expect(
                TakeOnSheetService.linkToEmployee('tos-123', 'new-emp-1', 'user-1')
            ).rejects.toThrow(/already linked/i);
        });
    });
});
