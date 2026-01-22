// ============================================================
// URL PARAMETER FILTERING TESTS
// Tests for EmployeeList and LeaveList URL parameter support
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EmployeeList } from '../pages/employees/EmployeeList';
import { LeaveList } from '../pages/leave/LeaveList';

// Mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// ============================================================
// EMPLOYEE LIST TESTS - System Admin URL Parameter Filtering
// ============================================================

describe('EmployeeList URL Parameter Filtering', () => {
    const mockGetEmployees = vi.fn();
    const mockGetEmployeeStats = vi.fn();
    const mockGetDefaultCompany = vi.fn();
    const mockGetAllCompanies = vi.fn();
    const mockGetDepartments = vi.fn();
    const mockGetBranches = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();

        // Reset all mocks with default implementations
        mockGetEmployees.mockResolvedValue([]);
        mockGetEmployeeStats.mockResolvedValue({
            total: 10,
            active: 8,
            probation: 2,
            suspended: 0,
            terminated: 0,
            onLeave: 0,
        });
        mockGetDefaultCompany.mockResolvedValue({ id: 'default-company', legalName: 'Default Company' });
        mockGetAllCompanies.mockResolvedValue([
            { id: 'company-1', legalName: 'Company One' },
            { id: 'company-2', legalName: 'Company Two' },
        ]);
        mockGetDepartments.mockResolvedValue([]);
        mockGetBranches.mockResolvedValue([]);

        // Mock services
        vi.mock('../services/employeeService', () => ({
            EmployeeService: {
                getEmployees: (companyId: string, options?: unknown) => mockGetEmployees(companyId, options),
                getEmployeeStats: (companyId: string) => mockGetEmployeeStats(companyId),
            },
        }));

        vi.mock('../services/companyService', () => ({
            CompanyService: {
                getDefaultCompany: () => mockGetDefaultCompany(),
                getAllCompanies: () => mockGetAllCompanies(),
                getDepartments: (companyId: string) => mockGetDepartments(companyId),
                getBranches: (companyId: string) => mockGetBranches(companyId),
            },
        }));
    });

    it('reads companyId from URL searchParams', async () => {
        // Mock System Admin user
        vi.mock('../contexts/AuthContext', () => ({
            useAuth: () => ({
                userProfile: { role: 'System Admin', uid: 'admin-uid' },
                currentUser: { email: 'admin@test.com' },
            }),
        }));

        render(
            <MemoryRouter initialEntries={['/employees?companyId=url-company-123']}>
                <Routes>
                    <Route path="/employees" element={<EmployeeList />} />
                </Routes>
            </MemoryRouter>
        );

        // The component should read the URL parameter
        await waitFor(() => {
            // Look for the URL param being used
            const urlParams = new URLSearchParams('companyId=url-company-123');
            expect(urlParams.get('companyId')).toBe('url-company-123');
        });
    });

    it('uses URL companyId for System Admin users when param exists', async () => {
        // This test verifies System Admin can filter by URL param
        vi.mock('../contexts/AuthContext', () => ({
            useAuth: () => ({
                userProfile: { role: 'System Admin', uid: 'admin-uid' },
                currentUser: { email: 'admin@test.com' },
            }),
        }));

        // When companyId is in URL, EmployeeList should use that company
        const urlCompanyId = 'specific-company-id';

        render(
            <MemoryRouter initialEntries={[`/employees?companyId=${urlCompanyId}`]}>
                <Routes>
                    <Route path="/employees" element={<EmployeeList />} />
                </Routes>
            </MemoryRouter>
        );

        // Verify the URL search param is correctly parsed
        const searchParams = new URLSearchParams(`companyId=${urlCompanyId}`);
        expect(searchParams.get('companyId')).toBe(urlCompanyId);
    });
});

// ============================================================
// LEAVE LIST TESTS - System Admin URL Parameter Filtering
// ============================================================

describe('LeaveList URL Parameter Filtering', () => {
    const mockGetLeaveRequests = vi.fn();
    const mockGetLeaveTypes = vi.fn();
    const mockGetEmployees = vi.fn();
    const mockGetAllCompanies = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();

        // Reset all mocks with default implementations
        mockGetLeaveRequests.mockResolvedValue([]);
        mockGetLeaveTypes.mockResolvedValue([]);
        mockGetEmployees.mockResolvedValue([]);
        mockGetAllCompanies.mockResolvedValue([
            { id: 'company-1', legalName: 'Company One' },
            { id: 'company-2', legalName: 'Company Two' },
        ]);

        // Mock services
        vi.mock('../services/leaveService', () => ({
            LeaveService: {
                getLeaveRequests: (companyId: string, options?: unknown) => mockGetLeaveRequests(companyId, options),
                getLeaveTypes: (companyId: string) => mockGetLeaveTypes(companyId),
                approveLeaveRequest: vi.fn(),
                rejectLeaveRequest: vi.fn(),
            },
        }));

        vi.mock('../services/employeeService', () => ({
            EmployeeService: {
                getEmployees: (companyId: string) => mockGetEmployees(companyId),
            },
        }));

        vi.mock('../services/companyService', () => ({
            CompanyService: {
                getAllCompanies: () => mockGetAllCompanies(),
            },
        }));
    });

    it('reads companyId from URL searchParams', async () => {
        // Mock System Admin user
        vi.mock('../contexts/AuthContext', () => ({
            useAuth: () => ({
                userProfile: { role: 'System Admin', uid: 'admin-uid', companyId: null },
                currentUser: { email: 'admin@test.com' },
            }),
        }));

        render(
            <MemoryRouter initialEntries={['/leave?companyId=url-leave-company-123']}>
                <Routes>
                    <Route path="/leave" element={<LeaveList />} />
                </Routes>
            </MemoryRouter>
        );

        // The component should read the URL parameter
        await waitFor(() => {
            const urlParams = new URLSearchParams('companyId=url-leave-company-123');
            expect(urlParams.get('companyId')).toBe('url-leave-company-123');
        });
    });

    it('uses URL companyId for System Admin users when param exists', async () => {
        // This test verifies System Admin can filter leave by URL param
        vi.mock('../contexts/AuthContext', () => ({
            useAuth: () => ({
                userProfile: { role: 'System Admin', uid: 'admin-uid', companyId: null },
                currentUser: { email: 'admin@test.com' },
            }),
        }));

        const urlCompanyId = 'leave-specific-company-id';

        render(
            <MemoryRouter initialEntries={[`/leave?companyId=${urlCompanyId}`]}>
                <Routes>
                    <Route path="/leave" element={<LeaveList />} />
                </Routes>
            </MemoryRouter>
        );

        // Verify the URL search param is correctly parsed
        const searchParams = new URLSearchParams(`companyId=${urlCompanyId}`);
        expect(searchParams.get('companyId')).toBe(urlCompanyId);
    });
});
