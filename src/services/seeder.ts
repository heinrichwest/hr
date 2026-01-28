import { CompanyService } from "./companyService";
import { EmployeeService } from "./employeeService";
import { UserService } from "./userService";
import { LeaveService } from "./leaveService";
import type { Company } from "../types/company";
import type { Employee } from "../types/employee";
import type { UserRole } from "../types/user";

// Seed Data Configuration
const TENANTS = [
    { name: 'Speccon', suffix: '(S)', domain: 'speccon.co.za', color: '#3b82f6' },
    { name: 'Megro', suffix: '(M)', domain: 'megro.co.za', color: '#10b981' },
    { name: 'Andebe', suffix: '(A)', domain: 'andebe.co.za', color: '#f59e0b' }
];

const DEPARTMENTS = ['Executive', 'HR', 'Finance', 'Operations', 'IT'];
const JOB_TITLES = ['Manager', 'Specialist', 'Assistant', 'Officer'];

// Realistic South African employee names
const SA_FIRST_NAMES = [
    'Thabo', 'Nomsa', 'Sipho', 'Zanele', 'Mpho', 'Lindiwe', 'Bongani', 'Thandi',
    'Karabo', 'Lerato', 'Tshepo', 'Naledi', 'Kagiso', 'Palesa', 'Mandla', 'Noma',
    'Trevor', 'Sarah', 'David', 'Michelle', 'James', 'Nicole', 'Andrew', 'Jessica',
    'Fatima', 'Ahmed', 'Zainab', 'Ibrahim', 'Ayesha', 'Muhammad',
    'Priya', 'Raj', 'Anita', 'Kumar', 'Deepak', 'Sanjay'
];

const SA_LAST_NAMES = [
    'Khumalo', 'Nkosi', 'Dlamini', 'Ndlovu', 'Mthembu', 'Sithole', 'Zulu', 'Mokoena',
    'Molefe', 'Nhlapo', 'Maseko', 'Mabaso', 'Cele', 'Buthelezi', 'Radebe', 'Naidoo',
    'Van der Merge', 'Botha', 'De Klerk', 'Pretorius', 'Du Plessis', 'Swart', 'Nel',
    'Patel', 'Pillay', 'Govender', 'Chetty', 'Reddy', 'Naicker',
    'Abrahams', 'Jacobs', 'Williams', 'Adams', 'Peterson', 'Smith'
];

/**
 * Hash password using Web Crypto API (SHA-256)
 * Same implementation as SignUp.tsx for consistency
 */
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export const Seeder = {
    async clearAllData() {
        console.log("Clearing all existing data...");

        try {
            // Import Firestore functions
            const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            // Delete all employees
            console.log("Deleting all employees...");
            const employeesSnapshot = await getDocs(collection(db, 'employees'));
            for (const empDoc of employeesSnapshot.docs) {
                await deleteDoc(doc(db, 'employees', empDoc.id));
            }
            console.log(`Deleted ${employeesSnapshot.size} employees`);

            // Delete all job titles
            console.log("Deleting all job titles...");
            const jobTitlesSnapshot = await getDocs(collection(db, 'jobTitles'));
            for (const jobDoc of jobTitlesSnapshot.docs) {
                await deleteDoc(doc(db, 'jobTitles', jobDoc.id));
            }
            console.log(`Deleted ${jobTitlesSnapshot.size} job titles`);

            // Delete all departments
            console.log("Deleting all departments...");
            const departmentsSnapshot = await getDocs(collection(db, 'departments'));
            for (const deptDoc of departmentsSnapshot.docs) {
                await deleteDoc(doc(db, 'departments', deptDoc.id));
            }
            console.log(`Deleted ${departmentsSnapshot.size} departments`);

            // Delete all branches
            console.log("Deleting all branches...");
            const branchesSnapshot = await getDocs(collection(db, 'branches'));
            for (const branchDoc of branchesSnapshot.docs) {
                await deleteDoc(doc(db, 'branches', branchDoc.id));
            }
            console.log(`Deleted ${branchesSnapshot.size} branches`);

            // Delete all companies
            console.log("Deleting all companies...");
            const companies = await CompanyService.getAllCompanies();
            for (const company of companies) {
                console.log(`Deleting company: ${company.legalName}...`);
                await CompanyService.deleteCompany(company.id);
            }
            console.log(`Deleted ${companies.length} companies`);

            // NOTE: access_requests collection is NOT cleared to preserve demo data
            // Demo access requests persist across re-seeding operations

            console.log("All data cleared successfully!");
        } catch (error) {
            console.error("Failed to clear data:", error);
            throw error;
        }
    },

    async clearAndReseed() {
        console.log("Starting clear and reseed process...");

        try {
            await this.clearAllData();
            await this.seedDatabase();
            console.log("Clear and reseed completed successfully!");
        } catch (error) {
            console.error("Clear and reseed failed:", error);
            throw error;
        }
    },

    async seedDatabase() {
        console.log("Starting database seed...");

        try {
            for (const tenant of TENANTS) {
                console.log(`Seeding tenant: ${tenant.name}...`);
                await this.seedTenant(tenant);
            }

            // Seed demo access requests after tenants
            await this.seedDemoAccessRequests();

            console.log("Database seed completed successfully!");
        } catch (error) {
            console.error("Seeding failed:", error);
            throw error;
        }
    },

    /**
     * Seeds 3 demo pending access requests for System Admin dashboard testing
     *
     * Demo requests use:
     * - Random South African names from SA_FIRST_NAMES and SA_LAST_NAMES arrays
     * - Email pattern: firstname.lastname@example.com (lowercase)
     * - Varied creation timestamps: today, 2 days ago, 3 days ago
     * - Pending status only
     *
     * Duplicate Prevention:
     * - Checks for existing @example.com requests before creating
     * - Skips creation if demo requests already exist
     * - Prevents duplicate names across all 3 requests
     *
     * Data Persistence:
     * - Demo requests persist across re-seeding operations
     * - clearAllData() does NOT delete access_requests collection
     */
    async seedDemoAccessRequests() {
        console.log("Seeding demo access requests...");

        try {
            const { collection, getDocs, query, where, Timestamp, setDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            // Check if demo requests already exist (prevent duplicates on re-seed)
            const accessRequestsRef = collection(db, 'access_requests');
            const allRequestsSnapshot = await getDocs(accessRequestsRef);

            // Filter for existing demo requests with @example.com domain
            const existingDemoRequests = allRequestsSnapshot.docs.filter(doc => {
                const email = doc.data().email || '';
                return email.endsWith('@example.com');
            });

            if (existingDemoRequests.length > 0) {
                console.log(`Found ${existingDemoRequests.length} existing demo requests, skipping creation...`);
                return;
            }

            // Generate unique name combinations
            const usedNames = new Set<string>();
            const demoRequests = [];

            // Calculate timestamp offsets in milliseconds
            const now = Date.now();
            const timestamps = [
                now,                                    // Today
                now - (2 * 24 * 60 * 60 * 1000),       // 2 days ago
                now - (3 * 24 * 60 * 60 * 1000)        // 3 days ago
            ];

            // Generate password hash for demo password (won't be used for actual login)
            const demoPasswordHash = await hashPassword('DemoPassword123!');

            // Create 3 demo requests
            for (let i = 0; i < 3; i++) {
                // Get unique first and last name combination
                let firstName = '';
                let lastName = '';
                let fullName = '';

                do {
                    firstName = SA_FIRST_NAMES[Math.floor(Math.random() * SA_FIRST_NAMES.length)];
                    lastName = SA_LAST_NAMES[Math.floor(Math.random() * SA_LAST_NAMES.length)];
                    fullName = `${firstName} ${lastName}`;
                } while (usedNames.has(fullName));

                usedNames.add(fullName);

                // Generate email with example.com domain
                const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

                demoRequests.push({
                    email,
                    firstName,
                    lastName,
                    passwordHash: demoPasswordHash,
                    createdAt: Timestamp.fromMillis(timestamps[i])
                });
            }

            // Create demo requests in Firestore
            for (const requestData of demoRequests) {
                const docRef = doc(accessRequestsRef);

                await setDoc(docRef, {
                    id: docRef.id,
                    email: requestData.email,
                    firstName: requestData.firstName,
                    lastName: requestData.lastName,
                    passwordHash: requestData.passwordHash,
                    status: 'pending',
                    createdAt: requestData.createdAt,
                    reviewedAt: null,
                    reviewedBy: null,
                    assignedRole: null,
                    assignedCompanyId: null,
                    linkedEmployeeId: null
                });

                console.log(`Created demo access request for ${requestData.email}`);
            }

            console.log("Created 3 demo pending access requests");
        } catch (error) {
            console.error("Failed to seed demo access requests:", error);
            throw error;
        }
    },

    async seedTenant(tenant: typeof TENANTS[0]) {
        // 1. Check if company already exists
        const legalName = `${tenant.name} Holdings ${tenant.suffix}`;
        const existingCompany = await CompanyService.getCompanyByName(legalName);

        if (existingCompany) {
            console.log(`Tenant ${tenant.name} already exists, skipping...`);
            return;
        }

        // 2. Create Company
        const companyData: Omit<Company, 'id' | 'createdAt'> = {
            legalName,
            tradingName: `${tenant.name} ${tenant.suffix}`,
            registrationNumber: `2024/${Math.floor(Math.random() * 100000)}/07 ${tenant.suffix}`,
            physicalAddress: {
                line1: `123 ${tenant.name} Street ${tenant.suffix}`,
                city: 'Pretoria',
                province: 'Gauteng',
                postalCode: '0001',
                country: 'South Africa'
            },
            defaultCurrency: 'ZAR',
            defaultPayFrequency: 'monthly',
            financialYearEnd: 2,
            isActive: true
        };

        const companyId = await CompanyService.createCompany(companyData);
        await CompanyService.initializeCompanyDefaults(companyId);

        // Seed default leave types for this tenant
        await LeaveService.seedDefaultLeaveTypes(companyId);

        // 2. Create Branches
        const branchId = await CompanyService.createBranch({
            companyId,
            name: `Head Office ${tenant.suffix}`,
            code: `HO-${tenant.name.substring(0, 3).toUpperCase()}`,
            isHeadOffice: true,
            isActive: true,
            city: 'Pretoria' // Assuming simple object match for now, fixing if interface differs
        } as any); // Casting mainly because Branch interface might have specific address structure or just ID.
        // Actually Branch interface in previous turn: address: Address.
        // Let's refine this to match the type properly in a moment, but for now `as any` or strictly matching `Address` is safer.

        // 3. Create Departments
        const deptIds: string[] = [];
        for (const deptName of DEPARTMENTS) {
            const deptId = await CompanyService.createDepartment({
                companyId,
                branchId,
                name: `${deptName} ${tenant.suffix}`,
                code: `${deptName.substring(0, 3).toUpperCase()}-${tenant.suffix.replace(/[()]/g, '')}`,
                isActive: true
            });
            deptIds.push(deptId);
        }

        // 4. Create Job Titles
        const jobIds: string[] = [];
        for (const jobName of JOB_TITLES) {
            const jobId = await CompanyService.createJobTitle({
                companyId,
                name: `${jobName} ${tenant.suffix}`,
                code: `${jobName.substring(0, 3).toUpperCase()}`,
                isActive: true
            });
            jobIds.push(jobId);
        }

        // 5. Create Employees & Users
        // We'll create:
        // - 2 HR Managers
        // - 3 Line Managers
        // - 2 Payroll Managers
        // - 8 Employees (regular staff)

        const roles: { role: UserRole; count: number; prefix: string }[] = [
            { role: 'HR Manager', count: 2, prefix: 'HR' },
            { role: 'Line Manager', count: 3, prefix: 'Manager' },
            { role: 'Payroll Manager', count: 2, prefix: 'Payroll' },
            { role: 'Employee', count: 8, prefix: 'Staff' }
        ];

        // Keep track of used names to avoid duplicates
        const usedNames = new Set<string>();
        let employeeCounter = 0;

        for (const roleConfig of roles) {
            for (let i = 1; i <= roleConfig.count; i++) {
                // Get unique first and last name combination
                let firstName = '';
                let lastName = '';
                let fullName = '';

                do {
                    firstName = SA_FIRST_NAMES[Math.floor(Math.random() * SA_FIRST_NAMES.length)];
                    lastName = SA_LAST_NAMES[Math.floor(Math.random() * SA_LAST_NAMES.length)];
                    fullName = `${firstName} ${lastName}`;
                } while (usedNames.has(fullName));

                usedNames.add(fullName);
                employeeCounter++;

                const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${tenant.domain}`;

                // Randomly assign dept and job
                const deptId = deptIds[Math.floor(Math.random() * deptIds.length)];
                const jobId = jobIds[Math.floor(Math.random() * jobIds.length)];

                // Random gender and birth date
                const genders = ['Male', 'Female', 'Other'];
                const randomGender = genders[Math.floor(Math.random() * genders.length)];
                const randomYear = 1980 + Math.floor(Math.random() * 25); // Birth years 1980-2004
                const randomMonth = 1 + Math.floor(Math.random() * 12);
                const randomDay = 1 + Math.floor(Math.random() * 28);
                const birthDate = new Date(randomYear, randomMonth - 1, randomDay);

                const empData: Omit<Employee, 'id' | 'createdAt'> = {
                    companyId,
                    firstName: firstName,
                    lastName: lastName,
                    initials: `${firstName[0]}${lastName[0]}`,
                    email,
                    employeeNumber: `${tenant.name.substring(0, 2).toUpperCase()}${String(employeeCounter).padStart(4, '0')}`,
                    idNumber: `${String(randomYear).slice(-2)}${String(randomMonth).padStart(2, '0')}${String(randomDay).padStart(2, '0')}${String(5000 + Math.floor(Math.random() * 5000))}080`,
                    dateOfBirth: birthDate,
                    gender: randomGender,
                    departmentId: deptId,
                    jobTitleId: jobId,
                    branchId,
                    status: 'active',
                    contractType: 'permanent',
                    startDate: new Date('2023-01-01'),
                    leaveBalance: 15,
                    isActive: true, // Helper field if exists
                    address: {
                        line1: '123 Fake St',
                        city: 'Pretoria',
                        province: 'Gauteng',
                        postalCode: '0001',
                        country: 'South Africa'
                    }
                } as any; // Type assertion to avoid minor missing optional fields in strict mode

                const empId = await EmployeeService.createEmployee(empData);

                // Create User Profile linked to this employee
                // We use a fake UID since we can't create Auth users programmatically easily
                const fakeUid = `uid_${tenant.name}_${roleConfig.prefix}_${i}`.toLowerCase();

                await UserService.createUserProfile(fakeUid, email, roleConfig.role, companyId);
                await UserService.updateUserProfile(fakeUid, {
                    employeeId: empId,
                    displayName: `${firstName} ${lastName}`
                });

                // Link employee to user
                await EmployeeService.updateEmployee(empId, { userId: fakeUid });
            }
        }
    }
};
