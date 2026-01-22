// ============================================================
// LEAVE SERVICE - Leave management operations
// ============================================================

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import type {
    LeaveType,
    LeaveTypeCode,
    AccrualMethod,
    LeaveRequest,
    LeaveBalance,
    LeaveRequestStatus,
    ApprovalRecord
} from '../types/leave';

// Helper to convert Firestore timestamps
const convertTimestamps = <T extends DocumentData>(data: T): T => {
    const converted = { ...data };
    Object.keys(converted).forEach(key => {
        const value = converted[key];
        if (value instanceof Timestamp) {
            (converted as Record<string, unknown>)[key] = value.toDate();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            (converted as Record<string, unknown>)[key] = convertTimestamps(value as DocumentData);
        }
    });
    return converted;
};

export const LeaveService = {
    // ============================================================
    // LEAVE TYPES
    // ============================================================

    async getLeaveTypes(companyId: string): Promise<LeaveType[]> {
        const q = query(
            collection(db, 'leaveTypes'),
            where('companyId', '==', companyId),
            orderBy('sortOrder')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as LeaveType[];
    },

    async getLeaveType(leaveTypeId: string): Promise<LeaveType | null> {
        const docRef = doc(db, 'leaveTypes', leaveTypeId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as LeaveType;
    },

    async createLeaveType(leaveType: Omit<LeaveType, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'leaveTypes'), {
            ...leaveType,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLeaveType(leaveTypeId: string, data: Partial<LeaveType>): Promise<void> {
        const docRef = doc(db, 'leaveTypes', leaveTypeId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteLeaveType(leaveTypeId: string): Promise<void> {
        const docRef = doc(db, 'leaveTypes', leaveTypeId);
        await deleteDoc(docRef);
    },

    // Add missing leave types to existing companies (for migrations)
    async addMissingLeaveTypes(companyId: string): Promise<string[]> {
        const existing = await this.getLeaveTypes(companyId);
        const existingCodes = existing.map(t => t.code);
        const addedTypes: string[] = [];

        const missingTypes: Array<{ code: LeaveTypeCode; name: string; description: string; defaultDaysPerYear: number; isPaid: boolean; accrualMethod: AccrualMethod; color: string; sortOrder: number; requiresAttachment: boolean; minConsecutiveDays?: number; maxConsecutiveDays?: number }> = [
            { code: 'paternity', name: 'Paternity Leave', description: 'Paternity leave for fathers (10 consecutive days)', defaultDaysPerYear: 10, isPaid: false, accrualMethod: 'none', color: '#3B82F6', sortOrder: 5, requiresAttachment: true, minConsecutiveDays: 1, maxConsecutiveDays: 10 },
            { code: 'birthday', name: 'Birthday Leave', description: 'Paid day off on your birthday', defaultDaysPerYear: 1, isPaid: true, accrualMethod: 'annual', color: '#A855F7', sortOrder: 8, requiresAttachment: false }
        ];

        for (const type of missingTypes) {
            if (!existingCodes.includes(type.code)) {
                await this.createLeaveType({
                    companyId,
                    code: type.code,
                    name: type.name,
                    description: type.description,
                    defaultDaysPerYear: type.defaultDaysPerYear,
                    isPaid: type.isPaid,
                    accrualMethod: type.accrualMethod,
                    maxCarryOver: 0,
                    requiresApproval: true,
                    requiresAttachment: type.requiresAttachment,
                    minConsecutiveDays: type.minConsecutiveDays,
                    maxConsecutiveDays: type.maxConsecutiveDays,
                    color: type.color,
                    sortOrder: type.sortOrder,
                    isActive: true
                });
                addedTypes.push(type.name);
            }
        }

        return addedTypes;
    },

    // Seed default South African leave types
    async seedDefaultLeaveTypes(companyId: string): Promise<void> {
        const existing = await this.getLeaveTypes(companyId);
        if (existing.length > 0) return; // Don't seed if types already exist

        const defaultTypes: Omit<LeaveType, 'id' | 'createdAt'>[] = [
            {
                companyId,
                code: 'annual',
                name: 'Annual Leave',
                description: 'Standard annual leave as per BCEA',
                defaultDaysPerYear: 15, // BCEA minimum for 5-day week employees
                isPaid: true,
                accrualMethod: 'monthly',
                maxCarryOver: 5,
                requiresApproval: true,
                requiresAttachment: false,
                color: '#10B981',
                sortOrder: 1,
                isActive: true
            },
            {
                companyId,
                code: 'sick',
                name: 'Sick Leave',
                description: 'Sick leave as per BCEA (36 days per 3-year cycle)',
                defaultDaysPerYear: 12, // 36 days / 3 years
                isPaid: true,
                accrualMethod: 'annual',
                maxCarryOver: 0,
                requiresApproval: true,
                requiresAttachment: true,
                attachmentRequiredAfterDays: 2, // Medical cert required for 2+ consecutive days
                color: '#EF4444',
                sortOrder: 2,
                isActive: true
            },
            {
                companyId,
                code: 'family_responsibility',
                name: 'Family Responsibility Leave',
                description: 'Family responsibility leave as per BCEA',
                defaultDaysPerYear: 3, // BCEA: 3 days per year
                isPaid: true,
                accrualMethod: 'annual',
                maxCarryOver: 0,
                minServiceMonths: 4,
                requiresApproval: true,
                requiresAttachment: true,
                color: '#8B5CF6',
                sortOrder: 3,
                isActive: true
            },
            {
                companyId,
                code: 'maternity',
                name: 'Maternity Leave',
                description: 'Maternity leave as per BCEA (4 consecutive months)',
                defaultDaysPerYear: 120, // 4 months
                isPaid: false, // Paid via UIF, not employer
                accrualMethod: 'none',
                maxCarryOver: 0,
                requiresApproval: true,
                requiresAttachment: true,
                minConsecutiveDays: 1,
                maxConsecutiveDays: 120,
                color: '#EC4899',
                sortOrder: 4,
                isActive: true
            },
            {
                companyId,
                code: 'paternity',
                name: 'Paternity Leave',
                description: 'Paternity leave for fathers (10 consecutive days)',
                defaultDaysPerYear: 10,
                isPaid: false, // Paid via UIF
                accrualMethod: 'none',
                maxCarryOver: 0,
                requiresApproval: true,
                requiresAttachment: true,
                minConsecutiveDays: 1,
                maxConsecutiveDays: 10,
                color: '#3B82F6',
                sortOrder: 5,
                isActive: true
            },
            {
                companyId,
                code: 'parental',
                name: 'Parental Leave',
                description: 'Parental leave for adoptive parents',
                defaultDaysPerYear: 10,
                isPaid: false, // Paid via UIF
                accrualMethod: 'none',
                maxCarryOver: 0,
                requiresApproval: true,
                requiresAttachment: true,
                color: '#06B6D4',
                sortOrder: 6,
                isActive: true
            },
            {
                companyId,
                code: 'study',
                name: 'Study Leave',
                description: 'Leave for approved study and examinations',
                defaultDaysPerYear: 5,
                isPaid: true,
                accrualMethod: 'annual',
                maxCarryOver: 0,
                requiresApproval: true,
                requiresAttachment: true,
                color: '#F59E0B',
                sortOrder: 7,
                isActive: true
            },
            {
                companyId,
                code: 'birthday',
                name: 'Birthday Leave',
                description: 'Paid day off on your birthday',
                defaultDaysPerYear: 1,
                isPaid: true,
                accrualMethod: 'annual',
                maxCarryOver: 0,
                requiresApproval: true,
                requiresAttachment: false,
                color: '#A855F7',
                sortOrder: 8,
                isActive: true
            },
            {
                companyId,
                code: 'unpaid',
                name: 'Unpaid Leave',
                description: 'Leave without pay',
                defaultDaysPerYear: 0,
                isPaid: false,
                accrualMethod: 'none',
                maxCarryOver: 0,
                requiresApproval: true,
                requiresAttachment: false,
                color: '#6B7280',
                sortOrder: 9,
                isActive: true
            }
        ];

        for (const leaveType of defaultTypes) {
            await this.createLeaveType(leaveType);
        }
    },

    // ============================================================
    // LEAVE REQUESTS
    // ============================================================

    async getLeaveRequests(companyId: string, options?: {
        employeeId?: string;
        status?: LeaveRequestStatus;
        leaveTypeId?: string;
        limitCount?: number;
    }): Promise<LeaveRequest[]> {
        let q = query(
            collection(db, 'leaveRequests'),
            where('companyId', '==', companyId),
            orderBy('createdAt', 'desc')
        );

        if (options?.limitCount) {
            q = query(q, limit(options.limitCount));
        }

        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as LeaveRequest[];

        // Apply client-side filters for composite queries
        if (options?.employeeId) {
            results = results.filter(r => r.employeeId === options.employeeId);
        }
        if (options?.status) {
            results = results.filter(r => r.status === options.status);
        }
        if (options?.leaveTypeId) {
            results = results.filter(r => r.leaveTypeId === options.leaveTypeId);
        }

        return results;
    },

    async getLeaveRequest(requestId: string): Promise<LeaveRequest | null> {
        const docRef = doc(db, 'leaveRequests', requestId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as LeaveRequest;
    },

    async getPendingApprovals(companyId: string, approverId?: string): Promise<LeaveRequest[]> {
        const q = query(
            collection(db, 'leaveRequests'),
            where('companyId', '==', companyId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        let requests = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as LeaveRequest[];

        // Filter by approver if specified (for line managers)
        if (approverId) {
            requests = requests.filter(r => r.currentApprover === approverId);
        }

        return requests;
    },

    async createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'leaveRequests'), {
            ...request,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLeaveRequest(requestId: string, data: Partial<LeaveRequest>): Promise<void> {
        const docRef = doc(db, 'leaveRequests', requestId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async approveLeaveRequest(
        requestId: string,
        approverId: string,
        approverName: string,
        comments?: string
    ): Promise<void> {
        const request = await this.getLeaveRequest(requestId);
        if (!request) throw new Error('Request not found');

        const approvalRecord: ApprovalRecord = {
            id: crypto.randomUUID(),
            approverId,
            approverName,
            action: 'approved',
            comments,
            actionDate: new Date()
        };

        await this.updateLeaveRequest(requestId, {
            status: 'approved',
            approvalHistory: [...(request.approvalHistory || []), approvalRecord]
        });

        // Deduct from balance
        await this.deductLeaveBalance(
            request.companyId,
            request.employeeId,
            request.leaveTypeId,
            request.workingDays
        );
    },

    async rejectLeaveRequest(
        requestId: string,
        approverId: string,
        approverName: string,
        comments: string
    ): Promise<void> {
        const request = await this.getLeaveRequest(requestId);
        if (!request) throw new Error('Request not found');

        const approvalRecord: ApprovalRecord = {
            id: crypto.randomUUID(),
            approverId,
            approverName,
            action: 'rejected',
            comments,
            actionDate: new Date()
        };

        await this.updateLeaveRequest(requestId, {
            status: 'rejected',
            approvalHistory: [...(request.approvalHistory || []), approvalRecord]
        });
    },

    async cancelLeaveRequest(requestId: string, cancelledBy: string, reason?: string): Promise<void> {
        const request = await this.getLeaveRequest(requestId);
        if (!request) throw new Error('Request not found');

        await this.updateLeaveRequest(requestId, {
            status: 'cancelled',
            cancelledBy,
            cancelledDate: new Date(),
            cancellationReason: reason
        });

        // Restore balance if it was already approved
        if (request.status === 'approved') {
            await this.restoreLeaveBalance(
                request.companyId,
                request.employeeId,
                request.leaveTypeId,
                request.workingDays
            );
        }
    },

    // ============================================================
    // LEAVE BALANCES
    // ============================================================

    async getLeaveBalances(companyId: string, employeeId: string): Promise<LeaveBalance[]> {
        const q = query(
            collection(db, 'leaveBalances'),
            where('companyId', '==', companyId),
            where('employeeId', '==', employeeId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as LeaveBalance[];
    },

    async getLeaveBalance(employeeId: string, leaveTypeId: string): Promise<LeaveBalance | null> {
        const q = query(
            collection(db, 'leaveBalances'),
            where('employeeId', '==', employeeId),
            where('leaveTypeId', '==', leaveTypeId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as LeaveBalance;
    },

    async initializeLeaveBalance(
        companyId: string,
        employeeId: string,
        leaveTypeId: string,
        year: number
    ): Promise<string> {
        const leaveType = await this.getLeaveType(leaveTypeId);
        if (!leaveType) throw new Error('Leave type not found');

        const existing = await this.getLeaveBalance(employeeId, leaveTypeId);
        if (existing) return existing.id;

        const cycleStart = new Date(year, 0, 1); // Jan 1
        const cycleEnd = new Date(year, 11, 31); // Dec 31

        const docRef = await addDoc(collection(db, 'leaveBalances'), {
            employeeId,
            companyId,
            leaveTypeId,
            leaveTypeName: leaveType.name,
            cycleYear: year,
            cycleStartDate: Timestamp.fromDate(cycleStart),
            cycleEndDate: Timestamp.fromDate(cycleEnd),
            openingBalance: 0,
            accrued: leaveType.defaultDaysPerYear,
            taken: 0,
            pending: 0,
            adjusted: 0,
            forfeited: 0,
            carriedForward: 0,
            currentBalance: leaveType.defaultDaysPerYear,
            projectedBalance: leaveType.defaultDaysPerYear,
            updatedAt: Timestamp.now()
        });

        return docRef.id;
    },

    async updateLeaveBalance(balanceId: string, data: Partial<LeaveBalance>): Promise<void> {
        const docRef = doc(db, 'leaveBalances', balanceId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deductLeaveBalance(
        companyId: string,
        employeeId: string,
        leaveTypeId: string,
        days: number
    ): Promise<void> {
        let balance = await this.getLeaveBalance(employeeId, leaveTypeId);

        if (!balance) {
            // Create balance if not exists
            const year = new Date().getFullYear();
            await this.initializeLeaveBalance(companyId, employeeId, leaveTypeId, year);
            balance = await this.getLeaveBalance(employeeId, leaveTypeId);
        }

        if (balance) {
            await this.updateLeaveBalance(balance.id, {
                taken: balance.taken + days,
                currentBalance: balance.currentBalance - days
            });
        }
    },

    async restoreLeaveBalance(
        _companyId: string,
        employeeId: string,
        leaveTypeId: string,
        days: number
    ): Promise<void> {
        const balance = await this.getLeaveBalance(employeeId, leaveTypeId);
        if (balance) {
            await this.updateLeaveBalance(balance.id, {
                taken: Math.max(0, balance.taken - days),
                currentBalance: balance.currentBalance + days
            });
        }
    },

    // ============================================================
    // LEAVE CALENDAR & REPORTS
    // ============================================================

    async getLeaveCalendar(companyId: string, startDate: Date, endDate: Date): Promise<LeaveRequest[]> {
        const q = query(
            collection(db, 'leaveRequests'),
            where('companyId', '==', companyId),
            where('status', '==', 'approved')
        );

        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as LeaveRequest[];

        // Filter by date range client-side (Firestore doesn't support range queries on multiple fields)
        return requests.filter(r => {
            const reqStart = new Date(r.startDate);
            const reqEnd = new Date(r.endDate);
            return reqStart <= endDate && reqEnd >= startDate;
        });
    },

    async getEmployeesOnLeaveToday(companyId: string): Promise<LeaveRequest[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.getLeaveCalendar(companyId, today, tomorrow);
    },

    calculateBusinessDays(startDate: Date, endDate: Date): number {
        // This should exclude weekends and public holidays
        let count = 0;
        const current = new Date(startDate);

        while (current <= endDate) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        return count;
    }
};
