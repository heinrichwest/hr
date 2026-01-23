// ============================================================
// EMPLOYMENT INFO SECTION
// Form section for employment details in take-on sheet
// ============================================================

import type { EmploymentInfo, EmploymentType } from '../../types/takeOnSheet';
import type { JobTitle, Department } from '../../types/company';
import './TakeOnSheetSections.css';

interface EmployeeOption {
    id: string;
    firstName: string;
    lastName: string;
}

interface EmploymentInfoSectionProps {
    data: EmploymentInfo;
    onChange: (data: Partial<EmploymentInfo>) => void;
    isEditable: boolean;
    jobTitles: JobTitle[];
    departments: Department[];
    employees: EmployeeOption[];
    showValidation?: boolean;
}

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
    { value: 'permanent', label: 'Permanent' },
    { value: 'fixed', label: 'Fixed Term' },
];

export function EmploymentInfoSection({
    data,
    onChange,
    isEditable,
    jobTitles,
    departments,
    employees,
    showValidation = false,
}: EmploymentInfoSectionProps) {
    const handleChange = (field: keyof EmploymentInfo, value: unknown) => {
        onChange({ [field]: value });
    };

    const formatDateForInput = (date: Date | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    return (
        <div className="tos-section">
            <h3 className="tos-section__title">Employment Information</h3>

            {/* Employment Type */}
            <div className="tos-field">
                <label className="tos-field__label">Employment Type</label>
                <div className="tos-field__radio-group">
                    {EMPLOYMENT_TYPES.map((type) => (
                        <label
                            key={type.value}
                            className={`tos-field__radio-label ${!isEditable ? 'tos-field__radio-label--disabled' : ''}`}
                        >
                            <input
                                type="radio"
                                name="employmentType"
                                value={type.value}
                                checked={data.employmentType === type.value}
                                onChange={(e) => handleChange('employmentType', e.target.value as EmploymentType)}
                                disabled={!isEditable}
                                className="tos-field__radio"
                            />
                            <span className="tos-field__radio-text">{type.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Contract Toggle */}
            <div className="tos-field">
                <label className="tos-field__checkbox-label">
                    <input
                        type="checkbox"
                        checked={data.isContract}
                        onChange={(e) => handleChange('isContract', e.target.checked)}
                        disabled={!isEditable}
                        className="tos-field__checkbox"
                    />
                    <span>Contract Position</span>
                </label>
                {data.isContract && (
                    <div className="tos-field__inline" style={{ marginTop: 'var(--space-2)' }}>
                        <label className="tos-field__label">Contract Period (months)</label>
                        <input
                            type="number"
                            value={data.contractPeriodMonths || ''}
                            onChange={(e) => handleChange('contractPeriodMonths', parseInt(e.target.value) || undefined)}
                            disabled={!isEditable}
                            className="tos-field__input tos-field__input--small"
                            min={1}
                            placeholder="e.g., 12"
                        />
                    </div>
                )}
            </div>

            {/* Job Title */}
            <div className="tos-field">
                <label className="tos-field__label">Job Title</label>
                <select
                    value={data.jobTitleId}
                    onChange={(e) => handleChange('jobTitleId', e.target.value)}
                    disabled={!isEditable}
                    className="tos-field__select"
                >
                    <option value="">Select Job Title</option>
                    {jobTitles.filter(jt => jt.isActive).map((jt) => (
                        <option key={jt.id} value={jt.id}>
                            {jt.name}
                        </option>
                    ))}
                </select>
                {showValidation && !data.jobTitleId && (
                    <span className="tos-field__error">Job title is required</span>
                )}
            </div>

            {/* Department */}
            <div className="tos-field">
                <label className="tos-field__label">Department</label>
                <select
                    value={data.departmentId}
                    onChange={(e) => handleChange('departmentId', e.target.value)}
                    disabled={!isEditable}
                    className="tos-field__select"
                >
                    <option value="">Select Department</option>
                    {departments.filter(d => d.isActive).map((dept) => (
                        <option key={dept.id} value={dept.id}>
                            {dept.name}
                        </option>
                    ))}
                </select>
                {showValidation && !data.departmentId && (
                    <span className="tos-field__error">Department is required</span>
                )}
            </div>

            {/* Salary */}
            <div className="tos-field">
                <label className="tos-field__label">Salary</label>
                <div className="tos-field__inline">
                    <select
                        value={data.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        disabled={!isEditable}
                        className="tos-field__select tos-field__select--small"
                    >
                        <option value="ZAR">ZAR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                    </select>
                    <input
                        type="number"
                        value={data.salary || ''}
                        onChange={(e) => handleChange('salary', parseFloat(e.target.value) || 0)}
                        disabled={!isEditable}
                        className="tos-field__input"
                        placeholder="Monthly salary"
                        min={0}
                        step={100}
                    />
                </div>
                {showValidation && !data.salary && (
                    <span className="tos-field__error">Salary is required</span>
                )}
            </div>

            {/* Date of Employment */}
            <div className="tos-field">
                <label className="tos-field__label">Date of Employment</label>
                <input
                    type="date"
                    value={formatDateForInput(data.dateOfEmployment)}
                    onChange={(e) => handleChange('dateOfEmployment', new Date(e.target.value))}
                    disabled={!isEditable}
                    className="tos-field__input"
                />
                {showValidation && !data.dateOfEmployment && (
                    <span className="tos-field__error">Date of employment is required</span>
                )}
            </div>

            {/* Reports To */}
            <div className="tos-field">
                <label className="tos-field__label">Reports To</label>
                <select
                    value={data.reportsTo}
                    onChange={(e) => handleChange('reportsTo', e.target.value)}
                    disabled={!isEditable}
                    className="tos-field__select"
                >
                    <option value="">Select Manager</option>
                    {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                        </option>
                    ))}
                </select>
                {showValidation && !data.reportsTo && (
                    <span className="tos-field__error">Reports to is required</span>
                )}
            </div>
        </div>
    );
}
