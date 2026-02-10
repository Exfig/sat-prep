import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { loadAllUserData, updateProfile } from '../services/database';
import { startSyncEngine, stopSyncEngine } from '../services/syncEngine';

type UserRole = 'student' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, meta?: SignupMeta) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

interface SignupMeta {
  school?: string;
  gradeLevel?: number;
  targetTestDate?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('student');

  const hydrateFromSupabase = useAppStore((s) => s.hydrateFromSupabase);
  const clearUserData = useAppStore((s) => s.clearUserData);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        hydrateUser(s.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        stopSyncEngine();
        clearUserData();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function hydrateUser(userId: string) {
    try {
      const [data, profileRes] = await Promise.all([
        loadAllUserData(userId),
        supabase.from('profiles').select('role').eq('id', userId).single(),
      ]);
      hydrateFromSupabase(userId, data);
      if (profileRes.data?.role === 'admin') {
        setRole('admin');
      }
      startSyncEngine(userId);
    } catch (err) {
      console.error('Failed to hydrate user data:', err);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    // onAuthStateChange will fire → hydrateUser is called in the getSession flow
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) {
      setLoading(true);
      await hydrateUser(s.user.id);
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, meta?: SignupMeta) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) return { error: error.message };

    if (data.session && data.user) {
      setLoading(true);
      await hydrateUser(data.user.id);

      // Update profile with extra fields after session is established
      if (meta) {
        await updateProfile(data.user.id, {
          school: meta.school || null,
          grade_level: meta.gradeLevel || null,
          target_test_date: meta.targetTestDate || null,
        });
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    stopSyncEngine();
    setRole('student');
    await supabase.auth.signOut();
    clearUserData();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useIsAdmin() {
  return useAuth().role === 'admin';
}
