// ============================================================
// INDUSTRIAL RELATIONS SERVICE - IR case management operations
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
    IRCase,
    IRCaseStatus,
    IRCaseType,
    IRCaseEvent,
    Hearing,
    Warning,
    WarningType
} from '../types/ir';

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

// Generate case number: IR-2024-0001
const generateCaseNumber = async (companyId: string): Promise<string> => {
    const year = new Date().getFullYear();
    const q = query(
        collection(db, 'irCases'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc'),
        limit(1)
    );
    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastCase = snapshot.docs[0].data() as IRCase;
        const match = lastCase.caseNumber.match(/IR-\d{4}-(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    return `IR-${year}-${nextNumber.toString().padStart(4, '0')}`;
};

// Generate warning number: WRN-2024-0001
const generateWarningNumber = async (companyId: string): Promise<string> => {
    const year = new Date().getFullYear();
    const q = query(
        collection(db, 'warnings'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc'),
        limit(1)
    );
    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
        const lastWarning = snapshot.docs[0].data() as Warning;
        const match = lastWarning.warningNumber.match(/WRN-\d{4}-(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    return `WRN-${year}-${nextNumber.toString().padStart(4, '0')}`;
};

export const IRService = {
    // ============================================================
    // IR CASES
    // ============================================================

    async getIRCases(companyId: string, filters?: {
        status?: IRCaseStatus;
        caseType?: IRCaseType;
        assignedToId?: string;
        employeeId?: string;
    }): Promise<IRCase[]> {
        let q = query(
            collection(db, 'irCases'),
            where('companyId', '==', companyId),
            orderBy('dateOpened', 'desc')
        );

        const snapshot = await getDocs(q);
        let cases = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as IRCase[];

        // Apply client-side filters (Firestore limitations on compound queries)
        if (filters) {
            if (filters.status) {
                cases = cases.filter(c => c.status === filters.status);
            }
            if (filters.caseType) {
                cases = cases.filter(c => c.caseType === filters.caseType);
            }
            if (filters.assignedToId) {
                cases = cases.filter(c => c.assignedToId === filters.assignedToId);
            }
            if (filters.employeeId) {
                cases = cases.filter(c => c.employeeId === filters.employeeId);
            }
        }

        return cases;
    },

    async getIRCase(caseId: string): Promise<IRCase | null> {
        const docRef = doc(db, 'irCases', caseId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as IRCase;
    },

    async createIRCase(irCase: Omit<IRCase, 'id' | 'caseNumber' | 'createdAt'>): Promise<string> {
        const caseNumber = await generateCaseNumber(irCase.companyId);

        const docRef = await addDoc(collection(db, 'irCases'), {
            ...irCase,
            caseNumber,
            createdAt: Timestamp.now()
        });

        // Create initial case event
        await this.addCaseEvent({
            caseId: docRef.id,
            eventType: 'case_created',
            eventDate: new Date(),
            title: 'Case Created',
            description: `IR Case ${caseNumber} has been opened`,
            createdBy: irCase.createdBy
        });

        return docRef.id;
    },

    async updateIRCase(caseId: string, data: Partial<IRCase>, updatedBy: string): Promise<void> {
        const docRef = doc(db, 'irCases', caseId);
        const existing = await getDoc(docRef);
        const existingData = existing.data() as IRCase;

        await updateDoc(docRef, {
            ...data,
            updatedBy,
            updatedAt: Timestamp.now()
        });

        // Log status change
        if (data.status && data.status !== existingData.status) {
            await this.addCaseEvent({
                caseId,
                eventType: 'status_changed',
                eventDate: new Date(),
                title: 'Status Changed',
                description: `Status changed from ${existingData.status} to ${data.status}`,
                createdBy: updatedBy
            });
        }
    },

    async deleteIRCase(caseId: string): Promise<void> {
        const docRef = doc(db, 'irCases', caseId);
        await deleteDoc(docRef);

        // Delete related events
        const eventsQuery = query(
            collection(db, 'irCaseEvents'),
            where('caseId', '==', caseId)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        for (const eventDoc of eventsSnapshot.docs) {
            await deleteDoc(eventDoc.ref);
        }
    },

    // ============================================================
    // IR CASE EVENTS / TIMELINE
    // ============================================================

    async getCaseEvents(caseId: string): Promise<IRCaseEvent[]> {
        const q = query(
            collection(db, 'irCaseEvents'),
            where('caseId', '==', caseId),
            orderBy('eventDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as IRCaseEvent[];
    },

    async addCaseEvent(event: Omit<IRCaseEvent, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'irCaseEvents'), {
            ...event,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    // ============================================================
    // HEARINGS
    // ============================================================

    async getHearings(companyId: string, filters?: {
        caseId?: string;
        status?: string;
    }): Promise<Hearing[]> {
        let q = query(
            collection(db, 'hearings'),
            where('companyId', '==', companyId),
            orderBy('scheduledDate', 'desc')
        );

        const snapshot = await getDocs(q);
        let hearings = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as Hearing[];

        if (filters) {
            if (filters.caseId) {
                hearings = hearings.filter(h => h.caseId === filters.caseId);
            }
            if (filters.status) {
                hearings = hearings.filter(h => h.status === filters.status);
            }
        }

        return hearings;
    },

    async getHearing(hearingId: string): Promise<Hearing | null> {
        const docRef = doc(db, 'hearings', hearingId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Hearing;
    },

    async createHearing(hearing: Omit<Hearing, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'hearings'), {
            ...hearing,
            createdAt: Timestamp.now()
        });

        // Add case event
        await this.addCaseEvent({
            caseId: hearing.caseId,
            eventType: 'hearing_scheduled',
            eventDate: new Date(),
            title: 'Hearing Scheduled',
            description: `${hearing.hearingType} hearing scheduled for ${new Date(hearing.scheduledDate).toLocaleDateString('en-ZA')}`,
            createdBy: hearing.createdBy
        });

        return docRef.id;
    },

    async updateHearing(hearingId: string, data: Partial<Hearing>): Promise<void> {
        const docRef = doc(db, 'hearings', hearingId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteHearing(hearingId: string): Promise<void> {
        const docRef = doc(db, 'hearings', hearingId);
        await deleteDoc(docRef);
    },

    // ============================================================
    // WARNINGS
    // ============================================================

    async getWarnings(companyId: string, filters?: {
        employeeId?: string;
        warningType?: WarningType;
        isActive?: boolean;
    }): Promise<Warning[]> {
        let q = query(
            collection(db, 'warnings'),
            where('companyId', '==', companyId),
            orderBy('issueDate', 'desc')
        );

        const snapshot = await getDocs(q);
        let warnings = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as Warning[];

        if (filters) {
            if (filters.employeeId) {
                warnings = warnings.filter(w => w.employeeId === filters.employeeId);
            }
            if (filters.warningType) {
                warnings = warnings.filter(w => w.warningType === filters.warningType);
            }
            if (filters.isActive !== undefined) {
                warnings = warnings.filter(w => w.isActive === filters.isActive);
            }
        }

        return warnings;
    },

    async getWarning(warningId: string): Promise<Warning | null> {
        const docRef = doc(db, 'warnings', warningId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Warning;
    },

    async getEmployeeWarnings(employeeId: string): Promise<Warning[]> {
        const q = query(
            collection(db, 'warnings'),
            where('employeeId', '==', employeeId),
            orderBy('issueDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as Warning[];
    },

    async getActiveWarnings(employeeId: string): Promise<Warning[]> {
        const warnings = await this.getEmployeeWarnings(employeeId);
        const now = new Date();
        return warnings.filter(w =>
            w.isActive &&
            !w.isExpired &&
            new Date(w.expiryDate) > now
        );
    },

    async createWarning(warning: Omit<Warning, 'id' | 'warningNumber' | 'createdAt'>): Promise<string> {
        const warningNumber = await generateWarningNumber(warning.companyId);

        const docRef = await addDoc(collection(db, 'warnings'), {
            ...warning,
            warningNumber,
            createdAt: Timestamp.now()
        });

        // Add case event if linked to a case
        if (warning.caseId) {
            await this.addCaseEvent({
                caseId: warning.caseId,
                eventType: 'warning_issued',
                eventDate: new Date(),
                title: 'Warning Issued',
                description: `${warning.warningType.replace('_', ' ')} warning issued`,
                createdBy: warning.issuedById
            });
        }

        return docRef.id;
    },

    async updateWarning(warningId: string, data: Partial<Warning>): Promise<void> {
        const docRef = doc(db, 'warnings', warningId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async expireWarning(warningId: string): Promise<void> {
        const docRef = doc(db, 'warnings', warningId);
        await updateDoc(docRef, {
            isActive: false,
            isExpired: true,
            updatedAt: Timestamp.now()
        });
    },

    // ============================================================
    // STATISTICS
    // ============================================================

    async getIRStatistics(companyId: string): Promise<{
        totalCases: number;
        openCases: number;
        closedCases: number;
        byType: Record<string, number>;
        byStatus: Record<string, number>;
        avgResolutionDays: number;
        activeWarnings: number;
        upcomingHearings: number;
    }> {
        const cases = await this.getIRCases(companyId);
        const warnings = await this.getWarnings(companyId);
        const hearings = await this.getHearings(companyId);

        const now = new Date();
        const openStatuses: IRCaseStatus[] = ['draft', 'investigation', 'hearing_scheduled', 'hearing_in_progress', 'awaiting_outcome', 'appeal'];
        const closedStatuses: IRCaseStatus[] = ['closed', 'withdrawn'];

        const openCases = cases.filter(c => openStatuses.includes(c.status));
        const closedCases = cases.filter(c => closedStatuses.includes(c.status));

        // Calculate by type
        const byType: Record<string, number> = {};
        cases.forEach(c => {
            byType[c.caseType] = (byType[c.caseType] || 0) + 1;
        });

        // Calculate by status
        const byStatus: Record<string, number> = {};
        cases.forEach(c => {
            byStatus[c.status] = (byStatus[c.status] || 0) + 1;
        });

        // Calculate average resolution days
        let totalDays = 0;
        let resolvedCount = 0;
        closedCases.forEach(c => {
            if (c.dateClosed && c.dateOpened) {
                const days = Math.floor((new Date(c.dateClosed).getTime() - new Date(c.dateOpened).getTime()) / (1000 * 60 * 60 * 24));
                totalDays += days;
                resolvedCount++;
            }
        });
        const avgResolutionDays = resolvedCount > 0 ? Math.round(totalDays / resolvedCount) : 0;

        // Active warnings
        const activeWarnings = warnings.filter(w =>
            w.isActive &&
            !w.isExpired &&
            new Date(w.expiryDate) > now
        ).length;

        // Upcoming hearings (next 30 days)
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const upcomingHearings = hearings.filter(h =>
            h.status === 'scheduled' &&
            new Date(h.scheduledDate) >= now &&
            new Date(h.scheduledDate) <= thirtyDaysFromNow
        ).length;

        return {
            totalCases: cases.length,
            openCases: openCases.length,
            closedCases: closedCases.length,
            byType,
            byStatus,
            avgResolutionDays,
            activeWarnings,
            upcomingHearings
        };
    },

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    getCaseTypeLabel(type: IRCaseType): string {
        const labels: Record<IRCaseType, string> = {
            misconduct: 'Misconduct',
            poor_performance: 'Poor Performance',
            incapacity: 'Incapacity',
            grievance: 'Grievance',
            abscondment: 'Abscondment',
            dispute: 'Dispute',
            ccma: 'CCMA Dispute',
            retrenchment: 'Retrenchment'
        };
        return labels[type] || type;
    },

    getCaseStatusLabel(status: IRCaseStatus): string {
        const labels: Record<IRCaseStatus, string> = {
            draft: 'Draft',
            investigation: 'Investigation',
            hearing_scheduled: 'Hearing Scheduled',
            hearing_in_progress: 'Hearing In Progress',
            awaiting_outcome: 'Awaiting Outcome',
            appeal: 'Appeal',
            closed: 'Closed',
            withdrawn: 'Withdrawn'
        };
        return labels[status] || status;
    },

    getWarningTypeLabel(type: WarningType): string {
        const labels: Record<WarningType, string> = {
            verbal: 'Verbal Warning',
            written: 'Written Warning',
            final_written: 'Final Written Warning'
        };
        return labels[type] || type;
    },

    calculateWarningExpiryDate(issueDate: Date, warningType: WarningType): Date {
        const validityMonths: Record<WarningType, number> = {
            verbal: 3,
            written: 6,
            final_written: 12
        };
        const expiry = new Date(issueDate);
        expiry.setMonth(expiry.getMonth() + validityMonths[warningType]);
        return expiry;
    },

    formatDate(date: Date | string): string {
        return new Date(date).toLocaleDateString('en-ZA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
};
