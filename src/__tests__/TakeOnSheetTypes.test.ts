// ============================================================
// TAKE-ON SHEET TYPE TESTS
// Tests for TypeScript type validation
// ============================================================

import { describe, it, expect } from 'vitest';
import type {
    TakeOnSheetStatus,
    TakeOnDocument,
    SystemAccess,
    StatusChange,
} from '../types/takeOnSheet';

describe('TakeOnSheet Types', () => {
    describe('TakeOnSheetStatus', () => {
        it('should have correct status values: draft, pending_hr_review, pending_it_setup, complete', () => {
            // Type-safe status values
            const validStatuses: TakeOnSheetStatus[] = [
                'draft',
                'pending_hr_review',
                'pending_it_setup',
                'complete',
            ];

            expect(validStatuses).toHaveLength(4);
            expect(validStatuses).toContain('draft');
            expect(validStatuses).toContain('pending_hr_review');
            expect(validStatuses).toContain('pending_it_setup');
            expect(validStatuses).toContain('complete');
        });
    });

    describe('SystemAccess', () => {
        it('should have all 10 boolean fields for system access options', () => {
            const systemAccess: SystemAccess = {
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

            // Verify all 10 fields exist
            expect(typeof systemAccess.ess).toBe('boolean');
            expect(typeof systemAccess.mss).toBe('boolean');
            expect(typeof systemAccess.zoho).toBe('boolean');
            expect(typeof systemAccess.lms).toBe('boolean');
            expect(typeof systemAccess.sophos).toBe('boolean');
            expect(typeof systemAccess.msOffice).toBe('boolean');
            expect(typeof systemAccess.bizvoip).toBe('boolean');
            expect(typeof systemAccess.email).toBe('boolean');
            expect(typeof systemAccess.teams).toBe('boolean');
            expect(typeof systemAccess.mimecast).toBe('boolean');

            // Count the fields
            const fieldCount = Object.keys(systemAccess).length;
            expect(fieldCount).toBe(10);
        });
    });

    describe('TakeOnDocument', () => {
        it('should have required metadata fields', () => {
            const document: TakeOnDocument = {
                fileName: 'id_copy.pdf',
                storagePath: '/tenants/company1/take-on-sheets/sheet1/documents/certifiedId',
                uploadedAt: new Date(),
                uploadedBy: 'user123',
                fileSize: 1024000,
                mimeType: 'application/pdf',
            };

            expect(document.fileName).toBe('id_copy.pdf');
            expect(document.storagePath).toContain('take-on-sheets');
            expect(document.uploadedAt).toBeInstanceOf(Date);
            expect(document.uploadedBy).toBe('user123');
            expect(document.fileSize).toBe(1024000);
            expect(document.mimeType).toBe('application/pdf');

            // Verify all required fields exist
            const requiredFields = ['fileName', 'storagePath', 'uploadedAt', 'uploadedBy', 'fileSize', 'mimeType'];
            requiredFields.forEach(field => {
                expect(document).toHaveProperty(field);
            });
        });
    });

    describe('StatusChange', () => {
        it('should have correct structure for audit trail', () => {
            const statusChange: StatusChange = {
                fromStatus: 'draft',
                toStatus: 'pending_hr_review',
                changedBy: 'manager123',
                changedAt: new Date(),
                notes: 'Submitted for HR review',
            };

            expect(statusChange.fromStatus).toBe('draft');
            expect(statusChange.toStatus).toBe('pending_hr_review');
            expect(statusChange.changedBy).toBe('manager123');
            expect(statusChange.changedAt).toBeInstanceOf(Date);
            expect(statusChange.notes).toBe('Submitted for HR review');

            // Verify structure fields
            expect(statusChange).toHaveProperty('fromStatus');
            expect(statusChange).toHaveProperty('toStatus');
            expect(statusChange).toHaveProperty('changedBy');
            expect(statusChange).toHaveProperty('changedAt');

            // Notes is optional, so verify it can be undefined
            const statusChangeWithoutNotes: StatusChange = {
                fromStatus: 'pending_hr_review',
                toStatus: 'pending_it_setup',
                changedBy: 'hr_admin',
                changedAt: new Date(),
            };
            expect(statusChangeWithoutNotes.notes).toBeUndefined();
        });
    });
});
