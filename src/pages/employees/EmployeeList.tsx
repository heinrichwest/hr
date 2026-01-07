import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Button } from '../../components/Button/Button';
import { EmployeeService } from '../../services/employeeService';
import { CompanyService } from '../../services/companyService';
import type { Employee } from '../../types/employee';
import type { Department, Branch } from '../../types/company';
import './Employees.css';

type FilterStatus = 'all' | 'active' | 'probation' | 'suspended' | 'terminated' | 'on_leave';

export function EmployeeList() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

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
        }
    }, [companyId, statusFilter, departmentFilter, branchFilter]);

    const loadInitialData = async () => {
        try {
            const company = await CompanyService.getDefaultCompany();
            if (company) {
                setCompanyId(company.id);
                const [depts, branchList] = await Promise.all([
                    CompanyService.getDepartments(company.id),
                    CompanyService.getBranches(company.id)
                ]);
                setDepartments(depts);
                setBranches(branchList);
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const options: any = {};
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

    const filteredEmployees = searchTerm
        ? employees.filter(emp =>
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : employees;

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
            '#EC4899',
            '#14B8A6',
            '#F97316'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const getDepartmentName = (deptId?: string) => {
        if (!deptId) return '-';
        const dept = departments.find(d => d.id === deptId);
        return dept?.name || '-';
    };

    if (!companyId && !loading) {
        return (
            <MainLayout>
                <div className="employees-empty-company">
                    <div className="empty-icon">
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
            {/* Page Header */}
            <div className="employees-header animate-slide-down">
                <div className="employees-header-content">
                    <h1 className="employees-title">Employees</h1>
                    <p className="employees-subtitle">Manage your workforce</p>
                </div>
                <div className="employees-header-actions">
                    <Button variant="secondary" onClick={loadEmployees}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Refresh
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/employees/new')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Employee
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="employees-stats animate-scale-in">
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Employees</div>
                </div>
                <div className="stat-card stat-card--active">
                    <div className="stat-value">{stats.active}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="stat-card stat-card--probation">
                    <div className="stat-value">{stats.probation}</div>
                    <div className="stat-label">On Probation</div>
                </div>
                <div className="stat-card stat-card--leave">
                    <div className="stat-value">{stats.onLeave}</div>
                    <div className="stat-label">On Leave</div>
                </div>
                <div className="stat-card stat-card--suspended">
                    <div className="stat-value">{stats.suspended}</div>
                    <div className="stat-label">Suspended</div>
                </div>
            </div>

            {/* Filters */}
            <div className="employees-filters animate-fade-in">
                <div className="filter-search">
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name, employee number, or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="filter-search-input"
                    />
                </div>

                <div className="filter-selects">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as FilterStatus)}
                        className="filter-select"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="probation">Probation</option>
                        <option value="on_leave">On Leave</option>
                        <option value="suspended">Suspended</option>
                        <option value="terminated">Terminated</option>
                    </select>

                    <select
                        value={departmentFilter}
                        onChange={e => setDepartmentFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>

                    <select
                        value={branchFilter}
                        onChange={e => setBranchFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Branches</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Employee Table */}
            <div className="employees-table-container animate-scale-in">
                <div className="employees-table-wrapper">
                    <table className="employees-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Employee No.</th>
                                <th>Department</th>
                                <th>Job Title</th>
                                <th>Status</th>
                                <th>Start Date</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="loading-row">
                                            <td>
                                                <div className="employee-cell">
                                                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)' }} />
                                                    <div>
                                                        <div className="skeleton" style={{ width: 150, height: 16, marginBottom: 4 }} />
                                                        <div className="skeleton" style={{ width: 180, height: 12 }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td><div className="skeleton" style={{ width: 80, height: 16 }} /></td>
                                            <td><div className="skeleton" style={{ width: 100, height: 16 }} /></td>
                                            <td><div className="skeleton" style={{ width: 120, height: 16 }} /></td>
                                            <td><div className="skeleton" style={{ width: 70, height: 24 }} /></td>
                                            <td><div className="skeleton" style={{ width: 80, height: 16 }} /></td>
                                            <td><div className="skeleton" style={{ width: 60, height: 32, marginLeft: 'auto' }} /></td>
                                        </tr>
                                    ))}
                                </>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <line x1="17" y1="11" x2="23" y2="11" />
                                                </svg>
                                            </div>
                                            <p className="empty-state-text">
                                                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                                                    ? 'No employees match your filters'
                                                    : 'No employees yet'}
                                            </p>
                                            <p className="empty-state-hint">
                                                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                                                    ? 'Try adjusting your search or filter criteria'
                                                    : 'Click "Add Employee" to create your first employee'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map(employee => (
                                    <tr key={employee.id}>
                                        <td>
                                            <Link to={`/employees/${employee.id}`} className="employee-cell">
                                                <div
                                                    className="employee-avatar"
                                                    style={{ backgroundColor: getAvatarColor(`${employee.firstName}${employee.lastName}`) }}
                                                >
                                                    {employee.avatar ? (
                                                        <img src={employee.avatar} alt="" />
                                                    ) : (
                                                        getInitials(employee.firstName, employee.lastName)
                                                    )}
                                                </div>
                                                <div className="employee-info">
                                                    <span className="employee-name">
                                                        {employee.firstName} {employee.lastName}
                                                    </span>
                                                    <span className="employee-email">{employee.email}</span>
                                                </div>
                                            </Link>
                                        </td>
                                        <td>
                                            <code className="employee-number">{employee.employeeNumber}</code>
                                        </td>
                                        <td>{getDepartmentName(employee.departmentId)}</td>
                                        <td>{employee.jobTitle || '-'}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(employee.status)}`}>
                                                {formatStatus(employee.status)}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(employee.startDate).toLocaleDateString('en-ZA', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/employees/${employee.id}`}
                                                    className="action-btn"
                                                    title="View details"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                    View
                                                </Link>
                                                <Link
                                                    to={`/employees/${employee.id}/edit`}
                                                    className="action-btn action-btn--icon"
                                                    title="Edit"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                {!loading && filteredEmployees.length > 0 && (
                    <div className="table-footer">
                        <span className="table-count">
                            Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employee{employees.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
