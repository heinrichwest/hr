import { useEffect, useState } from 'react';
import { CompanyService } from '../../services/companyService';
import { UserService } from '../../services/userService';
import { EmployeeService } from '../../services/employeeService';
import { Seeder } from '../../services/seeder';
import type { Company } from '../../types/company';
import type { UserProfile, UserRole } from '../../types/user';
import { Button } from '../../components/Button/Button';
import { MainLayout } from '../../components/Layout/MainLayout';
import './TenantManagement.css';

// Admin roles that can be assigned to tenant admins
const ADMIN_ROLES: UserRole[] = ['HR Admin', 'HR Manager', 'Payroll Admin', 'Payroll Manager', 'Finance Approver'];

export function TenantManagement() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    // Selected tenant for detail view
    const [selectedTenant, setSelectedTenant] = useState<Company | null>(null);
    const [tenantUsers, setTenantUsers] = useState<UserProfile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Add admin form state
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminRole, setNewAdminRole] = useState<UserRole>('HR Admin');
    const [addingAdmin, setAddingAdmin] = useState(false);

    // Form State
    const [newCompany, setNewCompany] = useState({
        legalName: '',
        registrationNumber: '',
        defaultCurrency: 'ZAR',
        defaultPayFrequency: 'monthly',
        financialYearEnd: 2
    });

    // Stats for selected tenant
    const [tenantStats, setTenantStats] = useState({
        employees: 0,
        admins: 0
    });

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const fetchedCompanies = await CompanyService.getAllCompanies();
            setCompanies(fetchedCompanies);
        } catch (error) {
            console.error("Failed to load companies", error);
        } finally {
            setLoading(false);
        }
    };

    const loadTenantUsers = async (companyId: string) => {
        setLoadingUsers(true);
        try {
            const users = await UserService.getAllUsers(companyId);
            setTenantUsers(users);
            setTenantStats(prev => ({
                ...prev,
                admins: users.filter(u => ADMIN_ROLES.includes(u.role)).length
            }));
        } catch (error) {
            console.error("Failed to load tenant users", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadTenantStats = async (companyId: string) => {
        try {
            const employees = await EmployeeService.getEmployees(companyId);
            setTenantStats(prev => ({
                ...prev,
                employees: employees.length
            }));
        } catch (error) {
            console.error("Failed to load tenant stats", error);
        }
    };

    const handleSelectTenant = async (company: Company) => {
        setSelectedTenant(company);
        await Promise.all([
            loadTenantUsers(company.id),
            loadTenantStats(company.id)
        ]);
    };

    const handleCloseTenantDetail = () => {
        setSelectedTenant(null);
        setTenantUsers([]);
        setTenantStats({ employees: 0, admins: 0 });
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const companyData: Omit<Company, 'id' | 'createdAt'> = {
                legalName: newCompany.legalName,
                registrationNumber: newCompany.registrationNumber,
                defaultCurrency: newCompany.defaultCurrency,
                defaultPayFrequency: newCompany.defaultPayFrequency as Company['defaultPayFrequency'],
                financialYearEnd: newCompany.financialYearEnd,
                physicalAddress: {
                    line1: '',
                    city: '',
                    province: '',
                    postalCode: '',
                    country: 'South Africa'
                },
                isActive: true
            };

            const companyId = await CompanyService.createCompany(companyData);
            await CompanyService.initializeCompanyDefaults(companyId);

            setIsCreateModalOpen(false);
            setNewCompany({
                legalName: '',
                registrationNumber: '',
                defaultCurrency: 'ZAR',
                defaultPayFrequency: 'monthly',
                financialYearEnd: 2
            });
            loadCompanies();
        } catch (error) {
            console.error("Failed to create company", error);
            alert("Failed to create company");
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant || !newAdminEmail.trim()) return;

        setAddingAdmin(true);
        try {
            // Create a placeholder user profile that will be linked when the user logs in
            const fakeUid = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await UserService.createUserProfile(fakeUid, newAdminEmail.trim().toLowerCase(), newAdminRole, selectedTenant.id);

            // Reload tenant users
            await loadTenantUsers(selectedTenant.id);

            setNewAdminEmail('');
            setNewAdminRole('HR Admin');
            alert(`Admin user ${newAdminEmail} added successfully. They can now log in with this email.`);
        } catch (error) {
            console.error("Failed to add admin", error);
            alert("Failed to add admin user");
        } finally {
            setAddingAdmin(false);
        }
    };

    const handleSeedData = async () => {
        if (!confirm('Are you sure you want to seed the database? This will create dummy tenants and data.')) return;

        setIsSeeding(true);
        try {
            await Seeder.seedDatabase();
            await loadCompanies();
            alert('Database seeded successfully!');
        } catch (error) {
            console.error('Seeding failed:', error);
            alert('Failed to seed database');
        } finally {
            setIsSeeding(false);
        }
    };

    const handleRemoveDuplicates = async () => {
        if (!confirm('This will remove duplicate tenants, keeping only the first occurrence of each company name. Continue?')) return;

        setLoading(true);
        try {
            // Group companies by legalName
            const groupedByName = new Map<string, Company[]>();
            for (const company of companies) {
                const existing = groupedByName.get(company.legalName) || [];
                existing.push(company);
                groupedByName.set(company.legalName, existing);
            }

            // Delete duplicates (keep the first one, delete the rest)
            let deletedCount = 0;
            for (const [, companiesWithSameName] of groupedByName) {
                if (companiesWithSameName.length > 1) {
                    // Keep the first, delete the rest
                    for (let i = 1; i < companiesWithSameName.length; i++) {
                        await CompanyService.deleteCompany(companiesWithSameName[i].id);
                        deletedCount++;
                    }
                }
            }

            await loadCompanies();
            alert(`Removed ${deletedCount} duplicate tenant(s).`);
        } catch (error) {
            console.error('Failed to remove duplicates:', error);
            alert('Failed to remove duplicates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (email: string, displayName?: string) => {
        if (displayName) {
            return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email.charAt(0).toUpperCase();
    };

    return (
        <MainLayout>
            <div className="tenants-header animate-slide-down">
                <div className="tenants-header-content">
                    <h1 className="tenants-title">Tenant Management</h1>
                    <p className="tenants-subtitle">Manage system tenants (companies)</p>
                </div>
                <div className="tenants-header-actions">
                    <Button variant="tertiary" onClick={handleRemoveDuplicates} disabled={loading}>
                        Remove Duplicates
                    </Button>
                    <Button variant="tertiary" onClick={handleSeedData} disabled={isSeeding}>
                        {isSeeding ? 'Seeding...' : 'Seed Data'}
                    </Button>
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Tenant
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="tenants-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="tenant-card tenant-card--loading">
                            <div className="tenant-card-header">
                                <div>
                                    <div className="skeleton tenant-skeleton--name" />
                                    <div className="skeleton tenant-skeleton--reg" />
                                </div>
                                <div className="skeleton tenant-skeleton--status" />
                            </div>
                            <div className="tenant-actions">
                                <div className="skeleton tenant-skeleton--button" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : companies.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <h3 className="empty-state-text">No Tenants Yet</h3>
                    <p className="empty-state-hint">Get started by adding your first tenant (company) to the system.</p>
                </div>
            ) : (
                <div className="tenants-grid animate-scale-in">
                    {companies.map(company => (
                        <div key={company.id} className={`tenant-card ${selectedTenant?.id === company.id ? 'tenant-card--selected' : ''}`}>
                            <div className="tenant-card-header">
                                <div>
                                    <h3 className="tenant-name">{company.legalName}</h3>
                                    <p className="tenant-reg">{company.registrationNumber}</p>
                                </div>
                                <span className={`tenant-status ${company.isActive ? 'tenant-status--active' : 'tenant-status--inactive'}`}>
                                    {company.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="tenant-actions">
                                <Button variant="secondary" size="sm" onClick={() => handleSelectTenant(company)}>
                                    <UsersIcon />
                                    Manage Admins
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tenant Detail Panel */}
            {selectedTenant && (
                <div className="tenant-detail-panel animate-slide-down">
                    <div className="tenant-detail-header">
                        <h2>{selectedTenant.legalName} - Admin Users</h2>
                        <Button variant="secondary" size="sm" onClick={handleCloseTenantDetail}>
                            <CloseIcon />
                            Close
                        </Button>
                    </div>
                    <div className="tenant-detail-content">
                        {/* Tenant Stats */}
                        <div className="tenant-stats">
                            <div className="tenant-stat">
                                <div className="tenant-stat-value">{tenantStats.employees}</div>
                                <div className="tenant-stat-label">Employees</div>
                            </div>
                            <div className="tenant-stat">
                                <div className="tenant-stat-value">{tenantStats.admins}</div>
                                <div className="tenant-stat-label">Admin Users</div>
                            </div>
                        </div>

                        {/* Admin Users Section */}
                        <div className="admin-users-section">
                            <h3>
                                <UsersIcon />
                                Admin Users
                            </h3>

                            {loadingUsers ? (
                                <div>Loading users...</div>
                            ) : tenantUsers.filter(u => ADMIN_ROLES.includes(u.role)).length === 0 ? (
                                <div className="empty-admins">
                                    <UsersIcon />
                                    <p>No admin users assigned to this tenant yet.</p>
                                </div>
                            ) : (
                                <div className="admin-users-list">
                                    {tenantUsers
                                        .filter(u => ADMIN_ROLES.includes(u.role))
                                        .map(user => (
                                            <div key={user.uid} className="admin-user-card">
                                                <div className="admin-user-info">
                                                    <div className="admin-user-avatar">
                                                        {getInitials(user.email, user.displayName)}
                                                    </div>
                                                    <div className="admin-user-details">
                                                        <span className="admin-user-name">
                                                            {user.displayName || user.email.split('@')[0]}
                                                        </span>
                                                        <span className="admin-user-email">{user.email}</span>
                                                    </div>
                                                </div>
                                                <span className="admin-user-role">{user.role}</span>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Add Admin Form */}
                            <form className="add-admin-form" onSubmit={handleAddAdmin}>
                                <label htmlFor="admin-email" className="form-label">
                                    Email Address<span>*</span>
                                </label>
                                <input
                                    id="admin-email"
                                    type="email"
                                    placeholder="Email address"
                                    value={newAdminEmail}
                                    onChange={e => setNewAdminEmail(e.target.value)}
                                    required
                                />
                                <label htmlFor="admin-role" className="form-label">
                                    Role<span>*</span>
                                </label>
                                <select
                                    id="admin-role"
                                    value={newAdminRole}
                                    onChange={e => setNewAdminRole(e.target.value as UserRole)}
                                >
                                    {ADMIN_ROLES.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                <Button type="submit" variant="primary" disabled={addingAdmin}>
                                    {addingAdmin ? 'Adding...' : 'Add Admin'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Tenant Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add New Tenant</h2>
                            <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateCompany}>
                            <div className="form-group">
                                <label htmlFor="company-legal-name">Company Name<span>*</span></label>
                                <input
                                    id="company-legal-name"
                                    type="text"
                                    required
                                    value={newCompany.legalName}
                                    onChange={e => setNewCompany({ ...newCompany, legalName: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="company-registration-number">Registration Number<span>*</span></label>
                                <input
                                    id="company-registration-number"
                                    type="text"
                                    required
                                    value={newCompany.registrationNumber}
                                    onChange={e => setNewCompany({ ...newCompany, registrationNumber: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">Create Tenant</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

// Icon Components
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

function CloseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

