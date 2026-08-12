'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from '@/shared/api/api-client';
import { AuthLogoutData } from '@/shared/auth/AuthLogoutData';
import { tokenStore } from '@/shared/auth/token-store';
import type { AuthMe, AuthSession, AuthTenant, AuthUser } from '@/shared/auth/AuthTypes';

type AuthContextValue = {
  ready: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  tenant: AuthTenant | null;
  me: AuthMe | null;
  applySession: (session: AuthSession) => void;
  refreshSession: () => Promise<boolean>;
  loadMe: () => Promise<AuthMe | null>;
  clearSession: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<AuthTenant | null>(null);
  const [me, setMe] = useState<AuthMe | null>(null);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setTenant(null);
    setMe(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthLogoutData();
    } catch {
      // limpa sessão local mesmo se o cookie já expirou
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const applySession = useCallback((session: AuthSession) => {
    tokenStore.setAccessToken(session.accessToken);
    tokenStore.setTenantId(session.tenant.id);
    setUser(session.user);
    setTenant(session.tenant);
  }, []);

  const loadMe = useCallback(async () => {
    if (!tokenStore.getAccessToken()) return null;
    const result = await apiClient.request<AuthMe>('/auth/me');
    setMe(result);
    setUser(result.user);
    const currentTenant =
      result.memberships.find((m) => m.tenantId === result.current.tenantId)?.tenant ?? null;
    if (currentTenant) {
      tokenStore.setTenantId(currentTenant.id);
      setTenant(currentTenant);
    }
    return result;
  }, []);

  const refreshSession = useCallback(async () => {
    const token = await apiClient.refresh();
    if (!token) {
      clearSession();
      return false;
    }
    try {
      await loadMe();
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [clearSession, loadMe]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (tokenStore.getAccessToken()) {
        try {
          await loadMe();
        } catch {
          if (!cancelled) await refreshSession();
        }
      } else {
        await refreshSession();
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // bootstrap da sessão uma vez no mount
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      isAuthenticated: Boolean(user && tokenStore.getAccessToken()),
      user,
      tenant,
      me,
      applySession,
      refreshSession,
      loadMe,
      clearSession,
      logout,
    }),
    [ready, user, tenant, me, applySession, refreshSession, loadMe, clearSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return ctx;
}
