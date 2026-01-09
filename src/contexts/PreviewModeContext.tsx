// ============================================================
// PREVIEW MODE CONTEXT
// Manages role preview state for System Admin dashboard switching
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserRole } from '../types/user';

interface PreviewModeContextType {
    isPreviewMode: boolean;
    previewRole: UserRole | null;
    setPreviewRole: (role: UserRole) => void;
    exitPreviewMode: () => void;
}

const PreviewModeContext = createContext<PreviewModeContextType>({
    isPreviewMode: false,
    previewRole: null,
    setPreviewRole: () => {},
    exitPreviewMode: () => {},
});

interface PreviewModeProviderProps {
    children: React.ReactNode;
}

export function PreviewModeProvider({ children }: PreviewModeProviderProps) {
    const [previewRole, setPreviewRoleState] = useState<UserRole | null>(null);

    const isPreviewMode = previewRole !== null;

    const setPreviewRole = useCallback((role: UserRole) => {
        // If selecting System Admin, exit preview mode instead
        if (role === 'System Admin') {
            setPreviewRoleState(null);
        } else {
            setPreviewRoleState(role);
        }
    }, []);

    const exitPreviewMode = useCallback(() => {
        setPreviewRoleState(null);
    }, []);

    return (
        <PreviewModeContext.Provider
            value={{
                isPreviewMode,
                previewRole,
                setPreviewRole,
                exitPreviewMode,
            }}
        >
            {children}
        </PreviewModeContext.Provider>
    );
}

export function usePreviewMode() {
    return useContext(PreviewModeContext);
}
