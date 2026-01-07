import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { EmployeeService } from '../../services/employeeService';
import { CompanyService } from '../../services/companyService';
import type { Employee, EmploymentHistory, EmployeeDocument } from '../../types/employee';
import type { Department, Branch, JobTitle, JobGrade } from '../../types/company';
import './Employees.css';

type Tab = 'overview' | 'employment' | 'payroll' | 'documents' | 'history';

export function EmployeeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Related data
    const [departments, setDepartments] = useState<Department[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [jobGrades, setJobGrades] = useState<JobGrade[]>([]);
    const [employmentHistory, setEmploymentHistory] = useState<EmploymentHistory[]>([]);
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);

    useEffect(() => {
        if (id) {
            loadEmployee();
        }
    }, [id]);

    const loadEmployee = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const emp = await EmployeeService.getEmployee(id);
            if (!emp) {
                navigate('/employees');
                return;
            }
            setEmployee(emp);

            // Load related data
            const [depts, branchList, titles, grades, history, docs] = await Promise.all([
                CompanyService.getDepartments(emp.companyId),
                CompanyService.getBranches(emp.companyId),
                CompanyService.getJobTitles(emp.companyId),
                CompanyService.getJobGrades(emp.companyId),
                EmployeeService.getEmploymentHistory(id),
                EmployeeService.getEmployeeDocuments(id)
            ]);

            setDepartments(depts);
            setBranches(branchList);
            setJobTitles(titles);
            setJobGrades(grades);
            setEmploymentHistory(history);
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to load employee:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active': return 'status-badge--active';
            case 'probation': return 'status-badge--probation';
            case 'suspended': return 'status-badge--suspended';
            case 'terminated':
            case 'resigned':
            case 'retrenched': return 'status-badge--terminated';
            case 'on_leave': return 'status-badge--leave';
            default: return '';
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'var(--speccon-brand-primary)',
            'var(--speccon-info)',
            'var(--speccon-success)',
            'var(--speccon-warning)',
            '#8B5CF6',
            '#EC4899'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return '-';
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount);
    };

    const getDepartmentName = (deptId?: string) => {
        if (!deptId) return '-';
        return departments.find(d => d.id === deptId)?.name || '-';
    };

    const getBranchName = (branchId?: string) => {
        if (!branchId) return '-';
        return branches.find(b => b.id === branchId)?.name || '-';
    };

    const getJobTitleName = (titleId?: string) => {
        if (!titleId) return '-';
        return jobTitles.find(j => j.id === titleId)?.name || '-';
    };

    const getGradeName = (gradeId?: string) => {
        if (!gradeId) return '-';
        return jobGrades.find(g => g.id === gradeId)?.name || '-';
    };

    const calculateAge = (dob: Date) => {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const calculateTenure = (startDate: Date) => {
        const today = new Date();
        const start = new Date(startDate);
        const years = today.getFullYear() - start.getFullYear();
        const months = today.getMonth() - start.getMonth();

        let totalMonths = years * 12 + months;
        if (today.getDate() < start.getDate()) {
            totalMonths--;
        }

        const y = Math.floor(totalMonths / 12);
        const m = totalMonths % 12;

        if (y > 0 && m > 0) {
            return `${y} year${y !== 1 ? 's' : ''}, ${m} month${m !== 1 ? 's' : ''}`;
        } else if (y > 0) {
            return `${y} year${y !== 1 ? 's' : ''}`;
        } else {
            return `${m} month${m !== 1 ? 's' : ''}`;
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="animate-fade-in">
                    <div className="skeleton" style={{ height: 150, marginBottom: 'var(--space-6)' }} />
                    <div className="skeleton" style={{ height: 60, marginBottom: 'var(--space-6)' }} />
                    <div className="skeleton" style={{ height: 300 }} />
                </div>
            </MainLayout>
        );
    }

    if (!employee) {
        return (
            <MainLayout>
                <div className="empty-state">
                    <p>Employee not found</p>
                    <Button variant="primary" onClick={() => navigate('/employees')}>
                        Back to Employees
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Back Link */}
            <Link to="/employees" className="action-btn" style={{ marginBottom: 'var(--space-4)', display: 'inline-flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Employees
            </Link>

            {/* Header Card */}
            <div className="employee-detail-header animate-slide-down">
                <div
                    className="employee-detail-avatar"
                    style={{ backgroundColor: getAvatarColor(`${employee.firstName}${employee.lastName}`) }}
                >
                    {employee.avatar ? (
                        <img src={employee.avatar} alt="" />
                    ) : (
                        getInitials(employee.firstName, employee.lastName)
                    )}
                </div>
                <div className="employee-detail-info">
                    <h1 className="employee-detail-name">
                        {employee.firstName} {employee.lastName}
                    </h1>
                    <div className="employee-detail-meta">
                        <span className="employee-detail-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                            {employee.jobTitle || getJobTitleName(employee.jobTitleId)}
                        </span>
                        <span className="employee-detail-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                            {employee.department || getDepartmentName(employee.departmentId)}
                        </span>
                        <span className="employee-detail-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            {employee.email}
                        </span>
                    </div>
                    <div className="employee-detail-badges">
                        <span className={`status-badge ${getStatusBadgeClass(employee.status)}`}>
                            {formatStatus(employee.status)}
                        </span>
                        <code className="employee-number">{employee.employeeNumber}</code>
                    </div>
                </div>
                <div className="employee-detail-actions">
                    <Button variant="primary" onClick={() => navigate(`/employees/${id}/edit`)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="employee-tabs animate-scale-in">
                <button
                    className={`employee-tab ${activeTab === 'overview' ? 'employee-tab--active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    Overview
                </button>
                <button
                    className={`employee-tab ${activeTab === 'employment' ? 'employee-tab--active' : ''}`}
                    onClick={() => setActiveTab('employment')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    Employment
                </button>
                <button
                    className={`employee-tab ${activeTab === 'payroll' ? 'employee-tab--active' : ''}`}
                    onClick={() => setActiveTab('payroll')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Payroll
                </button>
                <button
                    className={`employee-tab ${activeTab === 'documents' ? 'employee-tab--active' : ''}`}
                    onClick={() => setActiveTab('documents')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Documents ({documents.length})
                </button>
                <button
                    className={`employee-tab ${activeTab === 'history' ? 'employee-tab--active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    History ({employmentHistory.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
                {activeTab === 'overview' && (
                    <>
                        {/* Personal Information */}
                        <div className="info-card">
                            <div className="info-card-header">
                                <h3 className="info-card-title">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Personal Information
                                </h3>
                            </div>
                            <div className="info-card-body">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-item-label">Full Name</span>
                                        <span className="info-item-value">
                                            {employee.firstName} {employee.middleName} {employee.lastName}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Preferred Name</span>
                                        <span className={`info-item-value ${!employee.preferredName ? 'info-item-value--empty' : ''}`}>
                                            {employee.preferredName || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">{employee.idType === 'sa_id' ? 'ID Number' : 'Passport'}</span>
                                        <span className="info-item-value">{employee.idNumber}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Date of Birth</span>
                                        <span className="info-item-value">
                                            {formatDate(employee.dateOfBirth)} ({calculateAge(employee.dateOfBirth)} years)
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Gender</span>
                                        <span className={`info-item-value ${!employee.gender ? 'info-item-value--empty' : ''}`}>
                                            {employee.gender ? employee.gender.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Marital Status</span>
                                        <span className={`info-item-value ${!employee.maritalStatus ? 'info-item-value--empty' : ''}`}>
                                            {employee.maritalStatus ? employee.maritalStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Nationality</span>
                                        <span className={`info-item-value ${!employee.nationality ? 'info-item-value--empty' : ''}`}>
                                            {employee.nationality || 'Not specified'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="info-card">
                            <div className="info-card-header">
                                <h3 className="info-card-title">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" />
                                    </svg>
                                    Contact Information
                                </h3>
                            </div>
                            <div className="info-card-body">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-item-label">Work Email</span>
                                        <span className="info-item-value">{employee.email}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Personal Email</span>
                                        <span className={`info-item-value ${!employee.personalEmail ? 'info-item-value--empty' : ''}`}>
                                            {employee.personalEmail || 'Not provided'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Phone</span>
                                        <span className="info-item-value">{employee.phone}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Alternate Phone</span>
                                        <span className={`info-item-value ${!employee.alternatePhone ? 'info-item-value--empty' : ''}`}>
                                            {employee.alternatePhone || 'Not provided'}
                                        </span>
                                    </div>
                                </div>

                                {employee.residentialAddress && (
                                    <>
                                        <hr className="form-divider" />
                                        <div className="info-grid info-grid--2col">
                                            <div className="info-item">
                                                <span className="info-item-label">Residential Address</span>
                                                <span className="info-item-value">
                                                    {employee.residentialAddress.line1}
                                                    {employee.residentialAddress.line2 && <br />}
                                                    {employee.residentialAddress.line2}
                                                    {employee.residentialAddress.suburb && <><br />{employee.residentialAddress.suburb}</>}
                                                    <br />
                                                    {employee.residentialAddress.city}, {employee.residentialAddress.province}
                                                    <br />
                                                    {employee.residentialAddress.postalCode}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'employment' && (
                    <div className="info-card">
                        <div className="info-card-header">
                            <h3 className="info-card-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                                Employment Details
                            </h3>
                        </div>
                        <div className="info-card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-item-label">Employee Number</span>
                                    <span className="info-item-value">{employee.employeeNumber}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Start Date</span>
                                    <span className="info-item-value">{formatDate(employee.startDate)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Tenure</span>
                                    <span className="info-item-value">{calculateTenure(employee.startDate)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Status</span>
                                    <span className={`status-badge ${getStatusBadgeClass(employee.status)}`}>
                                        {formatStatus(employee.status)}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Contract Type</span>
                                    <span className="info-item-value">
                                        {employee.contractType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Job Title</span>
                                    <span className="info-item-value">{employee.jobTitle || getJobTitleName(employee.jobTitleId)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Job Grade</span>
                                    <span className={`info-item-value ${!employee.gradeId ? 'info-item-value--empty' : ''}`}>
                                        {employee.grade || getGradeName(employee.gradeId) || 'Not assigned'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Department</span>
                                    <span className="info-item-value">{employee.department || getDepartmentName(employee.departmentId)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Branch</span>
                                    <span className={`info-item-value ${!employee.branchId ? 'info-item-value--empty' : ''}`}>
                                        {employee.branch || getBranchName(employee.branchId) || 'Not assigned'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Cost Centre</span>
                                    <span className={`info-item-value ${!employee.costCentreId ? 'info-item-value--empty' : ''}`}>
                                        {employee.costCentre || 'Not assigned'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-item-label">Manager</span>
                                    <span className={`info-item-value ${!employee.managerId ? 'info-item-value--empty' : ''}`}>
                                        {employee.managerName || 'Not assigned'}
                                    </span>
                                </div>
                                {employee.status === 'probation' && (
                                    <div className="info-item">
                                        <span className="info-item-label">Probation End Date</span>
                                        <span className={`info-item-value ${!employee.probationEndDate ? 'info-item-value--empty' : ''}`}>
                                            {formatDate(employee.probationEndDate) || 'Not set'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payroll' && (
                    <>
                        <div className="info-card">
                            <div className="info-card-header">
                                <h3 className="info-card-title">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                    Payroll Details
                                </h3>
                            </div>
                            <div className="info-card-body">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-item-label">Pay Frequency</span>
                                        <span className="info-item-value">
                                            {employee.payFrequency.charAt(0).toUpperCase() + employee.payFrequency.slice(1)}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Salary Type</span>
                                        <span className="info-item-value">
                                            {employee.salaryType === 'monthly' ? 'Monthly Salary' : 'Hourly Rate'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">{employee.salaryType === 'monthly' ? 'Basic Salary' : 'Hourly Rate'}</span>
                                        <span className="info-item-value">
                                            {employee.salaryType === 'monthly'
                                                ? formatCurrency(employee.basicSalary)
                                                : `${formatCurrency(employee.hourlyRate)}/hour`}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">Tax Number</span>
                                        <span className={`info-item-value ${!employee.taxNumber ? 'info-item-value--empty' : ''}`}>
                                            {employee.taxNumber || 'Not provided'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-item-label">UIF Applicable</span>
                                        <span className="info-item-value">{employee.isUifApplicable ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="info-card">
                            <div className="info-card-header">
                                <h3 className="info-card-title">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                        <line x1="1" y1="10" x2="23" y2="10" />
                                    </svg>
                                    Bank Details
                                </h3>
                            </div>
                            <div className="info-card-body">
                                {employee.bankDetails ? (
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-item-label">Account Holder</span>
                                            <span className="info-item-value">{employee.bankDetails.accountHolderName}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-item-label">Bank</span>
                                            <span className="info-item-value">{employee.bankDetails.bankName}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-item-label">Branch Code</span>
                                            <span className="info-item-value">{employee.bankDetails.branchCode}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-item-label">Account Number</span>
                                            <span className="info-item-value">
                                                ****{employee.bankDetails.accountNumber.slice(-4)}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-item-label">Account Type</span>
                                            <span className="info-item-value">
                                                {employee.bankDetails.accountType.charAt(0).toUpperCase() + employee.bankDetails.accountType.slice(1)}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-item-label">Verified</span>
                                            <span className={`status-badge ${employee.bankDetails.isVerified ? 'status-badge--active' : 'status-badge--suspended'}`}>
                                                {employee.bankDetails.isVerified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <p className="empty-state-text">No bank details on file</p>
                                        <p className="empty-state-hint">Bank details can be added when editing this employee</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'documents' && (
                    <div className="info-card">
                        <div className="info-card-header">
                            <h3 className="info-card-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                Documents
                            </h3>
                            <Button variant="secondary" size="sm">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Upload Document
                            </Button>
                        </div>
                        <div className="info-card-body">
                            {documents.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    </div>
                                    <p className="empty-state-text">No documents uploaded</p>
                                    <p className="empty-state-hint">Upload employee documents like ID copies, contracts, and certificates</p>
                                </div>
                            ) : (
                                <p>Document list will be shown here</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="info-card">
                        <div className="info-card-header">
                            <h3 className="info-card-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                Employment History
                            </h3>
                        </div>
                        <div className="info-card-body">
                            {employmentHistory.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </div>
                                    <p className="empty-state-text">No history records</p>
                                    <p className="empty-state-hint">Employment changes will be tracked here automatically</p>
                                </div>
                            ) : (
                                <p>Employment history timeline will be shown here</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
