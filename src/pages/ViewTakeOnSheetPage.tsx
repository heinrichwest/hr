// ============================================================
// VIEW TAKE-ON SHEET PAGE
// Page for viewing and editing an existing take-on sheet
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { TakeOnSheetForm } from '../components/TakeOnSheet/TakeOnSheetForm';
import { TakeOnSheetService } from '../services/takeOnSheetService';
import { EmployeeService } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import type { TakeOnSheet } from '../types/takeOnSheet';
import './ViewTakeOnSheetPage.css';

// Inline ChevronLeft icon
function ChevronLeft({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

// Inline UserPlus icon
function UserPlusIcon({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    );
}

// Inline CheckCircle icon
function CheckCircleIcon({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

export default function ViewTakeOnSheetPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userProfile, currentUser } = useAuth();

    const [sheet, setSheet] = useState<TakeOnSheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Employee creation state
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [creatingEmployee, setCreatingEmployee] = useState(false);
    const [createEmployeeError, setCreateEmployeeError] = useState<string | null>(null);
    const [employeeCreated, setEmployeeCreated] = useState(false);
    const [createdEmployeeId, setCreatedEmployeeId] = useState<string | null>(null);

    useEffect(() => {
        async function loadSheet() {
            if (!id) {
                setError('No take-on sheet ID provided.');
                setLoading(false);
                return;
            }

            try {
                const data = await TakeOnSheetService.getTakeOnSheetById(id);
                if (!data) {
                    setError('Take-on sheet not found.');
                } else if (userProfile?.companyId && data.companyId !== userProfile.companyId) {
                    // Tenant isolation check
                    setError('You do not have permission to view this take-on sheet.');
                } else {
                    setSheet(data);
                    // Check if employee already created
                    if (data.employeeId) {
                        setEmployeeCreated(true);
                        setCreatedEmployeeId(data.employeeId);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load take-on sheet.');
            } finally {
                setLoading(false);
            }
        }

        loadSheet();
    }, [id, userProfile?.companyId]);

    const handleBack = () => {
        navigate('/take-on-sheets');
    };

    const handleSaveSuccess = (updatedSheet: TakeOnSheet) => {
        setSheet(updatedSheet);
    };

    // Check if user can create employee
    const canCreateEmployee = (): { allowed: boolean; reason?: string } => {
        if (!sheet) return { allowed: false, reason: 'No sheet loaded.' };
        if (!userProfile) return { allowed: false, reason: 'User not authenticated.' };

        // Check role permissions
        const allowedRoles = ['System Admin', 'HR Admin', 'HR Manager'];
        if (!allowedRoles.includes(userProfile.role)) {
            return { allowed: false, reason: 'You do not have permission to create employees.' };
        }

        // Use service validation
        const validation = TakeOnSheetService.canCreateEmployee(sheet);
        return { allowed: validation.canCreate, reason: validation.reason };
    };

    // Handle employee creation
    const handleCreateEmployee = async () => {
        if (!sheet || !currentUser) return;

        setCreatingEmployee(true);
        setCreateEmployeeError(null);

        try {
            // Check for existing employee with same ID number
            const existingEmployee = await EmployeeService.findExistingEmployeeForTakeOnSheet(sheet);
            if (existingEmployee) {
                throw new Error(`An employee with ID number ${sheet.personalDetails.idNumber} already exists (${existingEmployee.firstName} ${existingEmployee.lastName}).`);
            }

            // Create employee with document transfer
            const result = await EmployeeService.createEmployeeWithDocumentsFromTakeOnSheet(
                sheet,
                currentUser.uid
            );

            // Link take-on sheet to created employee
            const updatedSheet = await TakeOnSheetService.linkToEmployee(
                sheet.id,
                result.employeeId,
                currentUser.uid
            );

            setSheet(updatedSheet);
            setEmployeeCreated(true);
            setCreatedEmployeeId(result.employeeId);
            setShowConfirmDialog(false);
        } catch (err) {
            setCreateEmployeeError(err instanceof Error ? err.message : 'Failed to create employee.');
        } finally {
            setCreatingEmployee(false);
        }
    };

    // Navigate to employee profile
    const handleViewEmployee = () => {
        if (createdEmployeeId) {
            navigate(`/employees/${createdEmployeeId}`);
        }
    };

    // Loading state
    if (loading) {
        return (
            <MainLayout>
                <div className="view-tos-page view-tos-page--loading">
                    <div className="view-tos-page__loader">Loading take-on sheet...</div>
                </div>
            </MainLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <MainLayout>
                <div className="view-tos-page">
                    <div className="view-tos-page__header">
                        <button
                            type="button"
                            className="view-tos-page__back"
                            onClick={handleBack}
                        >
                            <ChevronLeft size={16} />
                            Back to Take-On Sheets
                        </button>
                    </div>
                    <div className="view-tos-page__error-container">
                        <p className="view-tos-page__error">{error}</p>
                        <button
                            type="button"
                            className="view-tos-page__error-btn"
                            onClick={handleBack}
                        >
                            Return to List
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // No sheet found
    if (!sheet) {
        return (
            <MainLayout>
                <div className="view-tos-page">
                    <div className="view-tos-page__header">
                        <button
                            type="button"
                            className="view-tos-page__back"
                            onClick={handleBack}
                        >
                            <ChevronLeft size={16} />
                            Back to Take-On Sheets
                        </button>
                    </div>
                    <div className="view-tos-page__error-container">
                        <p className="view-tos-page__error">Take-on sheet not found.</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Determine page title based on status
    const getPageTitle = () => {
        const employeeName = sheet.personalDetails.firstName && sheet.personalDetails.lastName
            ? `${sheet.personalDetails.firstName} ${sheet.personalDetails.lastName}`
            : 'New Employee';

        switch (sheet.status) {
            case 'draft':
                return `Edit Take-On Sheet - ${employeeName}`;
            case 'pending_hr_review':
                return `HR Review - ${employeeName}`;
            case 'pending_it_setup':
                return `IT Setup - ${employeeName}`;
            case 'complete':
                return `Take-On Sheet - ${employeeName}`;
            default:
                return `Take-On Sheet - ${employeeName}`;
        }
    };

    const getPageSubtitle = () => {
        if (employeeCreated && createdEmployeeId) {
            return 'Employee record has been created from this take-on sheet.';
        }
        switch (sheet.status) {
            case 'draft':
                return 'Complete all sections and submit for HR review.';
            case 'pending_hr_review':
                return 'Review employment details, documents, and approve for IT setup.';
            case 'pending_it_setup':
                return 'Configure system access and complete the onboarding process.';
            case 'complete':
                return 'This take-on sheet is complete. You can now create an employee record.';
            default:
                return '';
        }
    };

    const createEmployeeStatus = canCreateEmployee();

    return (
        <MainLayout>
            <div className="view-tos-page">
                <div className="view-tos-page__header">
                    <button
                        type="button"
                        className="view-tos-page__back"
                        onClick={handleBack}
                    >
                        <ChevronLeft size={16} />
                        Back to Take-On Sheets
                    </button>
                    <div className="view-tos-page__title-row">
                        <div className="view-tos-page__title-section">
                            <h1 className="view-tos-page__title">{getPageTitle()}</h1>
                            <p className="view-tos-page__subtitle">{getPageSubtitle()}</p>
                        </div>

                        {/* Create Employee Button */}
                        {sheet.status === 'complete' && !employeeCreated && (
                            <div className="view-tos-page__actions">
                                <button
                                    type="button"
                                    className="view-tos-page__create-btn"
                                    onClick={() => setShowConfirmDialog(true)}
                                    disabled={!createEmployeeStatus.allowed}
                                    title={createEmployeeStatus.reason}
                                >
                                    <UserPlusIcon size={18} />
                                    Create Employee
                                </button>
                            </div>
                        )}

                        {/* Employee Created Banner */}
                        {employeeCreated && createdEmployeeId && (
                            <div className="view-tos-page__created-banner">
                                <div className="view-tos-page__created-content">
                                    <CheckCircleIcon size={20} />
                                    <span>Employee created successfully</span>
                                </div>
                                <button
                                    type="button"
                                    className="view-tos-page__view-employee-btn"
                                    onClick={handleViewEmployee}
                                >
                                    View Employee Profile
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <TakeOnSheetForm
                    sheetId={sheet.id}
                    initialData={sheet}
                    onSaveSuccess={handleSaveSuccess}
                />

                {/* Confirmation Dialog */}
                {showConfirmDialog && (
                    <div className="view-tos-page__modal-overlay">
                        <div className="view-tos-page__modal">
                            <h2 className="view-tos-page__modal-title">Create Employee Record</h2>
                            <div className="view-tos-page__modal-content">
                                <p>
                                    You are about to create an employee record from this take-on sheet for:
                                </p>
                                <div className="view-tos-page__modal-employee-info">
                                    <strong>{sheet.personalDetails.firstName} {sheet.personalDetails.lastName}</strong>
                                    <span>ID: {sheet.personalDetails.idNumber}</span>
                                </div>
                                <p className="view-tos-page__modal-note">
                                    This will create the employee record and transfer all uploaded documents.
                                    This action cannot be undone.
                                </p>
                                {createEmployeeError && (
                                    <p className="view-tos-page__modal-error">
                                        {createEmployeeError}
                                    </p>
                                )}
                            </div>
                            <div className="view-tos-page__modal-actions">
                                <button
                                    type="button"
                                    className="view-tos-page__modal-cancel"
                                    onClick={() => {
                                        setShowConfirmDialog(false);
                                        setCreateEmployeeError(null);
                                    }}
                                    disabled={creatingEmployee}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="view-tos-page__modal-confirm"
                                    onClick={handleCreateEmployee}
                                    disabled={creatingEmployee}
                                >
                                    {creatingEmployee ? 'Creating...' : 'Create Employee'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
