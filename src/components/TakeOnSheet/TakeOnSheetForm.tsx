// ============================================================
// TAKE-ON SHEET FORM CONTAINER
// Main form component for creating/editing take-on sheets
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { EmploymentInfoSection } from './EmploymentInfoSection';
import { PersonalDetailsSection } from './PersonalDetailsSection';
import { PayrollDocumentsSection } from './PayrollDocumentsSection';
import { SystemAccessSection } from './SystemAccessSection';
import { StatusWorkflowIndicator } from './StatusWorkflowIndicator';
import { Button } from '../Button/Button';
import { TakeOnSheetService } from '../../services/takeOnSheetService';
import { TakeOnSheetDocumentService } from '../../services/takeOnSheetDocumentService';
import type {
    TakeOnSheet,
    TakeOnSheetStatus,
    EmploymentInfo,
    PersonalDetails,
    SystemAccess,
    TakeOnDocumentType,
    TakeOnSheetSection,
} from '../../types/takeOnSheet';
import type { JobTitle, Department } from '../../types/company';
import type { UserRole } from '../../types/user';
import './TakeOnSheetForm.css';

interface EmployeeOption {
    id: string;
    firstName: string;
    lastName: string;
}

export interface TakeOnSheetFormProps {
    sheetId?: string;
    companyId?: string;
    userId?: string;
    userRole?: UserRole;
    jobTitles?: JobTitle[];
    departments?: Department[];
    employees?: EmployeeOption[];
    onSave?: (sheet: TakeOnSheet) => void;
    onCancel?: () => void;
    onTransition?: (sheet: TakeOnSheet) => void;
    /** @deprecated Use onSave instead */
    onSaveSuccess?: (sheet: TakeOnSheet) => void;
    /** @deprecated Loaded from sheetId */
    initialData?: TakeOnSheet;
}

type TabKey = 'employment' | 'personal' | 'documents' | 'systemAccess';

const TABS: { key: TabKey; label: string; section: TakeOnSheetSection }[] = [
    { key: 'employment', label: 'Employment Info', section: 'employment' },
    { key: 'personal', label: 'Personal Details', section: 'personal' },
    { key: 'documents', label: 'Payroll Documents', section: 'documents' },
    { key: 'systemAccess', label: 'System Access', section: 'systemAccess' },
];

const VALID_TRANSITIONS: Record<TakeOnSheetStatus, TakeOnSheetStatus[]> = {
    draft: ['pending_hr_review'],
    pending_hr_review: ['pending_it_setup'],
    pending_it_setup: ['complete'],
    complete: [],
};

const STATUS_TRANSITION_LABELS: Record<TakeOnSheetStatus, string> = {
    draft: 'Submit for HR Review',
    pending_hr_review: 'Submit for IT Setup',
    pending_it_setup: 'Mark as Complete',
    complete: '',
};

export function TakeOnSheetForm({
    sheetId,
    companyId = '',
    userId = '',
    userRole = 'Employee',
    jobTitles = [],
    departments = [],
    employees = [],
    onSave,
    onCancel,
    onTransition,
    onSaveSuccess,
    initialData,
}: TakeOnSheetFormProps) {
    const [sheet, setSheet] = useState<TakeOnSheet | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('employment');
    const [loading, setLoading] = useState(!!sheetId);
    const [saving, setSaving] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showValidation, _setShowValidation] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Partial<Record<TakeOnDocumentType, number>>>({});
    const [uploadErrors, setUploadErrors] = useState<Partial<Record<TakeOnDocumentType, string>>>({});

    // Load existing sheet
    useEffect(() => {
        if (initialData) {
            setSheet(initialData);
            setLoading(false);
        } else if (sheetId) {
            loadSheet();
        }
    }, [sheetId, initialData]);

    const loadSheet = async () => {
        try {
            setLoading(true);
            setError(null);
            const loadedSheet = await TakeOnSheetService.getTakeOnSheetById(sheetId!);
            if (loadedSheet) {
                setSheet(loadedSheet);
            } else {
                setError('Take-on sheet not found.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load take-on sheet.');
        } finally {
            setLoading(false);
        }
    };

    // Check if user can edit a section
    const canEditSection = useCallback((section: TakeOnSheetSection): boolean => {
        if (!sheet) return userRole === 'Line Manager' || userRole === 'HR Admin' || userRole === 'HR Manager' || userRole === 'System Admin';
        return TakeOnSheetService.canEditSection(userRole, section, sheet.status);
    }, [sheet, userRole]);

    // Check if user can transition status
    const canTransition = useCallback((): boolean => {
        if (!sheet) return false;
        const nextStatuses = VALID_TRANSITIONS[sheet.status];
        if (nextStatuses.length === 0) return false;
        return TakeOnSheetService.canTransitionStatus(userRole, sheet.status, nextStatuses[0]);
    }, [sheet, userRole]);

    // Handle employment info changes
    const handleEmploymentChange = useCallback((data: Partial<EmploymentInfo>) => {
        setSheet(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                employmentInfo: { ...prev.employmentInfo, ...data },
            };
        });
        setIsDirty(true);
    }, []);

    // Handle personal details changes
    const handlePersonalChange = useCallback((data: Partial<PersonalDetails>) => {
        setSheet(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                personalDetails: { ...prev.personalDetails, ...data },
            };
        });
        setIsDirty(true);
    }, []);

    // Handle system access changes
    const handleSystemAccessChange = useCallback((data: Partial<SystemAccess>) => {
        setSheet(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                systemAccess: { ...prev.systemAccess, ...data },
            };
        });
        setIsDirty(true);
    }, []);

    // Handle document upload
    const handleDocumentUpload = useCallback(async (documentType: TakeOnDocumentType, file: File) => {
        if (!sheet) return;

        try {
            setUploadErrors(prev => ({ ...prev, [documentType]: undefined }));

            const document = await TakeOnSheetDocumentService.uploadTakeOnDocument(
                sheet.id,
                companyId,
                documentType,
                file,
                userId,
                (progress) => {
                    setUploadProgress(prev => ({ ...prev, [documentType]: progress }));
                }
            );

            setSheet(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    documents: { ...prev.documents, [documentType]: document },
                };
            });

            setUploadProgress(prev => ({ ...prev, [documentType]: undefined }));
        } catch (err) {
            setUploadErrors(prev => ({
                ...prev,
                [documentType]: err instanceof Error ? err.message : 'Upload failed',
            }));
            setUploadProgress(prev => ({ ...prev, [documentType]: undefined }));
        }
    }, [sheet, companyId, userId]);

    // Handle document delete
    const handleDocumentDelete = useCallback(async (documentType: TakeOnDocumentType) => {
        if (!sheet) return;

        try {
            await TakeOnSheetDocumentService.deleteTakeOnDocument(sheet.id, documentType);

            setSheet(prev => {
                if (!prev) return prev;
                const updatedDocs = { ...prev.documents };
                delete updatedDocs[documentType];
                return { ...prev, documents: updatedDocs };
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete document.');
        }
    }, [sheet]);

    // Save changes
    const handleSave = async () => {
        if (!sheet) return;

        try {
            setSaving(true);
            setError(null);

            const updatedSheet = await TakeOnSheetService.updateTakeOnSheet(sheet.id, {
                updatedBy: userId,
                employmentInfo: sheet.employmentInfo,
                personalDetails: sheet.personalDetails,
                systemAccess: sheet.systemAccess,
            });

            setSheet(updatedSheet);
            setIsDirty(false);
            onSave?.(updatedSheet);
            onSaveSuccess?.(updatedSheet);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    // Transition status
    const handleTransition = async () => {
        if (!sheet) return;

        const nextStatus = VALID_TRANSITIONS[sheet.status][0];
        if (!nextStatus) return;

        try {
            setTransitioning(true);
            setError(null);

            const updatedSheet = await TakeOnSheetService.transitionStatus(
                sheet.id,
                nextStatus,
                userId
            );

            setSheet(updatedSheet);
            onTransition?.(updatedSheet);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to transition status.');
        } finally {
            setTransitioning(false);
        }
    };

    if (loading) {
        return (
            <div className="tos-form tos-form--loading">
                <div className="tos-form__loader">Loading take-on sheet...</div>
            </div>
        );
    }

    if (error && !sheet) {
        return (
            <div className="tos-form tos-form--error">
                <div className="tos-form__error-message">{error}</div>
                <Button variant="secondary" onClick={onCancel}>Go Back</Button>
            </div>
        );
    }

    // For new sheet creation, create initial state
    const currentSheet = sheet || {
        id: '',
        companyId,
        status: 'draft' as TakeOnSheetStatus,
        employmentInfo: {
            employmentType: 'permanent' as const,
            isContract: false,
            jobTitleId: '',
            departmentId: '',
            salary: 0,
            currency: 'ZAR',
            dateOfEmployment: new Date(),
            reportsTo: '',
        },
        personalDetails: {
            title: 'Mr' as const,
            firstName: '',
            lastName: '',
            race: 'African' as const,
            physicalAddress: { line1: '', city: '', province: '', postalCode: '', country: 'South Africa' },
            postalAddress: { line1: '', city: '', province: '', postalCode: '', country: 'South Africa' },
            postalSameAsPhysical: true,
            idNumber: '',
            contactNumber: '',
            hasDisability: false,
            employeeAcknowledgement: false,
        },
        systemAccess: {
            ess: false, mss: false, zoho: false, lms: false, sophos: false,
            msOffice: false, bizvoip: false, email: false, teams: false, mimecast: false,
        },
        documents: {},
        statusHistory: [],
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: userId,
    };

    return (
        <div className="tos-form">
            <StatusWorkflowIndicator currentStatus={currentSheet.status} />

            {error && (
                <div className="tos-form__error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>&times;</button>
                </div>
            )}

            <div className="tos-form__tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`tos-form__tab ${activeTab === tab.key ? 'tos-form__tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                        {!canEditSection(tab.section) && (
                            <span className="tos-form__tab-badge">View Only</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="tos-form__content">
                {activeTab === 'employment' && (
                    <EmploymentInfoSection
                        data={currentSheet.employmentInfo}
                        onChange={handleEmploymentChange}
                        isEditable={canEditSection('employment')}
                        jobTitles={jobTitles}
                        departments={departments}
                        employees={employees}
                        showValidation={showValidation}
                    />
                )}

                {activeTab === 'personal' && (
                    <PersonalDetailsSection
                        data={currentSheet.personalDetails}
                        onChange={handlePersonalChange}
                        isEditable={canEditSection('personal')}
                        showValidation={showValidation}
                    />
                )}

                {activeTab === 'documents' && (
                    <PayrollDocumentsSection
                        documents={currentSheet.documents}
                        onUpload={handleDocumentUpload}
                        onDelete={handleDocumentDelete}
                        isEditable={canEditSection('documents')}
                        uploadProgress={uploadProgress}
                        uploadErrors={uploadErrors}
                    />
                )}

                {activeTab === 'systemAccess' && (
                    <SystemAccessSection
                        data={currentSheet.systemAccess}
                        onChange={handleSystemAccessChange}
                        isEditable={canEditSection('systemAccess')}
                    />
                )}
            </div>

            <div className="tos-form__actions">
                <div className="tos-form__actions-left">
                    {onCancel && (
                        <Button variant="ghost" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                </div>
                <div className="tos-form__actions-right">
                    {isDirty && (
                        <Button
                            variant="secondary"
                            onClick={handleSave}
                            loading={saving}
                            disabled={saving || transitioning}
                        >
                            Save Changes
                        </Button>
                    )}
                    {canTransition() && (
                        <Button
                            variant="primary"
                            onClick={handleTransition}
                            loading={transitioning}
                            disabled={saving || transitioning || isDirty}
                        >
                            {STATUS_TRANSITION_LABELS[currentSheet.status]}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
