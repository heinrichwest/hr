// ============================================================
// TAKE-ON SHEET DOCUMENT SERVICE
// Service for managing document uploads for take-on sheets
// ============================================================

import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    type UploadTaskSnapshot,
} from 'firebase/storage';
import type {
    TakeOnSheet,
    TakeOnDocument,
    TakeOnDocumentType,
} from '../types/takeOnSheet';

/** Firestore collection name for take-on sheets */
const COLLECTION_NAME = 'takeOnSheets';

/** Maximum file size in bytes (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types */
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
];

/** Progress callback type */
export type UploadProgressCallback = (progress: number) => void;

export const TakeOnSheetDocumentService = {
    /**
     * Validate file type
     * @param file - The file to validate
     * @throws Error if file type is invalid
     */
    validateFileType(file: File): void {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            throw new Error(
                `Invalid file type: ${file.type}. Allowed types: PDF, JPEG, PNG`
            );
        }
    },

    /**
     * Validate file size
     * @param file - The file to validate
     * @throws Error if file is too large
     */
    validateFileSize(file: File): void {
        if (file.size > MAX_FILE_SIZE) {
            const maxMB = MAX_FILE_SIZE / (1024 * 1024);
            const fileMB = (file.size / (1024 * 1024)).toFixed(2);
            throw new Error(
                `File size exceeds maximum limit of ${maxMB}MB. Your file is ${fileMB}MB.`
            );
        }
    },

    /**
     * Get the storage path for a document
     * @param companyId - The company/tenant ID
     * @param sheetId - The take-on sheet ID
     * @param documentType - The type of document
     * @param fileName - The file name
     * @returns The storage path
     */
    getStoragePath(
        companyId: string,
        sheetId: string,
        documentType: TakeOnDocumentType,
        fileName: string
    ): string {
        return `tenants/${companyId}/take-on-sheets/${sheetId}/documents/${documentType}/${fileName}`;
    },

    /**
     * Upload a document for a take-on sheet
     * @param sheetId - The take-on sheet ID
     * @param companyId - The company ID for tenant-scoped path
     * @param documentType - The type of document being uploaded
     * @param file - The file to upload
     * @param userId - The user performing the upload
     * @param onProgress - Optional progress callback
     * @returns The uploaded document metadata
     */
    async uploadTakeOnDocument(
        sheetId: string,
        companyId: string,
        documentType: TakeOnDocumentType,
        file: File,
        userId: string,
        onProgress?: UploadProgressCallback
    ): Promise<TakeOnDocument> {
        // Validate file
        this.validateFileType(file);
        this.validateFileSize(file);

        // Verify sheet exists
        const docRef = doc(db, COLLECTION_NAME, sheetId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Take-on sheet not found.');
        }

        // Generate storage path
        const storagePath = this.getStoragePath(companyId, sheetId, documentType, file.name);
        const storageRef = ref(storage, storagePath);

        // Upload file with progress tracking
        return new Promise((resolve, reject) => {
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot: UploadTaskSnapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    reject(new Error(`Upload failed: ${error.message}`));
                },
                async () => {
                    try {
                        // Get download URL
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

                        // Create document metadata
                        const documentData: TakeOnDocument = {
                            fileName: file.name,
                            storagePath: storagePath,
                            uploadedAt: new Date(),
                            uploadedBy: userId,
                            fileSize: file.size,
                            mimeType: file.type,
                            downloadUrl: downloadUrl,
                        };

                        // Update Firestore document
                        const sheet = docSnap.data() as TakeOnSheet;
                        const updatedDocuments = {
                            ...sheet.documents,
                            [documentType]: documentData,
                        };

                        await updateDoc(docRef, {
                            documents: updatedDocuments,
                            updatedAt: serverTimestamp(),
                            updatedBy: userId,
                        });

                        resolve(documentData);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    },

    /**
     * Delete a document from a take-on sheet
     * @param sheetId - The take-on sheet ID
     * @param documentType - The type of document to delete
     */
    async deleteTakeOnDocument(
        sheetId: string,
        documentType: TakeOnDocumentType
    ): Promise<void> {
        // Get the sheet
        const docRef = doc(db, COLLECTION_NAME, sheetId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Take-on sheet not found.');
        }

        const sheet = docSnap.data() as TakeOnSheet;
        const documentData = sheet.documents[documentType];

        if (!documentData) {
            throw new Error(`Document type '${documentType}' not found on this sheet.`);
        }

        // Delete from storage
        const storageRef = ref(storage, documentData.storagePath);
        await deleteObject(storageRef);

        // Remove from Firestore
        const updatedDocuments = { ...sheet.documents };
        delete updatedDocuments[documentType];

        await updateDoc(docRef, {
            documents: updatedDocuments,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Get download URL for a document
     * @param storagePath - The storage path of the document
     * @returns The download URL
     */
    async getDocumentDownloadUrl(storagePath: string): Promise<string> {
        const storageRef = ref(storage, storagePath);
        return getDownloadURL(storageRef);
    },

    /**
     * Check if all required documents are uploaded
     * @param sheetId - The take-on sheet ID
     * @returns Object with missing documents and completeness status
     */
    async checkDocumentCompleteness(
        sheetId: string
    ): Promise<{ isComplete: boolean; missing: TakeOnDocumentType[] }> {
        const docRef = doc(db, COLLECTION_NAME, sheetId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Take-on sheet not found.');
        }

        const sheet = docSnap.data() as TakeOnSheet;
        const requiredDocuments: TakeOnDocumentType[] = [
            'sarsLetter',
            'bankProof',
            'certifiedId',
            'signedContract',
            'cvQualifications',
            'marisit',
            'eaa1Form',
        ];

        const missing = requiredDocuments.filter(
            (docType) => !sheet.documents[docType]
        );

        return {
            isComplete: missing.length === 0,
            missing,
        };
    },
};
