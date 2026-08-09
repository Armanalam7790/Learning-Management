import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { TOKEN_STORAGE_KEY } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [initializing, setInitializing] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const { data } = await authApi.me();
        if (!cancelled) setUser(data.data);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('lms:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('lms:unauthorized', handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    const { user: loggedInUser, token: authToken } = data.data;
    localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    setToken(authToken);
    // The login response only carries a minimal user shape (id, fullName,
    // email, role, institute) — fetch the full profile for phone, avatar, etc.
    try {
      const me = await authApi.me();
      setUser(me.data.data);
      return me.data.data;
    } catch {
      setUser(loggedInUser);
      return loggedInUser;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      initializing,
      login,
      logout,
    }),
    [user, token, initializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
