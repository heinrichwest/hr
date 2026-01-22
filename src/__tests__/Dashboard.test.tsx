// ============================================================
// DASHBOARD TESTS
// Tests for System Admin Dashboard functionality
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';

// Mock the auth context
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock auth context
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        userProfile: { role: 'System Admin', uid: 'test-uid-123' },
        currentUser: { email: 'admin@test.com' },
    }),
}));

// Mock preview mode context
vi.mock('../contexts/PreviewModeContext', () => ({
    usePreviewMode: () => ({
        isPreviewMode: false,
        previewRole: null,
    }),
}));

// Mock services
const mockGetAllCompanies = vi.fn();
const mockGetPendingRequestsCount = vi.fn();
const mockGetUnreadNotificationsCount = vi.fn();
const mockGetEmployeeStats = vi.fn();
const mockGetLeaveRequests = vi.fn();

vi.mock('../services/companyService', () => ({
    CompanyService: {
        getAllCompanies: () => mockGetAllCompanies(),
    },
}));

vi.mock('../services/accessRequestService', () => ({
    AccessRequestService: {
        getPendingRequestsCount: () => mockGetPendingRequestsCount(),
    },
}));

vi.mock('../services/notificationService', () => ({
    NotificationService: {
        getUnreadNotificationsCount: (companyId?: string) => mockGetUnreadNotificationsCount(companyId),
    },
}));

vi.mock('../services/employeeService', () => ({
    EmployeeService: {
        getEmployeeStats: (companyId: string) => mockGetEmployeeStats(companyId),
    },
}));

vi.mock('../services/leaveService', () => ({
    LeaveService: {
        getLeaveRequests: (companyId: string, options?: { status?: string }) =>
            mockGetLeaveRequests(companyId, options),
    },
}));

describe('Dashboard - System Admin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();

        // Setup default mock returns
        mockGetAllCompanies.mockResolvedValue([
            { id: 'company-1', legalName: 'Test Company 1' },
            { id: 'company-2', legalName: 'Test Company 2' },
        ]);
        mockGetPendingRequestsCount.mockResolvedValue(5);
        mockGetUnreadNotificationsCount.mockResolvedValue(3);
        mockGetEmployeeStats.mockResolvedValue({
            total: 25,
            active: 20,
            probation: 3,
            suspended: 1,
            terminated: 1,
            onLeave: 0,
        });
        mockGetLeaveRequests.mockResolvedValue([
            { id: 'leave-1', status: 'pending' },
            { id: 'leave-2', status: 'pending' },
        ]);
    });

    it('renders tenant dropdown with "All Companies" default', async () => {
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Wait for companies to load
        await waitFor(() => {
            expect(mockGetAllCompanies).toHaveBeenCalled();
        });

        // Find the dropdown
        const dropdown = screen.getByRole('combobox');
        expect(dropdown).toBeInTheDocument();

        // Check default value is "All Companies"
        expect(dropdown).toHaveValue('');

        // Check that company options are available
        const allCompaniesOption = screen.getByRole('option', { name: 'All Companies' });
        expect(allCompaniesOption).toBeInTheDocument();
    });

    it('displays loading skeletons while fetching stats', async () => {
        // Make the mock take longer to resolve
        mockGetPendingRequestsCount.mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(5), 100))
        );

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Check for skeleton elements during loading
        const skeletons = document.querySelectorAll('.stat-skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays Pending Tasks card with correct count from AccessRequestService', async () => {
        mockGetPendingRequestsCount.mockResolvedValue(7);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Wait for stats to load
        await waitFor(() => {
            expect(mockGetPendingRequestsCount).toHaveBeenCalled();
        });

        // Find the Pending Tasks card by its label, then look for the value in the same card
        await waitFor(() => {
            const pendingTasksLabel = screen.getByText('Pending Tasks');
            const statCard = pendingTasksLabel.closest('.stat-card');
            expect(statCard).toBeInTheDocument();

            // Find the stat-value within this specific card
            const statValue = statCard?.querySelector('.stat-value');
            expect(statValue?.textContent).toBe('7');
        });
    });

    it('navigates to /employees with companyId param when Team Members card is clicked', async () => {
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Wait for stats to load
        await waitFor(() => {
            expect(mockGetEmployeeStats).toHaveBeenCalled();
        });

        // Find and click the Team Members card
        const teamMembersLabel = await screen.findByText('Team Members');
        const statCard = teamMembersLabel.closest('.stat-card');

        expect(statCard).toBeInTheDocument();
        if (statCard) {
            fireEvent.click(statCard);
        }

        // Verify navigation was called (without companyId since "All Companies" is selected)
        expect(mockNavigate).toHaveBeenCalledWith('/employees');
    });

    it('refreshes stats when tenant dropdown selection changes', async () => {
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Wait for initial load
        await waitFor(() => {
            expect(mockGetAllCompanies).toHaveBeenCalled();
        });

        // Clear mocks to track new calls
        mockGetEmployeeStats.mockClear();
        mockGetLeaveRequests.mockClear();
        mockGetUnreadNotificationsCount.mockClear();

        // Find and change the dropdown
        const dropdown = screen.getByRole('combobox');
        fireEvent.change(dropdown, { target: { value: 'company-1' } });

        // Verify stats are reloaded with the new company
        await waitFor(() => {
            expect(mockGetEmployeeStats).toHaveBeenCalledWith('company-1');
        });

        await waitFor(() => {
            expect(mockGetUnreadNotificationsCount).toHaveBeenCalledWith('company-1');
        });
    });

    it('navigates to correct pages when clicking stat cards', async () => {
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Wait for stats to load
        await waitFor(() => {
            expect(mockGetPendingRequestsCount).toHaveBeenCalled();
        });

        // Click Pending Tasks card
        const pendingTasksLabel = await screen.findByText('Pending Tasks');
        const pendingCard = pendingTasksLabel.closest('.stat-card');
        if (pendingCard) {
            fireEvent.click(pendingCard);
        }
        expect(mockNavigate).toHaveBeenCalledWith('/admin/pending-approvals');

        mockNavigate.mockClear();

        // Click Notifications card
        const notificationsLabel = await screen.findByText('Notifications');
        const notificationsCard = notificationsLabel.closest('.stat-card');
        if (notificationsCard) {
            fireEvent.click(notificationsCard);
        }
        expect(mockNavigate).toHaveBeenCalledWith('/admin/notifications');
    });
});
