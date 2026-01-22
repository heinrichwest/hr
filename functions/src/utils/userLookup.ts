// ============================================================
// USER LOOKUP UTILITY
// Retrieves user/employee email addresses from Firestore
// ============================================================

import { getFirestore } from 'firebase-admin/firestore';

/**
 * Result of a user email lookup
 */
export interface UserLookupResult {
    /** Whether the user was found */
    found: boolean;
    /** User's email address (if found) */
    email?: string;
    /** User's display name (if found) */
    displayName?: string;
    /** User's ID (if found) */
    userId?: string;
}

/**
 * In-memory cache for user lookups within a single function execution.
 * This prevents multiple Firestore reads for the same user.
 */
const userCache: Map<string, UserLookupResult> = new Map();

/**
 * Clears the user lookup cache.
 * Call this at the start of each function execution if needed.
 */
export function clearUserCache(): void {
    userCache.clear();
}

/**
 * Gets a user's email address by their user ID.
 * Looks up the user in the `users` collection.
 *
 * @param userId - The user's document ID in the users collection
 * @returns Promise<UserLookupResult> - Lookup result with email if found
 *
 * @example
 * ```typescript
 * const result = await getUserEmailByUserId('user-123');
 * if (result.found) {
 *   console.log('Email:', result.email);
 * }
 * ```
 */
export async function getUserEmailByUserId(userId: string): Promise<UserLookupResult> {
    // Check cache first
    const cacheKey = `userId:${userId}`;
    if (userCache.has(cacheKey)) {
        return userCache.get(cacheKey)!;
    }

    const db = getFirestore();

    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            console.warn(`User not found with ID: ${userId}`);
            const result: UserLookupResult = { found: false };
            userCache.set(cacheKey, result);
            return result;
        }

        const userData = userDoc.data();
        const result: UserLookupResult = {
            found: true,
            email: userData?.email,
            displayName: userData?.displayName,
            userId: userDoc.id,
        };

        userCache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error(`Error looking up user by ID ${userId}:`, error);
        return { found: false };
    }
}

/**
 * Gets a user's email address by their employee ID.
 * Queries the `users` collection for a user with matching employeeId and companyId.
 *
 * @param employeeId - The employee ID to look up
 * @param companyId - The company ID for tenant isolation
 * @returns Promise<UserLookupResult> - Lookup result with email if found
 *
 * @example
 * ```typescript
 * const result = await getUserEmailByEmployeeId('emp-456', 'company-123');
 * if (result.found) {
 *   console.log('Email:', result.email);
 * }
 * ```
 */
export async function getUserEmailByEmployeeId(
    employeeId: string,
    companyId: string
): Promise<UserLookupResult> {
    // Check cache first
    const cacheKey = `employeeId:${employeeId}:${companyId}`;
    if (userCache.has(cacheKey)) {
        return userCache.get(cacheKey)!;
    }

    const db = getFirestore();

    try {
        // Query users collection for matching employeeId and companyId
        const usersQuery = db
            .collection('users')
            .where('employeeId', '==', employeeId)
            .where('companyId', '==', companyId)
            .limit(1);

        const snapshot = await usersQuery.get();

        if (snapshot.empty) {
            console.warn(`User not found with employeeId: ${employeeId}, companyId: ${companyId}`);
            const result: UserLookupResult = { found: false };
            userCache.set(cacheKey, result);
            return result;
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const result: UserLookupResult = {
            found: true,
            email: userData?.email,
            displayName: userData?.displayName,
            userId: userDoc.id,
        };

        userCache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error(`Error looking up user by employeeId ${employeeId}:`, error);
        return { found: false };
    }
}

/**
 * Gets a user's email address, trying employeeId first, then userId.
 * Useful when you have both IDs available.
 *
 * @param employeeId - The employee ID to look up
 * @param companyId - The company ID for tenant isolation
 * @param fallbackUserId - Optional user ID to try if employeeId lookup fails
 * @returns Promise<UserLookupResult> - Lookup result with email if found
 */
export async function getUserEmail(
    employeeId: string,
    companyId: string,
    fallbackUserId?: string
): Promise<UserLookupResult> {
    // Try employee ID first
    const employeeResult = await getUserEmailByEmployeeId(employeeId, companyId);
    if (employeeResult.found) {
        return employeeResult;
    }

    // Try user ID as fallback
    if (fallbackUserId) {
        return getUserEmailByUserId(fallbackUserId);
    }

    return { found: false };
}
