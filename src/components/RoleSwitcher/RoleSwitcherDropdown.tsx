// ============================================================
// ROLE SWITCHER DROPDOWN COMPONENT
// Dropdown for System Admin to preview different role dashboards
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePreviewMode } from '../../contexts/PreviewModeContext';
import { ALL_ROLES, ROLE_DISPLAY_INFO } from '../../utils/roleUtils';
import type { UserRole } from '../../types/user';
import './RoleSwitcherDropdown.css';

export function RoleSwitcherDropdown() {
    const { userProfile } = useAuth();
    const { isPreviewMode, previewRole, setPreviewRole, exitPreviewMode } = usePreviewMode();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Check if user is System Admin
    const isSystemAdmin = userProfile?.role?.toString().trim().toLowerCase() === 'system admin';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard events (Escape to close)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Only render for System Admin users
    if (!isSystemAdmin) {
        return null;
    }

    const handleRoleSelect = (role: UserRole) => {
        if (role === 'System Admin') {
            exitPreviewMode();
        } else {
            setPreviewRole(role);
        }
        setIsOpen(false);
    };

    const currentDisplayRole = isPreviewMode && previewRole ? previewRole : 'System Admin';

    return (
        <div className="role-switcher" ref={dropdownRef}>
            <button
                className="role-switcher-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label="Switch role preview"
            >
                <span className="role-switcher-icon">
                    <ViewIcon />
                </span>
                <span className="role-switcher-label">
                    {isPreviewMode ? 'Previewing' : 'View as'}
                </span>
                <span className="role-switcher-value">
                    {currentDisplayRole}
                </span>
                <span className={`role-switcher-chevron ${isOpen ? 'role-switcher-chevron--open' : ''}`}>
                    <ChevronDownIcon />
                </span>
            </button>

            {isOpen && (
                <div className="role-switcher-menu animate-scale-in" role="listbox">
                    <div className="role-switcher-menu-header">
                        <span className="role-switcher-menu-title">Select Role to Preview</span>
                    </div>
                    <div className="role-switcher-menu-divider" />
                    <div className="role-switcher-menu-list">
                        {ALL_ROLES.map((role) => {
                            const isSelected = role === currentDisplayRole;
                            const roleInfo = ROLE_DISPLAY_INFO[role];

                            return (
                                <button
                                    key={role}
                                    className={`role-switcher-menu-item ${isSelected ? 'role-switcher-menu-item--selected' : ''}`}
                                    onClick={() => handleRoleSelect(role)}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <div className="role-switcher-menu-item-content">
                                        <span className="role-switcher-menu-item-name">{role}</span>
                                        <span className="role-switcher-menu-item-desc">
                                            {roleInfo.description}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <span className="role-switcher-menu-item-check">
                                            <CheckIcon />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// Icon Components
function ViewIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
