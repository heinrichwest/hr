// ============================================================
// DASHBOARD PREVIEWS INDEX
// Export all dashboard preview components and role mapping
// ============================================================

export { EmployeeDashboardPreview } from './EmployeeDashboardPreview';
export { HRDashboardPreview } from './HRDashboardPreview';
export { PayrollDashboardPreview } from './PayrollDashboardPreview';
export { FinanceDashboardPreview } from './FinanceDashboardPreview';
export { LineManagerDashboardPreview } from './LineManagerDashboardPreview';
export { IRDashboardPreview } from './IRDashboardPreview';

import type { UserRole } from '../../types/user';
import { EmployeeDashboardPreview } from './EmployeeDashboardPreview';
import { HRDashboardPreview } from './HRDashboardPreview';
import { PayrollDashboardPreview } from './PayrollDashboardPreview';
import { FinanceDashboardPreview } from './FinanceDashboardPreview';
import { LineManagerDashboardPreview } from './LineManagerDashboardPreview';
import { IRDashboardPreview } from './IRDashboardPreview';

/**
 * Mapping of roles to their respective dashboard preview components
 */
export const ROLE_DASHBOARD_MAP: Record<UserRole, React.ComponentType | null> = {
    'System Admin': null, // Uses original Dashboard content
    'HR Admin': HRDashboardPreview,
    'HR Manager': HRDashboardPreview,
    'Payroll Admin': PayrollDashboardPreview,
    'Payroll Manager': PayrollDashboardPreview,
    'Finance Approver': FinanceDashboardPreview,
    'Finance Read-Only': FinanceDashboardPreview,
    'Line Manager': LineManagerDashboardPreview,
    'IR Officer': IRDashboardPreview,
    'IR Manager': IRDashboardPreview,
    'Employee': EmployeeDashboardPreview,
};

/**
 * Get the dashboard preview component for a given role
 */
export function getDashboardPreviewComponent(role: UserRole): React.ComponentType | null {
    return ROLE_DASHBOARD_MAP[role] || null;
}
