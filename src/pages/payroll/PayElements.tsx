// ============================================================
// PAY ELEMENTS - Manage pay element definitions
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { PayrollService } from '../../services/payrollService';
import type { PayElement, PayElementType } from '../../types/company';
import './Payroll.css';

type ElementFilter = 'all' | 'earning' | 'deduction' | 'employer_contribution';

const TYPE_LABELS: Record<PayElementType, string> = {
    earning: 'Earning',
    deduction: 'Deduction',
    employer_contribution: 'Employer Contribution'
};

export function PayElements() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [elements, setElements] = useState<PayElement[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<ElementFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingElement, setEditingElement] = useState<PayElement | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<PayElement>>({
        code: '',
        name: '',
        type: 'earning',
        calculationMethod: 'fixed',
        isTaxable: true,
        isUifApplicable: false,
        isSdlApplicable: false,
        isPensionApplicable: false,
        isRecurring: true,
        isActive: true,
        sortOrder: 0
    });

    useEffect(() => {
        loadPayElements();
    }, [userProfile?.companyId]);

    const loadPayElements = async () => {
        if (!userProfile?.companyId) return;

        try {
            setLoading(true);
            const data = await PayrollService.getPayElements(userProfile.companyId);
            setElements(data);
        } catch (error) {
            console.error('Error loading pay elements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedDefaults = async () => {
        if (!userProfile?.companyId) return;

        try {
            setSaving(true);
            await PayrollService.seedDefaultPayElements(userProfile.companyId);
            await loadPayElements();
        } catch (error) {
            console.error('Error seeding defaults:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenModal = (element?: PayElement) => {
        if (element) {
            setEditingElement(element);
            setFormData({
                code: element.code,
                name: element.name,
                type: element.type,
                calculationMethod: element.calculationMethod,
                defaultAmount: element.defaultAmount,
                defaultPercentage: element.defaultPercentage,
                isTaxable: element.isTaxable,
                isUifApplicable: element.isUifApplicable,
                isSdlApplicable: element.isSdlApplicable,
                isPensionApplicable: element.isPensionApplicable,
                glCode: element.glCode,
                isRecurring: element.isRecurring,
                isActive: element.isActive,
                sortOrder: element.sortOrder
            });
        } else {
            setEditingElement(null);
            setFormData({
                code: '',
                name: '',
                type: 'earning',
                calculationMethod: 'fixed',
                isTaxable: true,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: elements.length + 1
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingElement(null);
        setFormData({});
    };

    const handleSave = async () => {
        if (!userProfile?.companyId || !formData.code || !formData.name) return;

        try {
            setSaving(true);

            if (editingElement) {
                await PayrollService.updatePayElement(editingElement.id, formData);
            } else {
                await PayrollService.createPayElement({
                    ...formData as Omit<PayElement, 'id' | 'createdAt'>,
                    companyId: userProfile.companyId
                });
            }

            await loadPayElements();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving pay element:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (elementId: string) => {
        if (!confirm('Are you sure you want to delete this pay element?')) return;

        try {
            await PayrollService.deletePayElement(elementId);
            await loadPayElements();
        } catch (error) {
            console.error('Error deleting pay element:', error);
        }
    };

    const handleToggleActive = async (element: PayElement) => {
        try {
            await PayrollService.updatePayElement(element.id, {
                isActive: !element.isActive
            });
            await loadPayElements();
        } catch (error) {
            console.error('Error toggling active status:', error);
        }
    };

    // Filter elements
    const filteredElements = elements.filter(el => {
        if (activeFilter !== 'all' && el.type !== activeFilter) return false;

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            if (!el.code.toLowerCase().includes(search) &&
                !el.name.toLowerCase().includes(search)) return false;
        }

        return true;
    });

    // Group by type
    const earningElements = filteredElements.filter(e => e.type === 'earning');
    const deductionElements = filteredElements.filter(e => e.type === 'deduction');
    const contributionElements = filteredElements.filter(e => e.type === 'employer_contribution');

    return (
        <MainLayout>
            {/* Header */}
            <div className="payroll-header">
                <div className="payroll-header-content">
                    <h1 className="payroll-title">Pay Elements</h1>
                    <p className="payroll-subtitle">Define earnings, deductions, and employer contributions for payroll</p>
                </div>
                <div className="payroll-header-actions">
                    <Button variant="ghost" onClick={() => navigate('/payroll')}>
                        <ArrowLeftIcon />
                        Back to Payroll
                    </Button>
                    {elements.length === 0 && (
                        <Button variant="secondary" onClick={handleSeedDefaults} disabled={saving}>
                            <RefreshIcon />
                            Load SA Defaults
                        </Button>
                    )}
                    <Button variant="primary" onClick={() => handleOpenModal()}>
                        <PlusIcon />
                        Add Element
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="payroll-stats">
                <div className="payroll-stat-card" onClick={() => setActiveFilter('all')} style={{ cursor: 'pointer' }}>
                    <div className="payroll-stat-value">{elements.length}</div>
                    <div className="payroll-stat-label">Total Elements</div>
                </div>
                <div className="payroll-stat-card payroll-stat-card--approved" onClick={() => setActiveFilter('earning')} style={{ cursor: 'pointer' }}>
                    <div className="payroll-stat-value">{earningElements.length}</div>
                    <div className="payroll-stat-label">Earnings</div>
                </div>
                <div className="payroll-stat-card payroll-stat-card--processing" onClick={() => setActiveFilter('deduction')} style={{ cursor: 'pointer' }}>
                    <div className="payroll-stat-value">{deductionElements.length}</div>
                    <div className="payroll-stat-label">Deductions</div>
                </div>
                <div className="payroll-stat-card payroll-stat-card--total" onClick={() => setActiveFilter('employer_contribution')} style={{ cursor: 'pointer' }}>
                    <div className="payroll-stat-value">{contributionElements.length}</div>
                    <div className="payroll-stat-label">Employer Contributions</div>
                </div>
            </div>

            {/* Filters */}
            <div className="payroll-filters">
                <div className="payroll-filter-search">
                    <SearchIcon />
                    <input
                        type="text"
                        className="payroll-filter-input"
                        placeholder="Search pay elements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="payroll-filter-selects">
                    <select
                        className="payroll-filter-select"
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value as ElementFilter)}
                    >
                        <option value="all">All Types</option>
                        <option value="earning">Earnings</option>
                        <option value="deduction">Deductions</option>
                        <option value="employer_contribution">Employer Contributions</option>
                    </select>
                </div>
            </div>

            {/* Elements Grid */}
            {loading ? (
                <div className="payroll-empty-state">
                    <div className="payroll-empty-icon">
                        <LoadingIcon />
                    </div>
                    <p className="payroll-empty-text">Loading pay elements...</p>
                </div>
            ) : filteredElements.length === 0 ? (
                <div className="payroll-empty-state">
                    <div className="payroll-empty-icon">
                        <LayoutIcon />
                    </div>
                    <p className="payroll-empty-text">
                        {elements.length === 0 ? 'No pay elements defined' : 'No matching elements'}
                    </p>
                    <p className="payroll-empty-hint">
                        {elements.length === 0
                            ? 'Load South African defaults or create custom elements'
                            : 'Try adjusting your filters'}
                    </p>
                    {elements.length === 0 && (
                        <Button variant="primary" onClick={handleSeedDefaults} disabled={saving} style={{ marginTop: '16px' }}>
                            <RefreshIcon />
                            Load SA Defaults
                        </Button>
                    )}
                </div>
            ) : (
                <div className="pay-elements-grid">
                    {filteredElements.map(element => (
                        <div key={element.id} className={`pay-element-card ${!element.isActive ? 'pay-element-card--inactive' : ''}`}>
                            <div className="pay-element-card-header">
                                <div className="pay-element-card-type">
                                    <span className={`pay-element-card-type-badge pay-element-card-type-badge--${element.type}`}>
                                        {TYPE_LABELS[element.type]}
                                    </span>
                                </div>
                                {!element.isActive && (
                                    <span className="payroll-status-badge payroll-status-badge--draft">Inactive</span>
                                )}
                            </div>
                            <div className="pay-element-card-body">
                                <h3 className="pay-element-card-name">{element.name}</h3>
                                <p className="pay-element-card-code">{element.code}</p>

                                <div className="pay-element-tax-indicators">
                                    <span className={`pay-element-tax-indicator ${element.isTaxable ? 'pay-element-tax-indicator--active' : ''}`}>
                                        {element.isTaxable ? 'Taxable' : 'Non-Taxable'}
                                    </span>
                                    {element.isUifApplicable && (
                                        <span className="pay-element-tax-indicator pay-element-tax-indicator--active">UIF</span>
                                    )}
                                    {element.isSdlApplicable && (
                                        <span className="pay-element-tax-indicator pay-element-tax-indicator--active">SDL</span>
                                    )}
                                </div>

                                {element.glCode && (
                                    <div className="pay-element-card-details" style={{ marginTop: '12px' }}>
                                        <div className="pay-element-card-detail" style={{ gridColumn: '1 / -1' }}>
                                            <span className="pay-element-card-detail-label">GL Code</span>
                                            <span className="pay-element-card-detail-value">{element.glCode}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="pay-element-card-actions">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenModal(element)}>
                                    <EditIcon />
                                    Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(element)}>
                                    {element.isActive ? <EyeOffIcon /> : <EyeIcon />}
                                    {element.isActive ? 'Disable' : 'Enable'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(element.id)}>
                                    <TrashIcon />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="payroll-modal" onClick={handleCloseModal}>
                    <div className="payroll-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
                        <div className="payroll-modal-header">
                            <h2 className="payroll-modal-title">
                                {editingElement ? 'Edit Pay Element' : 'Add Pay Element'}
                            </h2>
                            <button className="payroll-modal-close" onClick={handleCloseModal}>
                                <XIcon />
                            </button>
                        </div>
                        <div className="payroll-modal-body">
                            <div className="pay-element-form-grid">
                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">
                                        Code <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="pay-element-form-input"
                                        value={formData.code || ''}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., BASIC, OT_1.5"
                                    />
                                </div>
                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">
                                        Type <span>*</span>
                                    </label>
                                    <select
                                        className="pay-element-form-select"
                                        value={formData.type || 'earning'}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as PayElementType })}
                                    >
                                        <option value="earning">Earning</option>
                                        <option value="deduction">Deduction</option>
                                        <option value="employer_contribution">Employer Contribution</option>
                                    </select>
                                </div>
                                <div className="pay-element-form-field pay-element-form-grid--full">
                                    <label className="pay-element-form-label">
                                        Name <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="pay-element-form-input"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Basic Salary"
                                    />
                                </div>
                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">Calculation Method</label>
                                    <select
                                        className="pay-element-form-select"
                                        value={formData.calculationMethod || 'fixed'}
                                        onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value as 'fixed' | 'percentage' | 'hourly' | 'daily' | 'formula' })}
                                    >
                                        <option value="fixed">Fixed Amount</option>
                                        <option value="percentage">Percentage</option>
                                        <option value="hourly">Hourly Rate</option>
                                        <option value="daily">Daily Rate</option>
                                        <option value="formula">Formula</option>
                                    </select>
                                </div>
                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">GL Code</label>
                                    <input
                                        type="text"
                                        className="pay-element-form-input"
                                        value={formData.glCode || ''}
                                        onChange={(e) => setFormData({ ...formData, glCode: e.target.value })}
                                        placeholder="e.g., 5000-10"
                                    />
                                </div>
                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">Sort Order</label>
                                    <input
                                        type="number"
                                        className="pay-element-form-input"
                                        value={formData.sortOrder || 0}
                                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="pay-element-form-field pay-element-form-grid--full">
                                    <label className="pay-element-form-label">Tax Treatment</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div className="pay-element-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="isTaxable"
                                                checked={formData.isTaxable || false}
                                                onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
                                            />
                                            <label htmlFor="isTaxable">Taxable (subject to PAYE)</label>
                                        </div>
                                        <div className="pay-element-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="isUifApplicable"
                                                checked={formData.isUifApplicable || false}
                                                onChange={(e) => setFormData({ ...formData, isUifApplicable: e.target.checked })}
                                            />
                                            <label htmlFor="isUifApplicable">UIF Applicable</label>
                                        </div>
                                        <div className="pay-element-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="isSdlApplicable"
                                                checked={formData.isSdlApplicable || false}
                                                onChange={(e) => setFormData({ ...formData, isSdlApplicable: e.target.checked })}
                                            />
                                            <label htmlFor="isSdlApplicable">SDL Applicable</label>
                                        </div>
                                        <div className="pay-element-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="isPensionApplicable"
                                                checked={formData.isPensionApplicable || false}
                                                onChange={(e) => setFormData({ ...formData, isPensionApplicable: e.target.checked })}
                                            />
                                            <label htmlFor="isPensionApplicable">Pension Applicable</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="pay-element-form-field pay-element-form-grid--full">
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div className="pay-element-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="isRecurring"
                                                checked={formData.isRecurring !== false}
                                                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                            />
                                            <label htmlFor="isRecurring">Recurring</label>
                                        </div>
                                        <div className="pay-element-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                checked={formData.isActive !== false}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                            <label htmlFor="isActive">Active</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="payroll-modal-footer">
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSave} disabled={saving || !formData.code || !formData.name}>
                                {saving ? <LoadingIcon /> : <SaveIcon />}
                                {editingElement ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

// Icon Components
function ArrowLeftIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function RefreshIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg className="payroll-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function LayoutIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function SaveIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </svg>
    );
}

function LoadingIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
    );
}
