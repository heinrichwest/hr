import { useEffect, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { CompanyService } from '../../services/companyService';
import type { Company, Address, PayFrequency } from '../../types/company';

const SA_PROVINCES = [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape'
];

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
];

const emptyAddress: Address = {
    line1: '',
    line2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa'
};

export function CompanyProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState<Partial<Company>>({
        legalName: '',
        tradingName: '',
        registrationNumber: '',
        payeReference: '',
        uifReference: '',
        sdlReference: '',
        physicalAddress: { ...emptyAddress },
        postalAddress: { ...emptyAddress },
        phone: '',
        email: '',
        website: '',
        defaultCurrency: 'ZAR',
        defaultPayFrequency: 'monthly',
        financialYearEnd: 2,
        isActive: true
    });
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadCompany();
    }, []);

    const loadCompany = async () => {
        setLoading(true);
        try {
            const existingCompany = await CompanyService.getDefaultCompany();
            if (existingCompany) {
                setCompany(existingCompany);
                setCompanyId(existingCompany.id);
            }
        } catch (error) {
            console.error('Failed to load company:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string | number) => {
        setCompany(prev => ({ ...prev, [field]: value }));
    };

    const handleAddressChange = (type: 'physicalAddress' | 'postalAddress', field: string, value: string) => {
        setCompany(prev => ({
            ...prev,
            [type]: {
                ...(prev[type] || emptyAddress),
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            if (companyId) {
                await CompanyService.updateCompany(companyId, company);
                setMessage({ type: 'success', text: 'Company profile updated successfully!' });
            } else {
                const newId = await CompanyService.createCompany(company as Omit<Company, 'id' | 'createdAt'>);
                setCompanyId(newId);
                // Initialize defaults for new company
                await CompanyService.initializeCompanyDefaults(newId);
                setMessage({ type: 'success', text: 'Company profile created successfully!' });
            }
        } catch (error) {
            console.error('Failed to save company:', error);
            setMessage({ type: 'error', text: 'Failed to save company profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-section">
                <div className="settings-form-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="settings-field">
                            <div className="settings-skeleton" style={{ height: 16, width: 100, marginBottom: 8 }} />
                            <div className="settings-skeleton" style={{ height: 40 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            {message && (
                <div className={`settings-message settings-message--${message.type}`}>
                    {message.type === 'success' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Legal Information */}
            <div className="settings-section">
                <div className="settings-section-header">
                    <div>
                        <h3 className="settings-section-title">Legal Information</h3>
                        <p className="settings-section-subtitle">Company registration and legal details</p>
                    </div>
                </div>
                <div className="settings-form-grid">
                    <div className="settings-field">
                        <label htmlFor="company-legal-name" className="settings-field-label">
                            Legal Name<span>*</span>
                        </label>
                        <input
                            id="company-legal-name"
                            type="text"
                            className="settings-field-input"
                            value={company.legalName || ''}
                            onChange={(e) => handleChange('legalName', e.target.value)}
                            placeholder="Registered company name"
                        />
                    </div>
                    <div className="settings-field">
                        <label htmlFor="company-trading-name" className="settings-field-label">Trading Name</label>
                        <input
                            id="company-trading-name"
                            type="text"
                            className="settings-field-input"
                            value={company.tradingName || ''}
                            onChange={(e) => handleChange('tradingName', e.target.value)}
                            placeholder="Trading as (if different)"
                        />
                    </div>
                    <div className="settings-field">
                        <label htmlFor="company-registration-number" className="settings-field-label">
                            Registration Number<span>*</span>
                        </label>
                        <input
                            id="company-registration-number"
                            type="text"
                            className="settings-field-input"
                            value={company.registrationNumber || ''}
                            onChange={(e) => handleChange('registrationNumber', e.target.value)}
                            placeholder="e.g., 2024/123456/07"
                        />
                    </div>
                </div>
            </div>

            {/* Tax References */}
            <div className="settings-section">
                <div className="settings-section-header">
                    <div>
                        <h3 className="settings-section-title">Tax References</h3>
                        <p className="settings-section-subtitle">SARS and statutory registration numbers</p>
                    </div>
                </div>
                <div className="settings-form-grid settings-form-grid--3col">
                    <div className="settings-field">
                        <label htmlFor="company-paye-reference" className="settings-field-label">PAYE Reference</label>
                        <input
                            id="company-paye-reference"
                            type="text"
                            className="settings-field-input"
                            value={company.payeReference || ''}
                            onChange={(e) => handleChange('payeReference', e.target.value)}
                            placeholder="7000000000"
                        />
                        <span className="settings-field-hint">10-digit SARS employer code</span>
                    </div>
                    <div className="settings-field">
                        <label htmlFor="company-uif-reference" className="settings-field-label">UIF Reference</label>
                        <input
                            id="company-uif-reference"
                            type="text"
                            className="settings-field-input"
                            value={company.uifReference || ''}
                            onChange={(e) => handleChange('uifReference', e.target.value)}
                            placeholder="U000000000"
                        />
                        <span className="settings-field-hint">UIF employer number</span>
                    </div>
                    <div className="settings-field">
                        <label htmlFor="company-sdl-reference" className="settings-field-label">SDL Reference</label>
                        <input
                            id="company-sdl-reference"
                            type="text"
                            className="settings-field-input"
                            value={company.sdlReference || ''}
                            onChange={(e) => handleChange('sdlReference', e.target.value)}
                            placeholder="L000000000"
                        />
                        <span className="settings-field-hint">Skills Development Levy number</span>
                    </div>
                </div>
            </div>

            {/* Physical Address */}
            <div className="settings-section">
                <div className="settings-section-header">
                    <div>
                        <h3 className="settings-section-title">Physical Address</h3>
                        <p className="settings-section-subtitle">Main business premises</p>
                    </div>
                </div>
                <div className="settings-form-grid">
                    <div className="settings-field settings-form-grid--full">
                        <label htmlFor="physical-address-line1" className="settings-field-label">Street Address</label>
                        <input
                            id="physical-address-line1"
                            type="text"
                            className="settings-field-input"
                            value={company.physicalAddress?.line1 || ''}
                            onChange={(e) => handleAddressChange('physicalAddress', 'line1', e.target.value)}
                            placeholder="Street address"
                        />
                    </div>
                    <div className="settings-field settings-form-grid--full">
                        <label htmlFor="physical-address-line2" className="settings-field-label">Address Line 2</label>
                        <input
                            id="physical-address-line2"
                            type="text"
                            className="settings-field-input"
                            value={company.physicalAddress?.line2 || ''}
                            onChange={(e) => handleAddressChange('physicalAddress', 'line2', e.target.value)}
                            placeholder="Building, suite, unit (optional)"
                        />
                    </div>
                    <div className="settings-field">
                        <label htmlFor="physical-address-city" className="settings-field-label">City</label>
                        <input
                            id="physical-address-city"
                            type="text"
                            className="settings-field-input"
                            value={company.physicalAddress?.city || ''}
                            onChange={(e) => handleAddressChange('physicalAddress', 'city', e.target.value)}
                            placeholder="City"
                        />
                    </div>
                    <div className="settings-field">
                        <label htmlFor="physical-address-province" className="settings-field-label">Province</label>
                        <select
                            id="physical-address-province"
                            className="settings-field-input settings-field-select"
                            value={company.physicalAddress?.province || ''}
                            onChange={(e) => handleAddressChange('physicalAddress', 'province', e.target.value)}
                        >
                            <option value="">Select province</option>
                            {SA_PROVINCES.map(prov => (
                                <option key={prov} value={prov}>{prov}</option>
                            ))}
                        </select>
                    </div>
                    <div className="settings-field">
                        <label htmlFor="physical-address-postal-code" className="settings-field-label">Postal Code</label>
                        <input
                            id="physical-address-postal-code"
                            type="text"
                            className="settings-field-input"
                            value={company.physicalAddress?.postalCode || ''}
                            onChange={(e) => handleAddressChange('physicalAddress', 'postalCode', e.target.value)}
                            placeholder="0001"
                        />
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="settings-section">
                <div className="settings-section-header">
                    <div>
                        <h3 className="settings-section-title">Contact Information</h3>
                        <p className="settings-section-subtitle">Company contact details</p>
                    </div>
                </div>
                <div className="settings-form-grid settings-form-grid--3col">
                    <div className="settings-field">
                        <label htmlFor="company-phone" className="settings-field-label">Phone</label>
                        <input
                            id="company-phone"
                            type="tel"
                            className="settings-field-input"
                            value={company.phone || ''}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="+27 11 000 0000"
                        />
                    </div>
                    <div className="settings-field">
                        <label htmlFor="company-email" className="settings-field-label">Email</label>
                        <input
                            id="company-email"
                            type="email"
                            className="settings-field-input"
                            value={company.email || ''}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="info@company.co.za"
                        />
                    </div>
                    <div className="settings-field">
                        <label htmlFor="company-website" className="settings-field-label">Website</label>
                        <input
                            id="company-website"
                            type="url"
                            className="settings-field-input"
                            value={company.website || ''}
                            onChange={(e) => handleChange('website', e.target.value)}
                            placeholder="https://www.company.co.za"
                        />
                    </div>
                </div>
            </div>

            {/* Payroll Settings */}
            <div className="settings-section">
                <div className="settings-section-header">
                    <div>
                        <h3 className="settings-section-title">Payroll Settings</h3>
                        <p className="settings-section-subtitle">Default payroll configuration</p>
                    </div>
                </div>
                <div className="settings-form-grid settings-form-grid--3col">
                    <div className="settings-field">
                        <label htmlFor="company-pay-frequency" className="settings-field-label">Default Pay Frequency</label>
                        <select
                            id="company-pay-frequency"
                            className="settings-field-input settings-field-select"
                            value={company.defaultPayFrequency || 'monthly'}
                            onChange={(e) => handleChange('defaultPayFrequency', e.target.value as PayFrequency)}
                        >
                            <option value="weekly">Weekly</option>
                            <option value="fortnightly">Fortnightly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    <div className="settings-field">
                        <label htmlFor="company-financial-year-end" className="settings-field-label">Financial Year End</label>
                        <select
                            id="company-financial-year-end"
                            className="settings-field-input settings-field-select"
                            value={company.financialYearEnd || 2}
                            onChange={(e) => handleChange('financialYearEnd', parseInt(e.target.value))}
                        >
                            {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <span className="settings-field-hint">SA tax year ends in February</span>
                    </div>
                    <div className="settings-field">
                        <label htmlFor="company-currency" className="settings-field-label">Currency</label>
                        <input
                            id="company-currency"
                            type="text"
                            className="settings-field-input"
                            value={company.defaultCurrency || 'ZAR'}
                            disabled
                        />
                        <span className="settings-field-hint">South African Rand</span>
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="settings-form-actions">
                <Button variant="secondary" onClick={loadCompany} disabled={saving}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </>
    );
}
