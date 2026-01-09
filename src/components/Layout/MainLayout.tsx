import { useState, useRef, useEffect, type ReactNode } from 'react';
import { SpecconLogo } from '../Logo/SpecconLogo';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserService } from '../../services/userService';
import type { Permission } from '../../types/user';
import { RoleSwitcherDropdown } from '../RoleSwitcher/RoleSwitcherDropdown';
import { PreviewModeBanner } from '../RoleSwitcher/PreviewModeBanner';
import { usePreviewMode } from '../../contexts/PreviewModeContext';
import './MainLayout.css';

interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType;
    permissions?: Permission[];
}

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { userProfile, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { exitPreviewMode, isPreviewMode } = usePreviewMode();

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset preview mode when navigating away from dashboard
    useEffect(() => {
        if (location.pathname !== '/' && isPreviewMode) {
            exitPreviewMode();
        }
    }, [location.pathname, isPreviewMode, exitPreviewMode]);

    // Check if user is System Admin
    const isSystemAdmin = userProfile?.role?.toString().trim().toLowerCase() === 'system admin';

    // Build navigation items based on role
    // System Admin only sees Tenants and Settings
    const systemAdminNavItems: NavItem[] = [
        { label: 'Tenants', path: '/admin/tenants', icon: TenantsIcon },
        { label: 'Settings', path: '/settings', icon: SettingsIcon },
    ];

    // Regular users see full navigation based on permissions
    const regularNavItems: NavItem[] = [
        { label: 'Dashboard', path: '/', icon: DashboardIcon },
        { label: 'Employees', path: '/employees', icon: EmployeesIcon, permissions: ['employees.view', 'employees.view_team'] },
        { label: 'Leave', path: '/leave', icon: LeaveIcon, permissions: ['leave.view_all', 'leave.view_team', 'leave.approve'] },
        { label: 'Payroll', path: '/payroll', icon: PayrollIcon, permissions: ['payroll.view', 'payroll.create_run'] },
        { label: 'IR Cases', path: '/ir', icon: IRIcon, permissions: ['ir.view_cases', 'ir.create_case'] },
        { label: 'Reports', path: '/reports', icon: ReportsIcon, permissions: ['reports.hr', 'reports.payroll', 'reports.ir'] },
        { label: 'Users', path: '/admin/users', icon: UsersIcon, permissions: ['users.view', 'users.manage_roles'] },
        { label: 'Settings', path: '/settings', icon: SettingsIcon, permissions: ['system.settings', 'company.edit'] },
    ];

    // Filter nav items based on user role and permissions
    const navItems = isSystemAdmin
        ? systemAdminNavItems
        : regularNavItems.filter(item => {
            if (!item.permissions) return true; // Dashboard is always visible
            return UserService.hasAnyPermission(userProfile, item.permissions);
        });

    const userInitials = userProfile?.displayName
        ? userProfile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : userProfile?.email?.charAt(0).toUpperCase() || '?';

    return (
        <div className="layout">
            {/* Header */}
            <header className="layout-header">
                <div className="layout-header-inner">
                    {/* Left: Logo & Nav */}
                    <div className="layout-header-left">
                        <Link to="/" className="layout-logo-link">
                            <SpecconLogo />
                        </Link>

                        <div className="layout-nav-divider" />

                        <nav className="layout-nav">
                            {navItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`layout-nav-link ${isActive(item.path) ? 'layout-nav-link--active' : ''}`}
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Right: Role Switcher & User Profile Dropdown */}
                    <div className="layout-header-right">
                        {/* Role Switcher Dropdown - Only for System Admin */}
                        {isSystemAdmin && <RoleSwitcherDropdown />}

                        {/* User Profile Dropdown */}
                        <div className="layout-user-dropdown-wrapper" ref={dropdownRef}>
                            <button
                                className="layout-user-profile"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-expanded={isDropdownOpen}
                                aria-haspopup="true"
                            >
                                <div className="layout-user-avatar">
                                    {userInitials}
                                </div>
                                <span className="layout-user-role">{userProfile?.role}</span>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="layout-dropdown animate-scale-in">
                                    <div className="layout-dropdown-header">
                                        <div className="layout-dropdown-avatar">
                                            {userInitials}
                                        </div>
                                        <div className="layout-dropdown-info">
                                            <span className="layout-dropdown-name">
                                                {userProfile?.displayName || currentUser?.email?.split('@')[0]}
                                            </span>
                                            <span className="layout-dropdown-email">
                                                {currentUser?.email}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="layout-dropdown-divider" />

                                    <div className="layout-dropdown-role">
                                        <span className="layout-dropdown-role-label">Role</span>
                                        <span className="layout-dropdown-role-value">{userProfile?.role}</span>
                                    </div>

                                    <div className="layout-dropdown-divider" />

                                    <button
                                        className="layout-dropdown-item layout-dropdown-item--danger"
                                        onClick={handleLogout}
                                    >
                                        <LogoutIcon />
                                        <span>Sign out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Preview Mode Banner - Positioned after header, before main content */}
            <PreviewModeBanner />

            {/* Main Content */}
            <main className="layout-main">
                <div className="layout-content">
                    {children}
                </div>
            </main>
        </div>
    );
}

// Icon Components
function DashboardIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
    );
}

function EmployeesIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function LeaveIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function PayrollIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}

function IRIcon() {
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

function ReportsIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    );
}

function TenantsIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4 8 4v14" />
            <path d="M13 10V7" />
            <path d="M13 14v-4" />
            <path d="M13 18v-4" />
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

function SettingsIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}
