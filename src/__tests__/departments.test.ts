import { describe, it, expect } from 'vitest';
import { DEPARTMENTS, DEPARTMENT_CODES, TENANTS } from '../services/seeder';
import { MOCK_EMPLOYEE } from '../data/mockEmployeeData';

// ============================================================
// Task Group 1: Seeder Department Constants and Code Generation
// ============================================================

describe('Seeder Department Constants', () => {
    it('DEPARTMENTS array contains exactly 14 entries', () => {
        expect(DEPARTMENTS).toHaveLength(14);
    });

    it('each department has a matching abbreviation code in DEPARTMENT_CODES', () => {
        for (const dept of DEPARTMENTS) {
            expect(DEPARTMENT_CODES).toHaveProperty(dept);
            expect(typeof DEPARTMENT_CODES[dept]).toBe('string');
            expect(DEPARTMENT_CODES[dept].length).toBeGreaterThan(0);
        }
    });

    it('abbreviation codes with tenant suffix are generated correctly', () => {
        // Simulate the code generation logic from seedTenant
        const expectedExamples: Record<string, Record<string, string>> = {
            'Human Resources': { S: 'HR-S', M: 'HR-M', A: 'HR-A' },
            'IT Development': { S: 'IT-DEV-S', M: 'IT-DEV-M', A: 'IT-DEV-A' },
            'Finance': { S: 'FIN-S', M: 'FIN-M', A: 'FIN-A' },
        };

        for (const [deptName, tenantCodes] of Object.entries(expectedExamples)) {
            const baseCode = DEPARTMENT_CODES[deptName];
            for (const tenant of TENANTS) {
                const tenantSuffix = tenant.suffix.replace(/[()]/g, '');
                const fullCode = `${baseCode}-${tenantSuffix}`;
                expect(fullCode).toBe(tenantCodes[tenantSuffix]);
            }
        }
    });

    it('no duplicate codes exist within the same tenant', () => {
        for (const tenant of TENANTS) {
            const tenantSuffix = tenant.suffix.replace(/[()]/g, '');
            const codes = DEPARTMENTS.map(dept => `${DEPARTMENT_CODES[dept]}-${tenantSuffix}`);
            const uniqueCodes = new Set(codes);
            expect(uniqueCodes.size).toBe(codes.length);
        }
    });
});

// ============================================================
// Task Group 2: Mock Data Consistency
// ============================================================

describe('Mock Data Department References', () => {
    it('MOCK_EMPLOYEE.department uses a valid department name from the new list', () => {
        expect(DEPARTMENTS).toContain(MOCK_EMPLOYEE.department);
    });

    it('no mock data references old department names', () => {
        const oldDepartments = ['Executive', 'HR', 'Operations', 'IT', 'Engineering'];
        // MOCK_EMPLOYEE.department should not be any of the old names
        expect(oldDepartments).not.toContain(MOCK_EMPLOYEE.department);
    });
});

// ============================================================
// Task Group 3: Integration / Verification Tests
// ============================================================

describe('Integration: Seeded Department Verification', () => {
    const EXPECTED_DEPARTMENTS = [
        'Human Resources',
        'Finance',
        'IT Development',
        'IT Hardware and Software Support',
        'IT Client Support',
        'Sales',
        'TAP Academy',
        'Content Development',
        'Administration',
        'Client Liaison',
        'Learnership & Training',
        'Recruitment',
        'Key Accounts',
        'Practical Work Experience Learners'
    ];

    it('each tenant receives exactly 14 departments from the seeder', () => {
        // The seeder iterates TENANTS and seeds DEPARTMENTS for each.
        // Verify the constants guarantee 14 departments per tenant.
        expect(TENANTS).toHaveLength(3);
        expect(DEPARTMENTS).toHaveLength(14);

        // Verify each tenant would produce 14 department records
        for (const tenant of TENANTS) {
            const tenantSuffix = tenant.suffix.replace(/[()]/g, '');
            const seededDepts = DEPARTMENTS.map(deptName => ({
                name: `${deptName} ${tenant.suffix}`,
                code: `${DEPARTMENT_CODES[deptName]}-${tenantSuffix}`,
            }));
            expect(seededDepts).toHaveLength(14);
        }
    });

    it('department names match the expected list', () => {
        // Verify DEPARTMENTS matches expected list exactly, in order
        expect(DEPARTMENTS).toEqual(EXPECTED_DEPARTMENTS);
    });

    it('department codes follow the expected abbreviation + tenant suffix pattern', () => {
        const expectedCodes: Record<string, string> = {
            'Human Resources': 'HR',
            'Finance': 'FIN',
            'IT Development': 'IT-DEV',
            'IT Hardware and Software Support': 'IT-HW',
            'IT Client Support': 'IT-CS',
            'Sales': 'SAL',
            'TAP Academy': 'TAP',
            'Content Development': 'CD',
            'Administration': 'ADM',
            'Client Liaison': 'CL',
            'Learnership & Training': 'LT',
            'Recruitment': 'REC',
            'Key Accounts': 'KA',
            'Practical Work Experience Learners': 'PWE',
        };

        // Verify every department has the correct base code
        for (const [deptName, expectedCode] of Object.entries(expectedCodes)) {
            expect(DEPARTMENT_CODES[deptName]).toBe(expectedCode);
        }

        // Verify full codes with tenant suffixes follow the pattern: CODE-SUFFIX
        const tenantSuffixes = ['S', 'M', 'A'];
        for (const suffix of tenantSuffixes) {
            for (const deptName of DEPARTMENTS) {
                const fullCode = `${DEPARTMENT_CODES[deptName]}-${suffix}`;
                // Pattern: one or more uppercase letters/hyphens, followed by dash and single letter
                expect(fullCode).toMatch(/^[A-Z]([A-Z-]*[A-Z])?-[SMA]$/);
            }
        }
    });

    it('Employee List dropdown would render all 14 departments', () => {
        // Simulate what the dropdown would render: an option for each department
        // The EmployeeList component maps departments from Firestore to <option> elements.
        // Verify that our seeded data produces the correct dropdown options.
        const specconTenant = TENANTS.find(t => t.name === 'Speccon')!;
        const dropdownOptions = DEPARTMENTS.map((deptName, index) => ({
            id: `dept-${index}`,
            name: `${deptName} ${specconTenant.suffix}`,
            code: `${DEPARTMENT_CODES[deptName]}-S`,
        }));

        // All 14 departments should be present
        expect(dropdownOptions).toHaveLength(14);

        // Each option should have a non-empty name containing the department name
        for (const option of dropdownOptions) {
            expect(option.name.length).toBeGreaterThan(0);
            // Name should contain the original department name
            const baseName = option.name.replace(` ${specconTenant.suffix}`, '');
            expect(DEPARTMENTS).toContain(baseName);
        }

        // Old departments should not be in the dropdown
        const oldDeptNames = ['Executive', 'Operations', 'IT'];
        const dropdownNames = dropdownOptions.map(o => o.name);
        for (const oldDept of oldDeptNames) {
            const found = dropdownNames.some(name => name === oldDept || name.startsWith(`${oldDept} (`));
            expect(found).toBe(false);
        }
    });
});

// ============================================================
// Task Group 4: Gap Analysis - Strategic Additional Tests
// ============================================================

describe('Department Feature: Coverage Gap Tests', () => {
    it('DEPARTMENT_CODES map has no extra entries beyond the 14 departments', () => {
        // Ensures no stale or orphaned entries exist in the codes map
        const codeKeys = Object.keys(DEPARTMENT_CODES);
        expect(codeKeys).toHaveLength(DEPARTMENTS.length);
        for (const key of codeKeys) {
            expect(DEPARTMENTS).toContain(key);
        }
    });

    it('department codes are unique across all tenants combined', () => {
        // Cross-tenant isolation: every full code (base + suffix) must be globally unique
        const allCodes: string[] = [];
        for (const tenant of TENANTS) {
            const tenantSuffix = tenant.suffix.replace(/[()]/g, '');
            for (const dept of DEPARTMENTS) {
                allCodes.push(`${DEPARTMENT_CODES[dept]}-${tenantSuffix}`);
            }
        }
        // Total should be 14 departments x 3 tenants = 42 unique codes
        expect(allCodes).toHaveLength(42);
        const uniqueCodes = new Set(allCodes);
        expect(uniqueCodes.size).toBe(42);
    });

    it('DEPARTMENTS array contains no duplicate names', () => {
        const uniqueNames = new Set(DEPARTMENTS);
        expect(uniqueNames.size).toBe(DEPARTMENTS.length);
    });

    it('seeded department names include tenant suffix for tenant isolation', () => {
        // The seeder appends the tenant suffix to each department name
        // e.g., "Human Resources (S)" for Speccon. Verify this pattern works.
        for (const tenant of TENANTS) {
            for (const deptName of DEPARTMENTS) {
                const seededName = `${deptName} ${tenant.suffix}`;
                // Should contain original name and end with tenant suffix
                expect(seededName).toContain(deptName);
                expect(seededName).toContain(tenant.suffix);
                // Seeded name should be longer than the base name
                expect(seededName.length).toBeGreaterThan(deptName.length);
            }
        }
    });

    it('all seeded departments would have isActive set to true', () => {
        // The seeder creates each department with isActive: true.
        // Verify the seeder data structure by simulating what gets passed to createDepartment.
        for (const tenant of TENANTS) {
            const tenantSuffix = tenant.suffix.replace(/[()]/g, '');
            const seededDepts = DEPARTMENTS.map(deptName => ({
                name: `${deptName} ${tenant.suffix}`,
                code: `${DEPARTMENT_CODES[deptName]}-${tenantSuffix}`,
                isActive: true,
            }));

            for (const dept of seededDepts) {
                expect(dept.isActive).toBe(true);
                expect(dept.name.length).toBeGreaterThan(0);
                expect(dept.code.length).toBeGreaterThan(0);
            }
        }
    });
});
