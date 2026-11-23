import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { AppConfig, UserProfile } from '../types';
import { fetchAppConfig, getSupabaseClient } from '../lib/supabase';

interface AuthContextValue {
  config: AppConfig | null;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  config: null,
  session: null,
  user: null,
  profile: null,
  loading: true,
  authError: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadUserProfile = useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.user) {
      setProfile(null);
      setAuthError(null);
      return;
    }

    const supabase = await getSupabaseClient();
    if (!supabase) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', activeSession.user.id)
      .maybeSingle();

    if (data) {
      if (!data.is_active) {
        setAuthError('Akun Anda sedang dinonaktifkan oleh Administrator.');
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
        setUser(null);
        return;
      }
      setProfile(data as UserProfile);
      setAuthError(null);
      return;
    }

    // Attempt server-side profile sync if trigger wasn't executed before user creation
    try {
      const res = await fetch('/api/auth/ensure-profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeSession.access_token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.profile) {
          setProfile(json.profile as UserProfile);
          setAuthError(null);
          return;
        }
      }
    } catch {
      // Ignore network fallback error
    }

    if (error) {
      setAuthError(
        `Profil pengguna belum tersedia (${error.message}). Pastikan schema SQL Supabase telah dijalankan.`
      );
    } else {
      setAuthError('Profil pengguna tidak ditemukan di tabel profiles.');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    await loadUserProfile(data.session);
  }, [loadUserProfile]);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function init() {
      const cfg = await fetchAppConfig();
      if (!mounted) return;
      setConfig(cfg);

      if (!cfg.configured) {
        setLoading(false);
        return;
      }

      const supabase = await getSupabaseClient();
      if (!supabase || !mounted) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session) {
        await loadUserProfile(data.session);
      }
      if (mounted) setLoading(false);

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession) {
          await loadUserProfile(newSession);
        } else {
          setProfile(null);
        }
      });

      subscription = listener.subscription;
    }

    init();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadUserProfile]);

  const signOut = useCallback(async () => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        config,
        session,
        user,
        profile,
        loading,
        authError,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
