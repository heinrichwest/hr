import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import { LeaveService } from '../../services/leaveService';
import { EmployeeService } from '../../services/employeeService';
import type { LeaveRequest, LeaveType, LeaveBalance } from '../../types/leave';
import type { Employee } from '../../types/employee';
import './Leave.css';

interface FormData {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    isHalfDay: boolean;
    halfDayType: 'morning' | 'afternoon';
    reason: string;
    emergencyContact: string;
}

const initialFormData: FormData = {
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDayType: 'morning',
    reason: '',
    emergencyContact: ''
};

export function LeaveRequestForm() {
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();
    const companyId = userProfile?.companyId;

    // State
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [calculatedDays, setCalculatedDays] = useState(0);

    // Check if user is HR/Admin (can submit for others) or employee (self only)
    const isHRAdmin = userProfile?.role && ['System Admin', 'HR Admin', 'HR Manager'].includes(userProfile.role);

    useEffect(() => {
        if (companyId) {
            loadData();
        }
    }, [companyId, id]);

    // Calculate working days when dates change
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            calculateWorkingDays();
        } else {
            setCalculatedDays(0);
        }
    }, [formData.startDate, formData.endDate, formData.isHalfDay]);

    // Load leave balance when employee and leave type are selected
    useEffect(() => {
        if (formData.employeeId && formData.leaveTypeId && companyId) {
            loadLeaveBalance();
        } else {
            setLeaveBalance(null);
        }
    }, [formData.employeeId, formData.leaveTypeId, companyId]);

    const loadData = async () => {
        if (!companyId) return;

        try {
            setLoading(true);
            const [typesData, employeesData] = await Promise.all([
                LeaveService.getLeaveTypes(companyId),
                EmployeeService.getEmployees(companyId)
            ]);

            // Filter active leave types
            setLeaveTypes(typesData.filter(t => t.isActive));
            setEmployees(employeesData.filter(e => e.status === 'active'));

            // If not HR/Admin, pre-select current user's employee record
            if (!isHRAdmin && currentUser) {
                const currentEmployee = employeesData.find(e => e.userId === currentUser.uid);
                if (currentEmployee) {
                    setFormData(prev => ({ ...prev, employeeId: currentEmployee.id }));
                }
            }

            // If editing, load the request
            if (id) {
                const request = await LeaveService.getLeaveRequest(id);
                if (request) {
                    setFormData({
                        employeeId: request.employeeId,
                        leaveTypeId: request.leaveTypeId,
                        startDate: formatDateForInput(request.startDate),
                        endDate: formatDateForInput(request.endDate),
                        isHalfDay: request.isHalfDay,
                        halfDayType: request.halfDayType || 'morning',
                        reason: request.reason || '',
                        emergencyContact: request.emergencyContact || ''
                    });
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLeaveBalance = async () => {
        if (!companyId || !formData.employeeId || !formData.leaveTypeId) return;

        try {
            const balances = await LeaveService.getLeaveBalances(
                companyId,
                formData.employeeId
            );
            const balance = balances.find((b: LeaveBalance) => b.leaveTypeId === formData.leaveTypeId);
            setLeaveBalance(balance || null);
        } catch (error) {
            console.error('Error loading leave balance:', error);
            setLeaveBalance(null);
        }
    };

    const formatDateForInput = (date: Date | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const calculateWorkingDays = () => {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (start > end) {
            setCalculatedDays(0);
            return;
        }

        if (formData.isHalfDay) {
            setCalculatedDays(0.5);
            return;
        }

        let days = 0;
        const current = new Date(start);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                days++;
            }
            current.setDate(current.getDate() + 1);
        }

        setCalculatedDays(days);
    };

    const handleChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // If half day is selected, set end date to start date
            if (field === 'isHalfDay' && value === true) {
                newData.endDate = newData.startDate;
            }

            return newData;
        });

        // Clear error when field changes
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (!formData.employeeId) {
            newErrors.employeeId = 'Please select an employee';
        }

        if (!formData.leaveTypeId) {
            newErrors.leaveTypeId = 'Please select a leave type';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Please select a start date';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Please select an end date';
        }

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (start > end) {
                newErrors.endDate = 'End date must be after start date';
            }
        }

        // Check leave balance
        if (leaveBalance && calculatedDays > leaveBalance.currentBalance) {
            newErrors.leaveTypeId = `Insufficient leave balance. Available: ${leaveBalance.currentBalance} days`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveDraft = async () => {
        if (!companyId || !currentUser) return;

        try {
            setSaving(true);
            const requestData: Partial<LeaveRequest> = {
                employeeId: formData.employeeId,
                companyId,
                leaveTypeId: formData.leaveTypeId,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                isHalfDay: formData.isHalfDay,
                halfDayType: formData.isHalfDay ? formData.halfDayType : undefined,
                totalDays: calculatedDays,
                workingDays: calculatedDays,
                reason: formData.reason,
                emergencyContact: formData.emergencyContact,
                status: 'draft',
                createdBy: currentUser.uid,
                approvalHistory: []
            };

            if (isEditing && id) {
                await LeaveService.updateLeaveRequest(id, requestData);
            } else {
                await LeaveService.createLeaveRequest(requestData as Omit<LeaveRequest, 'id' | 'createdAt'>);
            }

            navigate('/leave');
        } catch (error) {
            console.error('Error saving draft:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm() || !companyId || !currentUser) return;

        try {
            setSaving(true);
            const requestData: Partial<LeaveRequest> = {
                employeeId: formData.employeeId,
                companyId,
                leaveTypeId: formData.leaveTypeId,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                isHalfDay: formData.isHalfDay,
                halfDayType: formData.isHalfDay ? formData.halfDayType : undefined,
                totalDays: calculatedDays,
                workingDays: calculatedDays,
                reason: formData.reason,
                emergencyContact: formData.emergencyContact,
                status: 'pending',
                submittedDate: new Date(),
                createdBy: currentUser.uid,
                approvalHistory: []
            };

            if (isEditing && id) {
                await LeaveService.updateLeaveRequest(id, requestData);
            } else {
                await LeaveService.createLeaveRequest(requestData as Omit<LeaveRequest, 'id' | 'createdAt'>);
            }

            navigate('/leave');
        } catch (error) {
            console.error('Error submitting request:', error);
        } finally {
            setSaving(false);
        }
    };

    // Get selected leave type details
    const selectedLeaveType = leaveTypes.find(t => t.id === formData.leaveTypeId);

    if (loading) {
        return (
            <div className="leave-empty-state">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="leave-form-container">
            {/* Header */}
            <div className="leave-form-header">
                <h1 className="leave-form-title">
                    {isEditing ? 'Edit Leave Request' : 'New Leave Request'}
                </h1>
                <Button variant="ghost" onClick={() => navigate('/leave')}>
                    <ArrowLeftIcon />
                    Back to List
                </Button>
            </div>

            {/* Employee Selection (for HR/Admin only) */}
            {isHRAdmin && (
                <div className="leave-form-card">
                    <div className="leave-form-card-header">
                        <div className="leave-form-card-icon">
                            <UserIcon />
                        </div>
                        <h3 className="leave-form-card-title">Employee</h3>
                    </div>
                    <div className="leave-form-card-body">
                        <div className="leave-form-field">
                            <label className="leave-form-label">
                                Select Employee <span>*</span>
                            </label>
                            <select
                                className="leave-form-select"
                                value={formData.employeeId}
                                onChange={(e) => handleChange('employeeId', e.target.value)}
                            >
                                <option value="">Select an employee...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                                    </option>
                                ))}
                            </select>
                            {errors.employeeId && (
                                <span className="leave-form-error">{errors.employeeId}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Type Selection */}
            <div className="leave-form-card">
                <div className="leave-form-card-header">
                    <div className="leave-form-card-icon">
                        <FileTextIcon />
                    </div>
                    <h3 className="leave-form-card-title">Leave Type</h3>
                </div>
                <div className="leave-form-card-body">
                    <div className="leave-form-field">
                        <label className="leave-form-label">
                            Leave Type <span>*</span>
                        </label>
                        <select
                            className="leave-form-select"
                            value={formData.leaveTypeId}
                            onChange={(e) => handleChange('leaveTypeId', e.target.value)}
                        >
                            <option value="">Select leave type...</option>
                            {leaveTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name} {type.isPaid ? '(Paid)' : '(Unpaid)'}
                                </option>
                            ))}
                        </select>
                        {errors.leaveTypeId && (
                            <span className="leave-form-error">{errors.leaveTypeId}</span>
                        )}
                    </div>

                    {/* Leave Balance Summary */}
                    {leaveBalance && selectedLeaveType && (
                        <div className="leave-balance-summary">
                            <div className="leave-balance-item">
                                <div className="leave-balance-value leave-balance-value--available">
                                    {leaveBalance.currentBalance}
                                </div>
                                <div className="leave-balance-label">Available Days</div>
                            </div>
                            <div className="leave-balance-item">
                                <div className="leave-balance-value">
                                    {leaveBalance.taken}
                                </div>
                                <div className="leave-balance-label">Days Taken</div>
                            </div>
                            <div className="leave-balance-item">
                                <div className="leave-balance-value leave-balance-value--pending">
                                    {leaveBalance.pending}
                                </div>
                                <div className="leave-balance-label">Pending</div>
                            </div>
                            <div className="leave-balance-item">
                                <div className="leave-balance-value">
                                    {selectedLeaveType.defaultDaysPerYear}
                                </div>
                                <div className="leave-balance-label">Annual Entitlement</div>
                            </div>
                        </div>
                    )}

                    {selectedLeaveType?.description && (
                        <p className="leave-form-hint">{selectedLeaveType.description}</p>
                    )}
                </div>
            </div>

            {/* Date Selection */}
            <div className="leave-form-card">
                <div className="leave-form-card-header">
                    <div className="leave-form-card-icon">
                        <CalendarIcon />
                    </div>
                    <h3 className="leave-form-card-title">Leave Dates</h3>
                </div>
                <div className="leave-form-card-body">
                    <div className="leave-form-grid">
                        <div className="leave-form-field">
                            <label className="leave-form-label">
                                Start Date <span>*</span>
                            </label>
                            <input
                                type="date"
                                className="leave-form-input"
                                value={formData.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            {errors.startDate && (
                                <span className="leave-form-error">{errors.startDate}</span>
                            )}
                        </div>

                        <div className="leave-form-field">
                            <label className="leave-form-label">
                                End Date <span>*</span>
                            </label>
                            <input
                                type="date"
                                className="leave-form-input"
                                value={formData.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                                disabled={formData.isHalfDay}
                            />
                            {errors.endDate && (
                                <span className="leave-form-error">{errors.endDate}</span>
                            )}
                        </div>
                    </div>

                    {/* Half Day Option */}
                    <div className="leave-form-checkbox" style={{ marginTop: 'var(--space-4)' }}>
                        <input
                            type="checkbox"
                            id="isHalfDay"
                            checked={formData.isHalfDay}
                            onChange={(e) => handleChange('isHalfDay', e.target.checked)}
                        />
                        <label htmlFor="isHalfDay">This is a half day request</label>
                    </div>

                    {formData.isHalfDay && (
                        <div className="leave-half-day-options">
                            <label
                                className={`leave-half-day-option ${formData.halfDayType === 'morning' ? 'leave-half-day-option--selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="halfDayType"
                                    value="morning"
                                    checked={formData.halfDayType === 'morning'}
                                    onChange={() => handleChange('halfDayType', 'morning')}
                                />
                                Morning (AM)
                            </label>
                            <label
                                className={`leave-half-day-option ${formData.halfDayType === 'afternoon' ? 'leave-half-day-option--selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="halfDayType"
                                    value="afternoon"
                                    checked={formData.halfDayType === 'afternoon'}
                                    onChange={() => handleChange('halfDayType', 'afternoon')}
                                />
                                Afternoon (PM)
                            </label>
                        </div>
                    )}

                    {/* Calculated Days */}
                    {calculatedDays > 0 && (
                        <div
                            className="leave-balance-summary"
                            style={{ marginTop: 'var(--space-4)', justifyContent: 'center' }}
                        >
                            <div className="leave-balance-item" style={{ flex: 'none', padding: 'var(--space-2) var(--space-6)' }}>
                                <div className="leave-balance-value">
                                    {calculatedDays}
                                </div>
                                <div className="leave-balance-label">
                                    Working {calculatedDays === 1 ? 'Day' : 'Days'} Requested
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Details */}
            <div className="leave-form-card">
                <div className="leave-form-card-header">
                    <div className="leave-form-card-icon">
                        <ClockIcon />
                    </div>
                    <h3 className="leave-form-card-title">Additional Details</h3>
                </div>
                <div className="leave-form-card-body">
                    <div className="leave-form-field leave-form-grid--full">
                        <label className="leave-form-label">
                            Reason for Leave
                        </label>
                        <textarea
                            className="leave-form-textarea"
                            value={formData.reason}
                            onChange={(e) => handleChange('reason', e.target.value)}
                            placeholder="Please provide a reason for your leave request..."
                            rows={3}
                        />
                        {selectedLeaveType?.requiresAttachment && (
                            <span className="leave-form-hint">
                                <AlertCircleIcon />
                                This leave type requires supporting documentation
                                {selectedLeaveType.attachmentRequiredAfterDays &&
                                    ` for requests exceeding ${selectedLeaveType.attachmentRequiredAfterDays} days`
                                }
                            </span>
                        )}
                    </div>

                    <div className="leave-form-field" style={{ marginTop: 'var(--space-4)' }}>
                        <label className="leave-form-label">
                            Emergency Contact (While on Leave)
                        </label>
                        <input
                            type="text"
                            className="leave-form-input"
                            value={formData.emergencyContact}
                            onChange={(e) => handleChange('emergencyContact', e.target.value)}
                            placeholder="Phone number or email..."
                        />
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="leave-form-footer">
                <Button
                    variant="secondary"
                    onClick={() => navigate('/leave')}
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleSaveDraft}
                    disabled={saving || !formData.employeeId || !formData.leaveTypeId}
                >
                    <SaveIcon />
                    Save as Draft
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={saving || calculatedDays === 0}
                >
                    <SendIcon />
                    {saving ? 'Submitting...' : 'Submit Request'}
                </Button>
            </div>
        </div>
    );
}

// Icon Components
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

function ArrowLeftIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
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

function SendIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function FileTextIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

function AlertCircleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
