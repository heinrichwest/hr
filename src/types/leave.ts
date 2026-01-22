// ============================================================
// LEAVE MANAGEMENT TYPES (BCEA-aligned)
// ============================================================

export type LeaveTypeCode =
    | 'annual'
    | 'sick'
    | 'family_responsibility'
    | 'maternity'
    | 'paternity'
    | 'parental'
    | 'adoption'
    | 'study'
    | 'unpaid'
    | 'special'
    | 'compassionate'
    | 'birthday';

export type AccrualMethod =
    | 'annual'       // Full entitlement at start of cycle
    | 'monthly'      // Accrue monthly
    | 'daily'        // Accrue daily
    | 'none';        // No accrual (fixed entitlement)

export interface LeaveType {
    id: string;
    companyId: string;

    name: string;
    code: LeaveTypeCode;
    description?: string;

    // Entitlement
    defaultDaysPerYear: number;
    isPaid: boolean;

    // Accrual settings
    accrualMethod: AccrualMethod;
    accrualStartDate?: 'hire_date' | 'year_start' | 'custom';

    // Caps & limits
    maxCarryOver?: number;           // Max days that can carry to next year
    maxAccumulation?: number;        // Maximum balance cap
    minConsecutiveDays?: number;     // Minimum days per request
    maxConsecutiveDays?: number;     // Maximum days per request

    // Validation rules
    requiresApproval: boolean;
    requiresAttachment: boolean;
    attachmentRequiredAfterDays?: number;  // e.g., Sick leave > 2 days needs certificate

    // Eligibility
    minServiceMonths?: number;       // Minimum months of service required
    applicableContractTypes?: string[];
    applicableGrades?: string[];

    // Display
    color?: string;                  // For calendar display
    sortOrder: number;
    isActive: boolean;

    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// LEAVE BALANCE & LEDGER
// ============================================================

export interface LeaveBalance {
    id: string;
    employeeId: string;
    companyId: string;
    leaveTypeId: string;
    leaveTypeName?: string;

    // Current cycle
    cycleYear: number;
    cycleStartDate: Date;
    cycleEndDate: Date;

    // Balances
    openingBalance: number;
    accrued: number;
    taken: number;
    pending: number;           // Approved but not yet taken
    adjusted: number;          // Manual adjustments
    forfeited: number;         // Lost due to expiry/caps
    carriedForward: number;    // From previous cycle

    // Calculated
    currentBalance: number;    // Available to take
    projectedBalance: number;  // Balance at end of cycle

    lastAccrualDate?: Date;
    updatedAt: Date;
}

export type LedgerTransactionType =
    | 'opening_balance'
    | 'accrual'
    | 'taken'
    | 'cancelled'
    | 'adjustment_add'
    | 'adjustment_deduct'
    | 'carry_forward'
    | 'forfeit'
    | 'payout';

export interface LeaveLedger {
    id: string;
    employeeId: string;
    companyId: string;
    leaveTypeId: string;
    leaveBalanceId: string;

    transactionType: LedgerTransactionType;
    transactionDate: Date;
    effectiveDate: Date;

    days: number;              // Positive for additions, negative for deductions
    balanceAfter: number;

    // Reference
    leaveRequestId?: string;
    description?: string;
    reason?: string;

    // Audit
    createdBy: string;
    createdAt: Date;
}

// ============================================================
// LEAVE REQUESTS
// ============================================================

export type LeaveRequestStatus =
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'taken';

export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName?: string;
    companyId: string;

    leaveTypeId: string;
    leaveTypeName?: string;

    // Dates
    startDate: Date;
    endDate: Date;
    isHalfDay: boolean;
    halfDayType?: 'morning' | 'afternoon';

    // Calculated
    totalDays: number;
    workingDays: number;       // Excluding weekends/holidays

    // Request details
    reason?: string;
    notes?: string;
    emergencyContact?: string;

    // Documents
    attachments?: LeaveAttachment[];

    // Workflow
    status: LeaveRequestStatus;
    submittedDate?: Date;

    // Approval chain
    currentApprover?: string;
    approvalHistory: ApprovalRecord[];

    // Cancellation
    cancelledDate?: Date;
    cancelledBy?: string;
    cancellationReason?: string;

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface LeaveAttachment {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedBy: string;
    uploadedAt: Date;
}

export interface ApprovalRecord {
    id: string;
    approverId: string;
    approverName?: string;
    approverRole?: string;
    action: 'approved' | 'rejected' | 'escalated';
    comments?: string;
    actionDate: Date;
}

// ============================================================
// LEAVE CALENDAR
// ============================================================

export interface LeaveCalendarEntry {
    id: string;
    employeeId: string;
    employeeName: string;
    departmentId?: string;
    departmentName?: string;

    leaveRequestId: string;
    leaveTypeId: string;
    leaveTypeName: string;
    leaveTypeColor?: string;

    startDate: Date;
    endDate: Date;
    isHalfDay: boolean;

    status: LeaveRequestStatus;
}

// ============================================================
// LEAVE POLICY RULES
// ============================================================

export interface LeavePolicy {
    id: string;
    companyId: string;
    name: string;
    description?: string;

    // Cycle settings
    cycleType: 'calendar_year' | 'anniversary' | 'custom';
    cycleStartMonth?: number;  // For calendar year (1-12)

    // Carry forward rules
    allowCarryForward: boolean;
    carryForwardExpiryMonths?: number;

    // Encashment rules
    allowEncashment: boolean;
    encashmentMaxDays?: number;

    // Pro-rata rules
    proRataFirstYear: boolean;
    proRataTermination: boolean;

    // Default leave types
    leaveTypeIds: string[];

    isDefault: boolean;
    isActive: boolean;

    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// BCEA STATUTORY LEAVE RULES (South Africa)
// ============================================================

export const BCEA_LEAVE_RULES = {
    annual: {
        minDaysPerYear: 21,           // Consecutive days including non-working days
        workingDaysPerYear: 15,       // Or 1 day per 17 days worked
        accrualRate: 1.25,            // Days per month
        minServiceMonths: 0,
    },
    sick: {
        cycleDays: 36,                // Over 36-month cycle
        cycleMonths: 36,
        firstSixMonthsDays: 1,        // 1 day per 26 days worked in first 6 months
        certificateRequiredAfterDays: 2,
    },
    family_responsibility: {
        daysPerYear: 3,
        minServiceMonths: 4,
        purposes: ['birth', 'illness', 'death'],
    },
    maternity: {
        consecutiveWeeks: 4,          // At least 4 consecutive months
        totalWeeks: 16,
        startBeforeBirth: 4,          // Can start 4 weeks before due date
        notWorkAfterBirth: 6,         // Cannot work for 6 weeks after birth
    },
} as const;
