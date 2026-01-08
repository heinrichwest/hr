import { useEffect, useState } from 'react';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile, UserRole } from '../../types/user';
import type { Company } from '../../types/company';
import { Button } from '../../components/Button/Button';
import { MainLayout } from '../../components/Layout/MainLayout';
import './UserManagement.css';

// All available roles
const ALL_ROLES: UserRole[] = [
    'System Admin',
    'HR Admin',
    'HR Manager',
    'Payroll Admin',
    'Payroll Manager',
    'Finance Approver',
    'Finance Read-Only',
    'Line Manager',
    'IR Officer',
    'IR Manager',
    'Employee'
];

export function UserManagement() {
    const { userProfile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            if (!userProfile) return;

            setLoading(true);
            try {
                if (userProfile.role === 'System Admin' || userProfile.role?.toLowerCase() === 'system admin') {
                    // Load all companies for filter
                    const allCompanies = await CompanyService.getAllCompanies();
                    setCompanies(allCompanies);

                    // Default to showing all users if no company selected, 
                    // or maybe we should default to the first company?
                    // For now, let's just load all.
                    await loadUsers();
                } else {
                    // For non-system admin, lock to their company
                    if (userProfile.companyId) {
                        setSelectedCompanyId(userProfile.companyId);
                        await loadUsers(userProfile.companyId);
                    } else {
                        // User has no company? Should not happen for normal users under this new model
                        console.warn("User has no company ID");
                        setUsers([]);
                    }
                }
            } catch (error) {
                console.error("Initialization failed", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [userProfile]);

    const loadUsers = async (companyId?: string) => {
        setLoading(true);
        try {
            // If companyId is passed, use it. Otherwise use selectedCompanyId if set.
            const targetCompanyId = companyId || selectedCompanyId || undefined;

            const fetchedUsers = await UserService.getAllUsers(targetCompanyId);
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCompanyId = e.target.value;
        setSelectedCompanyId(newCompanyId);
        await loadUsers(newCompanyId);
    };

    const handleEditRole = (user: UserProfile) => {
        setEditingUserId(user.uid);
        setSelectedRole(user.role);
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setSelectedRole(null);
    };

    const handleSaveRole = async (uid: string) => {
        if (!selectedRole) return;

        try {
            await UserService.updateUserRole(uid, selectedRole);
            setEditingUserId(null);
            setSelectedRole(null);
            // Reload with current filters
            loadUsers(selectedCompanyId);
        } catch (e) {
            alert("Failed to update role");
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'System Admin':
                return 'role-badge--admin';
            case 'HR Admin':
            case 'HR Manager':
                return 'role-badge--hr';
            case 'Payroll Admin':
            case 'Payroll Manager':
                return 'role-badge--payroll';
            case 'Finance Approver':
            case 'Finance Read-Only':
                return 'role-badge--finance';
            case 'Line Manager':
                return 'role-badge--manager';
            case 'IR Officer':
            case 'IR Manager':
                return 'role-badge--ir';
            default:
                return 'role-badge--employee';
        }
    };

    const getInitials = (user: UserProfile) => {
        if (user.displayName) {
            return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return user.email.charAt(0).toUpperCase();
    };

    const getAvatarColor = (email: string) => {
        const colors = [
            'var(--speccon-brand-primary)',
            'var(--speccon-info)',
            'var(--speccon-success)',
            'var(--speccon-warning)',
            '#8B5CF6',
            '#EC4899',
        ];
        const index = email.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="users-header animate-slide-down">
                <div className="users-header-content">
                    <h1 className="users-title">User Management</h1>
                    <p className="users-subtitle">View and manage user roles and permissions</p>
                </div>
                <div className="users-header-actions">
                    {(userProfile?.role === 'System Admin' || userProfile?.role?.toLowerCase() === 'system admin') && (
                        <div className="company-selector">
                            <select
                                value={selectedCompanyId}
                                onChange={handleCompanyChange}
                                className="company-select-input"
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--speccon-gray-200)',
                                    marginRight: '12px',
                                    backgroundColor: 'white',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">All Companies</option>
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.legalName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Button variant="secondary" onClick={() => loadUsers(selectedCompanyId)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Refresh
                    </Button>
                    <Button variant="primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add User
                    </Button>
                </div>
            </div>

            {/* Users Table */}
            <div className="users-table-container animate-scale-in">
                <div className="users-table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>User ID</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <tr key={i} className="loading-row">
                                            <td>
                                                <div className="user-cell">
                                                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)' }} />
                                                    <div className="skeleton" style={{ width: 180, height: 16 }} />
                                                </div>
                                            </td>
                                            <td><div className="skeleton" style={{ width: 120, height: 24 }} /></td>
                                            <td><div className="skeleton" style={{ width: 60, height: 24 }} /></td>
                                            <td><div className="skeleton" style={{ width: 100, height: 16 }} /></td>
                                            <td className="text-right"><div className="skeleton" style={{ width: 80, height: 32, marginLeft: 'auto' }} /></td>
                                        </tr>
                                    ))}
                                </>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <line x1="17" y1="11" x2="23" y2="11" />
                                                </svg>
                                            </div>
                                            <p className="empty-state-text">No users found</p>
                                            <p className="empty-state-hint">Users will appear here once they're added to the system</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.uid}>
                                        <td>
                                            <div className="user-cell">
                                                <div
                                                    className="user-avatar"
                                                    style={{ backgroundColor: getAvatarColor(user.email) }}
                                                >
                                                    {getInitials(user)}
                                                </div>
                                                <div className="user-info">
                                                    <span className="user-email">{user.email}</span>
                                                    <span className="user-name">{user.displayName || 'No display name'}</span>
                                                    {user.companyId && (
                                                        <span className="user-company-badge" style={{
                                                            fontSize: '10px',
                                                            backgroundColor: '#f3f4f6',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            color: '#6b7280',
                                                            marginLeft: '8px'
                                                        }}>
                                                            {companies.find(c => c.id === user.companyId)?.legalName || 'Unknown Company'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {editingUserId === user.uid ? (
                                                <select
                                                    className="role-select"
                                                    value={selectedRole || ''}
                                                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                                >
                                                    {ALL_ROLES.map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.isActive !== false ? 'status-badge--active' : 'status-badge--inactive'}`}>
                                                {user.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <code className="user-uid" title={user.uid}>
                                                {user.uid.substring(0, 12)}...
                                            </code>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                {editingUserId === user.uid ? (
                                                    <>
                                                        <button
                                                            className="action-btn action-btn--save"
                                                            onClick={() => handleSaveRole(user.uid)}
                                                            title="Save"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                            Save
                                                        </button>
                                                        <button
                                                            className="action-btn"
                                                            onClick={handleCancelEdit}
                                                            title="Cancel"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="action-btn"
                                                            onClick={() => handleEditRole(user)}
                                                            title="Edit role"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                            Edit Role
                                                        </button>
                                                        <button className="action-btn action-btn--icon" title="More options">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="1" />
                                                                <circle cx="19" cy="12" r="1" />
                                                                <circle cx="5" cy="12" r="1" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                {!loading && users.length > 0 && (
                    <div className="table-footer">
                        <span className="table-count">
                            Showing <strong>{users.length}</strong> user{users.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
