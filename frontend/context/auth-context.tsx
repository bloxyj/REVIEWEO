import { logout as logoutRequest } from '@/lib/api';
import type { AuthPayload, AuthUser } from '@/lib/types';
import { createContext, useContext, useState } from 'react';

type Session = {
    token: string;
    user: AuthUser;
};

type AuthContextValue = {
    session: Session | null;
    isAdmin: boolean;
    setSession: (payload: AuthPayload) => void;
    clearSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
    children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [session, setSessionState] = useState<Session | null>(null);

    const setSession = (payload: AuthPayload) => {
        setSessionState({ token: payload.token, user: payload.user });
    };

    const clearSession = async () => {
        const token = session?.token;
        if (token) {
        try {
            await logoutRequest(token);
        } catch {
            // Logout API failures should not block local session cleanup.
        }
        }

        setSessionState(null);
    };

    const value: AuthContextValue = {
        session,
        isAdmin: session?.user.role === 'admin',
        setSession,
        clearSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider.');
    }

    return context;
}
