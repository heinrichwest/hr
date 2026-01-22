import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { EmployeeService } from '../../services/employeeService';
import { CompanyService } from '../../services/companyService';
import type { Employee } from '../../types/employee';
import type { Department, Branch, Company } from '../../types/company';
import './Employees.css';

type FilterStatus = 'all' | 'active' | 'probation' | 'suspended' | 'terminated' | 'on_leave';

export function EmployeeList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { userProfile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    // System Admin specific state
    const [companies, setCompanies] = useState<Company[]>([]);
    const isSystemAdmin = userProfile?.role === 'System Admin' || userProfile?.role?.toLowerCase() === 'system admin';

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        probation: 0,
        suspended: 0,
        terminated: 0,
        onLeave: 0
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (companyId) {
            loadEmployees();
            loadCompanyData(companyId);
        }
    }, [companyId, statusFilter, departmentFilter, branchFilter]);

    const loadInitialData = async () => {
        try {
            // Check for URL companyId parameter (for System Admin)
            const urlCompanyId = searchParams.get('companyId');

            if (isSystemAdmin) {
                // Load all companies for System Admin dropdown
                const allCompanies = await CompanyService.getAllCompanies();
                setCompanies(allCompanies);

                // If URL param exists, use it; otherwise use default company
                if (urlCompanyId) {
                    setCompanyId(urlCompanyId);
                } else {
                    const company = await CompanyService.getDefaultCompany();
                    if (company) {
                        setCompanyId(company.id);
                    }
                }
            } else {
                // Non-System Admin: use default company behavior
                const company = await CompanyService.getDefaultCompany();
                if (company) {
                    setCompanyId(company.id);
                }
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCompanyData = async (targetCompanyId: string) => {
        try {
            const [depts, branchList] = await Promise.all([
                CompanyService.getDepartments(targetCompanyId),
                CompanyService.getBranches(targetCompanyId)
            ]);
            setDepartments(depts);
            setBranches(branchList);
        } catch (error) {
            console.error('Failed to load company data:', error);
        }
    };

    const loadEmployees = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const options: Record<string, string> = {};
            if (statusFilter !== 'all') {
                options.status = statusFilter;
            }
            if (departmentFilter !== 'all') {
                options.departmentId = departmentFilter;
            }
            if (branchFilter !== 'all') {
                options.branchId = branchFilter;
            }

            const data = await EmployeeService.getEmployees(companyId, options);
            setEmployees(data);

            // Load stats
            const statsData = await EmployeeService.getEmployeeStats(companyId);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCompanyId = e.target.value;
        if (newCompanyId) {
            setCompanyId(newCompanyId);
            // Reset filters when company changes
            setDepartmentFilter('all');
            setBranchFilter('all');
        }
    };

    const filteredEmployees = searchTerm
        ? employees.filter(emp =>
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : employees;

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active': return 'emp-status--active';
            case 'probation': return 'emp-status--probation';
            case 'suspended': return 'emp-status--suspended';
            case 'terminated':
            case 'resigned':
            case 'retrenched': return 'emp-status--terminated';
            case 'on_leave': return 'emp-status--leave';
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
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const getDepartmentName = (deptId?: string) => {
        if (!deptId) return '-';
        const dept = departments.find(d => d.id === deptId);
        return dept?.name || '-';
    };

    const handleRowClick = (employeeId: string) => {
        navigate(`/employees/${employeeId}`);
    };

    if (!companyId && !loading) {
        return (
            <MainLayout>
                <div className="emp-empty-state">
                    <div className="emp-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h2>Company Profile Required</h2>
                    <p>Please set up your company profile before managing employees.</p>
                    <Button variant="primary" onClick={() => navigate('/settings')}>
                        Go to Settings
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="emp-page">
                {/* Header */}
                <div className="emp-header">
                    <div>
                        <h1 className="emp-title">Employees</h1>
                        <p className="emp-subtitle">
                            {stats.total} total employees {stats.active > 0 && `\u2022 ${stats.active} active`}
                        </p>
                    </div>
                    <div className="emp-header-actions">
                        {/* Company Selector for System Admin */}
                        {isSystemAdmin && companies.length > 0 && (
                            <div className="company-selector">
                                <select
                                    value={companyId || ''}
                                    onChange={handleCompanyChange}
                                    className="company-select-input"
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--speccon-gray-200)',
                                        marginRight: '12px',
                                        backgroundColor: 'white',
                                        fontSize: '14px',
                                        minWidth: '180px'
                                    }}
                                >
                                    {companies.map(company => (
                                        <option key={company.id} value={company.id}>
                                            {company.legalName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <Button variant="primary" onClick={() => navigate('/employees/new')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Employee
                        </Button>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="emp-filters">
                    <div className="emp-search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="emp-filter-group">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as FilterStatus)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="probation">Probation</option>
                            <option value="on_leave">On Leave</option>
                            <option value="suspended">Suspended</option>
                        </select>

                        <select
                            value={departmentFilter}
                            onChange={e => setDepartmentFilter(e.target.value)}
                        >
                            <option value="all">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>

                        <select
                            value={branchFilter}
                            onChange={e => setBranchFilter(e.target.value)}
                        >
                            <option value="all">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>

                        <button className="emp-refresh-btn" onClick={loadEmployees} title="Refresh">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Employee List */}
                <div className="emp-list">
                    {/* Table Header */}
                    <div className="emp-list-header">
                        <div className="emp-col emp-col--name">Employee</div>
                        <div className="emp-col emp-col--id">ID</div>
                        <div className="emp-col emp-col--dept">Department</div>
                        <div className="emp-col emp-col--status">Status</div>
                        <div className="emp-col emp-col--date">Start Date</div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="emp-loading">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="emp-row emp-row--loading">
                                    <div className="emp-col emp-col--name">
                                        <div className="emp-skeleton emp-skeleton--avatar" />
                                        <div className="emp-skeleton-text">
                                            <div className="emp-skeleton emp-skeleton--name" />
                                            <div className="emp-skeleton emp-skeleton--email" />
                                        </div>
                                    </div>
                                    <div className="emp-col emp-col--id">
                                        <div className="emp-skeleton emp-skeleton--id" />
                                    </div>
                                    <div className="emp-col emp-col--dept">
                                        <div className="emp-skeleton emp-skeleton--dept" />
                                    </div>
                                    <div className="emp-col emp-col--status">
                                        <div className="emp-skeleton emp-skeleton--status" />
                                    </div>
                                    <div className="emp-col emp-col--date">
                                        <div className="emp-skeleton emp-skeleton--date" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="emp-no-results">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="17" y1="11" x2="23" y2="11" />
                            </svg>
                            <p>No employees found</p>
                            <span>
                                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Click "Add Employee" to get started'}
                            </span>
                        </div>
                    ) : (
                        <div className="emp-rows">
                            {filteredEmployees.map(employee => (
                                <div
                                    key={employee.id}
                                    className="emp-row"
                                    onClick={() => handleRowClick(employee.id)}
                                >
                                    <div className="emp-col emp-col--name">
                                        <div
                                            className="emp-avatar"
                                            style={{ backgroundColor: getAvatarColor(`${employee.firstName}${employee.lastName}`) }}
                                        >
                                            {getInitials(employee.firstName, employee.lastName)}
                                        </div>
                                        <div className="emp-info">
                                            <span className="emp-name">{employee.firstName} {employee.lastName}</span>
                                            <span className="emp-email">{employee.email}</span>
                                        </div>
                                    </div>
                                    <div className="emp-col emp-col--id">
                                        <span className="emp-id">{employee.employeeNumber}</span>
                                    </div>
                                    <div className="emp-col emp-col--dept">
                                        {getDepartmentName(employee.departmentId)}
                                    </div>
                                    <div className="emp-col emp-col--status">
                                        <span className={`emp-status ${getStatusBadgeClass(employee.status)}`}>
                                            {formatStatus(employee.status)}
                                        </span>
                                    </div>
                                    <div className="emp-col emp-col--date">
                                        {new Date(employee.startDate).toLocaleDateString('en-ZA', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="emp-col emp-col--arrow">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && filteredEmployees.length > 0 && (
                    <div className="emp-footer">
                        Showing {filteredEmployees.length} of {employees.length} employees
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
