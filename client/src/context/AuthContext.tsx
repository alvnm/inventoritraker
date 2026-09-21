import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authApi } from '../api/endpoints';
import { setTokens, clearTokens } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isDM: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const d = await authApi.login({ email, password });
    setTokens(d.accessToken, d.refreshToken);
    setUser(d.user);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, role: string) => {
    const d = await authApi.register({ username, email, password, role });
    setTokens(d.accessToken, d.refreshToken);
    setUser(d.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // noop
    }
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const d = await authApi.me();
      setUser(d.user);
    } catch {
      // noop
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isDM: user?.role === 'DM' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
