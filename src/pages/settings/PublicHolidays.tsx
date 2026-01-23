import { useEffect, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { CompanyService } from '../../services/companyService';
import type { PublicHoliday } from '../../types/company';

export function PublicHolidays() {
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [seeding, setSeeding] = useState(false);

    const years = [
        new Date().getFullYear() - 1,
        new Date().getFullYear(),
        new Date().getFullYear() + 1
    ];

    useEffect(() => {
        loadCompanyId();
    }, []);

    useEffect(() => {
        if (companyId) {
            loadHolidays();
        }
    }, [companyId, selectedYear]);

    const loadCompanyId = async () => {
        const company = await CompanyService.getDefaultCompany();
        if (company) {
            setCompanyId(company.id);
        }
        setLoading(false);
    };

    const loadHolidays = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const data = await CompanyService.getPublicHolidays(companyId, selectedYear);
            setHolidays(data);
        } catch (error) {
            console.error('Failed to load holidays:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedHolidays = async () => {
        if (!companyId) return;
        setSeeding(true);
        try {
            await CompanyService.seedPublicHolidays(companyId, selectedYear);
            loadHolidays();
        } catch (error) {
            alert('Failed to seed holidays');
        } finally {
            setSeeding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;
        try {
            await CompanyService.deletePublicHoliday(id);
            loadHolidays();
        } catch (error) {
            alert('Failed to delete holiday');
        }
    };

    const handleSave = async (data: Partial<PublicHoliday>) => {
        if (!companyId) return;
        try {
            await CompanyService.createPublicHoliday({
                ...data,
                companyId,
                year: selectedYear
            } as Omit<PublicHoliday, 'id' | 'createdAt'>);
            setShowModal(false);
            loadHolidays();
        } catch (error) {
            alert('Failed to save holiday');
        }
    };

    const formatDate = (date: any) => {
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-ZA', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
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
                    Please set up your company profile first before configuring public holidays.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Header with Year Selector */}
            <div className="settings-section-header">
                <div>
                    <h3 className="settings-section-title">Public Holidays {selectedYear}</h3>
                    <p className="settings-section-subtitle">
                        South African public holidays and company-specific days off
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <select
                        className="settings-field-input settings-field-select"
                        value={selectedYear}
                        onChange={e => setSelectedYear(parseInt(e.target.value))}
                        style={{ width: 120 }}
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    {holidays.length === 0 && (
                        <Button variant="secondary" onClick={handleSeedHolidays} loading={seeding}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {seeding ? 'Loading...' : 'Load SA Holidays'}
                        </Button>
                    )}
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Holiday
                    </Button>
                </div>
            </div>

            {/* Holidays List */}
            {loading ? (
                <div className="settings-table-container">
                    <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading...</div>
                </div>
            ) : holidays.length === 0 ? (
                <div className="settings-empty">
                    <div className="settings-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <p className="settings-empty-text">No holidays for {selectedYear}</p>
                    <p className="settings-empty-hint">Click "Load SA Holidays" to add South African public holidays</p>
                </div>
            ) : (
                <div className="holidays-grid">
                    {holidays.map(holiday => (
                        <div key={holiday.id} className="holiday-card">
                            <div className="holiday-card-date">
                                <span className="holiday-card-day">
                                    {new Date(holiday.date as any).getDate?.() ||
                                     (holiday.date as any).toDate?.().getDate()}
                                </span>
                                <span className="holiday-card-month">
                                    {new Date(holiday.date as any).toLocaleDateString?.('en-ZA', { month: 'short' }) ||
                                     (holiday.date as any).toDate?.().toLocaleDateString('en-ZA', { month: 'short' })}
                                </span>
                            </div>
                            <div className="holiday-card-content">
                                <h4 className="holiday-card-name">{holiday.name}</h4>
                                <span className="holiday-card-full-date">{formatDate(holiday.date)}</span>
                            </div>
                            <div className="holiday-card-actions">
                                {holiday.isNational ? (
                                    <span className="settings-badge settings-badge--active">National</span>
                                ) : (
                                    <span className="settings-badge">Company</span>
                                )}
                                <button
                                    className="action-btn action-btn--icon"
                                    onClick={() => handleDelete(holiday.id)}
                                    title="Delete"
                                >
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

            {/* Add Modal */}
            {showModal && (
                <HolidayModal
                    year={selectedYear}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}

function HolidayModal({ year, onSave, onClose }: {
    year: number;
    onSave: (data: Partial<PublicHoliday>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<PublicHoliday>>({
        name: '',
        date: new Date(year, 0, 1),
        isNational: false
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="settings-modal-header">
                    <h3 className="settings-modal-title">Add Public Holiday</h3>
                    <button className="settings-modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="settings-modal-body">
                        <div className="settings-field" style={{ marginBottom: 'var(--space-4)' }}>
                            <label htmlFor="holiday-name" className="settings-field-label">Holiday Name<span>*</span></label>
                            <input
                                id="holiday-name"
                                type="text"
                                className="settings-field-input"
                                value={formData.name || ''}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Company Founders Day"
                                required
                            />
                        </div>
                        <div className="settings-field" style={{ marginBottom: 'var(--space-4)' }}>
                            <label htmlFor="holiday-date" className="settings-field-label">Date<span>*</span></label>
                            <input
                                id="holiday-date"
                                type="date"
                                className="settings-field-input"
                                value={formData.date instanceof Date
                                    ? formData.date.toISOString().split('T')[0]
                                    : ''}
                                onChange={e => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
                                required
                            />
                        </div>
                        <div className="settings-field">
                            <label htmlFor="holiday-is-national" className="pay-element-checkbox">
                                <input
                                    id="holiday-is-national"
                                    type="checkbox"
                                    checked={formData.isNational || false}
                                    onChange={e => setFormData(prev => ({ ...prev, isNational: e.target.checked }))}
                                />
                                <span>National Public Holiday</span>
                            </label>
                        </div>
                    </div>
                    <div className="settings-modal-footer">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary">Add Holiday</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
