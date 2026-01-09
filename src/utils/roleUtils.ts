// ============================================================
// ROLE UTILITIES
// Constants and helpers for user roles
// ============================================================

import type { UserRole } from '../types/user';

/**
 * Array of all 11 user roles in the system
 */
export const ALL_ROLES: UserRole[] = [
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
    'Employee',
];

/**
 * Display information for each role
 */
export interface RoleDisplayInfo {
    name: UserRole;
    description: string;
    icon?: string;
}

export const ROLE_DISPLAY_INFO: Record<UserRole, RoleDisplayInfo> = {
    'System Admin': {
        name: 'System Admin',
        description: 'Full system access and configuration',
        icon: 'settings',
    },
    'HR Admin': {
        name: 'HR Admin',
        description: 'Employee management and HR operations',
        icon: 'users',
    },
    'HR Manager': {
        name: 'HR Manager',
        description: 'HR oversight and policy management',
        icon: 'briefcase',
    },
    'Payroll Admin': {
        name: 'Payroll Admin',
        description: 'Payroll processing and calculations',
        icon: 'calculator',
    },
    'Payroll Manager': {
        name: 'Payroll Manager',
        description: 'Payroll approval and management',
        icon: 'dollar-sign',
    },
    'Finance Approver': {
        name: 'Finance Approver',
        description: 'Financial approvals and oversight',
        icon: 'check-circle',
    },
    'Finance Read-Only': {
        name: 'Finance Read-Only',
        description: 'View financial reports and data',
        icon: 'eye',
    },
    'Line Manager': {
        name: 'Line Manager',
        description: 'Team management and approvals',
        icon: 'users',
    },
    'IR Officer': {
        name: 'IR Officer',
        description: 'Industrial relations case handling',
        icon: 'file-text',
    },
    'IR Manager': {
        name: 'IR Manager',
        description: 'IR oversight and case management',
        icon: 'shield',
    },
    'Employee': {
        name: 'Employee',
        description: 'Self-service and personal info',
        icon: 'user',
    },
};

/**
 * Get the display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
    return ROLE_DISPLAY_INFO[role]?.name || role;
}

/**
 * Get the description for a role
 */
export function getRoleDescription(role: UserRole): string {
    return ROLE_DISPLAY_INFO[role]?.description || '';
}
