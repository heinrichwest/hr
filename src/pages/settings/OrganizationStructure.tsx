import { useEffect, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { CompanyService } from '../../services/companyService';
import type { Branch, Department, JobTitle, JobGrade, CostCentre } from '../../types/company';

type OrgTab = 'branches' | 'departments' | 'jobTitles' | 'jobGrades' | 'costCentres';

export function OrganizationStructure() {
    const [activeTab, setActiveTab] = useState<OrgTab>('departments');
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Data states
    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [jobGrades, setJobGrades] = useState<JobGrade[]>([]);
    const [costCentres, setCostCentres] = useState<CostCentre[]>([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        loadCompanyId();
    }, []);

    useEffect(() => {
        if (companyId) {
            loadData();
        }
    }, [companyId, activeTab]);

    const loadCompanyId = async () => {
        const company = await CompanyService.getDefaultCompany();
        if (company) {
            setCompanyId(company.id);
        }
        setLoading(false);
    };

    const loadData = async () => {
        if (!companyId) return;
        setLoading(true);

        try {
            switch (activeTab) {
                case 'branches':
                    setBranches(await CompanyService.getBranches(companyId));
                    break;
                case 'departments':
                    setDepartments(await CompanyService.getDepartments(companyId));
                    break;
                case 'jobTitles':
                    setJobTitles(await CompanyService.getJobTitles(companyId));
                    break;
                case 'jobGrades':
                    setJobGrades(await CompanyService.getJobGrades(companyId));
                    break;
                case 'costCentres':
                    setCostCentres(await CompanyService.getCostCentres(companyId));
                    break;
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            switch (activeTab) {
                case 'branches':
                    await CompanyService.deleteBranch(id);
                    break;
                case 'departments':
                    await CompanyService.deleteDepartment(id);
                    break;
                case 'jobTitles':
                    await CompanyService.deleteJobTitle(id);
                    break;
                case 'jobGrades':
                    await CompanyService.deleteJobGrade(id);
                    break;
                case 'costCentres':
                    await CompanyService.deleteCostCentre(id);
                    break;
            }
            loadData();
        } catch (error) {
            alert('Failed to delete item');
        }
    };

    const handleSave = async (data: any) => {
        if (!companyId) return;

        try {
            const itemData = { ...data, companyId, isActive: true };

            switch (activeTab) {
                case 'branches':
                    if (editingItem) {
                        await CompanyService.updateBranch(editingItem.id, itemData);
                    } else {
                        await CompanyService.createBranch(itemData);
                    }
                    break;
                case 'departments':
                    if (editingItem) {
                        await CompanyService.updateDepartment(editingItem.id, itemData);
                    } else {
                        await CompanyService.createDepartment(itemData);
                    }
                    break;
                case 'jobTitles':
                    if (editingItem) {
                        await CompanyService.updateJobTitle(editingItem.id, itemData);
                    } else {
                        await CompanyService.createJobTitle(itemData);
                    }
                    break;
                case 'jobGrades':
                    if (editingItem) {
                        await CompanyService.updateJobGrade(editingItem.id, itemData);
                    } else {
                        await CompanyService.createJobGrade(itemData);
                    }
                    break;
                case 'costCentres':
                    if (editingItem) {
                        await CompanyService.updateCostCentre(editingItem.id, itemData);
                    } else {
                        await CompanyService.createCostCentre(itemData);
                    }
                    break;
            }

            setShowModal(false);
            loadData();
        } catch (error) {
            alert('Failed to save item');
        }
    };

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
                    Please set up your company profile first before configuring the organization structure.
                </p>
            </div>
        );
    }

    const tabs: { id: OrgTab; label: string; count: number }[] = [
        { id: 'departments', label: 'Departments', count: departments.length },
        { id: 'branches', label: 'Branches', count: branches.length },
        { id: 'jobTitles', label: 'Job Titles', count: jobTitles.length },
        { id: 'jobGrades', label: 'Job Grades', count: jobGrades.length },
        { id: 'costCentres', label: 'Cost Centres', count: costCentres.length }
    ];

    return (
        <>
            {/* Sub-tabs */}
            <div className="org-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`org-tab ${activeTab === tab.id ? 'org-tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        <span className="org-tab-count">{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Header with Add Button */}
            <div className="settings-section-header" style={{ marginTop: 'var(--space-6)' }}>
                <div>
                    <h3 className="settings-section-title">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h3>
                    <p className="settings-section-subtitle">
                        {activeTab === 'departments' && 'Organizational departments and teams'}
                        {activeTab === 'branches' && 'Company branches and locations'}
                        {activeTab === 'jobTitles' && 'Employee job titles and positions'}
                        {activeTab === 'jobGrades' && 'Salary grades and levels'}
                        {activeTab === 'costCentres' && 'Cost allocation centres for accounting'}
                    </p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add {activeTab === 'branches' ? 'Branch' :
                         activeTab === 'departments' ? 'Department' :
                         activeTab === 'jobTitles' ? 'Job Title' :
                         activeTab === 'jobGrades' ? 'Job Grade' : 'Cost Centre'}
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="settings-card-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="settings-card">
                            <div className="settings-skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }} />
                            <div className="settings-skeleton" style={{ height: 14, width: '40%', marginBottom: 16 }} />
                            <div className="settings-skeleton" style={{ height: 32 }} />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {activeTab === 'departments' && (
                        <DepartmentsGrid
                            items={departments}
                            branches={branches}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                    {activeTab === 'branches' && (
                        <BranchesGrid items={branches} onEdit={handleEdit} onDelete={handleDelete} />
                    )}
                    {activeTab === 'jobTitles' && (
                        <JobTitlesGrid
                            items={jobTitles}
                            grades={jobGrades}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                    {activeTab === 'jobGrades' && (
                        <JobGradesGrid items={jobGrades} onEdit={handleEdit} onDelete={handleDelete} />
                    )}
                    {activeTab === 'costCentres' && (
                        <CostCentresGrid
                            items={costCentres}
                            departments={departments}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </>
            )}

            {/* Modal */}
            {showModal && (
                <OrgModal
                    type={activeTab}
                    item={editingItem}
                    branches={branches}
                    departments={departments}
                    grades={jobGrades}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}

// Grid Components
function DepartmentsGrid({ items, branches, onEdit, onDelete }: {
    items: Department[];
    branches: Branch[];
    onEdit: (item: Department) => void;
    onDelete: (id: string) => void;
}) {
    const getBranchName = (branchId?: string) => {
        if (!branchId) return null;
        return branches.find(b => b.id === branchId)?.name;
    };

    if (items.length === 0) {
        return <EmptyState type="departments" />;
    }

    return (
        <div className="settings-card-grid">
            {items.map(item => (
                <div key={item.id} className="settings-card">
                    <div className="settings-card-header">
                        <h4 className="settings-card-title">{item.name}</h4>
                        <span className="settings-card-code">{item.code}</span>
                    </div>
                    <p className="settings-card-desc">
                        {item.description || 'No description'}
                    </p>
                    <div className="settings-card-meta">
                        <span className={`settings-badge ${item.isActive ? 'settings-badge--active' : 'settings-badge--inactive'}`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {getBranchName(item.branchId) && (
                            <span className="settings-card-branch">{getBranchName(item.branchId)}</span>
                        )}
                        <div className="settings-card-actions">
                            <button className="action-btn action-btn--icon" onClick={() => onEdit(item)} title="Edit">
                                <EditIcon />
                            </button>
                            <button className="action-btn action-btn--icon" onClick={() => onDelete(item.id)} title="Delete">
                                <DeleteIcon />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function BranchesGrid({ items, onEdit, onDelete }: {
    items: Branch[];
    onEdit: (item: Branch) => void;
    onDelete: (id: string) => void;
}) {
    if (items.length === 0) {
        return <EmptyState type="branches" />;
    }

    return (
        <div className="settings-card-grid">
            {items.map(item => (
                <div key={item.id} className="settings-card">
                    <div className="settings-card-header">
                        <h4 className="settings-card-title">{item.name}</h4>
                        <span className="settings-card-code">{item.code}</span>
                    </div>
                    <p className="settings-card-desc">
                        {item.address?.city ? `${item.address.city}, ${item.address.province}` : 'No address'}
                    </p>
                    <div className="settings-card-meta">
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <span className={`settings-badge ${item.isActive ? 'settings-badge--active' : 'settings-badge--inactive'}`}>
                                {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {item.isHeadOffice && (
                                <span className="settings-badge settings-badge--earning">Head Office</span>
                            )}
                        </div>
                        <div className="settings-card-actions">
                            <button className="action-btn action-btn--icon" onClick={() => onEdit(item)} title="Edit">
                                <EditIcon />
                            </button>
                            <button className="action-btn action-btn--icon" onClick={() => onDelete(item.id)} title="Delete">
                                <DeleteIcon />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function JobTitlesGrid({ items, grades, onEdit, onDelete }: {
    items: JobTitle[];
    grades: JobGrade[];
    onEdit: (item: JobTitle) => void;
    onDelete: (id: string) => void;
}) {
    const getGradeName = (gradeId?: string) => {
        if (!gradeId) return null;
        return grades.find(g => g.id === gradeId)?.name;
    };

    if (items.length === 0) {
        return <EmptyState type="job titles" />;
    }

    return (
        <div className="settings-card-grid">
            {items.map(item => (
                <div key={item.id} className="settings-card">
                    <div className="settings-card-header">
                        <h4 className="settings-card-title">{item.name}</h4>
                        <span className="settings-card-code">{item.code}</span>
                    </div>
                    <p className="settings-card-desc">
                        {item.description || 'No description'}
                    </p>
                    <div className="settings-card-meta">
                        <span className={`settings-badge ${item.isActive ? 'settings-badge--active' : 'settings-badge--inactive'}`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {getGradeName(item.gradeId) && (
                            <span className="settings-card-grade">{getGradeName(item.gradeId)}</span>
                        )}
                        <div className="settings-card-actions">
                            <button className="action-btn action-btn--icon" onClick={() => onEdit(item)} title="Edit">
                                <EditIcon />
                            </button>
                            <button className="action-btn action-btn--icon" onClick={() => onDelete(item.id)} title="Delete">
                                <DeleteIcon />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function JobGradesGrid({ items, onEdit, onDelete }: {
    items: JobGrade[];
    onEdit: (item: JobGrade) => void;
    onDelete: (id: string) => void;
}) {
    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
    };

    if (items.length === 0) {
        return <EmptyState type="job grades" />;
    }

    return (
        <div className="settings-table-container">
            <table className="settings-table">
                <thead>
                    <tr>
                        <th>Grade</th>
                        <th>Code</th>
                        <th>Level</th>
                        <th>Min Salary</th>
                        <th>Max Salary</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            <td><strong>{item.name}</strong></td>
                            <td><code className="settings-card-code">{item.code}</code></td>
                            <td>{item.level}</td>
                            <td>{formatCurrency(item.minSalary)}</td>
                            <td>{formatCurrency(item.maxSalary)}</td>
                            <td>
                                <span className={`settings-badge ${item.isActive ? 'settings-badge--active' : 'settings-badge--inactive'}`}>
                                    {item.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="text-right">
                                <div className="settings-card-actions" style={{ justifyContent: 'flex-end' }}>
                                    <button className="action-btn action-btn--icon" onClick={() => onEdit(item)} title="Edit">
                                        <EditIcon />
                                    </button>
                                    <button className="action-btn action-btn--icon" onClick={() => onDelete(item.id)} title="Delete">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CostCentresGrid({ items, departments, onEdit, onDelete }: {
    items: CostCentre[];
    departments: Department[];
    onEdit: (item: CostCentre) => void;
    onDelete: (id: string) => void;
}) {
    const getDeptName = (deptId?: string) => {
        if (!deptId) return null;
        return departments.find(d => d.id === deptId)?.name;
    };

    if (items.length === 0) {
        return <EmptyState type="cost centres" />;
    }

    return (
        <div className="settings-table-container">
            <table className="settings-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>GL Code</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            <td><strong>{item.name}</strong></td>
                            <td><code className="settings-card-code">{item.code}</code></td>
                            <td>{item.glCode || '-'}</td>
                            <td>{getDeptName(item.departmentId) || '-'}</td>
                            <td>
                                <span className={`settings-badge ${item.isActive ? 'settings-badge--active' : 'settings-badge--inactive'}`}>
                                    {item.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="text-right">
                                <div className="settings-card-actions" style={{ justifyContent: 'flex-end' }}>
                                    <button className="action-btn action-btn--icon" onClick={() => onEdit(item)} title="Edit">
                                        <EditIcon />
                                    </button>
                                    <button className="action-btn action-btn--icon" onClick={() => onDelete(item.id)} title="Delete">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EmptyState({ type }: { type: string }) {
    return (
        <div className="settings-empty">
            <div className="settings-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="17" y1="11" x2="23" y2="11" />
                </svg>
            </div>
            <p className="settings-empty-text">No {type} found</p>
            <p className="settings-empty-hint">Click the Add button to create your first {type.slice(0, -1)}</p>
        </div>
    );
}

// Modal Component
function OrgModal({ type, item, branches, departments, grades, onSave, onClose }: {
    type: OrgTab;
    item: any;
    branches: Branch[];
    departments: Department[];
    grades: JobGrade[];
    onSave: (data: any) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState(item || {});

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const getTitle = () => {
        const action = item ? 'Edit' : 'Add';
        switch (type) {
            case 'branches': return `${action} Branch`;
            case 'departments': return `${action} Department`;
            case 'jobTitles': return `${action} Job Title`;
            case 'jobGrades': return `${action} Job Grade`;
            case 'costCentres': return `${action} Cost Centre`;
        }
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h3 className="settings-modal-title">{getTitle()}</h3>
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
                                    required
                                />
                            </div>

                            {type === 'departments' && (
                                <div className="settings-field">
                                    <label className="settings-field-label">Branch</label>
                                    <select
                                        className="settings-field-input settings-field-select"
                                        value={formData.branchId || ''}
                                        onChange={e => handleChange('branchId', e.target.value)}
                                    >
                                        <option value="">No branch</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {type === 'branches' && (
                                <div className="settings-field">
                                    <label className="settings-field-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isHeadOffice || false}
                                            onChange={e => handleChange('isHeadOffice', e.target.checked)}
                                            style={{ marginRight: 8 }}
                                        />
                                        Head Office
                                    </label>
                                </div>
                            )}

                            {type === 'jobTitles' && (
                                <div className="settings-field">
                                    <label className="settings-field-label">Job Grade</label>
                                    <select
                                        className="settings-field-input settings-field-select"
                                        value={formData.gradeId || ''}
                                        onChange={e => handleChange('gradeId', e.target.value)}
                                    >
                                        <option value="">No grade</option>
                                        {grades.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {type === 'jobGrades' && (
                                <>
                                    <div className="settings-field">
                                        <label className="settings-field-label">Level<span>*</span></label>
                                        <input
                                            type="number"
                                            className="settings-field-input"
                                            value={formData.level || ''}
                                            onChange={e => handleChange('level', parseInt(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="settings-field">
                                        <label className="settings-field-label">Min Salary</label>
                                        <input
                                            type="number"
                                            className="settings-field-input"
                                            value={formData.minSalary || ''}
                                            onChange={e => handleChange('minSalary', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="settings-field">
                                        <label className="settings-field-label">Max Salary</label>
                                        <input
                                            type="number"
                                            className="settings-field-input"
                                            value={formData.maxSalary || ''}
                                            onChange={e => handleChange('maxSalary', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </>
                            )}

                            {type === 'costCentres' && (
                                <>
                                    <div className="settings-field">
                                        <label className="settings-field-label">GL Code</label>
                                        <input
                                            type="text"
                                            className="settings-field-input"
                                            value={formData.glCode || ''}
                                            onChange={e => handleChange('glCode', e.target.value)}
                                        />
                                    </div>
                                    <div className="settings-field">
                                        <label className="settings-field-label">Department</label>
                                        <select
                                            className="settings-field-input settings-field-select"
                                            value={formData.departmentId || ''}
                                            onChange={e => handleChange('departmentId', e.target.value)}
                                        >
                                            <option value="">No department</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="settings-field settings-form-grid--full">
                                <label className="settings-field-label">Description</label>
                                <textarea
                                    className="settings-field-input settings-field-textarea"
                                    value={formData.description || ''}
                                    onChange={e => handleChange('description', e.target.value)}
                                    rows={3}
                                />
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

// Icons
function EditIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    );
}
