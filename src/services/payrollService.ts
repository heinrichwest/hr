// ============================================================
// PAYROLL SERVICE - Payroll management operations
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
    PayRun,
    PayRunStatus,
    PayRunLine,
    Payslip,
    PayrollAdjustment,
    BankFile,
    GLJournal
} from '../types/payroll';
import type { PayElement } from '../types/company';

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

export const PayrollService = {
    // ============================================================
    // PAY ELEMENTS
    // ============================================================

    async getPayElements(companyId: string): Promise<PayElement[]> {
        const q = query(
            collection(db, 'payElements'),
            where('companyId', '==', companyId),
            orderBy('sortOrder')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as PayElement[];
    },

    async getPayElement(payElementId: string): Promise<PayElement | null> {
        const docRef = doc(db, 'payElements', payElementId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as PayElement;
    },

    async createPayElement(payElement: Omit<PayElement, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'payElements'), {
            ...payElement,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updatePayElement(payElementId: string, data: Partial<PayElement>): Promise<void> {
        const docRef = doc(db, 'payElements', payElementId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deletePayElement(payElementId: string): Promise<void> {
        const docRef = doc(db, 'payElements', payElementId);
        await deleteDoc(docRef);
    },

    // Seed default South African pay elements
    async seedDefaultPayElements(companyId: string): Promise<void> {
        const existing = await this.getPayElements(companyId);
        if (existing.length > 0) return;

        const defaultElements: Omit<PayElement, 'id' | 'createdAt'>[] = [
            // Earnings
            {
                companyId,
                code: 'BASIC',
                name: 'Basic Salary',
                type: 'earning',
                calculationMethod: 'fixed',
                isTaxable: true,
                isUifApplicable: true,
                isSdlApplicable: true,
                isPensionApplicable: true,
                isRecurring: true,
                isActive: true,
                sortOrder: 1
            },
            {
                companyId,
                code: 'OT_1.5',
                name: 'Overtime (1.5x)',
                type: 'earning',
                calculationMethod: 'hourly',
                isTaxable: true,
                isUifApplicable: true,
                isSdlApplicable: true,
                isPensionApplicable: false,
                isRecurring: false,
                isActive: true,
                sortOrder: 2
            },
            {
                companyId,
                code: 'OT_2.0',
                name: 'Overtime (2x) - Sunday/Public Holiday',
                type: 'earning',
                calculationMethod: 'hourly',
                isTaxable: true,
                isUifApplicable: true,
                isSdlApplicable: true,
                isPensionApplicable: false,
                isRecurring: false,
                isActive: true,
                sortOrder: 3
            },
            {
                companyId,
                code: 'BONUS',
                name: 'Bonus',
                type: 'earning',
                calculationMethod: 'fixed',
                isTaxable: true,
                isUifApplicable: true,
                isSdlApplicable: true,
                isPensionApplicable: false,
                isRecurring: false,
                isActive: true,
                sortOrder: 4
            },
            {
                companyId,
                code: 'COMMISSION',
                name: 'Commission',
                type: 'earning',
                calculationMethod: 'fixed',
                isTaxable: true,
                isUifApplicable: true,
                isSdlApplicable: true,
                isPensionApplicable: false,
                isRecurring: false,
                isActive: true,
                sortOrder: 5
            },
            {
                companyId,
                code: 'TRAVEL_ALLOW',
                name: 'Travel Allowance',
                type: 'earning',
                calculationMethod: 'fixed',
                isTaxable: true,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 6
            },
            {
                companyId,
                code: 'CELL_ALLOW',
                name: 'Cellphone Allowance',
                type: 'earning',
                calculationMethod: 'fixed',
                isTaxable: true,
                isUifApplicable: true,
                isSdlApplicable: true,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 7
            },
            // Deductions
            {
                companyId,
                code: 'PAYE',
                name: 'PAYE (Tax)',
                type: 'deduction',
                calculationMethod: 'formula',
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 20
            },
            {
                companyId,
                code: 'UIF_EE',
                name: 'UIF (Employee)',
                type: 'deduction',
                calculationMethod: 'percentage',
                defaultPercentage: 1,
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 21
            },
            {
                companyId,
                code: 'PENSION_EE',
                name: 'Pension Fund (Employee)',
                type: 'deduction',
                calculationMethod: 'percentage',
                defaultPercentage: 7.5,
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 22
            },
            {
                companyId,
                code: 'MEDICAL_EE',
                name: 'Medical Aid (Employee)',
                type: 'deduction',
                calculationMethod: 'fixed',
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 23
            },
            {
                companyId,
                code: 'LOAN',
                name: 'Loan Repayment',
                type: 'deduction',
                calculationMethod: 'fixed',
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 24
            },
            // Employer Contributions
            {
                companyId,
                code: 'UIF_ER',
                name: 'UIF (Employer)',
                type: 'employer_contribution',
                calculationMethod: 'percentage',
                defaultPercentage: 1,
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 40
            },
            {
                companyId,
                code: 'SDL',
                name: 'Skills Development Levy',
                type: 'employer_contribution',
                calculationMethod: 'percentage',
                defaultPercentage: 1,
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 41
            },
            {
                companyId,
                code: 'PENSION_ER',
                name: 'Pension Fund (Employer)',
                type: 'employer_contribution',
                calculationMethod: 'percentage',
                defaultPercentage: 7.5,
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 42
            },
            {
                companyId,
                code: 'MEDICAL_ER',
                name: 'Medical Aid (Employer)',
                type: 'employer_contribution',
                calculationMethod: 'fixed',
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                isActive: true,
                sortOrder: 43
            }
        ];

        for (const element of defaultElements) {
            await this.createPayElement(element);
        }
    },

    // ============================================================
    // PAY RUNS
    // ============================================================

    async getPayRuns(companyId: string, options?: {
        status?: PayRunStatus;
        taxYear?: string;
        limitCount?: number;
    }): Promise<PayRun[]> {
        let q = query(
            collection(db, 'payRuns'),
            where('companyId', '==', companyId),
            orderBy('periodEnd', 'desc')
        );

        if (options?.limitCount) {
            q = query(q, limit(options.limitCount));
        }

        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as PayRun[];

        if (options?.status) {
            results = results.filter(r => r.status === options.status);
        }
        if (options?.taxYear) {
            results = results.filter(r => r.taxYear === options.taxYear);
        }

        return results;
    },

    async getPayRun(payRunId: string): Promise<PayRun | null> {
        const docRef = doc(db, 'payRuns', payRunId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as PayRun;
    },

    async createPayRun(payRun: Omit<PayRun, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'payRuns'), {
            ...payRun,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updatePayRun(payRunId: string, data: Partial<PayRun>): Promise<void> {
        const docRef = doc(db, 'payRuns', payRunId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async updatePayRunStatus(payRunId: string, status: PayRunStatus, userId: string): Promise<void> {
        const updates: Partial<PayRun> = { status };
        const now = new Date();

        switch (status) {
            case 'calculated':
                updates.calculatedBy = userId;
                updates.calculatedAt = now;
                break;
            case 'approved':
                updates.approvedBy = userId;
                updates.approvedAt = now;
                break;
            case 'finalised':
                updates.finalisedBy = userId;
                updates.finalisedAt = now;
                break;
        }

        await this.updatePayRun(payRunId, updates);
    },

    // ============================================================
    // PAY RUN LINES
    // ============================================================

    async getPayRunLines(payRunId: string): Promise<PayRunLine[]> {
        const q = query(
            collection(db, 'payRunLines'),
            where('payRunId', '==', payRunId),
            orderBy('employeeName')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as PayRunLine[];
    },

    async getPayRunLine(lineId: string): Promise<PayRunLine | null> {
        const docRef = doc(db, 'payRunLines', lineId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as PayRunLine;
    },

    async createPayRunLine(line: Omit<PayRunLine, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'payRunLines'), {
            ...line,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updatePayRunLine(lineId: string, data: Partial<PayRunLine>): Promise<void> {
        const docRef = doc(db, 'payRunLines', lineId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    // ============================================================
    // PAYSLIPS
    // ============================================================

    async getPayslips(companyId: string, options?: {
        employeeId?: string;
        payRunId?: string;
        limitCount?: number;
    }): Promise<Payslip[]> {
        let q = query(
            collection(db, 'payslips'),
            where('companyId', '==', companyId),
            orderBy('payDate', 'desc')
        );

        if (options?.limitCount) {
            q = query(q, limit(options.limitCount));
        }

        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as Payslip[];

        if (options?.employeeId) {
            results = results.filter(p => p.employeeId === options.employeeId);
        }
        if (options?.payRunId) {
            results = results.filter(p => p.payRunId === options.payRunId);
        }

        return results;
    },

    async getPayslip(payslipId: string): Promise<Payslip | null> {
        const docRef = doc(db, 'payslips', payslipId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Payslip;
    },

    async getEmployeePayslips(employeeId: string, limitCount?: number): Promise<Payslip[]> {
        let q = query(
            collection(db, 'payslips'),
            where('employeeId', '==', employeeId),
            orderBy('payDate', 'desc')
        );

        if (limitCount) {
            q = query(q, limit(limitCount));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as Payslip[];
    },

    async createPayslip(payslip: Omit<Payslip, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'payslips'), {
            ...payslip,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async markPayslipViewed(payslipId: string): Promise<void> {
        const docRef = doc(db, 'payslips', payslipId);
        await updateDoc(docRef, {
            viewedByEmployee: true,
            viewedAt: Timestamp.now()
        });
    },

    // ============================================================
    // PAYROLL ADJUSTMENTS
    // ============================================================

    async getAdjustments(companyId: string, options?: {
        employeeId?: string;
        status?: string;
    }): Promise<PayrollAdjustment[]> {
        const q = query(
            collection(db, 'payrollAdjustments'),
            where('companyId', '==', companyId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as PayrollAdjustment[];

        if (options?.employeeId) {
            results = results.filter(a => a.employeeId === options.employeeId);
        }
        if (options?.status) {
            results = results.filter(a => a.status === options.status);
        }

        return results;
    },

    async createAdjustment(adjustment: Omit<PayrollAdjustment, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'payrollAdjustments'), {
            ...adjustment,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateAdjustment(adjustmentId: string, data: Partial<PayrollAdjustment>): Promise<void> {
        const docRef = doc(db, 'payrollAdjustments', adjustmentId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async approveAdjustment(adjustmentId: string, approverId: string): Promise<void> {
        await this.updateAdjustment(adjustmentId, {
            status: 'approved',
            approvedBy: approverId,
            approvedAt: new Date()
        });
    },

    async rejectAdjustment(adjustmentId: string, reason: string): Promise<void> {
        await this.updateAdjustment(adjustmentId, {
            status: 'rejected',
            rejectionReason: reason
        });
    },

    // ============================================================
    // BANK FILES
    // ============================================================

    async getBankFiles(payRunId: string): Promise<BankFile[]> {
        const q = query(
            collection(db, 'bankFiles'),
            where('payRunId', '==', payRunId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as BankFile[];
    },

    async createBankFile(bankFile: Omit<BankFile, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'bankFiles'), bankFile);
        return docRef.id;
    },

    // ============================================================
    // GL JOURNALS
    // ============================================================

    async getJournals(payRunId: string): Promise<GLJournal[]> {
        const q = query(
            collection(db, 'glJournals'),
            where('payRunId', '==', payRunId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...convertTimestamps(docSnap.data())
        })) as GLJournal[];
    },

    async createJournal(journal: Omit<GLJournal, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'glJournals'), journal);
        return docRef.id;
    },

    // ============================================================
    // HELPERS
    // ============================================================

    // Get current tax year (March to February in South Africa)
    getCurrentTaxYear(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed

        // Tax year runs March to February
        if (month < 2) { // Jan or Feb
            return `${year - 1}/${year}`;
        }
        return `${year}/${year + 1}`;
    },

    // Calculate period number based on pay frequency and date
    calculatePeriodNumber(payFrequency: string, date: Date): number {
        const year = date.getFullYear();
        const month = date.getMonth();

        switch (payFrequency) {
            case 'weekly':
                // Calculate week of year
                const startOfYear = new Date(year, 0, 1);
                const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                return Math.ceil((days + startOfYear.getDay() + 1) / 7);

            case 'fortnightly':
                const weeksInYear = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000 * 7));
                return Math.ceil(weeksInYear / 2);

            case 'monthly':
                return month + 1;

            default:
                return 1;
        }
    },

    // Format currency
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount);
    }
};
