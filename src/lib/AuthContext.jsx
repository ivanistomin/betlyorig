import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext(null);

function getTelegramInitData() {
  if (typeof window === 'undefined') return null;
  const tg = window.Telegram?.WebApp;
  if (tg?.initData && tg.initData.length > 0) return tg.initData;
  if (import.meta.env.DEV) return 'dev_mode';
  return null;
}

async function authenticateWithTelegram(initData) {
  const res = await fetch('/api/telegramAuth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`telegramAuth failed: ${res.status} ${text}`);
  }
  return res.json();
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tgUserPayload, setTgUserPayload] = useState(null);

  const finishWithSession = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
    setIsAuthenticated(!!data?.user);
    setAuthChecked(true);
    setIsLoadingAuth(false);
  }, []);

  const runTelegramLogin = useCallback(async () => {
    const initData = getTelegramInitData();
    if (!initData) {
      setAuthError({ type: 'auth_required', message: 'Open this app inside Telegram' });
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }
    try {
      const result = await authenticateWithTelegram(initData);
      if (result?.access_token && result?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });
        if (error) throw error;
      }
      if (result?.tg_user) setTgUserPayload(result.tg_user);
      await finishWithSession();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[TG auth] failed', err);
      setAuthError({ type: 'auth_required', message: err.message });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [finishWithSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data?.session) {
        await finishWithSession();
        return;
      }
      await runTelegramLogin();
    })();
    return () => {
      cancelled = true;
    };
  }, [finishWithSession, runTelegramLogin]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const navigateToLogin = useCallback(() => {
    runTelegramLogin();
  }, [runTelegramLogin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        authChecked,
        tgUserPayload,
        logout,
        navigateToLogin,
        checkUserAuth: runTelegramLogin,
        checkAppState: runTelegramLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
