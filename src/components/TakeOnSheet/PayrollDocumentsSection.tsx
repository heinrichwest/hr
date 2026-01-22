// ============================================================
// PAYROLL DOCUMENTS SECTION
// Form section for document uploads in take-on sheet
// ============================================================

import { FileUpload } from '../FileUpload/FileUpload';
import type { TakeOnDocument, TakeOnDocumentType } from '../../types/takeOnSheet';
import './TakeOnSheetSections.css';

interface PayrollDocumentsSectionProps {
    documents: Partial<Record<TakeOnDocumentType, TakeOnDocument>>;
    onUpload: (documentType: TakeOnDocumentType, file: File) => void;
    onDelete: (documentType: TakeOnDocumentType) => void;
    isEditable: boolean;
    uploadProgress?: Partial<Record<TakeOnDocumentType, number>>;
    uploadErrors?: Partial<Record<TakeOnDocumentType, string>>;
}

const DOCUMENT_TYPES: { type: TakeOnDocumentType; label: string; description: string }[] = [
    {
        type: 'sarsLetter',
        label: 'SARS Letter',
        description: 'Tax registration letter from SARS',
    },
    {
        type: 'bankProof',
        label: 'Proof of Bank Account',
        description: 'Bank statement or letter confirming account details',
    },
    {
        type: 'certifiedId',
        label: 'Certified ID Copy',
        description: 'Certified copy of South African ID document',
    },
    {
        type: 'signedContract',
        label: 'Signed Contract',
        description: 'Signed employment contract',
    },
    {
        type: 'cvQualifications',
        label: 'CV and Qualifications',
        description: 'Curriculum vitae and copies of qualifications',
    },
    {
        type: 'marisit',
        label: 'MARISIT',
        description: 'Medical Aid Risk Incapacity and Standard IT certificate',
    },
    {
        type: 'eaa1Form',
        label: 'EAA1 Form',
        description: 'Employment Equity Act form',
    },
];

export function PayrollDocumentsSection({
    documents,
    onUpload,
    onDelete,
    isEditable,
    uploadProgress = {},
    uploadErrors = {},
}: PayrollDocumentsSectionProps) {
    const getDocumentStatus = (type: TakeOnDocumentType): 'uploaded' | 'pending' => {
        return documents[type] ? 'uploaded' : 'pending';
    };

    const uploadedCount = Object.keys(documents).length;
    const totalCount = DOCUMENT_TYPES.length;

    return (
        <div className="tos-section">
            <div className="tos-section__header">
                <h3 className="tos-section__title">Payroll / HR Documents</h3>
                <span className="tos-section__progress">
                    {uploadedCount} of {totalCount} uploaded
                </span>
            </div>

            <p className="tos-section__description">
                Please upload the following documents. All documents should be in PDF, JPEG, or PNG format (max 10MB each).
            </p>

            <div className="tos-documents-grid">
                {DOCUMENT_TYPES.map(({ type, label, description }) => {
                    const status = getDocumentStatus(type);
                    const existingDoc = documents[type];
                    const progress = uploadProgress[type];
                    const error = uploadErrors[type];

                    return (
                        <div
                            key={type}
                            className={`tos-document-item ${status === 'uploaded' ? 'tos-document-item--uploaded' : ''}`}
                        >
                            <div className="tos-document-item__header">
                                <div className="tos-document-item__info">
                                    <span className="tos-document-item__label">{label}</span>
                                    <span className="tos-document-item__description">{description}</span>
                                </div>
                                <span className={`tos-document-item__status tos-document-item__status--${status}`}>
                                    {status === 'uploaded' ? (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20,6 9,17 4,12" />
                                            </svg>
                                            Uploaded
                                        </>
                                    ) : (
                                        'Pending'
                                    )}
                                </span>
                            </div>
                            <div className="tos-document-item__upload">
                                <FileUpload
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    maxSize={10 * 1024 * 1024}
                                    onUpload={(file) => onUpload(type, file)}
                                    onDelete={() => onDelete(type)}
                                    value={existingDoc}
                                    progress={progress}
                                    error={error}
                                    disabled={!isEditable}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isEditable && (
                <p className="tos-section__readonly-notice">
                    Document uploads are managed by HR. Contact your HR representative for updates.
                </p>
            )}
        </div>
    );
}
