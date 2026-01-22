// ============================================================
// PERSONAL DETAILS SECTION
// Form section for personal information in take-on sheet
// ============================================================

import type { PersonalDetails, PersonTitle, RaceClassification } from '../../types/takeOnSheet';
import type { Address } from '../../types/company';
import './TakeOnSheetSections.css';

interface PersonalDetailsSectionProps {
    data: PersonalDetails;
    onChange: (data: Partial<PersonalDetails>) => void;
    isEditable: boolean;
    showValidation?: boolean;
}

const TITLE_OPTIONS: PersonTitle[] = ['Mr', 'Mrs', 'Miss', 'Ms'];

const RACE_OPTIONS: { value: RaceClassification; label: string }[] = [
    { value: 'African', label: 'African' },
    { value: 'Asian', label: 'Asian' },
    { value: 'Coloured', label: 'Coloured' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'European', label: 'European' },
    { value: 'Indian', label: 'Indian' },
];

const SA_PROVINCES = [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Northern Cape',
    'Western Cape',
];

export function PersonalDetailsSection({
    data,
    onChange,
    isEditable,
    showValidation = false,
}: PersonalDetailsSectionProps) {
    const handleChange = (field: keyof PersonalDetails, value: unknown) => {
        onChange({ [field]: value });
    };

    const handleAddressChange = (
        addressType: 'physicalAddress' | 'postalAddress',
        field: keyof Address,
        value: string
    ) => {
        const currentAddress = data[addressType];
        const updatedAddress = { ...currentAddress, [field]: value };
        onChange({ [addressType]: updatedAddress });

        // If physical address changes and postal same as physical is checked, update postal too
        if (addressType === 'physicalAddress' && data.postalSameAsPhysical) {
            onChange({
                [addressType]: updatedAddress,
                postalAddress: updatedAddress,
            });
        }
    };

    const handlePostalSameToggle = (checked: boolean) => {
        onChange({
            postalSameAsPhysical: checked,
            postalAddress: checked ? { ...data.physicalAddress } : data.postalAddress,
        });
    };

    const renderAddressFields = (
        addressType: 'physicalAddress' | 'postalAddress',
        label: string,
        disabled: boolean
    ) => {
        const address = data[addressType];

        return (
            <div className="tos-address-group">
                <h4 className="tos-address-group__title">{label}</h4>
                <div className="tos-field">
                    <label className="tos-field__label">Street Address Line 1</label>
                    <input
                        type="text"
                        value={address.line1}
                        onChange={(e) => handleAddressChange(addressType, 'line1', e.target.value)}
                        disabled={disabled}
                        className="tos-field__input"
                        placeholder="Street address"
                    />
                </div>
                <div className="tos-field">
                    <label className="tos-field__label">Street Address Line 2</label>
                    <input
                        type="text"
                        value={address.line2 || ''}
                        onChange={(e) => handleAddressChange(addressType, 'line2', e.target.value)}
                        disabled={disabled}
                        className="tos-field__input"
                        placeholder="Apartment, suite, unit, etc. (optional)"
                    />
                </div>
                <div className="tos-field">
                    <label className="tos-field__label">Suburb</label>
                    <input
                        type="text"
                        value={address.suburb || ''}
                        onChange={(e) => handleAddressChange(addressType, 'suburb', e.target.value)}
                        disabled={disabled}
                        className="tos-field__input"
                        placeholder="Suburb"
                    />
                </div>
                <div className="tos-field__row">
                    <div className="tos-field">
                        <label className="tos-field__label">City</label>
                        <input
                            type="text"
                            value={address.city}
                            onChange={(e) => handleAddressChange(addressType, 'city', e.target.value)}
                            disabled={disabled}
                            className="tos-field__input"
                            placeholder="City"
                        />
                    </div>
                    <div className="tos-field">
                        <label className="tos-field__label">Province</label>
                        <select
                            value={address.province}
                            onChange={(e) => handleAddressChange(addressType, 'province', e.target.value)}
                            disabled={disabled}
                            className="tos-field__select"
                        >
                            <option value="">Select Province</option>
                            {SA_PROVINCES.map((province) => (
                                <option key={province} value={province}>
                                    {province}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="tos-field__row">
                    <div className="tos-field">
                        <label className="tos-field__label">Postal Code</label>
                        <input
                            type="text"
                            value={address.postalCode}
                            onChange={(e) => handleAddressChange(addressType, 'postalCode', e.target.value)}
                            disabled={disabled}
                            className="tos-field__input"
                            placeholder="0000"
                            maxLength={10}
                        />
                    </div>
                    <div className="tos-field">
                        <label className="tos-field__label">Country</label>
                        <input
                            type="text"
                            value={address.country}
                            onChange={(e) => handleAddressChange(addressType, 'country', e.target.value)}
                            disabled={disabled}
                            className="tos-field__input"
                            placeholder="Country"
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="tos-section">
            <h3 className="tos-section__title">Personal Details</h3>

            {/* Title & Name */}
            <div className="tos-field__row">
                <div className="tos-field tos-field--small">
                    <label className="tos-field__label">Title</label>
                    <select
                        value={data.title}
                        onChange={(e) => handleChange('title', e.target.value as PersonTitle)}
                        disabled={!isEditable}
                        className="tos-field__select"
                    >
                        {TITLE_OPTIONS.map((title) => (
                            <option key={title} value={title}>
                                {title}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="tos-field">
                    <label className="tos-field__label">First Name</label>
                    <input
                        type="text"
                        value={data.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        disabled={!isEditable}
                        className="tos-field__input"
                        placeholder="First name"
                    />
                    {showValidation && !data.firstName && (
                        <span className="tos-field__error">First name is required</span>
                    )}
                </div>
                <div className="tos-field">
                    <label className="tos-field__label">Last Name</label>
                    <input
                        type="text"
                        value={data.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        disabled={!isEditable}
                        className="tos-field__input"
                        placeholder="Last name"
                    />
                    {showValidation && !data.lastName && (
                        <span className="tos-field__error">Last name is required</span>
                    )}
                </div>
            </div>

            {/* Race */}
            <div className="tos-field">
                <label className="tos-field__label">Race (Employment Equity)</label>
                <select
                    value={data.race}
                    onChange={(e) => handleChange('race', e.target.value as RaceClassification)}
                    disabled={!isEditable}
                    className="tos-field__select"
                >
                    {RACE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* ID Number */}
            <div className="tos-field">
                <label className="tos-field__label">ID Number</label>
                <input
                    type="text"
                    value={data.idNumber}
                    onChange={(e) => handleChange('idNumber', e.target.value)}
                    disabled={!isEditable}
                    className="tos-field__input"
                    placeholder="South African ID number (13 digits)"
                    maxLength={13}
                />
                {showValidation && !data.idNumber && (
                    <span className="tos-field__error">ID number is required</span>
                )}
            </div>

            {/* Contact Number */}
            <div className="tos-field">
                <label className="tos-field__label">Contact Number</label>
                <input
                    type="tel"
                    value={data.contactNumber}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    disabled={!isEditable}
                    className="tos-field__input"
                    placeholder="e.g., 0821234567"
                />
                {showValidation && !data.contactNumber && (
                    <span className="tos-field__error">Contact number is required</span>
                )}
            </div>

            {/* Physical Address */}
            {renderAddressFields('physicalAddress', 'Physical Address', !isEditable)}

            {/* Postal Same as Physical */}
            <div className="tos-field">
                <label className="tos-field__checkbox-label">
                    <input
                        type="checkbox"
                        checked={data.postalSameAsPhysical}
                        onChange={(e) => handlePostalSameToggle(e.target.checked)}
                        disabled={!isEditable}
                        className="tos-field__checkbox"
                    />
                    <span>Postal address same as physical address</span>
                </label>
            </div>

            {/* Postal Address */}
            {!data.postalSameAsPhysical && (
                renderAddressFields('postalAddress', 'Postal Address', !isEditable)
            )}

            {/* Disability */}
            <div className="tos-field">
                <label className="tos-field__checkbox-label">
                    <input
                        type="checkbox"
                        checked={data.hasDisability}
                        onChange={(e) => handleChange('hasDisability', e.target.checked)}
                        disabled={!isEditable}
                        className="tos-field__checkbox"
                    />
                    <span>Do you have a disability?</span>
                </label>
                {data.hasDisability && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                        <label className="tos-field__label">Please provide details</label>
                        <textarea
                            value={data.disabilityDetails || ''}
                            onChange={(e) => handleChange('disabilityDetails', e.target.value)}
                            disabled={!isEditable}
                            className="tos-field__textarea"
                            rows={3}
                            placeholder="Describe your disability and any accommodations needed"
                        />
                    </div>
                )}
            </div>

            {/* Employee Acknowledgement */}
            <div className="tos-field tos-field--acknowledgement">
                <label className="tos-field__checkbox-label">
                    <input
                        type="checkbox"
                        checked={data.employeeAcknowledgement}
                        onChange={(e) => handleChange('employeeAcknowledgement', e.target.checked)}
                        disabled={!isEditable}
                        className="tos-field__checkbox"
                    />
                    <span>
                        I confirm that the information provided above is accurate and complete to the best of my knowledge.
                    </span>
                </label>
                {showValidation && !data.employeeAcknowledgement && (
                    <span className="tos-field__error">You must acknowledge the information is correct</span>
                )}
            </div>
        </div>
    );
}
