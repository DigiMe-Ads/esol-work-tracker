import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { getSessionToken, setSessionToken } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!getSessionToken());

  // Resume a stored session; drop it if the server no longer accepts it.
  useEffect(() => {
    if (!getSessionToken()) return;
    authApi
      .me()
      .then((u) => {
        if (!u) setSessionToken(null);
        setUser(u);
      })
      .catch(() => setSessionToken(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const u = await authApi.signIn(username, password);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await authApi.signOut().catch(() => setSessionToken(null));
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', signIn, signOut }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
