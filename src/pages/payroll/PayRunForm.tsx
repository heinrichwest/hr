// ============================================================
// PAY RUN FORM - Create a new pay run
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { PayrollService } from '../../services/payrollService';
import { EmployeeService } from '../../services/employeeService';
import type { PayRun } from '../../types/payroll';
import type { PayFrequency } from '../../types/company';
import './Payroll.css';

export function PayRunForm() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [employeeCount, setEmployeeCount] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        payFrequency: 'monthly' as PayFrequency,
        periodNumber: PayrollService.calculatePeriodNumber('monthly', new Date()),
        taxYear: PayrollService.getCurrentTaxYear(),
        periodStart: '',
        periodEnd: '',
        cutOffDate: '',
        payDate: ''
    });

    useEffect(() => {
        loadEmployeeCount();
        calculateDates();
    }, [userProfile?.companyId]);

    useEffect(() => {
        calculateDates();
    }, [formData.payFrequency, formData.periodNumber, formData.taxYear]);

    const loadEmployeeCount = async () => {
        if (!userProfile?.companyId) return;

        try {
            const employees = await EmployeeService.getEmployees(userProfile.companyId);
            const activeEmployees = employees.filter(e => e.status === 'active');
            setEmployeeCount(activeEmployees.length);
        } catch (error) {
            console.error('Error loading employee count:', error);
        }
    };

    const calculateDates = () => {
        const taxYear = formData.taxYear;
        const [startYear] = taxYear.split('/').map(Number);
        const periodNumber = formData.periodNumber;

        let periodStart: Date;
        let periodEnd: Date;
        let cutOffDate: Date;
        let payDate: Date;

        if (formData.payFrequency === 'monthly') {
            // Tax year starts March, so period 1 = March
            const monthIndex = ((periodNumber - 1 + 2) % 12); // 0 = Jan, 2 = March
            const year = periodNumber <= 10 ? startYear : startYear + 1; // After Dec, move to next calendar year

            periodStart = new Date(year, monthIndex, 1);
            periodEnd = new Date(year, monthIndex + 1, 0); // Last day of month
            cutOffDate = new Date(year, monthIndex, 25);
            payDate = new Date(year, monthIndex, 25);
        } else if (formData.payFrequency === 'weekly') {
            // Simplified: Just calculate based on week number in tax year
            const taxYearStart = new Date(startYear, 2, 1); // March 1
            periodStart = new Date(taxYearStart);
            periodStart.setDate(periodStart.getDate() + (periodNumber - 1) * 7);

            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + 6);

            cutOffDate = new Date(periodEnd);
            payDate = new Date(periodEnd);
            payDate.setDate(payDate.getDate() + 3);
        } else {
            // Fortnightly
            const taxYearStart = new Date(startYear, 2, 1);
            periodStart = new Date(taxYearStart);
            periodStart.setDate(periodStart.getDate() + (periodNumber - 1) * 14);

            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + 13);

            cutOffDate = new Date(periodEnd);
            payDate = new Date(periodEnd);
            payDate.setDate(payDate.getDate() + 3);
        }

        setFormData(prev => ({
            ...prev,
            periodStart: periodStart.toISOString().split('T')[0],
            periodEnd: periodEnd.toISOString().split('T')[0],
            cutOffDate: cutOffDate.toISOString().split('T')[0],
            payDate: payDate.toISOString().split('T')[0]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.companyId) return;

        try {
            setSaving(true);

            const newPayRun: Omit<PayRun, 'id' | 'createdAt' | 'updatedAt'> = {
                companyId: userProfile.companyId,
                payFrequency: formData.payFrequency,
                periodNumber: formData.periodNumber,
                taxYear: formData.taxYear,
                periodStart: new Date(formData.periodStart),
                periodEnd: new Date(formData.periodEnd),
                cutOffDate: new Date(formData.cutOffDate),
                payDate: new Date(formData.payDate),
                status: 'draft',
                employeeCount: employeeCount,
                processedCount: 0,
                exceptionCount: 0,
                totalGrossEarnings: 0,
                totalDeductions: 0,
                totalEmployerContributions: 0,
                totalNetPay: 0,
                totalPaye: 0,
                totalUif: 0,
                totalSdl: 0,
                payslipsGenerated: false,
                bankFileGenerated: false,
                journalGenerated: false,
                createdBy: userProfile.uid
            };

            const payRunId = await PayrollService.createPayRun(newPayRun);
            navigate(`/payroll/runs/${payRunId}`);
        } catch (error) {
            console.error('Error creating pay run:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getMaxPeriods = () => {
        switch (formData.payFrequency) {
            case 'weekly': return 52;
            case 'fortnightly': return 26;
            case 'monthly': return 12;
            default: return 12;
        }
    };

    return (
        <MainLayout>
            <div className="pay-element-form-container">
                {/* Header */}
                <div className="payroll-header" style={{ marginBottom: '24px' }}>
                    <div className="payroll-header-content">
                        <h1 className="payroll-title">New Pay Run</h1>
                        <p className="payroll-subtitle">Create a new payroll run for {employeeCount} active employees</p>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('/payroll')}>
                        <XIcon />
                        Cancel
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="pay-element-form-card">
                        <div className="pay-element-form-header">
                            <div className="pay-element-form-icon">
                                <CalendarIcon />
                            </div>
                            <h2 className="pay-element-form-title">Pay Run Details</h2>
                        </div>

                        <div className="pay-element-form-body">
                            <div className="pay-element-form-grid">
                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">
                                        Pay Frequency <span>*</span>
                                    </label>
                                    <select
                                        className="pay-element-form-select"
                                        value={formData.payFrequency}
                                        onChange={(e) => {
                                            const freq = e.target.value as PayFrequency;
                                            setFormData(prev => ({
                                                ...prev,
                                                payFrequency: freq,
                                                periodNumber: PayrollService.calculatePeriodNumber(freq, new Date())
                                            }));
                                        }}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="fortnightly">Fortnightly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>

                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">
                                        Tax Year <span>*</span>
                                    </label>
                                    <select
                                        className="pay-element-form-select"
                                        value={formData.taxYear}
                                        onChange={(e) => setFormData(prev => ({ ...prev, taxYear: e.target.value }))}
                                    >
                                        <option value="2024/2025">2024/2025</option>
                                        <option value="2025/2026">2025/2026</option>
                                    </select>
                                </div>

                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">
                                        Period Number <span>*</span>
                                    </label>
                                    <select
                                        className="pay-element-form-select"
                                        value={formData.periodNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, periodNumber: parseInt(e.target.value) }))}
                                    >
                                        {Array.from({ length: getMaxPeriods() }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>Period {num}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">Employees</label>
                                    <input
                                        type="text"
                                        className="pay-element-form-input"
                                        value={`${employeeCount} active employees`}
                                        disabled
                                    />
                                </div>

                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">Period Start</label>
                                    <input
                                        type="date"
                                        className="pay-element-form-input"
                                        value={formData.periodStart}
                                        onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                                    />
                                </div>

                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">Period End</label>
                                    <input
                                        type="date"
                                        className="pay-element-form-input"
                                        value={formData.periodEnd}
                                        onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                                    />
                                </div>

                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">Cut-Off Date</label>
                                    <input
                                        type="date"
                                        className="pay-element-form-input"
                                        value={formData.cutOffDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cutOffDate: e.target.value }))}
                                    />
                                </div>

                                <div className="pay-element-form-field">
                                    <label className="pay-element-form-label">Pay Date</label>
                                    <input
                                        type="date"
                                        className="pay-element-form-input"
                                        value={formData.payDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, payDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
                                    Summary
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: 'var(--text-sm)' }}>
                                    <div>
                                        <span style={{ color: 'var(--color-text-tertiary)' }}>Period: </span>
                                        <span style={{ color: 'var(--color-text)' }}>
                                            {formData.payFrequency.charAt(0).toUpperCase() + formData.payFrequency.slice(1)} Period {formData.periodNumber}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--color-text-tertiary)' }}>Tax Year: </span>
                                        <span style={{ color: 'var(--color-text)' }}>{formData.taxYear}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--color-text-tertiary)' }}>Date Range: </span>
                                        <span style={{ color: 'var(--color-text)' }}>
                                            {formatDate(formData.periodStart)} - {formatDate(formData.periodEnd)}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--color-text-tertiary)' }}>Pay Date: </span>
                                        <span style={{ color: 'var(--color-text)' }}>{formatDate(formData.payDate)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pay-element-form-footer">
                            <Button variant="secondary" type="button" onClick={() => navigate('/payroll')}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving || employeeCount === 0}>
                                {saving ? <LoadingIcon /> : <PlusIcon />}
                                Create Pay Run
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}

// Icon Components
function XIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
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
