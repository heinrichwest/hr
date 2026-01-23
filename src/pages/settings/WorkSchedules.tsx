import { useEffect, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { CompanyService } from '../../services/companyService';
import type { WorkSchedule } from '../../types/company';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function WorkSchedules() {
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<WorkSchedule | null>(null);

    useEffect(() => {
        loadCompanyId();
    }, []);

    useEffect(() => {
        if (companyId) {
            loadSchedules();
        }
    }, [companyId]);

    const loadCompanyId = async () => {
        const company = await CompanyService.getDefaultCompany();
        if (company) {
            setCompanyId(company.id);
        }
        setLoading(false);
    };

    const loadSchedules = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const data = await CompanyService.getWorkSchedules(companyId);
            setSchedules(data);
        } catch (error) {
            console.error('Failed to load schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleEdit = (item: WorkSchedule) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this work schedule?')) return;
        try {
            await CompanyService.deleteWorkSchedule(id);
            loadSchedules();
        } catch (error) {
            alert('Failed to delete schedule');
        }
    };

    const handleSave = async (data: Partial<WorkSchedule>) => {
        if (!companyId) return;
        try {
            const itemData = { ...data, companyId, isActive: true };
            if (editingItem) {
                await CompanyService.updateWorkSchedule(editingItem.id, itemData);
            } else {
                await CompanyService.createWorkSchedule(itemData as Omit<WorkSchedule, 'id' | 'createdAt'>);
            }
            setShowModal(false);
            loadSchedules();
        } catch (error) {
            alert('Failed to save schedule');
        }
    };

    const getTotalHours = (schedule: WorkSchedule) => {
        return (
            schedule.mondayHours +
            schedule.tuesdayHours +
            schedule.wednesdayHours +
            schedule.thursdayHours +
            schedule.fridayHours +
            schedule.saturdayHours +
            schedule.sundayHours
        );
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
                    Please set up your company profile first before configuring work schedules.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="settings-section-header">
                <div>
                    <h3 className="settings-section-title">Work Schedules</h3>
                    <p className="settings-section-subtitle">
                        Define working hours and overtime rates for different employee groups
                    </p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Schedule
                </Button>
            </div>

            {/* Schedules Grid */}
            {loading ? (
                <div className="settings-card-grid">
                    {[1, 2].map(i => (
                        <div key={i} className="settings-card">
                            <div className="settings-skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }} />
                            <div className="settings-skeleton" style={{ height: 14, width: '40%', marginBottom: 16 }} />
                            <div className="settings-skeleton" style={{ height: 100 }} />
                        </div>
                    ))}
                </div>
            ) : schedules.length === 0 ? (
                <div className="settings-empty">
                    <div className="settings-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <p className="settings-empty-text">No work schedules defined</p>
                    <p className="settings-empty-hint">Click Add Schedule to create your first work schedule</p>
                </div>
            ) : (
                <div className="schedules-grid">
                    {schedules.map(schedule => (
                        <div key={schedule.id} className="schedule-card">
                            <div className="schedule-card-header">
                                <div>
                                    <h4 className="schedule-card-title">{schedule.name}</h4>
                                    <span className="settings-card-code">{schedule.code}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    {schedule.isDefault && (
                                        <span className="settings-badge settings-badge--active">Default</span>
                                    )}
                                    <span className={`settings-badge ${schedule.isActive ? 'settings-badge--active' : 'settings-badge--inactive'}`}>
                                        {schedule.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {schedule.description && (
                                <p className="schedule-card-desc">{schedule.description}</p>
                            )}

                            {/* Hours Bar Chart */}
                            <div className="schedule-hours">
                                <div className="schedule-hours-header">
                                    <span>Weekly Hours</span>
                                    <strong>{getTotalHours(schedule)}h</strong>
                                </div>
                                <div className="schedule-hours-chart">
                                    {[
                                        schedule.mondayHours,
                                        schedule.tuesdayHours,
                                        schedule.wednesdayHours,
                                        schedule.thursdayHours,
                                        schedule.fridayHours,
                                        schedule.saturdayHours,
                                        schedule.sundayHours
                                    ].map((hours, i) => (
                                        <div key={i} className="schedule-hours-bar">
                                            <div
                                                className="schedule-hours-bar-fill"
                                                style={{ height: `${(hours / 12) * 100}%` }}
                                            />
                                            <span className="schedule-hours-bar-label">{DAYS[i].slice(0, 1)}</span>
                                            <span className="schedule-hours-bar-value">{hours}h</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Multipliers */}
                            <div className="schedule-multipliers">
                                <div className="schedule-multiplier">
                                    <span className="schedule-multiplier-label">Overtime</span>
                                    <span className="schedule-multiplier-value">{schedule.overtimeMultiplier}x</span>
                                </div>
                                <div className="schedule-multiplier">
                                    <span className="schedule-multiplier-label">Sunday</span>
                                    <span className="schedule-multiplier-value">{schedule.sundayMultiplier}x</span>
                                </div>
                                <div className="schedule-multiplier">
                                    <span className="schedule-multiplier-label">Public Holiday</span>
                                    <span className="schedule-multiplier-value">{schedule.publicHolidayMultiplier}x</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="schedule-card-actions">
                                <button className="action-btn" onClick={() => handleEdit(schedule)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Edit
                                </button>
                                <button className="action-btn action-btn--icon" onClick={() => handleDelete(schedule.id)} title="Delete">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <ScheduleModal
                    item={editingItem}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}

function ScheduleModal({ item, onSave, onClose }: {
    item: WorkSchedule | null;
    onSave: (data: Partial<WorkSchedule>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<WorkSchedule>>(item || {
        name: '',
        code: '',
        description: '',
        mondayHours: 8,
        tuesdayHours: 8,
        wednesdayHours: 8,
        thursdayHours: 8,
        fridayHours: 8,
        saturdayHours: 0,
        sundayHours: 0,
        overtimeMultiplier: 1.5,
        sundayMultiplier: 2.0,
        publicHolidayMultiplier: 2.0,
        isDefault: false
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
                    <h3 className="settings-modal-title">{item ? 'Edit' : 'Add'} Work Schedule</h3>
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
                                <label htmlFor="schedule-name" className="settings-field-label">Name<span>*</span></label>
                                <input
                                    id="schedule-name"
                                    type="text"
                                    className="settings-field-input"
                                    value={formData.name || ''}
                                    onChange={e => handleChange('name', e.target.value)}
                                    placeholder="e.g., Standard (Mon-Fri)"
                                    required
                                />
                            </div>
                            <div className="settings-field">
                                <label htmlFor="schedule-code" className="settings-field-label">Code<span>*</span></label>
                                <input
                                    id="schedule-code"
                                    type="text"
                                    className="settings-field-input"
                                    value={formData.code || ''}
                                    onChange={e => handleChange('code', e.target.value.toUpperCase())}
                                    placeholder="e.g., STD"
                                    required
                                />
                            </div>
                            <div className="settings-field settings-form-grid--full">
                                <label htmlFor="schedule-description" className="settings-field-label">Description</label>
                                <textarea
                                    id="schedule-description"
                                    className="settings-field-input settings-field-textarea"
                                    value={formData.description || ''}
                                    onChange={e => handleChange('description', e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Daily Hours */}
                        <div style={{ marginTop: 'var(--space-6)' }}>
                            <label className="settings-field-label" style={{ marginBottom: 'var(--space-4)' }}>
                                Daily Working Hours
                            </label>
                            <div className="schedule-hours-inputs">
                                {DAYS.map((day) => {
                                    const field = `${day.toLowerCase()}Hours` as keyof WorkSchedule;
                                    return (
                                        <div key={day} className="schedule-hours-input">
                                            <label htmlFor={`schedule-${day.toLowerCase()}-hours`}>{day.slice(0, 3)}</label>
                                            <input
                                                id={`schedule-${day.toLowerCase()}-hours`}
                                                type="number"
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                value={(formData as any)[field] || 0}
                                                onChange={e => handleChange(field, parseFloat(e.target.value))}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Overtime Multipliers */}
                        <div style={{ marginTop: 'var(--space-6)' }}>
                            <label className="settings-field-label" style={{ marginBottom: 'var(--space-4)' }}>
                                Overtime Multipliers
                            </label>
                            <div className="settings-form-grid settings-form-grid--3col">
                                <div className="settings-field">
                                    <label htmlFor="schedule-overtime-multiplier" className="settings-field-label">Standard Overtime</label>
                                    <input
                                        id="schedule-overtime-multiplier"
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        className="settings-field-input"
                                        value={formData.overtimeMultiplier || 1.5}
                                        onChange={e => handleChange('overtimeMultiplier', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="settings-field">
                                    <label htmlFor="schedule-sunday-multiplier" className="settings-field-label">Sunday Rate</label>
                                    <input
                                        id="schedule-sunday-multiplier"
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        className="settings-field-input"
                                        value={formData.sundayMultiplier || 2.0}
                                        onChange={e => handleChange('sundayMultiplier', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="settings-field">
                                    <label htmlFor="schedule-public-holiday-multiplier" className="settings-field-label">Public Holiday Rate</label>
                                    <input
                                        id="schedule-public-holiday-multiplier"
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        className="settings-field-input"
                                        value={formData.publicHolidayMultiplier || 2.0}
                                        onChange={e => handleChange('publicHolidayMultiplier', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--space-4)' }}>
                            <label htmlFor="schedule-is-default" className="pay-element-checkbox">
                                <input
                                    id="schedule-is-default"
                                    type="checkbox"
                                    checked={formData.isDefault || false}
                                    onChange={e => handleChange('isDefault', e.target.checked)}
                                />
                                <span>Set as default schedule for new employees</span>
                            </label>
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
