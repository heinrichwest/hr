// ============================================================
// EMPLOYEE SERVICE - CRUD operations for employee management
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
    Employee,
    EmploymentHistory,
    EmployeeDocument,
    Termination,
    EmployeePayElement,
    EmployeeLoan,
    Garnishee,
    OnboardingChecklist
} from '../types/employee';

// Helper to convert Firestore timestamps
const convertTimestamps = <T extends DocumentData>(data: T): T => {
    const converted = { ...data };
    Object.keys(converted).forEach(key => {
        const value = converted[key];
        if (value instanceof Timestamp) {
            (converted as any)[key] = value.toDate();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            (converted as any)[key] = convertTimestamps(value);
        }
    });
    return converted;
};

export const EmployeeService = {
    // ============================================================
    // EMPLOYEE CRUD
    // ============================================================

    async getEmployees(companyId: string, options?: {
        status?: string;
        departmentId?: string;
        branchId?: string;
        managerId?: string;
        limitCount?: number;
    }): Promise<Employee[]> {
        let q = query(
            collection(db, 'employees'),
            where('companyId', '==', companyId),
            orderBy('lastName'),
            orderBy('firstName')
        );

        if (options?.status) {
            q = query(q, where('status', '==', options.status));
        }
        if (options?.departmentId) {
            q = query(q, where('departmentId', '==', options.departmentId));
        }
        if (options?.branchId) {
            q = query(q, where('branchId', '==', options.branchId));
        }
        if (options?.managerId) {
            q = query(q, where('managerId', '==', options.managerId));
        }
        if (options?.limitCount) {
            q = query(q, limit(options.limitCount));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        })) as Employee[];
    },

    async getEmployee(employeeId: string): Promise<Employee | null> {
        const docRef = doc(db, 'employees', employeeId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Employee;
    },

    async getEmployeeByNumber(companyId: string, employeeNumber: string): Promise<Employee | null> {
        const q = query(
            collection(db, 'employees'),
            where('companyId', '==', companyId),
            where('employeeNumber', '==', employeeNumber),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...convertTimestamps(doc.data()) } as Employee;
    },

    async getEmployeeByUserId(userId: string): Promise<Employee | null> {
        const q = query(
            collection(db, 'employees'),
            where('userId', '==', userId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...convertTimestamps(doc.data()) } as Employee;
    },

    async createEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'employees'), {
            ...employee,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateEmployee(employeeId: string, data: Partial<Employee>): Promise<void> {
        const docRef = doc(db, 'employees', employeeId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteEmployee(employeeId: string): Promise<void> {
        // Soft delete - mark as inactive
        const docRef = doc(db, 'employees', employeeId);
        await updateDoc(docRef, {
            isActive: false,
            updatedAt: Timestamp.now()
        });
    },

    // Generate next employee number
    async generateEmployeeNumber(companyId: string, prefix: string = 'EMP'): Promise<string> {
        const q = query(
            collection(db, 'employees'),
            where('companyId', '==', companyId),
            orderBy('employeeNumber', 'desc'),
            limit(1)
        );
        const snapshot = await getDocs(q);

        let nextNum = 1;
        if (!snapshot.empty) {
            const lastEmployee = snapshot.docs[0].data();
            const lastNumber = lastEmployee.employeeNumber;
            const numPart = lastNumber.replace(/\D/g, '');
            if (numPart) {
                nextNum = parseInt(numPart, 10) + 1;
            }
        }

        return `${prefix}${nextNum.toString().padStart(4, '0')}`;
    },

    // ============================================================
    // EMPLOYMENT HISTORY
    // ============================================================

    async getEmploymentHistory(employeeId: string): Promise<EmploymentHistory[]> {
        const q = query(
            collection(db, 'employmentHistory'),
            where('employeeId', '==', employeeId),
            orderBy('effectiveDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        })) as EmploymentHistory[];
    },

    async createEmploymentHistory(history: Omit<EmploymentHistory, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'employmentHistory'), {
            ...history,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    // ============================================================
    // EMPLOYEE DOCUMENTS
    // ============================================================

    async getEmployeeDocuments(employeeId: string, category?: string): Promise<EmployeeDocument[]> {
        let q = query(
            collection(db, 'employeeDocuments'),
            where('employeeId', '==', employeeId),
            orderBy('uploadedAt', 'desc')
        );

        if (category) {
            q = query(q, where('category', '==', category));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        })) as EmployeeDocument[];
    },

    async getEmployeeDocument(documentId: string): Promise<EmployeeDocument | null> {
        const docRef = doc(db, 'employeeDocuments', documentId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as EmployeeDocument;
    },

    async createEmployeeDocument(document: Omit<EmployeeDocument, 'id' | 'uploadedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'employeeDocuments'), {
            ...document,
            uploadedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateEmployeeDocument(documentId: string, data: Partial<EmployeeDocument>): Promise<void> {
        const docRef = doc(db, 'employeeDocuments', documentId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteEmployeeDocument(documentId: string): Promise<void> {
        const docRef = doc(db, 'employeeDocuments', documentId);
        await deleteDoc(docRef);
    },

    // Get documents expiring soon
    async getExpiringDocuments(companyId: string, daysAhead: number = 30): Promise<EmployeeDocument[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const q = query(
            collection(db, 'employeeDocuments'),
            where('companyId', '==', companyId),
            where('hasExpiry', '==', true),
            where('expiryDate', '<=', Timestamp.fromDate(futureDate)),
            orderBy('expiryDate')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        })) as EmployeeDocument[];
    },

    // ============================================================
    // TERMINATION
    // ============================================================

    async getTermination(employeeId: string): Promise<Termination | null> {
        const q = query(
            collection(db, 'terminations'),
            where('employeeId', '==', employeeId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...convertTimestamps(doc.data()) } as Termination;
    },

    async createTermination(termination: Omit<Termination, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'terminations'), {
            ...termination,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateTermination(terminationId: string, data: Partial<Termination>): Promise<void> {
        const docRef = doc(db, 'terminations', terminationId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    // ============================================================
    // EMPLOYEE PAY ELEMENTS
    // ============================================================

    async getEmployeePayElements(employeeId: string): Promise<EmployeePayElement[]> {
        const q = query(
            collection(db, 'employeePayElements'),
            where('employeeId', '==', employeeId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        })) as EmployeePayElement[];
    },

    async createEmployeePayElement(payElement: Omit<EmployeePayElement, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'employeePayElements'), {
            ...payElement,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateEmployeePayElement(payElementId: string, data: Partial<EmployeePayElement>): Promise<void> {
        const docRef = doc(db, 'employeePayElements', payElementId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteEmployeePayElement(payElementId: string): Promise<void> {
        const docRef = doc(db, 'employeePayElements', payElementId);
        await deleteDoc(docRef);
    },

    // ============================================================
    // LOANS
    // ============================================================

    async getEmployeeLoans(employeeId: string): Promise<EmployeeLoan[]> {
        const q = query(
            collection(db, 'employeeLoans'),
            where('employeeId', '==', employeeId),
            orderBy('startDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        })) as EmployeeLoan[];
    },

    async createEmployeeLoan(loan: Omit<EmployeeLoan, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'employeeLoans'), {
            ...loan,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateEmployeeLoan(loanId: string, data: Partial<EmployeeLoan>): Promise<void> {
        const docRef = doc(db, 'employeeLoans', loanId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    // ============================================================
    // GARNISHEES
    // ============================================================

    async getEmployeeGarnishees(employeeId: string): Promise<Garnishee[]> {
        const q = query(
            collection(db, 'garnishees'),
            where('employeeId', '==', employeeId),
            orderBy('priority')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        })) as Garnishee[];
    },

    async createGarnishee(garnishee: Omit<Garnishee, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'garnishees'), {
            ...garnishee,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateGarnishee(garnisheeId: string, data: Partial<Garnishee>): Promise<void> {
        const docRef = doc(db, 'garnishees', garnisheeId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    // ============================================================
    // ONBOARDING
    // ============================================================

    async getOnboardingChecklist(employeeId: string): Promise<OnboardingChecklist | null> {
        const q = query(
            collection(db, 'onboardingChecklists'),
            where('employeeId', '==', employeeId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...convertTimestamps(doc.data()) } as OnboardingChecklist;
    },

    async createOnboardingChecklist(checklist: Omit<OnboardingChecklist, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'onboardingChecklists'), {
            ...checklist,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateOnboardingChecklist(checklistId: string, data: Partial<OnboardingChecklist>): Promise<void> {
        const docRef = doc(db, 'onboardingChecklists', checklistId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    // ============================================================
    // SEARCH & STATS
    // ============================================================

    async searchEmployees(companyId: string, searchTerm: string): Promise<Employee[]> {
        // Note: For better search, consider using Algolia or Elasticsearch
        // This is a basic implementation
        const employees = await this.getEmployees(companyId);
        const term = searchTerm.toLowerCase();

        return employees.filter(emp =>
            emp.firstName.toLowerCase().includes(term) ||
            emp.lastName.toLowerCase().includes(term) ||
            emp.employeeNumber.toLowerCase().includes(term) ||
            emp.email.toLowerCase().includes(term) ||
            (emp.idNumber && emp.idNumber.includes(term))
        );
    },

    async getEmployeeStats(companyId: string): Promise<{
        total: number;
        active: number;
        probation: number;
        suspended: number;
        terminated: number;
        onLeave: number;
        byDepartment: Record<string, number>;
        byContractType: Record<string, number>;
    }> {
        const employees = await this.getEmployees(companyId);

        const stats = {
            total: employees.length,
            active: 0,
            probation: 0,
            suspended: 0,
            terminated: 0,
            onLeave: 0,
            byDepartment: {} as Record<string, number>,
            byContractType: {} as Record<string, number>
        };

        employees.forEach(emp => {
            // Status counts
            switch (emp.status) {
                case 'active': stats.active++; break;
                case 'probation': stats.probation++; break;
                case 'suspended': stats.suspended++; break;
                case 'terminated':
                case 'resigned':
                case 'retrenched':
                    stats.terminated++; break;
                case 'on_leave': stats.onLeave++; break;
            }

            // Department counts
            const deptId = emp.departmentId || 'unassigned';
            stats.byDepartment[deptId] = (stats.byDepartment[deptId] || 0) + 1;

            // Contract type counts
            stats.byContractType[emp.contractType] = (stats.byContractType[emp.contractType] || 0) + 1;
        });

        return stats;
    },

    // Get employees with upcoming birthdays
    async getUpcomingBirthdays(companyId: string, daysAhead: number = 30): Promise<Employee[]> {
        const employees = await this.getEmployees(companyId, { status: 'active' });
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + daysAhead);

        return employees.filter(emp => {
            if (!emp.dateOfBirth) return false;
            const birthday = new Date(emp.dateOfBirth);
            birthday.setFullYear(today.getFullYear());

            // Handle year rollover
            if (birthday < today) {
                birthday.setFullYear(today.getFullYear() + 1);
            }

            return birthday >= today && birthday <= endDate;
        }).sort((a, b) => {
            const aDate = new Date(a.dateOfBirth);
            const bDate = new Date(b.dateOfBirth);
            aDate.setFullYear(today.getFullYear());
            bDate.setFullYear(today.getFullYear());
            return aDate.getTime() - bDate.getTime();
        });
    },

    // Get employees whose probation is ending soon
    async getProbationEnding(companyId: string, daysAhead: number = 14): Promise<Employee[]> {
        const employees = await this.getEmployees(companyId, { status: 'probation' });
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + daysAhead);

        return employees.filter(emp => {
            if (!emp.probationEndDate) return false;
            const probEnd = new Date(emp.probationEndDate);
            return probEnd >= today && probEnd <= endDate;
        });
    },

    // Get employees by manager (direct reports)
    async getDirectReports(managerId: string): Promise<Employee[]> {
        const q = query(
            collection(db, 'employees'),
            where('managerId', '==', managerId),
            where('isActive', '==', true),
            orderBy('lastName')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        })) as Employee[];
    }
};
