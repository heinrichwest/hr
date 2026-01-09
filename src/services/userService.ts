import { db } from "../firebase";
import { doc, getDoc, setDoc, writeBatch, serverTimestamp, collection, getDocs, updateDoc, query, where } from "firebase/firestore";
import type { UserProfile, UserRole, RoleDefinition, Permission } from "../types/user";
import { ROLE_PERMISSIONS } from "../types/user";

export const UserService = {
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    },

    async createUserProfile(uid: string, email: string, role: UserRole, companyId?: string): Promise<void> {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            const userProfile: Partial<UserProfile> = {
                uid,
                email,
                role,
                companyId,
                isActive: true,
                createdAt: new Date(),
            };
            await setDoc(userRef, {
                ...userProfile,
                createdAt: serverTimestamp()
            });
        }
    },

    async getAllUsers(companyId?: string): Promise<UserProfile[]> {
        const usersRef = collection(db, "users");
        if (companyId) {
            const q = query(usersRef, where("companyId", "==", companyId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as UserProfile);
        } else {
            const querySnapshot = await getDocs(usersRef);
            return querySnapshot.docs.map(doc => doc.data() as UserProfile);
        }
    },

    async updateUserRole(uid: string, newRole: UserRole): Promise<void> {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            role: newRole,
            updatedAt: serverTimestamp()
        });
    },

    async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async assignUserToCompany(uid: string, companyId: string): Promise<void> {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            companyId: companyId,
            updatedAt: serverTimestamp()
        });
    },

    async getRoles(): Promise<RoleDefinition[]> {
        const querySnapshot = await getDocs(collection(db, "roles"));
        return querySnapshot.docs.map(doc => doc.data() as RoleDefinition);
    },

    /**
     * Get all available roles with their permissions
     */
    getAllRoleDefinitions(): { role: UserRole; permissions: Permission[] }[] {
        return (Object.keys(ROLE_PERMISSIONS) as UserRole[]).map(role => ({
            role,
            permissions: ROLE_PERMISSIONS[role]
        }));
    },

    /**
     * Check if a user has a specific permission
     */
    hasPermission(userProfile: UserProfile | null, permission: Permission): boolean {
        if (!userProfile) return false;
        return ROLE_PERMISSIONS[userProfile.role]?.includes(permission) ?? false;
    },

    /**
     * Check if a user has any of the specified permissions
     */
    hasAnyPermission(userProfile: UserProfile | null, permissions: Permission[]): boolean {
        if (!userProfile) return false;
        const userPermissions = ROLE_PERMISSIONS[userProfile.role] ?? [];
        return permissions.some(p => userPermissions.includes(p));
    },

    /**
     * Check if a user has all of the specified permissions
     */
    hasAllPermissions(userProfile: UserProfile | null, permissions: Permission[]): boolean {
        if (!userProfile) return false;
        const userPermissions = ROLE_PERMISSIONS[userProfile.role] ?? [];
        return permissions.every(p => userPermissions.includes(p));
    },

    /**
     * Get user's permissions
     */
    getUserPermissions(userProfile: UserProfile | null): Permission[] {
        if (!userProfile) return [];
        return ROLE_PERMISSIONS[userProfile.role] ?? [];
    },

    /**
     * Seeding function to initialize roles and default users.
     */
    async initializeSystem(): Promise<void> {
        const batch = writeBatch(db);

        // Define all roles with their permissions
        const roles: Omit<RoleDefinition, 'createdAt' | 'updatedAt'>[] = [
            {
                id: 'system_admin',
                name: 'System Admin',
                description: 'Full system access - manages environments, integrations, system-wide settings',
                permissions: ROLE_PERMISSIONS['System Admin'],
                isSystem: true
            },
            {
                id: 'hr_admin',
                name: 'HR Admin',
                description: 'Employee profiles, contracts, onboarding, documents, leave policy application',
                permissions: ROLE_PERMISSIONS['HR Admin'],
                isSystem: true
            },
            {
                id: 'hr_manager',
                name: 'HR Manager',
                description: 'Approves sensitive HR changes, oversees HR reporting',
                permissions: ROLE_PERMISSIONS['HR Manager'],
                isSystem: true
            },
            {
                id: 'payroll_admin',
                name: 'Payroll Admin',
                description: 'Captures payroll inputs, adjustments, runs calculations',
                permissions: ROLE_PERMISSIONS['Payroll Admin'],
                isSystem: true
            },
            {
                id: 'payroll_manager',
                name: 'Payroll Manager',
                description: 'Approves/finalises pay runs, controls periods, statutory outputs',
                permissions: ROLE_PERMISSIONS['Payroll Manager'],
                isSystem: true
            },
            {
                id: 'finance_approver',
                name: 'Finance Approver',
                description: 'Second-approval on payroll, reviews totals/variances, GL journals',
                permissions: ROLE_PERMISSIONS['Finance Approver'],
                isSystem: true
            },
            {
                id: 'finance_readonly',
                name: 'Finance Read-Only',
                description: 'View payroll reports and journals only',
                permissions: ROLE_PERMISSIONS['Finance Read-Only'],
                isSystem: true
            },
            {
                id: 'line_manager',
                name: 'Line Manager',
                description: 'Approves leave/time, initiates IR incidents, views team only',
                permissions: ROLE_PERMISSIONS['Line Manager'],
                isSystem: true
            },
            {
                id: 'ir_officer',
                name: 'IR Officer',
                description: 'Creates/manages IR cases, evidence, hearings, letters',
                permissions: ROLE_PERMISSIONS['IR Officer'],
                isSystem: true
            },
            {
                id: 'ir_manager',
                name: 'IR Manager',
                description: 'Oversight, approvals for sanctions, access to all IR dashboards',
                permissions: ROLE_PERMISSIONS['IR Manager'],
                isSystem: true
            },
            {
                id: 'employee',
                name: 'Employee',
                description: 'ESS: leave requests, view payslips, update limited personal info',
                permissions: ROLE_PERMISSIONS['Employee'],
                isSystem: true
            }
        ];

        // Add roles to batch
        roles.forEach(role => {
            const roleRef = doc(db, "roles", role.id);
            batch.set(roleRef, {
                ...role,
                createdAt: serverTimestamp()
            });
        });

        // Seed users
        const seedUsers = [
            { email: 'hein@speccon.co.za', role: 'System Admin' as UserRole },
            { email: 'lynne@speccon.co.za', role: 'HR Manager' as UserRole }
        ];

        seedUsers.forEach(user => {
            const setupRef = doc(db, "user_setup", user.email);
            batch.set(setupRef, {
                email: user.email,
                role: user.role,
                assigned: false
            });
        });

        await batch.commit();

        // Update existing users with their correct roles
        const usersSnapshot = await getDocs(collection(db, "users"));
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data() as UserProfile;
            const seedUser = seedUsers.find(s => s.email.toLowerCase() === userData.email.toLowerCase());
            if (seedUser && userData.role !== seedUser.role) {
                await updateDoc(doc(db, "users", userDoc.id), {
                    role: seedUser.role,
                    updatedAt: serverTimestamp()
                });
                console.log(`Updated ${userData.email} role to ${seedUser.role}`);
            }
        }

        console.log("System initialized with expanded Roles and User Setup entries.");
    },

    async syncUserRoleOnLogin(uid: string, email: string, firebaseDisplayName?: string | null): Promise<UserProfile | null> {
        const profile = await this.getUserProfile(uid);
        if (profile) {
            // Update last login and displayName if missing
            const updates: Record<string, unknown> = {
                lastLogin: serverTimestamp()
            };

            // If displayName is missing, try to set it from Firebase Auth or email
            if (!profile.displayName) {
                if (firebaseDisplayName) {
                    updates.displayName = firebaseDisplayName;
                } else {
                    // Derive from email: john.smith@company.com -> John Smith
                    const namePart = email.split('@')[0];
                    const displayName = namePart
                        .split(/[._-]/)
                        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                        .join(' ');
                    updates.displayName = displayName;
                }
            }

            await updateDoc(doc(db, "users", uid), updates);

            // Return updated profile
            return await this.getUserProfile(uid);
        }

        const setupRef = doc(db, "user_setup", email);
        const setupSnap = await getDoc(setupRef);

        let role: UserRole = 'Employee';
        let companyId: string | undefined = undefined;

        if (setupSnap.exists()) {
            const data = setupSnap.data();
            role = data.role as UserRole;
            companyId = data.companyId || undefined;
        }

        await this.createUserProfile(uid, email, role, companyId);

        // Set displayName for new user
        const displayName = firebaseDisplayName || email.split('@')[0]
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
        await this.updateUserProfile(uid, { displayName });

        return await this.getUserProfile(uid);
    }
};
