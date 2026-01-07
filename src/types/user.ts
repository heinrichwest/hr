// ============================================================
// USER ROLES & PERMISSIONS
// ============================================================

export type UserRole =
    | 'System Admin'
    | 'HR Admin'
    | 'HR Manager'
    | 'Payroll Admin'
    | 'Payroll Manager'
    | 'Finance Approver'
    | 'Finance Read-Only'
    | 'Line Manager'
    | 'IR Officer'
    | 'IR Manager'
    | 'Employee';

// Permission categories for granular access control
export type Permission =
    // System permissions
    | 'system.manage'
    | 'system.audit_logs'
    | 'system.settings'
    // User permissions
    | 'users.view'
    | 'users.create'
    | 'users.edit'
    | 'users.delete'
    | 'users.manage_roles'
    // Company permissions
    | 'company.view'
    | 'company.edit'
    | 'company.manage_structure'
    // Employee permissions
    | 'employees.view'
    | 'employees.view_own'
    | 'employees.view_team'
    | 'employees.create'
    | 'employees.edit'
    | 'employees.edit_sensitive'
    | 'employees.delete'
    | 'employees.terminate'
    | 'employees.view_salary'
    | 'employees.edit_salary'
    | 'employees.view_bank'
    | 'employees.edit_bank'
    // Leave permissions
    | 'leave.view_own'
    | 'leave.view_team'
    | 'leave.view_all'
    | 'leave.request'
    | 'leave.approve'
    | 'leave.adjust_balance'
    | 'leave.manage_policies'
    // Payroll permissions
    | 'payroll.view'
    | 'payroll.create_run'
    | 'payroll.calculate'
    | 'payroll.approve'
    | 'payroll.finalise'
    | 'payroll.reopen_period'
    | 'payroll.adjustments'
    | 'payroll.view_payslips'
    | 'payroll.statutory_exports'
    // IR permissions
    | 'ir.view_cases'
    | 'ir.create_case'
    | 'ir.manage_case'
    | 'ir.view_evidence'
    | 'ir.upload_evidence'
    | 'ir.generate_letters'
    | 'ir.record_outcomes'
    | 'ir.close_case'
    | 'ir.grant_access'
    // Reports permissions
    | 'reports.hr'
    | 'reports.payroll'
    | 'reports.ir'
    | 'reports.finance'
    // Documents permissions
    | 'documents.view_own'
    | 'documents.view_all'
    | 'documents.upload'
    | 'documents.manage';

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    companyId?: string;
    departmentId?: string;
    branchId?: string;
    managerId?: string;
    employeeId?: string; // Link to employee record if applicable
    phone?: string;
    avatar?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt?: Date;
}

export interface RoleDefinition {
    id: string;
    name: UserRole;
    description: string;
    permissions: Permission[];
    isSystem: boolean; // System roles cannot be deleted
    createdAt: Date;
    updatedAt?: Date;
}

// Role permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    'System Admin': [
        'system.manage', 'system.audit_logs', 'system.settings',
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
        'company.view', 'company.edit', 'company.manage_structure',
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'leave.view_all', 'leave.manage_policies',
        'documents.view_all', 'documents.manage',
        'reports.hr', 'reports.payroll', 'reports.ir', 'reports.finance'
    ],
    'HR Admin': [
        'employees.view', 'employees.create', 'employees.edit',
        'employees.view_salary', 'employees.view_bank',
        'leave.view_all', 'leave.adjust_balance',
        'documents.view_all', 'documents.upload', 'documents.manage',
        'reports.hr'
    ],
    'HR Manager': [
        'employees.view', 'employees.create', 'employees.edit', 'employees.edit_sensitive',
        'employees.terminate', 'employees.view_salary', 'employees.edit_salary',
        'employees.view_bank', 'employees.edit_bank',
        'leave.view_all', 'leave.approve', 'leave.adjust_balance', 'leave.manage_policies',
        'documents.view_all', 'documents.upload', 'documents.manage',
        'reports.hr'
    ],
    'Payroll Admin': [
        'employees.view', 'employees.view_salary', 'employees.view_bank',
        'payroll.view', 'payroll.create_run', 'payroll.calculate', 'payroll.adjustments',
        'payroll.view_payslips',
        'reports.payroll'
    ],
    'Payroll Manager': [
        'employees.view', 'employees.view_salary', 'employees.edit_salary',
        'employees.view_bank', 'employees.edit_bank',
        'payroll.view', 'payroll.create_run', 'payroll.calculate', 'payroll.approve',
        'payroll.finalise', 'payroll.reopen_period', 'payroll.adjustments',
        'payroll.view_payslips', 'payroll.statutory_exports',
        'reports.payroll'
    ],
    'Finance Approver': [
        'payroll.view', 'payroll.approve',
        'reports.payroll', 'reports.finance'
    ],
    'Finance Read-Only': [
        'payroll.view',
        'reports.payroll', 'reports.finance'
    ],
    'Line Manager': [
        'employees.view_team',
        'leave.view_team', 'leave.approve',
        'ir.create_case',
        'reports.hr'
    ],
    'IR Officer': [
        'employees.view',
        'ir.view_cases', 'ir.create_case', 'ir.manage_case',
        'ir.view_evidence', 'ir.upload_evidence',
        'ir.generate_letters', 'ir.record_outcomes',
        'documents.view_all', 'documents.upload',
        'reports.ir'
    ],
    'IR Manager': [
        'employees.view',
        'ir.view_cases', 'ir.create_case', 'ir.manage_case',
        'ir.view_evidence', 'ir.upload_evidence',
        'ir.generate_letters', 'ir.record_outcomes', 'ir.close_case', 'ir.grant_access',
        'documents.view_all', 'documents.upload', 'documents.manage',
        'reports.ir'
    ],
    'Employee': [
        'employees.view_own',
        'leave.view_own', 'leave.request',
        'payroll.view_payslips',
        'documents.view_own', 'documents.upload'
    ]
};

// Helper to check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Helper to get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}
