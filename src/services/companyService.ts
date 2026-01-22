import { db } from "../firebase";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    writeBatch
} from "firebase/firestore";
import type {
    Company,
    Branch,
    Department,
    JobTitle,
    JobGrade,
    CostCentre,
    PayElement,
    PublicHoliday,
    WorkSchedule,
    PayrollPeriod
} from "../types/company";

// ============================================================
// COMPANY SERVICE
// ============================================================

export const CompanyService = {
    // --------------------------------------------------------
    // Company Profile
    // --------------------------------------------------------
    async getCompany(companyId: string): Promise<Company | null> {
        const docRef = doc(db, "companies", companyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Company;
        }
        return null;
    },

    async getDefaultCompany(): Promise<Company | null> {
        // For single-tenant, get the first active company
        const q = query(
            collection(db, "companies"),
            where("isActive", "==", true),
            orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Company;
        }
        return null;
    },

    async getAllCompanies(): Promise<Company[]> {
        const q = query(
            collection(db, "companies"),
            orderBy("legalName", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    },

    async getCompanyByName(legalName: string): Promise<Company | null> {
        const q = query(
            collection(db, "companies"),
            where("legalName", "==", legalName)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Company;
        }
        return null;
    },

    async deleteCompany(companyId: string): Promise<void> {
        await deleteDoc(doc(db, "companies", companyId));
    },

    async createCompany(company: Omit<Company, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "companies"));
        await setDoc(docRef, {
            ...company,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateCompany(companyId: string, data: Partial<Company>): Promise<void> {
        const docRef = doc(db, "companies", companyId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    // --------------------------------------------------------
    // Branches
    // --------------------------------------------------------
    async getBranches(companyId: string): Promise<Branch[]> {
        const q = query(
            collection(db, "branches"),
            where("companyId", "==", companyId),
            orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
    },

    async getBranch(branchId: string): Promise<Branch | null> {
        const docRef = doc(db, "branches", branchId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Branch;
        }
        return null;
    },

    async createBranch(branch: Omit<Branch, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "branches"));
        await setDoc(docRef, {
            ...branch,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateBranch(branchId: string, data: Partial<Branch>): Promise<void> {
        const docRef = doc(db, "branches", branchId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteBranch(branchId: string): Promise<void> {
        await deleteDoc(doc(db, "branches", branchId));
    },

    // --------------------------------------------------------
    // Departments
    // --------------------------------------------------------
    async getDepartments(companyId: string): Promise<Department[]> {
        const q = query(
            collection(db, "departments"),
            where("companyId", "==", companyId),
            orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
    },

    async getDepartment(departmentId: string): Promise<Department | null> {
        const docRef = doc(db, "departments", departmentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Department;
        }
        return null;
    },

    async createDepartment(department: Omit<Department, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "departments"));
        await setDoc(docRef, {
            ...department,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateDepartment(departmentId: string, data: Partial<Department>): Promise<void> {
        const docRef = doc(db, "departments", departmentId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteDepartment(departmentId: string): Promise<void> {
        await deleteDoc(doc(db, "departments", departmentId));
    },

    // --------------------------------------------------------
    // Job Titles
    // --------------------------------------------------------
    async getJobTitles(companyId: string): Promise<JobTitle[]> {
        const q = query(
            collection(db, "jobTitles"),
            where("companyId", "==", companyId),
            orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobTitle));
    },

    async getJobTitle(jobTitleId: string): Promise<JobTitle | null> {
        const docRef = doc(db, "jobTitles", jobTitleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as JobTitle;
        }
        return null;
    },

    async createJobTitle(jobTitle: Omit<JobTitle, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "jobTitles"));
        await setDoc(docRef, {
            ...jobTitle,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateJobTitle(jobTitleId: string, data: Partial<JobTitle>): Promise<void> {
        const docRef = doc(db, "jobTitles", jobTitleId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteJobTitle(jobTitleId: string): Promise<void> {
        await deleteDoc(doc(db, "jobTitles", jobTitleId));
    },

    // --------------------------------------------------------
    // Job Grades
    // --------------------------------------------------------
    async getJobGrades(companyId: string): Promise<JobGrade[]> {
        const q = query(
            collection(db, "jobGrades"),
            where("companyId", "==", companyId),
            orderBy("level", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobGrade));
    },

    async getJobGrade(jobGradeId: string): Promise<JobGrade | null> {
        const docRef = doc(db, "jobGrades", jobGradeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as JobGrade;
        }
        return null;
    },

    async createJobGrade(jobGrade: Omit<JobGrade, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "jobGrades"));
        await setDoc(docRef, {
            ...jobGrade,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateJobGrade(jobGradeId: string, data: Partial<JobGrade>): Promise<void> {
        const docRef = doc(db, "jobGrades", jobGradeId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteJobGrade(jobGradeId: string): Promise<void> {
        await deleteDoc(doc(db, "jobGrades", jobGradeId));
    },

    // --------------------------------------------------------
    // Cost Centres
    // --------------------------------------------------------
    async getCostCentres(companyId: string): Promise<CostCentre[]> {
        const q = query(
            collection(db, "costCentres"),
            where("companyId", "==", companyId),
            orderBy("code", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CostCentre));
    },

    async getCostCentre(costCentreId: string): Promise<CostCentre | null> {
        const docRef = doc(db, "costCentres", costCentreId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as CostCentre;
        }
        return null;
    },

    async createCostCentre(costCentre: Omit<CostCentre, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "costCentres"));
        await setDoc(docRef, {
            ...costCentre,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateCostCentre(costCentreId: string, data: Partial<CostCentre>): Promise<void> {
        const docRef = doc(db, "costCentres", costCentreId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteCostCentre(costCentreId: string): Promise<void> {
        await deleteDoc(doc(db, "costCentres", costCentreId));
    },

    // --------------------------------------------------------
    // Pay Elements
    // --------------------------------------------------------
    async getPayElements(companyId: string): Promise<PayElement[]> {
        const q = query(
            collection(db, "payElements"),
            where("companyId", "==", companyId),
            orderBy("sortOrder", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayElement));
    },

    async getPayElement(payElementId: string): Promise<PayElement | null> {
        const docRef = doc(db, "payElements", payElementId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as PayElement;
        }
        return null;
    },

    async createPayElement(payElement: Omit<PayElement, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "payElements"));
        await setDoc(docRef, {
            ...payElement,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updatePayElement(payElementId: string, data: Partial<PayElement>): Promise<void> {
        const docRef = doc(db, "payElements", payElementId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deletePayElement(payElementId: string): Promise<void> {
        await deleteDoc(doc(db, "payElements", payElementId));
    },

    // --------------------------------------------------------
    // Public Holidays
    // --------------------------------------------------------
    async getPublicHolidays(companyId: string, year?: number): Promise<PublicHoliday[]> {
        let q = query(
            collection(db, "publicHolidays"),
            where("companyId", "==", companyId),
            orderBy("date", "asc")
        );

        if (year) {
            q = query(
                collection(db, "publicHolidays"),
                where("companyId", "==", companyId),
                where("year", "==", year),
                orderBy("date", "asc")
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PublicHoliday));
    },

    async createPublicHoliday(holiday: Omit<PublicHoliday, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "publicHolidays"));
        await setDoc(docRef, {
            ...holiday,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async deletePublicHoliday(holidayId: string): Promise<void> {
        await deleteDoc(doc(db, "publicHolidays", holidayId));
    },

    // Seed SA public holidays for a given year
    async seedPublicHolidays(companyId: string, year: number): Promise<void> {
        const saHolidays = [
            { date: new Date(year, 0, 1), name: "New Year's Day" },
            { date: new Date(year, 2, 21), name: "Human Rights Day" },
            { date: new Date(year, 3, 27), name: "Freedom Day" },
            { date: new Date(year, 4, 1), name: "Workers' Day" },
            { date: new Date(year, 5, 16), name: "Youth Day" },
            { date: new Date(year, 7, 9), name: "National Women's Day" },
            { date: new Date(year, 8, 24), name: "Heritage Day" },
            { date: new Date(year, 11, 16), name: "Day of Reconciliation" },
            { date: new Date(year, 11, 25), name: "Christmas Day" },
            { date: new Date(year, 11, 26), name: "Day of Goodwill" }
        ];

        const batch = writeBatch(db);

        for (const holiday of saHolidays) {
            const docRef = doc(collection(db, "publicHolidays"));
            batch.set(docRef, {
                companyId,
                date: holiday.date,
                name: holiday.name,
                isNational: true,
                year,
                createdAt: serverTimestamp()
            });
        }

        await batch.commit();
    },

    // --------------------------------------------------------
    // Work Schedules
    // --------------------------------------------------------
    async getWorkSchedules(companyId: string): Promise<WorkSchedule[]> {
        const q = query(
            collection(db, "workSchedules"),
            where("companyId", "==", companyId),
            orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkSchedule));
    },

    async getWorkSchedule(scheduleId: string): Promise<WorkSchedule | null> {
        const docRef = doc(db, "workSchedules", scheduleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as WorkSchedule;
        }
        return null;
    },

    async createWorkSchedule(schedule: Omit<WorkSchedule, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "workSchedules"));
        await setDoc(docRef, {
            ...schedule,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateWorkSchedule(scheduleId: string, data: Partial<WorkSchedule>): Promise<void> {
        const docRef = doc(db, "workSchedules", scheduleId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteWorkSchedule(scheduleId: string): Promise<void> {
        await deleteDoc(doc(db, "workSchedules", scheduleId));
    },

    // --------------------------------------------------------
    // Payroll Periods
    // --------------------------------------------------------
    async getPayrollPeriods(companyId: string, year?: number): Promise<PayrollPeriod[]> {
        let q = query(
            collection(db, "payrollPeriods"),
            where("companyId", "==", companyId),
            orderBy("startDate", "desc")
        );

        if (year) {
            q = query(
                collection(db, "payrollPeriods"),
                where("companyId", "==", companyId),
                where("year", "==", year),
                orderBy("startDate", "desc")
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollPeriod));
    },

    async getCurrentPayrollPeriod(companyId: string): Promise<PayrollPeriod | null> {
        const q = query(
            collection(db, "payrollPeriods"),
            where("companyId", "==", companyId),
            where("status", "==", "open"),
            orderBy("startDate", "desc")
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as PayrollPeriod;
        }
        return null;
    },

    async createPayrollPeriod(period: Omit<PayrollPeriod, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, "payrollPeriods"));
        await setDoc(docRef, {
            ...period,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updatePayrollPeriod(periodId: string, data: Partial<PayrollPeriod>): Promise<void> {
        const docRef = doc(db, "payrollPeriods", periodId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    // Generate payroll periods for a year
    async generatePayrollPeriods(
        companyId: string,
        year: number,
        frequency: 'weekly' | 'fortnightly' | 'monthly',
        payDayOfMonth: number = 25
    ): Promise<void> {
        const batch = writeBatch(db);

        if (frequency === 'monthly') {
            for (let month = 0; month < 12; month++) {
                const startDate = new Date(year, month, 1);
                const endDate = new Date(year, month + 1, 0);
                const cutOffDate = new Date(year, month, 20);
                let payDate = new Date(year, month, payDayOfMonth);

                // If pay date falls on weekend, move to Friday
                if (payDate.getDay() === 0) payDate.setDate(payDate.getDate() - 2);
                if (payDate.getDay() === 6) payDate.setDate(payDate.getDate() - 1);

                const docRef = doc(collection(db, "payrollPeriods"));
                batch.set(docRef, {
                    companyId,
                    payFrequency: frequency,
                    periodNumber: month + 1,
                    year,
                    startDate,
                    endDate,
                    cutOffDate,
                    payDate,
                    status: 'future',
                    createdAt: serverTimestamp()
                });
            }
        }

        await batch.commit();
    },

    // --------------------------------------------------------
    // Initialize Default Data
    // --------------------------------------------------------
    async initializeCompanyDefaults(companyId: string): Promise<void> {
        const batch = writeBatch(db);

        // Create default work schedule (Mon-Fri 8hrs)
        const defaultScheduleRef = doc(collection(db, "workSchedules"));
        batch.set(defaultScheduleRef, {
            companyId,
            name: "Standard (Mon-Fri)",
            code: "STD",
            description: "Standard 8-hour Monday to Friday schedule",
            mondayHours: 8,
            tuesdayHours: 8,
            wednesdayHours: 8,
            thursdayHours: 8,
            fridayHours: 8,
            saturdayHours: 0,
            sundayHours: 0,
            overtimeMultiplier: 1.5,
            sundayMultiplier: 2.0,
            publicHolidayMultiplier: 2.0,
            isDefault: true,
            isActive: true,
            createdAt: serverTimestamp()
        });

        // Create default pay elements
        const defaultPayElements = [
            {
                name: "Basic Salary",
                code: "BASIC",
                type: "earning",
                calculationMethod: "fixed",
                isTaxable: true,
                isUifApplicable: true,
                isSdlApplicable: true,
                isPensionApplicable: true,
                isRecurring: true,
                sortOrder: 1
            },
            {
                name: "Travel Allowance",
                code: "TRAVEL",
                type: "earning",
                calculationMethod: "fixed",
                isTaxable: true,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                sortOrder: 2
            },
            {
                name: "Medical Aid Contribution",
                code: "MED",
                type: "deduction",
                calculationMethod: "fixed",
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                sortOrder: 10
            },
            {
                name: "Pension Fund",
                code: "PENSION",
                type: "deduction",
                calculationMethod: "percentage",
                defaultPercentage: 7.5,
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                sortOrder: 11
            },
            {
                name: "UIF (Employee)",
                code: "UIF_EE",
                type: "deduction",
                calculationMethod: "percentage",
                defaultPercentage: 1,
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                sortOrder: 12
            },
            {
                name: "PAYE",
                code: "PAYE",
                type: "deduction",
                calculationMethod: "formula",
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                sortOrder: 13
            },
            {
                name: "UIF (Employer)",
                code: "UIF_ER",
                type: "employer_contribution",
                calculationMethod: "percentage",
                defaultPercentage: 1,
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                sortOrder: 20
            },
            {
                name: "SDL (Employer)",
                code: "SDL",
                type: "employer_contribution",
                calculationMethod: "percentage",
                defaultPercentage: 1,
                isTaxable: false,
                isUifApplicable: false,
                isSdlApplicable: false,
                isPensionApplicable: false,
                isRecurring: true,
                sortOrder: 21
            }
        ];

        for (const element of defaultPayElements) {
            const docRef = doc(collection(db, "payElements"));
            batch.set(docRef, {
                ...element,
                companyId,
                isActive: true,
                createdAt: serverTimestamp()
            });
        }

        await batch.commit();

        // Seed public holidays for current year
        const currentYear = new Date().getFullYear();
        await this.seedPublicHolidays(companyId, currentYear);
        await this.seedPublicHolidays(companyId, currentYear + 1);
    }
};
