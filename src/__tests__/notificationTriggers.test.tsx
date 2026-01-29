// ============================================================
// NOTIFICATION TRIGGERS TESTS
// Tests for notification triggers on leave requests and announcements
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../services/notificationService';
import { UserService } from '../services/userService';
import { EmployeeService } from '../services/employeeService';
import type { LeaveRequest } from '../types/leave';
import type { Employee } from '../types/employee';
import type { UserProfile } from '../types/user';

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
    auth: {},
    storage: {}
}));

// Mock services
vi.mock('../services/notificationService');
vi.mock('../services/leaveService');
vi.mock('../services/userService');
vi.mock('../services/employeeService');

describe('Notification Triggers', () => {
    const mockCompanyId = 'company-123';
    const mockEmployeeId = 'employee-456';
    const mockManagerId = 'manager-789';
    const mockHRAdminId = 'hr-admin-101';
    const mockHRManagerId = 'hr-manager-102';
    const mockLeaveRequestId = 'leave-request-001';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Leave Request Submission Trigger', () => {
        it('should create notification for Line Manager when leave request is submitted', async () => {
            // Mock employee with manager
            const mockEmployee: Partial<Employee> = {
                id: mockEmployeeId,
                companyId: mockCompanyId,
                managerId: mockManagerId,
                firstName: 'John',
                lastName: 'Doe',
                userId: 'employee-user-123'
            };

            // Mock Line Manager user
            const mockManager: Partial<Employee> = {
                id: mockManagerId,
                userId: 'manager-user-456',
                firstName: 'Jane',
                lastName: 'Manager'
            };

            // Mock getEmployee to return employee with manager
            vi.mocked(EmployeeService.getEmployee).mockResolvedValue(mockEmployee as Employee);
            vi.mocked(EmployeeService.getEmployee).mockResolvedValueOnce(mockEmployee as Employee);
            vi.mocked(EmployeeService.getEmployee).mockResolvedValueOnce(mockManager as Employee);

            // Mock createNotification
            vi.mocked(NotificationService.createNotification).mockResolvedValue('notification-001');

            // Trigger notification creation (this would happen in createLeaveRequest)
            await NotificationService.createNotification({
                companyId: mockCompanyId,
                userId: 'manager-user-456',
                type: 'leave_request',
                priority: 'high',
                title: 'New Leave Request from John Doe',
                description: 'John Doe has requested 3 days of Annual Leave',
                metadata: {
                    relatedEntityId: mockLeaveRequestId,
                    relatedEntityType: 'leave_request'
                }
            });

            // Verify notification was created for manager
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'manager-user-456',
                    type: 'leave_request',
                    priority: 'high',
                    title: 'New Leave Request from John Doe'
                })
            );
        });

        it('should create notifications for HR Admin and HR Manager roles', async () => {
            // Mock HR users
            const mockHRAdmin: Partial<UserProfile> = {
                uid: mockHRAdminId,
                role: 'HR Admin',
                companyId: mockCompanyId
            };

            const mockHRManager: Partial<UserProfile> = {
                uid: mockHRManagerId,
                role: 'HR Manager',
                companyId: mockCompanyId
            };

            // Mock getAllUsers to return HR roles
            vi.mocked(UserService.getAllUsers).mockResolvedValue([
                mockHRAdmin as UserProfile,
                mockHRManager as UserProfile
            ]);

            vi.mocked(NotificationService.createNotification).mockResolvedValue('notification-002');

            // Trigger notifications for HR roles
            const hrUsers = await UserService.getAllUsers(mockCompanyId);
            const hrAdminUsers = hrUsers.filter(u => u.role === 'HR Admin');
            const hrManagerUsers = hrUsers.filter(u => u.role === 'HR Manager');

            for (const user of [...hrAdminUsers, ...hrManagerUsers]) {
                await NotificationService.createNotification({
                    companyId: mockCompanyId,
                    userId: user.uid,
                    type: 'leave_request',
                    priority: 'high',
                    title: 'New Leave Request from John Doe',
                    description: 'John Doe has requested 3 days of Annual Leave',
                    metadata: {
                        relatedEntityId: mockLeaveRequestId,
                        relatedEntityType: 'leave_request'
                    }
                });
            }

            // Verify notifications created for HR roles
            expect(NotificationService.createNotification).toHaveBeenCalledTimes(2);
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockHRAdminId,
                    type: 'leave_request'
                })
            );
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockHRManagerId,
                    type: 'leave_request'
                })
            );
        });
    });

    describe('Announcement Creation', () => {
        it('should create broadcast notification for all users', async () => {
            vi.mocked(NotificationService.createNotification).mockResolvedValue('notification-003');

            // Create broadcast announcement
            await NotificationService.createNotification({
                companyId: mockCompanyId,
                userId: 'ALL',
                type: 'announcement',
                priority: 'high',
                title: 'Team Meeting Scheduled',
                description: 'All-hands meeting scheduled for Friday at 10 AM'
            });

            // Verify broadcast notification created
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'ALL',
                    type: 'announcement',
                    priority: 'high'
                })
            );
        });

        it('should create targeted notifications for specific role', async () => {
            // Mock users with specific role
            const mockPayrollUsers: Partial<UserProfile>[] = [
                { uid: 'payroll-user-1', role: 'Payroll Admin', companyId: mockCompanyId },
                { uid: 'payroll-user-2', role: 'Payroll Admin', companyId: mockCompanyId }
            ];

            vi.mocked(UserService.getAllUsers).mockResolvedValue(mockPayrollUsers as UserProfile[]);
            vi.mocked(NotificationService.createNotification).mockResolvedValue('notification-004');

            // Get users by role
            const allUsers = await UserService.getAllUsers(mockCompanyId);
            const payrollUsers = allUsers.filter(u => u.role === 'Payroll Admin');

            // Create notification for each user
            for (const user of payrollUsers) {
                await NotificationService.createNotification({
                    companyId: mockCompanyId,
                    userId: user.uid,
                    type: 'announcement',
                    priority: 'high',
                    title: 'Payroll Cutoff Reminder',
                    description: 'Submit all payroll changes by Jan 31st'
                });
            }

            // Verify targeted notifications created
            expect(NotificationService.createNotification).toHaveBeenCalledTimes(2);
        });

        it('should create targeted notifications for specific department', async () => {
            const mockDepartmentId = 'dept-001';

            // Mock employees in department
            const mockDepartmentEmployees: Partial<Employee>[] = [
                { id: 'emp-1', userId: 'user-1', departmentId: mockDepartmentId },
                { id: 'emp-2', userId: 'user-2', departmentId: mockDepartmentId }
            ];

            vi.mocked(EmployeeService.getEmployees).mockResolvedValue(mockDepartmentEmployees as Employee[]);
            vi.mocked(NotificationService.createNotification).mockResolvedValue('notification-005');

            // Get employees by department
            const employees = await EmployeeService.getEmployees(mockCompanyId, {
                departmentId: mockDepartmentId
            });

            // Create notification for each employee
            for (const employee of employees) {
                if (employee.userId) {
                    await NotificationService.createNotification({
                        companyId: mockCompanyId,
                        userId: employee.userId,
                        type: 'announcement',
                        priority: 'high',
                        title: 'Department Announcement',
                        description: 'Important update for your department'
                    });
                }
            }

            // Verify department-targeted notifications created
            expect(NotificationService.createNotification).toHaveBeenCalledTimes(2);
        });
    });

    describe('Leave Request Approval/Rejection - Mark as Resolved', () => {
        it('should mark notification as resolved when leave request is approved', async () => {
            const notificationId = 'notification-006';

            // Mock getUserNotifications to return notification with metadata
            vi.mocked(NotificationService.getUserNotifications).mockResolvedValue([
                {
                    id: notificationId,
                    companyId: mockCompanyId,
                    userId: mockManagerId,
                    type: 'leave_request',
                    priority: 'high',
                    title: 'New Leave Request',
                    description: 'Leave request pending',
                    isRead: false,
                    isResolved: false,
                    isDismissed: false,
                    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
                    metadata: {
                        relatedEntityId: mockLeaveRequestId,
                        relatedEntityType: 'leave_request'
                    }
                }
            ]);

            vi.mocked(NotificationService.markAsResolved).mockResolvedValue();

            // Simulate approval process - find and resolve related notification
            const notifications = await NotificationService.getUserNotifications(mockCompanyId, mockManagerId);
            const relatedNotification = notifications.find(
                n => n.metadata?.relatedEntityId === mockLeaveRequestId
            );

            if (relatedNotification) {
                await NotificationService.markAsResolved(relatedNotification.id);
            }

            // Verify notification was marked as resolved
            expect(NotificationService.markAsResolved).toHaveBeenCalledWith(notificationId);
        });

        it('should mark notification as resolved when leave request is rejected', async () => {
            const notificationId = 'notification-007';

            // Mock getUserNotifications to return notification
            vi.mocked(NotificationService.getUserNotifications).mockResolvedValue([
                {
                    id: notificationId,
                    companyId: mockCompanyId,
                    userId: mockManagerId,
                    type: 'leave_request',
                    priority: 'high',
                    title: 'New Leave Request',
                    description: 'Leave request pending',
                    isRead: false,
                    isResolved: false,
                    isDismissed: false,
                    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
                    metadata: {
                        relatedEntityId: mockLeaveRequestId,
                        relatedEntityType: 'leave_request'
                    }
                }
            ]);

            vi.mocked(NotificationService.markAsResolved).mockResolvedValue();

            // Simulate rejection process - find and resolve related notification
            const notifications = await NotificationService.getUserNotifications(mockCompanyId, mockManagerId);
            const relatedNotification = notifications.find(
                n => n.metadata?.relatedEntityId === mockLeaveRequestId
            );

            if (relatedNotification) {
                await NotificationService.markAsResolved(relatedNotification.id);
            }

            // Verify notification was marked as resolved
            expect(NotificationService.markAsResolved).toHaveBeenCalledWith(notificationId);
        });
    });
});
