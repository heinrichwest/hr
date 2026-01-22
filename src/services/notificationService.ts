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
} from 'firebase/firestore';
import type { Notification, CreateNotificationData } from '../types/notification';

/** Firestore collection name for notifications */
const COLLECTION_NAME = 'notifications';

export const NotificationService = {
    /**
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
     * Mark all notifications as read for a company or globally
     * @param companyId - Optional company ID to filter by
     */
    async markAllAsRead(companyId?: string): Promise<void> {
        const notificationsRef = collection(db, COLLECTION_NAME);
        let unreadQuery;

        if (companyId) {
            // Get unread for specific company OR global notifications
            unreadQuery = query(
                notificationsRef,
                where('companyId', 'in', [companyId, null]),
                where('isRead', '==', false)
            );
        } else {
            // Get only global unread notifications
            unreadQuery = query(
                notificationsRef,
                where('companyId', '==', null),
                where('isRead', '==', false)
            );
        }

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
     * Create a new notification
     * @param data - The notification data
     * @returns The ID of the created notification
     */
    async createNotification(data: CreateNotificationData): Promise<string> {
        // Generate a new document ID
        const docRef = doc(collection(db, COLLECTION_NAME));

        const notification: Omit<Notification, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
            id: docRef.id,
            type: data.type,
            title: data.title.trim(),
            message: data.message.trim(),
            companyId: data.companyId ?? null,
            isRead: false,
            recipientRole: data.recipientRole ?? null,
            createdAt: serverTimestamp(),
        };

        await setDoc(docRef, notification);

        return docRef.id;
    },
};
