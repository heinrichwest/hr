// ============================================================
// NOTIFICATION SERVICE
// Service for managing system notifications
// ============================================================

import { db } from '../firebase';
import {
    doc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    getCountFromServer,
    writeBatch,
    Timestamp,
    or,
    and,
} from 'firebase/firestore';
import type { Notification, CreateNotificationData } from '../types/notification';

/** Firestore collection name for notifications */
const COLLECTION_NAME = 'notifications';

export const NotificationService = {
    /**
     * Get notifications for a specific user, including broadcast notifications
     * Filters out resolved and dismissed notifications
     * @param companyId - Company ID to filter by (null for System Admin global notifications)
     * @param userId - User ID to get notifications for
     * @returns Array of notifications, sorted by creation date (newest first)
     */
    async getUserNotifications(companyId: string | null, userId: string): Promise<Notification[]> {
        const notificationsRef = collection(db, COLLECTION_NAME);

        // Run two separate queries to avoid complex or() index requirements
        // Query 1: User-specific notifications
        const userQuery = query(
            notificationsRef,
            where('companyId', '==', companyId),
            where('userId', '==', userId),
            where('isResolved', '==', false),
            where('isDismissed', '==', false),
            orderBy('createdAt', 'desc')
        );

        // Query 2: Broadcast notifications (userId: 'ALL')
        const broadcastQuery = query(
            notificationsRef,
            where('companyId', '==', companyId),
            where('userId', '==', 'ALL'),
            where('isResolved', '==', false),
            where('isDismissed', '==', false),
            orderBy('createdAt', 'desc')
        );

        // Execute both queries in parallel
        const [userSnapshot, broadcastSnapshot] = await Promise.all([
            getDocs(userQuery),
            getDocs(broadcastQuery)
        ]);

        // Combine results and sort by createdAt
        const userNotifications = userSnapshot.docs.map(doc => doc.data() as Notification);
        const broadcastNotifications = broadcastSnapshot.docs.map(doc => doc.data() as Notification);

        const allNotifications = [...userNotifications, ...broadcastNotifications];

        // Sort by createdAt descending
        allNotifications.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });

        return allNotifications;
    },

    /**
     * Get count of unread notifications for a specific user
     * @param companyId - Company ID to filter by
     * @param userId - User ID to get unread count for
     * @returns Number of unread notifications
     */
    async getUnreadCount(companyId: string | null, userId: string): Promise<number> {
        const notificationsRef = collection(db, COLLECTION_NAME);

        // Run two separate queries to avoid complex or() index requirements
        // Query 1: User-specific unread notifications
        const userQuery = query(
            notificationsRef,
            where('companyId', '==', companyId),
            where('userId', '==', userId),
            where('isRead', '==', false),
            where('isResolved', '==', false),
            where('isDismissed', '==', false)
        );

        // Query 2: Broadcast unread notifications
        const broadcastQuery = query(
            notificationsRef,
            where('companyId', '==', companyId),
            where('userId', '==', 'ALL'),
            where('isRead', '==', false),
            where('isResolved', '==', false),
            where('isDismissed', '==', false)
        );

        // Execute both count queries in parallel
        const [userCount, broadcastCount] = await Promise.all([
            getCountFromServer(userQuery),
            getCountFromServer(broadcastQuery)
        ]);

        return userCount.data().count + broadcastCount.data().count;
    },

    /**
     * Mark a single notification as read
     * @param notificationId - The notification document ID
     */
    async markAsRead(notificationId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await updateDoc(docRef, {
            isRead: true,
        });
    },

    /**
     * Mark all unread notifications as read for a specific user
     * @param companyId - Company ID to filter by
     * @param userId - User ID to mark notifications for
     */
    async markAllAsRead(companyId: string | null, userId: string): Promise<void> {
        const notificationsRef = collection(db, COLLECTION_NAME);

        const unreadQuery = query(
            notificationsRef,
            and(
                where('companyId', '==', companyId),
                or(
                    where('userId', '==', userId),
                    where('userId', '==', 'ALL')
                ),
                where('isRead', '==', false),
                where('isResolved', '==', false),
                where('isDismissed', '==', false)
            )
        );

        const snapshot = await getDocs(unreadQuery);

        if (snapshot.empty) {
            return;
        }

        // Use batch write for efficiency
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnapshot => {
            batch.update(docSnapshot.ref, { isRead: true });
        });

        await batch.commit();
    },

    /**
     * Mark a notification as resolved when the underlying action is completed
     * @param notificationId - The notification document ID
     */
    async markAsResolved(notificationId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await updateDoc(docRef, {
            isResolved: true,
            resolvedAt: serverTimestamp(),
        });
    },

    /**
     * Dismiss a notification (hide from user view)
     * @param notificationId - The notification document ID
     */
    async dismissNotification(notificationId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, notificationId);
        await updateDoc(docRef, {
            isDismissed: true,
        });
    },

    /**
     * Create a new notification
     * @param data - The notification data
     * @returns The ID of the created notification
     */
    async createNotification(data: CreateNotificationData): Promise<string> {
        // Generate a new document ID
        const docRef = doc(collection(db, COLLECTION_NAME));

        const notification: Omit<Notification, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
            id: docRef.id,
            companyId: data.companyId,
            userId: data.userId,
            type: data.type,
            priority: data.priority,
            title: data.title.trim(),
            description: data.description.trim(),
            isRead: false,
            isResolved: false,
            isDismissed: false,
            createdAt: serverTimestamp(),
            metadata: data.metadata,
        };

        await setDoc(docRef, notification);

        return docRef.id;
    },

    /**
     * Create an announcement notification
     * Broadcasts to all users or targets specific roles/departments
     * @param companyId - Company ID to scope announcement
     * @param title - Announcement title
     * @param description - Announcement description
     * @param recipientType - Type of recipients ('all' | 'role' | 'department')
     * @param recipientValue - Role name or department ID (required if recipientType is not 'all')
     * @returns Array of created notification IDs
     */
    async createAnnouncement(
        companyId: string | null,
        title: string,
        description: string,
        recipientType: 'all' | 'role' | 'department',
        recipientValue?: string
    ): Promise<string[]> {
        const notificationIds: string[] = [];

        if (recipientType === 'all') {
            // Create broadcast notification
            const notificationId = await this.createNotification({
                companyId,
                userId: 'ALL',
                type: 'announcement',
                priority: 'high',
                title,
                description
            });
            notificationIds.push(notificationId);
        } else if (recipientType === 'role' && recipientValue) {
            // Query users by role
            const usersRef = collection(db, 'users');
            const roleQuery = query(
                usersRef,
                where('companyId', '==', companyId),
                where('role', '==', recipientValue)
            );
            const usersSnapshot = await getDocs(roleQuery);

            // Create notification for each user with this role
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const notificationId = await this.createNotification({
                    companyId,
                    userId: userData.uid,
                    type: 'announcement',
                    priority: 'high',
                    title,
                    description
                });
                notificationIds.push(notificationId);
            }
        } else if (recipientType === 'department' && recipientValue) {
            // Query employees by department
            const employeesRef = collection(db, 'employees');
            const deptQuery = query(
                employeesRef,
                where('companyId', '==', companyId),
                where('departmentId', '==', recipientValue)
            );
            const employeesSnapshot = await getDocs(deptQuery);

            // Create notification for each employee in this department
            for (const empDoc of employeesSnapshot.docs) {
                const empData = empDoc.data();
                if (empData.userId) {
                    const notificationId = await this.createNotification({
                        companyId,
                        userId: empData.userId,
                        type: 'announcement',
                        priority: 'high',
                        title,
                        description
                    });
                    notificationIds.push(notificationId);
                }
            }
        }

        return notificationIds;
    },

    // ============================================================
    // LEGACY METHODS (for backward compatibility)
    // These methods should be updated to use new schema in consuming code
    // ============================================================

    /**
     * @deprecated Use getUserNotifications instead
     * Get notifications for a company or global notifications
     * @param companyId - Optional company ID to filter by (null for global only)
     * @returns Array of notifications, sorted by creation date (newest first)
     */
    async getNotifications(companyId?: string): Promise<Notification[]> {
        const notificationsRef = collection(db, COLLECTION_NAME);
        let notificationsQuery;

        if (companyId) {
            // Get notifications for specific company OR global notifications (companyId is null)
            notificationsQuery = query(
                notificationsRef,
                where('companyId', 'in', [companyId, null]),
                orderBy('createdAt', 'desc')
            );
        } else {
            // Get only global notifications when no companyId provided
            notificationsQuery = query(
                notificationsRef,
                where('companyId', '==', null),
                orderBy('createdAt', 'desc')
            );
        }

        const snapshot = await getDocs(notificationsQuery);
        return snapshot.docs.map(doc => doc.data() as Notification);
    },

    /**
     * @deprecated Use getUnreadCount instead
     * Get count of unread notifications for a company or globally
     * @param companyId - Optional company ID to filter by
     * @returns Number of unread notifications
     */
    async getUnreadNotificationsCount(companyId?: string): Promise<number> {
        const notificationsRef = collection(db, COLLECTION_NAME);
        let countQuery;

        if (companyId) {
            // Count unread for specific company OR global notifications
            countQuery = query(
                notificationsRef,
                where('companyId', 'in', [companyId, null]),
                where('isRead', '==', false)
            );
        } else {
            // Count only global unread notifications
            countQuery = query(
                notificationsRef,
                where('companyId', '==', null),
                where('isRead', '==', false)
            );
        }

        const snapshot = await getCountFromServer(countQuery);
        return snapshot.data().count;
    },

    // ============================================================
    // DEMO DATA SEEDING
    // ============================================================

    /**
     * Seed demo notifications for testing the Notifications page
     * Creates various notification types with different priorities and read states
     * @param companyId - Company ID to seed notifications for (null for System Admin)
     * @param userId - User ID to seed notifications for
     * @returns Array of created notification IDs
     */
    async seedDemoNotifications(companyId: string | null, userId: string): Promise<string[]> {
        const notificationIds: string[] = [];
        const now = new Date();

        // Demo notification data with variety of types, priorities, and ages
        const demoNotifications: Array<{
            type: CreateNotificationData['type'];
            priority: CreateNotificationData['priority'];
            title: string;
            description: string;
            isRead: boolean;
            daysAgo: number;
        }> = [
            // High priority - Unread
            {
                type: 'leave_request',
                priority: 'high',
                title: 'New Leave Request from Sarah Johnson',
                description: 'Sarah Johnson has requested 5 days of Annual Leave from 3 Feb to 7 Feb 2026.',
                isRead: false,
                daysAgo: 0,
            },
            {
                type: 'leave_request',
                priority: 'high',
                title: 'Urgent: Leave Request Requires Approval',
                description: 'Michael Ndlovu has requested emergency Family Responsibility Leave starting tomorrow.',
                isRead: false,
                daysAgo: 0,
            },
            // Medium priority - Unread
            {
                type: 'announcement',
                priority: 'medium',
                title: 'Company Meeting Scheduled',
                description: 'All-hands meeting scheduled for Friday 31 Jan at 10:00 AM in the main boardroom.',
                isRead: false,
                daysAgo: 1,
            },
            {
                type: 'payroll_cutoff',
                priority: 'medium',
                title: 'Payroll Cutoff Reminder',
                description: 'Please submit all payroll changes by 28 Jan 2026. Late submissions may delay salary payments.',
                isRead: false,
                daysAgo: 2,
            },
            {
                type: 'performance',
                priority: 'medium',
                title: 'Performance Review Due',
                description: 'Q4 2025 performance reviews are due by 15 Feb 2026. Please complete all pending reviews.',
                isRead: false,
                daysAgo: 3,
            },
            // Low priority - Unread
            {
                type: 'training',
                priority: 'low',
                title: 'New Training Course Available',
                description: 'A new compliance training course "Workplace Safety 2026" is now available in the learning portal.',
                isRead: false,
                daysAgo: 4,
            },
            {
                type: 'announcement',
                priority: 'low',
                title: 'Office Closure Notice',
                description: 'The office will be closed on 21 March 2026 for Human Rights Day public holiday.',
                isRead: false,
                daysAgo: 5,
            },
            // Read notifications
            {
                type: 'leave_request',
                priority: 'high',
                title: 'Leave Request Approved',
                description: 'Your Annual Leave request for 20-24 Jan 2026 has been approved by your manager.',
                isRead: true,
                daysAgo: 7,
            },
            {
                type: 'attendance',
                priority: 'medium',
                title: 'Attendance Reminder',
                description: 'Please remember to clock in and out daily using the attendance system.',
                isRead: true,
                daysAgo: 10,
            },
            {
                type: 'announcement',
                priority: 'low',
                title: 'Welcome New Team Members',
                description: 'Please welcome Thabo Mokoena and Lerato Dlamini who joined the Engineering team this week.',
                isRead: true,
                daysAgo: 14,
            },
            // Additional variety for pagination testing
            {
                type: 'performance',
                priority: 'high',
                title: 'Probation Review Required',
                description: 'Employee probation period ends in 7 days. Please schedule the final review meeting.',
                isRead: false,
                daysAgo: 1,
            },
            {
                type: 'training',
                priority: 'medium',
                title: 'Training Certificate Expiring',
                description: 'Your First Aid certification expires on 28 Feb 2026. Please renew before expiry.',
                isRead: false,
                daysAgo: 6,
            },
        ];

        // Create each notification
        for (const notif of demoNotifications) {
            const createdAt = new Date(now.getTime() - notif.daysAgo * 24 * 60 * 60 * 1000);
            const notificationId = crypto.randomUUID();

            const notificationDoc: Notification = {
                id: notificationId,
                companyId,
                userId,
                type: notif.type,
                priority: notif.priority,
                title: notif.title,
                description: notif.description,
                isRead: notif.isRead,
                isResolved: false,
                isDismissed: false,
                createdAt: Timestamp.fromDate(createdAt),
            };

            const docRef = doc(db, COLLECTION_NAME, notificationId);
            await setDoc(docRef, notificationDoc);
            notificationIds.push(notificationId);
        }

        return notificationIds;
    },

    /**
     * Clear all demo notifications for a user
     * @param companyId - Company ID to clear notifications for
     * @param userId - User ID to clear notifications for
     */
    async clearDemoNotifications(companyId: string | null, userId: string): Promise<void> {
        const notificationsRef = collection(db, COLLECTION_NAME);
        const notificationsQuery = query(
            notificationsRef,
            where('companyId', '==', companyId),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(notificationsQuery);
        const batch = writeBatch(db);

        for (const docSnap of snapshot.docs) {
            batch.delete(docSnap.ref);
        }

        await batch.commit();
    },
};
