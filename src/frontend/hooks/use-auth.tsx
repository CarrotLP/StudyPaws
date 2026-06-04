import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/backend/lib/supabase';

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_EMAIL = process.env.EXPO_PUBLIC_DEMO_EMAIL;
const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeDemoSession = async () => {
      if (!DEMO_EMAIL || !DEMO_PASSWORD) {
        if (mounted) {
          setError('Demo sign-in credentials are missing.');
          setLoading(false);
        }
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      let nextSession = sessionData.session;

      if (nextSession?.user.email !== DEMO_EMAIL) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });

        if (signInError) {
          if (mounted) {
            setError(signInError.message);
            setLoading(false);
          }
          return;
        }

        nextSession = data.session;
      }

      if (mounted) {
        setSession(nextSession);
        setError(nextSession ? null : 'Demo sign-in did not return a session.');
        setLoading(false);
      }
    };

    void initializeDemoSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ loading, session, user: session?.user ?? null, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
