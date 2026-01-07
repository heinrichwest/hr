import { useEffect, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { CompanyService } from '../../services/companyService';
import type { PayElement, PayElementType, CalculationMethod } from '../../types/company';

const PAY_ELEMENT_TYPES: { value: PayElementType; label: string }[] = [
    { value: 'earning', label: 'Earning' },
    { value: 'deduction', label: 'Deduction' },
    { value: 'employer_contribution', label: 'Employer Contribution' }
];

const CALCULATION_METHODS: { value: CalculationMethod; label: string }[] = [
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'hourly', label: 'Hourly Rate' },
    { value: 'daily', label: 'Daily Rate' },
    { value: 'formula', label: 'Formula/Calculated' }
];

export function PayElements() {
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [payElements, setPayElements] = useState<PayElement[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<PayElement | null>(null);
    const [filter, setFilter] = useState<PayElementType | 'all'>('all');

    useEffect(() => {
        loadCompanyId();
    }, []);

    useEffect(() => {
        if (companyId) {
            loadPayElements();
        }
    }, [companyId]);

    const loadCompanyId = async () => {
        const company = await CompanyService.getDefaultCompany();
        if (company) {
            setCompanyId(company.id);
        }
        setLoading(false);
    };

    const loadPayElements = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const elements = await CompanyService.getPayElements(companyId);
            setPayElements(elements);
        } catch (error) {
            console.error('Failed to load pay elements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleEdit = (item: PayElement) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this pay element?')) return;
        try {
            await CompanyService.deletePayElement(id);
            loadPayElements();
        } catch (error) {
            alert('Failed to delete pay element');
        }
    };

    const handleSave = async (data: Partial<PayElement>) => {
        if (!companyId) return;
        try {
            const itemData = {
                ...data,
                companyId,
                isActive: true,
                sortOrder: editingItem?.sortOrder || payElements.length + 1
            };

            if (editingItem) {
                await CompanyService.updatePayElement(editingItem.id, itemData);
            } else {
                await CompanyService.createPayElement(itemData as Omit<PayElement, 'id' | 'createdAt'>);
            }
            setShowModal(false);
            loadPayElements();
        } catch (error) {
            alert('Failed to save pay element');
        }
    };

    const filteredElements = filter === 'all'
        ? payElements
        : payElements.filter(e => e.type === filter);

    const earnings = payElements.filter(e => e.type === 'earning');
    const deductions = payElements.filter(e => e.type === 'deduction');
    const contributions = payElements.filter(e => e.type === 'employer_contribution');

    if (!companyId && !loading) {
        return (
            <div className="settings-empty">
                <div className="settings-empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <p className="settings-empty-text">Company Profile Required</p>
                <p className="settings-empty-hint">
                    Please set up your company profile first before configuring pay elements.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Stats Summary */}
            <div className="pay-elements-stats">
                <div className="pay-elements-stat pay-elements-stat--earning">
                    <span className="pay-elements-stat-value">{earnings.length}</span>
                    <span className="pay-elements-stat-label">Earnings</span>
                </div>
                <div className="pay-elements-stat pay-elements-stat--deduction">
                    <span className="pay-elements-stat-value">{deductions.length}</span>
                    <span className="pay-elements-stat-label">Deductions</span>
                </div>
                <div className="pay-elements-stat pay-elements-stat--contribution">
                    <span className="pay-elements-stat-value">{contributions.length}</span>
                    <span className="pay-elements-stat-label">Employer Contributions</span>
                </div>
            </div>

            {/* Header with Filter & Add */}
            <div className="settings-section-header" style={{ marginTop: 'var(--space-6)' }}>
                <div className="pay-elements-filter">
                    <button
                        className={`pay-elements-filter-btn ${filter === 'all' ? 'pay-elements-filter-btn--active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({payElements.length})
                    </button>
                    <button
                        className={`pay-elements-filter-btn pay-elements-filter-btn--earning ${filter === 'earning' ? 'pay-elements-filter-btn--active' : ''}`}
                        onClick={() => setFilter('earning')}
                    >
                        Earnings
                    </button>
                    <button
                        className={`pay-elements-filter-btn pay-elements-filter-btn--deduction ${filter === 'deduction' ? 'pay-elements-filter-btn--active' : ''}`}
                        onClick={() => setFilter('deduction')}
                    >
                        Deductions
                    </button>
                    <button
                        className={`pay-elements-filter-btn pay-elements-filter-btn--contribution ${filter === 'employer_contribution' ? 'pay-elements-filter-btn--active' : ''}`}
                        onClick={() => setFilter('employer_contribution')}
                    >
                        Employer
                    </button>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Pay Element
                </Button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="settings-table-container">
                    <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading...</div>
                </div>
            ) : filteredElements.length === 0 ? (
                <div className="settings-empty">
                    <div className="settings-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <p className="settings-empty-text">No pay elements found</p>
                    <p className="settings-empty-hint">Click Add Pay Element to create your first one</p>
                </div>
            ) : (
                <div className="settings-table-container">
                    <table className="settings-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Type</th>
                                <th>Calculation</th>
                                <th>Tax</th>
                                <th>UIF</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredElements.map(element => (
                                <tr key={element.id}>
                                    <td><strong>{element.name}</strong></td>
                                    <td><code className="settings-card-code">{element.code}</code></td>
                                    <td>
                                        <span className={`settings-badge settings-badge--${element.type === 'earning' ? 'earning' : element.type === 'deduction' ? 'deduction' : 'employer'}`}>
                                            {element.type === 'earning' ? 'Earning' :
                                             element.type === 'deduction' ? 'Deduction' : 'Employer'}
                                        </span>
                                    </td>
                                    <td>
                                        {element.calculationMethod === 'fixed' && 'Fixed'}
                                        {element.calculationMethod === 'percentage' && `${element.defaultPercentage || 0}%`}
                                        {element.calculationMethod === 'hourly' && 'Hourly'}
                                        {element.calculationMethod === 'daily' && 'Daily'}
                                        {element.calculationMethod === 'formula' && 'Formula'}
                                    </td>
                                    <td>
                                        {element.isTaxable ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--speccon-success)" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--speccon-text-disabled)" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        )}
                                    </td>
                                    <td>
                                        {element.isUifApplicable ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--speccon-success)" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--speccon-text-disabled)" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`settings-badge ${element.isActive ? 'settings-badge--active' : 'settings-badge--inactive'}`}>
                                            {element.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="settings-card-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button className="action-btn action-btn--icon" onClick={() => handleEdit(element)} title="Edit">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button className="action-btn action-btn--icon" onClick={() => handleDelete(element.id)} title="Delete">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <PayElementModal
                    item={editingItem}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}

function PayElementModal({ item, onSave, onClose }: {
    item: PayElement | null;
    onSave: (data: Partial<PayElement>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<PayElement>>(item || {
        name: '',
        code: '',
        type: 'earning',
        calculationMethod: 'fixed',
        isTaxable: true,
        isUifApplicable: true,
        isSdlApplicable: true,
        isPensionApplicable: false,
        isRecurring: true
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
                <div className="settings-modal-header">
                    <h3 className="settings-modal-title">{item ? 'Edit' : 'Add'} Pay Element</h3>
                    <button className="settings-modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="settings-modal-body">
                        <div className="settings-form-grid">
                            <div className="settings-field">
                                <label className="settings-field-label">Name<span>*</span></label>
                                <input
                                    type="text"
                                    className="settings-field-input"
                                    value={formData.name || ''}
                                    onChange={e => handleChange('name', e.target.value)}
                                    placeholder="e.g., Basic Salary"
                                    required
                                />
                            </div>
                            <div className="settings-field">
                                <label className="settings-field-label">Code<span>*</span></label>
                                <input
                                    type="text"
                                    className="settings-field-input"
                                    value={formData.code || ''}
                                    onChange={e => handleChange('code', e.target.value.toUpperCase())}
                                    placeholder="e.g., BASIC"
                                    required
                                />
                            </div>
                            <div className="settings-field">
                                <label className="settings-field-label">Type<span>*</span></label>
                                <select
                                    className="settings-field-input settings-field-select"
                                    value={formData.type || 'earning'}
                                    onChange={e => handleChange('type', e.target.value)}
                                    required
                                >
                                    {PAY_ELEMENT_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="settings-field">
                                <label className="settings-field-label">Calculation Method<span>*</span></label>
                                <select
                                    className="settings-field-input settings-field-select"
                                    value={formData.calculationMethod || 'fixed'}
                                    onChange={e => handleChange('calculationMethod', e.target.value)}
                                    required
                                >
                                    {CALCULATION_METHODS.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.calculationMethod === 'fixed' && (
                                <div className="settings-field">
                                    <label className="settings-field-label">Default Amount</label>
                                    <input
                                        type="number"
                                        className="settings-field-input"
                                        value={formData.defaultAmount || ''}
                                        onChange={e => handleChange('defaultAmount', parseFloat(e.target.value))}
                                        placeholder="0.00"
                                    />
                                </div>
                            )}

                            {formData.calculationMethod === 'percentage' && (
                                <div className="settings-field">
                                    <label className="settings-field-label">Default Percentage</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="settings-field-input"
                                        value={formData.defaultPercentage || ''}
                                        onChange={e => handleChange('defaultPercentage', parseFloat(e.target.value))}
                                        placeholder="0.00"
                                    />
                                </div>
                            )}

                            <div className="settings-field">
                                <label className="settings-field-label">GL Code</label>
                                <input
                                    type="text"
                                    className="settings-field-input"
                                    value={formData.glCode || ''}
                                    onChange={e => handleChange('glCode', e.target.value)}
                                    placeholder="General ledger code"
                                />
                            </div>
                        </div>

                        {/* Tax Applicability */}
                        <div style={{ marginTop: 'var(--space-6)' }}>
                            <label className="settings-field-label" style={{ marginBottom: 'var(--space-4)' }}>
                                Tax & Statutory Applicability
                            </label>
                            <div className="pay-element-checkboxes">
                                <label className="pay-element-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.isTaxable || false}
                                        onChange={e => handleChange('isTaxable', e.target.checked)}
                                    />
                                    <span>Taxable (PAYE)</span>
                                </label>
                                <label className="pay-element-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.isUifApplicable || false}
                                        onChange={e => handleChange('isUifApplicable', e.target.checked)}
                                    />
                                    <span>UIF Applicable</span>
                                </label>
                                <label className="pay-element-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.isSdlApplicable || false}
                                        onChange={e => handleChange('isSdlApplicable', e.target.checked)}
                                    />
                                    <span>SDL Applicable</span>
                                </label>
                                <label className="pay-element-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPensionApplicable || false}
                                        onChange={e => handleChange('isPensionApplicable', e.target.checked)}
                                    />
                                    <span>Pension Applicable</span>
                                </label>
                                <label className="pay-element-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRecurring || false}
                                        onChange={e => handleChange('isRecurring', e.target.checked)}
                                    />
                                    <span>Recurring (every pay period)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="settings-modal-footer">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary">{item ? 'Save Changes' : 'Create'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
