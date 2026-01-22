import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { UserService } from "../services/userService";
import { AccessRequestService } from "../services/accessRequestService";
import type { UserProfile } from "../types/user";

/**
 * Access request status type for login flow handling
 * - 'none': No access request exists or request is approved (allow normal login)
 * - 'pending': Access request is pending review
 * - 'rejected': Access request was rejected
 * - null: Status has not been checked yet
 */
export type AccessRequestStatusType = 'none' | 'pending' | 'rejected' | null;

/**
 * Utility function to check access request status by email
 * This can be used before/during login to determine appropriate flow
 * @param email - Email address to check
 * @returns The access request status
 */
export async function checkAccessRequestStatus(email: string): Promise<AccessRequestStatusType> {
    try {
        const accessRequest = await AccessRequestService.getAccessRequestByEmail(email);

        if (!accessRequest) {
            // No access request exists - allow normal login attempt
            return 'none';
        }

        switch (accessRequest.status) {
            case 'pending':
                return 'pending';
            case 'rejected':
                return 'rejected';
            case 'approved':
                // Approved users can log in normally
                return 'none';
            default:
                return 'none';
        }
    } catch (error) {
        console.error('Error checking access request status:', error);
        // On error, allow login attempt to proceed
        return 'none';
    }
}

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    accessRequestStatus: AccessRequestStatusType;
    checkAccessRequestStatus: (email: string) => Promise<AccessRequestStatusType>;
    setAccessRequestStatus: (status: AccessRequestStatusType) => void;
    clearAccessRequestStatus: () => void;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    userProfile: null,
    loading: true,
    accessRequestStatus: null,
    checkAccessRequestStatus: async () => 'none',
    setAccessRequestStatus: () => {},
    clearAccessRequestStatus: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessRequestStatus, setAccessRequestStatusState] = useState<AccessRequestStatusType>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user && user.email) {
                // Fetch or Create Profile
                try {
                    const profile = await UserService.syncUserRoleOnLogin(
                        user.uid,
                        user.email,
                        user.displayName
                    );
                    setUserProfile(profile);
                } catch (e) {
                    console.error("Error fetching user profile", e);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    /**
     * Check access request status for a given email
     * Updates the context state with the result
     */
    const handleCheckAccessRequestStatus = useCallback(async (email: string): Promise<AccessRequestStatusType> => {
        const status = await checkAccessRequestStatus(email);
        setAccessRequestStatusState(status);
        return status;
    }, []);

    /**
     * Manually set the access request status
     * Useful when status is already known (e.g., from login flow check)
     */
    const setAccessRequestStatus = useCallback((status: AccessRequestStatusType) => {
        setAccessRequestStatusState(status);
    }, []);

    /**
     * Clear the access request status (reset to null)
     * Useful when returning to login page or logging out
     */
    const clearAccessRequestStatus = useCallback(() => {
        setAccessRequestStatusState(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            currentUser,
            userProfile,
            loading,
            accessRequestStatus,
            checkAccessRequestStatus: handleCheckAccessRequestStatus,
            setAccessRequestStatus,
            clearAccessRequestStatus,
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
