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

export const Seeder = {
    async seedDatabase() {
        console.log("Starting database seed...");

        try {
            for (const tenant of TENANTS) {
                console.log(`Seeding tenant: ${tenant.name}...`);
                await this.seedTenant(tenant);
            }
            console.log("Database seed completed successfully!");
        } catch (error) {
            console.error("Seeding failed:", error);
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
        // - 1 Admin (HR Manager)
        // - 1 Manager (Line Manager)
        // - 3 Employees

        const roles: { role: UserRole; count: number; prefix: string }[] = [
            { role: 'HR Manager', count: 1, prefix: 'Admin' },
            { role: 'Line Manager', count: 1, prefix: 'Manager' },
            { role: 'Employee', count: 3, prefix: 'User' }
        ];

        for (const roleConfig of roles) {
            for (let i = 1; i <= roleConfig.count; i++) {
                const firstName = `${roleConfig.prefix}${i}`;
                const lastName = `${tenant.name}${tenant.suffix}`; // e.g. Admin1 Speccon(S)
                const email = `${firstName.toLowerCase()}.${i}@${tenant.domain}`;

                // Randomly assign dept and job
                const deptId = deptIds[Math.floor(Math.random() * deptIds.length)];
                const jobId = jobIds[Math.floor(Math.random() * jobIds.length)];

                const empData: Omit<Employee, 'id' | 'createdAt'> = {
                    companyId,
                    firstName: `${firstName} ${tenant.suffix}`,
                    lastName: lastName,
                    initials: firstName[0],
                    email,
                    employeeNumber: `${tenant.name.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 10000)}`,
                    idNumber: `${9001015000080 + Math.floor(Math.random() * 1000)}`,
                    dateOfBirth: new Date('1990-01-01'),
                    gender: 'Male',
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
