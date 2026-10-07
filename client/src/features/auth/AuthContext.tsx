import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../../services/api';
import type { Role, User } from '../../services/types';

interface Ctx {
  user: User | null; loading: boolean; demoMode: boolean;
  login: (email: string, password: string, role: Role) => Promise<User>;
  demoLogin: (role: Role) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}
const AuthContext = createContext<Ctx>(null as unknown as Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const refresh = useCallback(async () => {
    try { setUser((await api.me()).user); } catch { setUser(null); }
  }, []);
  useEffect(() => {
    (async () => {
      await Promise.all([refresh(), api.config().then((c) => setDemoMode(c.demoMode)).catch(() => {})]);
      setLoading(false);
    })();
    const onUnauthorized = () => setUser(null);
    window.addEventListener('sp:unauthorized', onUnauthorized);
    return () => window.removeEventListener('sp:unauthorized', onUnauthorized);
  }, [refresh]);

  const value = useMemo<Ctx>(() => ({
    user, loading, demoMode, refresh,
    login: async (e, p, r) => { const { user } = await api.login(e, p, r); setUser(user); return user; },
    demoLogin: async (r) => { const { user } = await api.demoLogin(r); setUser(user); return user; },
    logout: async () => { try { await api.logout(); } finally { setUser(null); } },
  }), [user, loading, demoMode, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
