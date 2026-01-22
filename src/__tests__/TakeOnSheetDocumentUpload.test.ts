// ============================================================
// TAKE-ON SHEET DOCUMENT UPLOAD TESTS
// Tests for document upload and validation functionality
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TakeOnSheetDocumentService } from '../services/takeOnSheetDocumentService';

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
    storage: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => ({ id: 'mock-doc-id' })),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
}));

// Mock Storage functions
vi.mock('firebase/storage', () => ({
    ref: vi.fn(() => ({})),
    uploadBytesResumable: vi.fn(() => ({
        on: vi.fn((_event, _progress, _error, complete) => {
            // Simulate successful upload
            complete();
        }),
        snapshot: { ref: {} },
    })),
    getDownloadURL: vi.fn(() => Promise.resolve('https://storage.example.com/file.pdf')),
    deleteObject: vi.fn(() => Promise.resolve()),
}));

// Helper to create mock File with specified size
const createMockFile = (
    name: string,
    size: number,
    type: string
): File => {
    // Create content with the desired size
    const content = new ArrayBuffer(size);
    const blob = new Blob([content], { type });
    const file = new File([blob], name, { type });
    // Override the size property since Blob may not respect it in jsdom
    Object.defineProperty(file, 'size', { value: size });
    return file;
};

describe('TakeOnSheetDocumentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadTakeOnDocument', () => {
        it('should upload file to correct storage path', async () => {
            const { ref } = await import('firebase/storage');
            const { getDoc, updateDoc, doc } = await import('firebase/firestore');

            // Mock existing sheet
            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'sheet-123',
                    companyId: 'company-456',
                    documents: {},
                }),
            } as never);
            vi.mocked(updateDoc).mockResolvedValue(undefined);

            const file = createMockFile('id_copy.pdf', 1024, 'application/pdf');

            await TakeOnSheetDocumentService.uploadTakeOnDocument(
                'sheet-123',
                'company-456',
                'certifiedId',
                file,
                'user-789'
            );

            // Verify storage path includes tenant and sheet ID
            expect(ref).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringContaining('tenants/company-456/take-on-sheets/sheet-123/documents/certifiedId')
            );
        });

        it('should validate file type (PDF, JPG, PNG only)', async () => {
            const { getDoc, doc } = await import('firebase/firestore');

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'sheet-123',
                    companyId: 'company-456',
                    documents: {},
                }),
            } as never);

            // Invalid file type (text file)
            const invalidFile = createMockFile('document.txt', 1024, 'text/plain');

            await expect(
                TakeOnSheetDocumentService.uploadTakeOnDocument(
                    'sheet-123',
                    'company-456',
                    'certifiedId',
                    invalidFile,
                    'user-789'
                )
            ).rejects.toThrow('Invalid file type');

            // Valid PDF
            const validPdf = createMockFile('document.pdf', 1024, 'application/pdf');
            await expect(
                TakeOnSheetDocumentService.uploadTakeOnDocument(
                    'sheet-123',
                    'company-456',
                    'certifiedId',
                    validPdf,
                    'user-789'
                )
            ).resolves.toBeDefined();
        });

        it('should validate file size (max 10MB)', async () => {
            const { getDoc, doc } = await import('firebase/firestore');

            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'sheet-123',
                    companyId: 'company-456',
                    documents: {},
                }),
            } as never);

            // File larger than 10MB (11MB)
            const largeFile = createMockFile('large.pdf', 11 * 1024 * 1024, 'application/pdf');

            await expect(
                TakeOnSheetDocumentService.uploadTakeOnDocument(
                    'sheet-123',
                    'company-456',
                    'certifiedId',
                    largeFile,
                    'user-789'
                )
            ).rejects.toThrow('File size exceeds');

            // File within limit (5MB)
            const validFile = createMockFile('valid.pdf', 5 * 1024 * 1024, 'application/pdf');
            await expect(
                TakeOnSheetDocumentService.uploadTakeOnDocument(
                    'sheet-123',
                    'company-456',
                    'certifiedId',
                    validFile,
                    'user-789'
                )
            ).resolves.toBeDefined();
        });
    });

    describe('deleteTakeOnDocument', () => {
        it('should remove file from storage', async () => {
            const { deleteObject } = await import('firebase/storage');
            const { getDoc, updateDoc, doc } = await import('firebase/firestore');

            // Mock existing sheet with document
            vi.mocked(doc).mockReturnValue({} as never);
            vi.mocked(getDoc).mockResolvedValue({
                exists: () => true,
                data: () => ({
                    id: 'sheet-123',
                    companyId: 'company-456',
                    documents: {
                        certifiedId: {
                            fileName: 'id_copy.pdf',
                            storagePath: 'tenants/company-456/take-on-sheets/sheet-123/documents/certifiedId/id_copy.pdf',
                            uploadedAt: new Date(),
                            uploadedBy: 'user-123',
                            fileSize: 1024,
                            mimeType: 'application/pdf',
                        },
                    },
                }),
            } as never);
            vi.mocked(updateDoc).mockResolvedValue(undefined);
            vi.mocked(deleteObject).mockResolvedValue(undefined);

            await TakeOnSheetDocumentService.deleteTakeOnDocument(
                'sheet-123',
                'certifiedId'
            );

            expect(deleteObject).toHaveBeenCalled();
            expect(updateDoc).toHaveBeenCalled();
        });
    });
});
