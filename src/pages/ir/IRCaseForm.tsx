// ============================================================
// IR CASE FORM - Create or edit an IR case
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { IRService } from '../../services/irService';
import { EmployeeService } from '../../services/employeeService';
import { UserService } from '../../services/userService';
import type { IRCase, IRCaseType, IRCasePriority, MisconductCategory, PerformanceCategory, GrievanceCategory } from '../../types/ir';
import type { Employee } from '../../types/employee';
import type { UserProfile } from '../../types/user';
import './IR.css';

export function IRCaseForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const isEditing = !!id;

    const [formData, setFormData] = useState({
        caseType: 'misconduct' as IRCaseType,
        priority: 'medium' as IRCasePriority,
        employeeId: '',
        incidentDate: new Date().toISOString().split('T')[0],
        incidentLocation: '',
        incidentSummary: '',
        policyReference: '',
        misconductCategory: '' as MisconductCategory | '',
        performanceCategory: '' as PerformanceCategory | '',
        grievanceCategory: '' as GrievanceCategory | '',
        assignedToId: '',
        isConfidential: false,
        targetResolutionDate: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, [userProfile?.companyId]);

    useEffect(() => {
        if (id) {
            loadCase();
        }
    }, [id]);

    const loadData = async () => {
        if (!userProfile?.companyId) return;

        try {
            setLoading(true);
            const [employeesData, companyUsers] = await Promise.all([
                EmployeeService.getEmployees(userProfile.companyId),
                UserService.getAllUsers(userProfile.companyId)
            ]);

            setEmployees(employeesData.filter((e: Employee) => e.status === 'active'));
            setUsers(companyUsers);

            // Default assignee to current user
            if (!id && userProfile.uid) {
                setFormData(prev => ({ ...prev, assignedToId: userProfile.uid }));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCase = async () => {
        if (!id) return;

        try {
            const irCase = await IRService.getIRCase(id);
            if (irCase) {
                setFormData({
                    caseType: irCase.caseType,
                    priority: irCase.priority,
                    employeeId: irCase.employeeId,
                    incidentDate: new Date(irCase.incidentDate).toISOString().split('T')[0],
                    incidentLocation: irCase.incidentLocation || '',
                    incidentSummary: irCase.incidentSummary,
                    policyReference: irCase.policyReference || '',
                    misconductCategory: irCase.misconductCategory || '',
                    performanceCategory: irCase.performanceCategory || '',
                    grievanceCategory: irCase.grievanceCategory || '',
                    assignedToId: irCase.assignedToId,
                    isConfidential: irCase.isConfidential,
                    targetResolutionDate: irCase.targetResolutionDate
                        ? new Date(irCase.targetResolutionDate).toISOString().split('T')[0]
                        : '',
                    notes: irCase.notes || ''
                });
            }
        } catch (error) {
            console.error('Error loading case:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.companyId) return;

        // Validation
        if (!formData.employeeId) {
            alert('Please select an employee');
            return;
        }
        if (!formData.incidentSummary.trim()) {
            alert('Please enter an incident summary');
            return;
        }
        if (!formData.assignedToId) {
            alert('Please assign the case to someone');
            return;
        }

        try {
            setSaving(true);

            const selectedEmployee = employees.find(e => e.id === formData.employeeId);
            const assignedUser = users.find(u => u.uid === formData.assignedToId);

            const caseData: Omit<IRCase, 'id' | 'caseNumber' | 'createdAt'> = {
                companyId: userProfile.companyId,
                caseType: formData.caseType,
                status: 'draft',
                priority: formData.priority,
                employeeId: formData.employeeId,
                employeeName: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : undefined,
                employeeNumber: selectedEmployee?.employeeNumber,
                departmentId: selectedEmployee?.departmentId,
                departmentName: selectedEmployee?.department,
                incidentDate: new Date(formData.incidentDate),
                incidentLocation: formData.incidentLocation || undefined,
                incidentSummary: formData.incidentSummary,
                policyReference: formData.policyReference || undefined,
                misconductCategory: formData.caseType === 'misconduct' && formData.misconductCategory
                    ? formData.misconductCategory as MisconductCategory
                    : undefined,
                performanceCategory: formData.caseType === 'poor_performance' && formData.performanceCategory
                    ? formData.performanceCategory as PerformanceCategory
                    : undefined,
                grievanceCategory: formData.caseType === 'grievance' && formData.grievanceCategory
                    ? formData.grievanceCategory as GrievanceCategory
                    : undefined,
                assignedToId: formData.assignedToId,
                assignedToName: assignedUser?.displayName,
                initiatorId: userProfile.uid,
                initiatorName: userProfile.displayName,
                isConfidential: formData.isConfidential,
                dateOpened: new Date(),
                targetResolutionDate: formData.targetResolutionDate
                    ? new Date(formData.targetResolutionDate)
                    : undefined,
                notes: formData.notes || undefined,
                createdBy: userProfile.uid
            };

            if (isEditing && id) {
                await IRService.updateIRCase(id, caseData, userProfile.uid);
                navigate(`/ir/cases/${id}`);
            } else {
                const newId = await IRService.createIRCase(caseData);
                navigate(`/ir/cases/${newId}`);
            }
        } catch (error) {
            console.error('Error saving case:', error);
            alert('Failed to save case. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="ir-empty-state">
                    <div className="ir-empty-icon">
                        <LoadingIcon />
                    </div>
                    <p className="ir-empty-text">Loading...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="ir-form-container">
                {/* Header */}
                <div className="ir-header" style={{ marginBottom: '24px' }}>
                    <div className="ir-header-content">
                        <h1 className="ir-title">{isEditing ? 'Edit IR Case' : 'New IR Case'}</h1>
                        <p className="ir-subtitle">
                            {isEditing ? 'Update the case details' : 'Create a new disciplinary or grievance case'}
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('/ir')}>
                        <XIcon />
                        Cancel
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Case Type & Priority */}
                    <div className="ir-form-card">
                        <div className="ir-form-header">
                            <div className="ir-form-icon">
                                <FileTextIcon />
                            </div>
                            <h2 className="ir-form-title">Case Details</h2>
                        </div>
                        <div className="ir-form-body">
                            <div className="ir-form-grid">
                                <div className="ir-form-field">
                                    <label className="ir-form-label">
                                        Case Type <span>*</span>
                                    </label>
                                    <select
                                        className="ir-form-select"
                                        value={formData.caseType}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            caseType: e.target.value as IRCaseType,
                                            misconductCategory: '',
                                            performanceCategory: '',
                                            grievanceCategory: ''
                                        }))}
                                    >
                                        <option value="misconduct">Misconduct</option>
                                        <option value="poor_performance">Poor Performance</option>
                                        <option value="incapacity">Incapacity</option>
                                        <option value="grievance">Grievance</option>
                                        <option value="abscondment">Abscondment</option>
                                        <option value="dispute">Dispute</option>
                                        <option value="ccma">CCMA Dispute</option>
                                        <option value="retrenchment">Retrenchment</option>
                                    </select>
                                </div>

                                <div className="ir-form-field">
                                    <label className="ir-form-label">
                                        Priority <span>*</span>
                                    </label>
                                    <select
                                        className="ir-form-select"
                                        value={formData.priority}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as IRCasePriority }))}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                {/* Category based on type */}
                                {formData.caseType === 'misconduct' && (
                                    <div className="ir-form-field">
                                        <label className="ir-form-label">Misconduct Category</label>
                                        <select
                                            className="ir-form-select"
                                            value={formData.misconductCategory}
                                            onChange={(e) => setFormData(prev => ({ ...prev, misconductCategory: e.target.value as MisconductCategory }))}
                                        >
                                            <option value="">Select category</option>
                                            <option value="attendance">Attendance</option>
                                            <option value="insubordination">Insubordination</option>
                                            <option value="dishonesty">Dishonesty</option>
                                            <option value="theft">Theft</option>
                                            <option value="damage_to_property">Damage to Property</option>
                                            <option value="harassment">Harassment</option>
                                            <option value="substance_abuse">Substance Abuse</option>
                                            <option value="safety_violation">Safety Violation</option>
                                            <option value="breach_of_policy">Breach of Policy</option>
                                            <option value="gross_negligence">Gross Negligence</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                )}

                                {formData.caseType === 'poor_performance' && (
                                    <div className="ir-form-field">
                                        <label className="ir-form-label">Performance Category</label>
                                        <select
                                            className="ir-form-select"
                                            value={formData.performanceCategory}
                                            onChange={(e) => setFormData(prev => ({ ...prev, performanceCategory: e.target.value as PerformanceCategory }))}
                                        >
                                            <option value="">Select category</option>
                                            <option value="quality_of_work">Quality of Work</option>
                                            <option value="productivity">Productivity</option>
                                            <option value="skills_gap">Skills Gap</option>
                                            <option value="failure_to_meet_targets">Failure to Meet Targets</option>
                                            <option value="communication">Communication</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                )}

                                {formData.caseType === 'grievance' && (
                                    <div className="ir-form-field">
                                        <label className="ir-form-label">Grievance Category</label>
                                        <select
                                            className="ir-form-select"
                                            value={formData.grievanceCategory}
                                            onChange={(e) => setFormData(prev => ({ ...prev, grievanceCategory: e.target.value as GrievanceCategory }))}
                                        >
                                            <option value="">Select category</option>
                                            <option value="unfair_treatment">Unfair Treatment</option>
                                            <option value="harassment">Harassment</option>
                                            <option value="discrimination">Discrimination</option>
                                            <option value="working_conditions">Working Conditions</option>
                                            <option value="management">Management</option>
                                            <option value="policy_dispute">Policy Dispute</option>
                                            <option value="interpersonal">Interpersonal</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                )}

                                <div className="ir-form-field">
                                    <label className="ir-form-label">Policy Reference</label>
                                    <input
                                        type="text"
                                        className="ir-form-input"
                                        value={formData.policyReference}
                                        onChange={(e) => setFormData(prev => ({ ...prev, policyReference: e.target.value }))}
                                        placeholder="e.g., Disciplinary Code 4.2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employee & Incident */}
                    <div className="ir-form-card">
                        <div className="ir-form-header">
                            <div className="ir-form-icon">
                                <UserIcon />
                            </div>
                            <h2 className="ir-form-title">Employee & Incident</h2>
                        </div>
                        <div className="ir-form-body">
                            <div className="ir-form-grid">
                                <div className="ir-form-field">
                                    <label className="ir-form-label">
                                        Employee <span>*</span>
                                    </label>
                                    <select
                                        className="ir-form-select"
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                    >
                                        <option value="">Select employee</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ir-form-field">
                                    <label className="ir-form-label">
                                        Incident Date <span>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="ir-form-input"
                                        value={formData.incidentDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                                    />
                                </div>

                                <div className="ir-form-field">
                                    <label className="ir-form-label">Incident Location</label>
                                    <input
                                        type="text"
                                        className="ir-form-input"
                                        value={formData.incidentLocation}
                                        onChange={(e) => setFormData(prev => ({ ...prev, incidentLocation: e.target.value }))}
                                        placeholder="e.g., Warehouse, Office"
                                    />
                                </div>

                                <div className="ir-form-field">
                                    <label className="ir-form-label">Target Resolution Date</label>
                                    <input
                                        type="date"
                                        className="ir-form-input"
                                        value={formData.targetResolutionDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, targetResolutionDate: e.target.value }))}
                                    />
                                </div>

                                <div className="ir-form-field ir-form-grid--full">
                                    <label className="ir-form-label">
                                        Incident Summary <span>*</span>
                                    </label>
                                    <textarea
                                        className="ir-form-textarea"
                                        value={formData.incidentSummary}
                                        onChange={(e) => setFormData(prev => ({ ...prev, incidentSummary: e.target.value }))}
                                        placeholder="Describe the incident or issue in detail..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="ir-form-card">
                        <div className="ir-form-header">
                            <div className="ir-form-icon">
                                <UsersIcon />
                            </div>
                            <h2 className="ir-form-title">Assignment</h2>
                        </div>
                        <div className="ir-form-body">
                            <div className="ir-form-grid">
                                <div className="ir-form-field">
                                    <label className="ir-form-label">
                                        Assign To <span>*</span>
                                    </label>
                                    <select
                                        className="ir-form-select"
                                        value={formData.assignedToId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, assignedToId: e.target.value }))}
                                    >
                                        <option value="">Select user</option>
                                        {users.map(user => (
                                            <option key={user.uid} value={user.uid}>
                                                {user.displayName} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ir-form-field" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '28px' }}>
                                    <input
                                        type="checkbox"
                                        id="isConfidential"
                                        checked={formData.isConfidential}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isConfidential: e.target.checked }))}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <label htmlFor="isConfidential" className="ir-form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                                        Mark as Confidential
                                    </label>
                                </div>

                                <div className="ir-form-field ir-form-grid--full">
                                    <label className="ir-form-label">Notes</label>
                                    <textarea
                                        className="ir-form-textarea"
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Any additional notes..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="ir-form-footer" style={{ background: 'transparent', border: 'none', padding: '24px 0' }}>
                        <Button variant="secondary" type="button" onClick={() => navigate('/ir')}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? <LoadingIcon /> : <SaveIcon />}
                            {isEditing ? 'Update Case' : 'Create Case'}
                        </Button>
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

function FileTextIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
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

function UsersIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
