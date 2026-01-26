// ============================================================
// REPORT GENERATION MODAL
// Two-step modal for selecting tenant and employees for report generation
// ============================================================

import { useState, useEffect } from 'react';
import { CompanyService } from '../../services/companyService';
import { EmployeeService } from '../../services/employeeService';
import type { Company } from '../../types/company';
import type { Employee } from '../../types/employee';
import './ReportGenerationModal.css';

interface ReportGenerationModalProps {
    isOpen: boolean;
    reportName: string;
    onClose: () => void;
    onGenerate: (tenantIds: string[], employeeIds: string[]) => void;
}

type Step = 'tenant' | 'employee';

export function ReportGenerationModal({
    isOpen,
    reportName,
    onClose,
    onGenerate
}: ReportGenerationModalProps) {
    const [step, setStep] = useState<Step>('tenant');
    const [tenants, setTenants] = useState<Company[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load tenants when modal opens
    useEffect(() => {
        if (isOpen) {
            loadTenants();
        } else {
            // Reset state when modal closes
            setStep('tenant');
            setSelectedTenants(new Set());
            setSelectedEmployees(new Set());
            setSearchTerm('');
            setError('');
        }
    }, [isOpen]);

    const loadTenants = async () => {
        setLoading(true);
        setError('');
        try {
            const allTenants = await CompanyService.getAllCompanies();
            setTenants(allTenants);
        } catch (err) {
            console.error('Failed to load tenants:', err);
            setError('Failed to load companies');
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        setLoading(true);
        setError('');
        try {
            // Load employees for all selected tenants
            const allEmployees: Employee[] = [];
            for (const tenantId of selectedTenants) {
                const tenantEmployees = await EmployeeService.getEmployees(tenantId);
                allEmployees.push(...tenantEmployees);
            }
            setEmployees(allEmployees);
        } catch (err) {
            console.error('Failed to load employees:', err);
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    // Handle tenant checkbox toggle
    const handleTenantToggle = (tenantId: string) => {
        setSelectedTenants(prev => {
            const updated = new Set(prev);
            if (updated.has(tenantId)) {
                updated.delete(tenantId);
            } else {
                updated.add(tenantId);
            }
            return updated;
        });
    };

    // Handle employee checkbox toggle
    const handleEmployeeToggle = (employeeId: string) => {
        setSelectedEmployees(prev => {
            const updated = new Set(prev);
            if (updated.has(employeeId)) {
                updated.delete(employeeId);
            } else {
                updated.add(employeeId);
            }
            return updated;
        });
    };

    // Handle "Next" button click (tenant -> employee)
    const handleNext = () => {
        if (selectedTenants.size === 0) {
            setError('Please select at least one company');
            return;
        }
        setError('');
        setStep('employee');
        loadEmployees();
    };

    // Handle "Back" button click (employee -> tenant)
    const handleBack = () => {
        setStep('tenant');
        setSelectedEmployees(new Set());
        setSearchTerm('');
    };

    // Handle "Generate Report" button click
    const handleGenerate = () => {
        if (selectedEmployees.size === 0) {
            setError('Please select at least one employee');
            return;
        }
        onGenerate(Array.from(selectedTenants), Array.from(selectedEmployees));
        onClose();
    };

    // Filter items based on search term
    const filteredTenants = tenants.filter(tenant =>
        tenant.legalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredEmployees = employees.filter(employee =>
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header">
                    <h2 className="modal-title">
                        {step === 'tenant' ? 'Choose your Company' : 'Choose Employees'}
                    </h2>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Modal Subtitle */}
                <div className="modal-subtitle">
                    <span className="modal-report-name">{reportName}</span>
                    {step === 'employee' && (
                        <span className="modal-step-info">
                            {selectedTenants.size} {selectedTenants.size === 1 ? 'company' : 'companies'} selected
                        </span>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="modal-error" role="alert">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Search Bar */}
                <div className="modal-search">
                    <input
                        type="text"
                        placeholder={step === 'tenant' ? 'Search companies...' : 'Search employees...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="modal-search-input"
                    />
                    <svg className="modal-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                </div>

                {/* Selection List */}
                <div className="modal-list-container">
                    {loading ? (
                        <div className="modal-loading">
                            <div className="modal-spinner" />
                            <span>Loading...</span>
                        </div>
                    ) : step === 'tenant' ? (
                        <div className="modal-list">
                            {filteredTenants.length === 0 ? (
                                <div className="modal-empty">No companies found</div>
                            ) : (
                                filteredTenants.map(tenant => (
                                    <label key={tenant.id} className="modal-list-item" htmlFor={`tenant-${tenant.id}`}>
                                        <input
                                            id={`tenant-${tenant.id}`}
                                            type="checkbox"
                                            checked={selectedTenants.has(tenant.id)}
                                            onChange={() => handleTenantToggle(tenant.id)}
                                            className="modal-checkbox"
                                        />
                                        <span className="modal-item-text">{tenant.legalName}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="modal-list">
                            {filteredEmployees.length === 0 ? (
                                <div className="modal-empty">No employees found</div>
                            ) : (
                                filteredEmployees.map(employee => (
                                    <label key={employee.id} className="modal-list-item" htmlFor={`employee-${employee.id}`}>
                                        <input
                                            id={`employee-${employee.id}`}
                                            type="checkbox"
                                            checked={selectedEmployees.has(employee.id)}
                                            onChange={() => handleEmployeeToggle(employee.id)}
                                            className="modal-checkbox"
                                        />
                                        <span className="modal-item-text">
                                            {employee.firstName} {employee.lastName}
                                            {employee.employeeNumber && (
                                                <span className="modal-item-secondary"> ({employee.employeeNumber})</span>
                                            )}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                    <div className="modal-selection-count">
                        {step === 'tenant' ? (
                            <span>{selectedTenants.size} {selectedTenants.size === 1 ? 'company' : 'companies'} selected</span>
                        ) : (
                            <span>{selectedEmployees.size} {selectedEmployees.size === 1 ? 'employee' : 'employees'} selected</span>
                        )}
                    </div>
                    <div className="modal-actions">
                        {step === 'employee' && (
                            <button className="btn btn--secondary" onClick={handleBack}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Back
                            </button>
                        )}
                        <button className="btn btn--secondary" onClick={onClose}>
                            Cancel
                        </button>
                        {step === 'tenant' ? (
                            <button
                                className="btn btn--primary"
                                onClick={handleNext}
                                disabled={selectedTenants.size === 0}
                            >
                                Next
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                className="btn btn--primary"
                                onClick={handleGenerate}
                                disabled={selectedEmployees.size === 0}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                Generate Report
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
