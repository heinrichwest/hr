import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { EmployeeService } from '../../services/employeeService';
import { CompanyService } from '../../services/companyService';
import type { Employee, ContractType, EmploymentStatus, Gender, MaritalStatus, IdType } from '../../types/employee';
import type { Department, Branch, JobTitle, JobGrade, CostCentre, WorkSchedule } from '../../types/company';
import { useAuth } from '../../contexts/AuthContext';
import './Employees.css';

const SA_PROVINCES = [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Northern Cape',
    'Western Cape'
];

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
    { value: 'permanent', label: 'Permanent' },
    { value: 'fixed_term', label: 'Fixed Term' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'intern', label: 'Intern' }
];

const EMPLOYMENT_STATUSES: { value: EmploymentStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'probation', label: 'On Probation' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'resigned', label: 'Resigned' },
    { value: 'retrenched', label: 'Retrenched' }
];

const GENDERS: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

const MARITAL_STATUSES: { value: MaritalStatus; label: string }[] = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'separated', label: 'Separated' },
    { value: 'domestic_partnership', label: 'Domestic Partnership' }
];

interface FormData {
    // Personal
    firstName: string;
    lastName: string;
    middleName: string;
    preferredName: string;
    idType: IdType;
    idNumber: string;
    passportCountry: string;
    dateOfBirth: string;
    gender: Gender | '';
    nationality: string;
    maritalStatus: MaritalStatus | '';
    // Contact
    email: string;
    personalEmail: string;
    phone: string;
    alternatePhone: string;
    // Address
    addressLine1: string;
    addressLine2: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
    // Employment
    employeeNumber: string;
    startDate: string;
    status: EmploymentStatus;
    contractType: ContractType;
    jobTitleId: string;
    gradeId: string;
    departmentId: string;
    branchId: string;
    costCentreId: string;
    managerId: string;
    workScheduleId: string;
    // Probation
    probationEndDate: string;
    // Payroll
    payFrequency: 'weekly' | 'fortnightly' | 'monthly';
    salaryType: 'monthly' | 'hourly';
    basicSalary: string;
    hourlyRate: string;
    taxNumber: string;
    isUifApplicable: boolean;
    // Bank
    bankAccountHolderName: string;
    bankName: string;
    bankBranchCode: string;
    bankAccountNumber: string;
    bankAccountType: 'savings' | 'current' | 'transmission';
}

const initialFormData: FormData = {
    firstName: '',
    lastName: '',
    middleName: '',
    preferredName: '',
    idType: 'sa_id',
    idNumber: '',
    passportCountry: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'South African',
    maritalStatus: '',
    email: '',
    personalEmail: '',
    phone: '',
    alternatePhone: '',
    addressLine1: '',
    addressLine2: '',
    suburb: '',
    city: '',
    province: '',
    postalCode: '',
    employeeNumber: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'probation',
    contractType: 'permanent',
    jobTitleId: '',
    gradeId: '',
    departmentId: '',
    branchId: '',
    costCentreId: '',
    managerId: '',
    workScheduleId: '',
    probationEndDate: '',
    payFrequency: 'monthly',
    salaryType: 'monthly',
    basicSalary: '',
    hourlyRate: '',
    taxNumber: '',
    isUifApplicable: true,
    bankAccountHolderName: '',
    bankName: '',
    bankBranchCode: '',
    bankAccountNumber: '',
    bankAccountType: 'current'
};

export function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);

    // Lookup data
    const [departments, setDepartments] = useState<Department[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [jobGrades, setJobGrades] = useState<JobGrade[]>([]);
    const [costCentres, setCostCentres] = useState<CostCentre[]>([]);
    const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
    const [managers, setManagers] = useState<Employee[]>([]);

    useEffect(() => {
        loadInitialData();
    }, [id]);

    const loadInitialData = async () => {
        try {
            const company = await CompanyService.getDefaultCompany();
            if (!company) {
                navigate('/settings');
                return;
            }

            setCompanyId(company.id);

            // Load lookup data in parallel
            const [depts, branchList, titles, grades, centres, schedules, empList] = await Promise.all([
                CompanyService.getDepartments(company.id),
                CompanyService.getBranches(company.id),
                CompanyService.getJobTitles(company.id),
                CompanyService.getJobGrades(company.id),
                CompanyService.getCostCentres(company.id),
                CompanyService.getWorkSchedules(company.id),
                EmployeeService.getEmployees(company.id, { status: 'active' })
            ]);

            setDepartments(depts);
            setBranches(branchList);
            setJobTitles(titles);
            setJobGrades(grades);
            setCostCentres(centres);
            setWorkSchedules(schedules);
            setManagers(empList);

            // If editing, load existing employee
            if (id) {
                const employee = await EmployeeService.getEmployee(id);
                if (employee) {
                    setFormData({
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        middleName: employee.middleName || '',
                        preferredName: employee.preferredName || '',
                        idType: employee.idType,
                        idNumber: employee.idNumber,
                        passportCountry: employee.passportCountry || '',
                        dateOfBirth: new Date(employee.dateOfBirth).toISOString().split('T')[0],
                        gender: employee.gender || '',
                        nationality: employee.nationality || 'South African',
                        maritalStatus: employee.maritalStatus || '',
                        email: employee.email,
                        personalEmail: employee.personalEmail || '',
                        phone: employee.phone,
                        alternatePhone: employee.alternatePhone || '',
                        addressLine1: employee.residentialAddress?.line1 || '',
                        addressLine2: employee.residentialAddress?.line2 || '',
                        suburb: employee.residentialAddress?.suburb || '',
                        city: employee.residentialAddress?.city || '',
                        province: employee.residentialAddress?.province || '',
                        postalCode: employee.residentialAddress?.postalCode || '',
                        employeeNumber: employee.employeeNumber,
                        startDate: new Date(employee.startDate).toISOString().split('T')[0],
                        status: employee.status,
                        contractType: employee.contractType,
                        jobTitleId: employee.jobTitleId || '',
                        gradeId: employee.gradeId || '',
                        departmentId: employee.departmentId || '',
                        branchId: employee.branchId || '',
                        costCentreId: employee.costCentreId || '',
                        managerId: employee.managerId || '',
                        workScheduleId: employee.workScheduleId || '',
                        probationEndDate: employee.probationEndDate ? new Date(employee.probationEndDate).toISOString().split('T')[0] : '',
                        payFrequency: employee.payFrequency,
                        salaryType: employee.salaryType,
                        basicSalary: employee.basicSalary?.toString() || '',
                        hourlyRate: employee.hourlyRate?.toString() || '',
                        taxNumber: employee.taxNumber || '',
                        isUifApplicable: employee.isUifApplicable,
                        bankAccountHolderName: employee.bankDetails?.accountHolderName || '',
                        bankName: employee.bankDetails?.bankName || '',
                        bankBranchCode: employee.bankDetails?.branchCode || '',
                        bankAccountNumber: employee.bankDetails?.accountNumber || '',
                        bankAccountType: employee.bankDetails?.accountType || 'current'
                    });
                }
            } else {
                // Generate new employee number for new employees
                const empNumber = await EmployeeService.generateEmployeeNumber(company.id);
                setFormData(prev => ({ ...prev, employeeNumber: empNumber }));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId || !currentUser) return;

        setSaving(true);
        try {
            const employeeData: Omit<Employee, 'id' | 'createdAt'> = {
                companyId,
                employeeNumber: formData.employeeNumber,
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName || undefined,
                preferredName: formData.preferredName || undefined,
                idType: formData.idType,
                idNumber: formData.idNumber,
                passportCountry: formData.idType === 'passport' ? formData.passportCountry : undefined,
                dateOfBirth: new Date(formData.dateOfBirth),
                gender: formData.gender || undefined,
                nationality: formData.nationality || undefined,
                maritalStatus: formData.maritalStatus || undefined,
                email: formData.email,
                personalEmail: formData.personalEmail || undefined,
                phone: formData.phone,
                alternatePhone: formData.alternatePhone || undefined,
                residentialAddress: {
                    line1: formData.addressLine1,
                    line2: formData.addressLine2 || undefined,
                    suburb: formData.suburb || undefined,
                    city: formData.city,
                    province: formData.province,
                    postalCode: formData.postalCode,
                    country: 'South Africa'
                },
                startDate: new Date(formData.startDate),
                status: formData.status,
                contractType: formData.contractType,
                jobTitleId: formData.jobTitleId,
                jobTitle: jobTitles.find(j => j.id === formData.jobTitleId)?.name,
                gradeId: formData.gradeId || undefined,
                grade: jobGrades.find(g => g.id === formData.gradeId)?.name,
                departmentId: formData.departmentId,
                department: departments.find(d => d.id === formData.departmentId)?.name,
                branchId: formData.branchId || undefined,
                branch: branches.find(b => b.id === formData.branchId)?.name,
                costCentreId: formData.costCentreId || undefined,
                costCentre: costCentres.find(c => c.id === formData.costCentreId)?.name,
                managerId: formData.managerId || undefined,
                managerName: managers.find(m => m.id === formData.managerId)?.firstName + ' ' + managers.find(m => m.id === formData.managerId)?.lastName,
                workScheduleId: formData.workScheduleId || undefined,
                probationEndDate: formData.probationEndDate ? new Date(formData.probationEndDate) : undefined,
                payFrequency: formData.payFrequency,
                salaryType: formData.salaryType,
                basicSalary: formData.basicSalary ? parseFloat(formData.basicSalary) : undefined,
                hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
                taxNumber: formData.taxNumber || undefined,
                isUifApplicable: formData.isUifApplicable,
                bankDetails: formData.bankAccountNumber ? {
                    accountHolderName: formData.bankAccountHolderName,
                    bankName: formData.bankName,
                    branchCode: formData.bankBranchCode,
                    accountNumber: formData.bankAccountNumber,
                    accountType: formData.bankAccountType,
                    isVerified: false
                } : undefined,
                isActive: true,
                createdBy: currentUser.uid
            };

            if (isEdit && id) {
                await EmployeeService.updateEmployee(id, {
                    ...employeeData,
                    updatedBy: currentUser.uid
                });
            } else {
                await EmployeeService.createEmployee(employeeData);
            }

            navigate('/employees');
        } catch (error) {
            console.error('Failed to save employee:', error);
            alert('Failed to save employee. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="employee-form-container">
                    <div className="skeleton" style={{ height: 40, width: '30%', marginBottom: 'var(--space-6)' }} />
                    <div className="employee-form-section">
                        <div className="skeleton" style={{ height: 60 }} />
                        <div style={{ padding: 'var(--space-6)' }}>
                            <div className="form-grid">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="skeleton" style={{ height: 70 }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <form onSubmit={handleSubmit} className="employee-form-container animate-fade-in">
                {/* Header */}
                <div className="employee-form-header">
                    <h1 className="employee-form-title">
                        {isEdit ? 'Edit Employee' : 'Add New Employee'}
                    </h1>
                    <div className="employee-form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={saving}>
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Employee'}
                        </Button>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="employee-form-section">
                    <div className="employee-form-section-header">
                        <div className="employee-form-section-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <h2 className="employee-form-section-title">Personal Information</h2>
                    </div>
                    <div className="employee-form-section-body">
                        <div className="form-grid">
                            <div className="form-field">
                                <label className="form-label">First Name<span>*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.firstName}
                                    onChange={e => handleChange('firstName', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Middle Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.middleName}
                                    onChange={e => handleChange('middleName', e.target.value)}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Last Name<span>*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.lastName}
                                    onChange={e => handleChange('lastName', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Preferred Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.preferredName}
                                    onChange={e => handleChange('preferredName', e.target.value)}
                                    placeholder="Nickname or preferred name"
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">ID Type<span>*</span></label>
                                <select
                                    className="form-select"
                                    value={formData.idType}
                                    onChange={e => handleChange('idType', e.target.value)}
                                    required
                                >
                                    <option value="sa_id">SA ID Number</option>
                                    <option value="passport">Passport</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">
                                    {formData.idType === 'sa_id' ? 'ID Number' : 'Passport Number'}<span>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.idNumber}
                                    onChange={e => handleChange('idNumber', e.target.value)}
                                    maxLength={formData.idType === 'sa_id' ? 13 : 20}
                                    required
                                />
                            </div>
                            {formData.idType === 'passport' && (
                                <div className="form-field">
                                    <label className="form-label">Passport Country</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.passportCountry}
                                        onChange={e => handleChange('passportCountry', e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="form-field">
                                <label className="form-label">Date of Birth<span>*</span></label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.dateOfBirth}
                                    onChange={e => handleChange('dateOfBirth', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Gender</label>
                                <select
                                    className="form-select"
                                    value={formData.gender}
                                    onChange={e => handleChange('gender', e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    {GENDERS.map(g => (
                                        <option key={g.value} value={g.value}>{g.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Nationality</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.nationality}
                                    onChange={e => handleChange('nationality', e.target.value)}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Marital Status</label>
                                <select
                                    className="form-select"
                                    value={formData.maritalStatus}
                                    onChange={e => handleChange('maritalStatus', e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    {MARITAL_STATUSES.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="employee-form-section">
                    <div className="employee-form-section-header">
                        <div className="employee-form-section-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                            </svg>
                        </div>
                        <h2 className="employee-form-section-title">Contact Information</h2>
                    </div>
                    <div className="employee-form-section-body">
                        <div className="form-grid">
                            <div className="form-field">
                                <label className="form-label">Work Email<span>*</span></label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Personal Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.personalEmail}
                                    onChange={e => handleChange('personalEmail', e.target.value)}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Phone Number<span>*</span></label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={e => handleChange('phone', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Alternate Phone</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.alternatePhone}
                                    onChange={e => handleChange('alternatePhone', e.target.value)}
                                />
                            </div>
                        </div>

                        <hr className="form-divider" />

                        <div className="form-grid">
                            <div className="form-field form-grid--full">
                                <label className="form-label">Street Address<span>*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.addressLine1}
                                    onChange={e => handleChange('addressLine1', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field form-grid--full">
                                <label className="form-label">Address Line 2</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.addressLine2}
                                    onChange={e => handleChange('addressLine2', e.target.value)}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Suburb</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.suburb}
                                    onChange={e => handleChange('suburb', e.target.value)}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">City<span>*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.city}
                                    onChange={e => handleChange('city', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Province<span>*</span></label>
                                <select
                                    className="form-select"
                                    value={formData.province}
                                    onChange={e => handleChange('province', e.target.value)}
                                    required
                                >
                                    <option value="">Select province...</option>
                                    {SA_PROVINCES.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Postal Code<span>*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.postalCode}
                                    onChange={e => handleChange('postalCode', e.target.value)}
                                    maxLength={4}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employment Details */}
                <div className="employee-form-section">
                    <div className="employee-form-section-header">
                        <div className="employee-form-section-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                        </div>
                        <h2 className="employee-form-section-title">Employment Details</h2>
                    </div>
                    <div className="employee-form-section-body">
                        <div className="form-grid">
                            <div className="form-field">
                                <label className="form-label">Employee Number<span>*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.employeeNumber}
                                    onChange={e => handleChange('employeeNumber', e.target.value)}
                                    required
                                    readOnly={isEdit}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Start Date<span>*</span></label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.startDate}
                                    onChange={e => handleChange('startDate', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Status<span>*</span></label>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={e => handleChange('status', e.target.value)}
                                    required
                                >
                                    {EMPLOYMENT_STATUSES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Contract Type<span>*</span></label>
                                <select
                                    className="form-select"
                                    value={formData.contractType}
                                    onChange={e => handleChange('contractType', e.target.value)}
                                    required
                                >
                                    {CONTRACT_TYPES.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Department<span>*</span></label>
                                <select
                                    className="form-select"
                                    value={formData.departmentId}
                                    onChange={e => handleChange('departmentId', e.target.value)}
                                    required
                                >
                                    <option value="">Select department...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Branch</label>
                                <select
                                    className="form-select"
                                    value={formData.branchId}
                                    onChange={e => handleChange('branchId', e.target.value)}
                                >
                                    <option value="">Select branch...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Job Title<span>*</span></label>
                                <select
                                    className="form-select"
                                    value={formData.jobTitleId}
                                    onChange={e => handleChange('jobTitleId', e.target.value)}
                                    required
                                >
                                    <option value="">Select job title...</option>
                                    {jobTitles.map(j => (
                                        <option key={j.id} value={j.id}>{j.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Job Grade</label>
                                <select
                                    className="form-select"
                                    value={formData.gradeId}
                                    onChange={e => handleChange('gradeId', e.target.value)}
                                >
                                    <option value="">Select grade...</option>
                                    {jobGrades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Cost Centre</label>
                                <select
                                    className="form-select"
                                    value={formData.costCentreId}
                                    onChange={e => handleChange('costCentreId', e.target.value)}
                                >
                                    <option value="">Select cost centre...</option>
                                    {costCentres.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Manager</label>
                                <select
                                    className="form-select"
                                    value={formData.managerId}
                                    onChange={e => handleChange('managerId', e.target.value)}
                                >
                                    <option value="">Select manager...</option>
                                    {managers.filter(m => m.id !== id).map(m => (
                                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Work Schedule</label>
                                <select
                                    className="form-select"
                                    value={formData.workScheduleId}
                                    onChange={e => handleChange('workScheduleId', e.target.value)}
                                >
                                    <option value="">Select schedule...</option>
                                    {workSchedules.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            {formData.status === 'probation' && (
                                <div className="form-field">
                                    <label className="form-label">Probation End Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.probationEndDate}
                                        onChange={e => handleChange('probationEndDate', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payroll Details */}
                <div className="employee-form-section">
                    <div className="employee-form-section-header">
                        <div className="employee-form-section-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <h2 className="employee-form-section-title">Payroll Details</h2>
                    </div>
                    <div className="employee-form-section-body">
                        <div className="form-grid">
                            <div className="form-field">
                                <label className="form-label">Pay Frequency<span>*</span></label>
                                <select
                                    className="form-select"
                                    value={formData.payFrequency}
                                    onChange={e => handleChange('payFrequency', e.target.value)}
                                    required
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="fortnightly">Fortnightly</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Salary Type<span>*</span></label>
                                <select
                                    className="form-select"
                                    value={formData.salaryType}
                                    onChange={e => handleChange('salaryType', e.target.value)}
                                    required
                                >
                                    <option value="monthly">Monthly Salary</option>
                                    <option value="hourly">Hourly Rate</option>
                                </select>
                            </div>
                            {formData.salaryType === 'monthly' ? (
                                <div className="form-field">
                                    <label className="form-label">Basic Salary (ZAR)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.basicSalary}
                                        onChange={e => handleChange('basicSalary', e.target.value)}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            ) : (
                                <div className="form-field">
                                    <label className="form-label">Hourly Rate (ZAR)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.hourlyRate}
                                        onChange={e => handleChange('hourlyRate', e.target.value)}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            )}
                            <div className="form-field">
                                <label className="form-label">Tax Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.taxNumber}
                                    onChange={e => handleChange('taxNumber', e.target.value)}
                                    placeholder="SARS Tax Reference"
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">&nbsp;</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isUifApplicable}
                                        onChange={e => handleChange('isUifApplicable', e.target.checked)}
                                    />
                                    <span className="form-label" style={{ margin: 0 }}>UIF Applicable</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="employee-form-section">
                    <div className="employee-form-section-header">
                        <div className="employee-form-section-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                        </div>
                        <h2 className="employee-form-section-title">Bank Details</h2>
                    </div>
                    <div className="employee-form-section-body">
                        <div className="form-grid">
                            <div className="form-field">
                                <label className="form-label">Account Holder Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.bankAccountHolderName}
                                    onChange={e => handleChange('bankAccountHolderName', e.target.value)}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Bank Name</label>
                                <select
                                    className="form-select"
                                    value={formData.bankName}
                                    onChange={e => handleChange('bankName', e.target.value)}
                                >
                                    <option value="">Select bank...</option>
                                    <option value="ABSA">ABSA</option>
                                    <option value="Capitec">Capitec</option>
                                    <option value="FNB">First National Bank (FNB)</option>
                                    <option value="Nedbank">Nedbank</option>
                                    <option value="Standard Bank">Standard Bank</option>
                                    <option value="African Bank">African Bank</option>
                                    <option value="Discovery Bank">Discovery Bank</option>
                                    <option value="Investec">Investec</option>
                                    <option value="TymeBank">TymeBank</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Branch Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.bankBranchCode}
                                    onChange={e => handleChange('bankBranchCode', e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Account Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.bankAccountNumber}
                                    onChange={e => handleChange('bankAccountNumber', e.target.value)}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Account Type</label>
                                <select
                                    className="form-select"
                                    value={formData.bankAccountType}
                                    onChange={e => handleChange('bankAccountType', e.target.value as any)}
                                >
                                    <option value="current">Current/Cheque</option>
                                    <option value="savings">Savings</option>
                                    <option value="transmission">Transmission</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Footer */}
                <div className="employee-form-footer">
                    <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Employee'}
                    </Button>
                </div>
            </form>
        </MainLayout>
    );
}
