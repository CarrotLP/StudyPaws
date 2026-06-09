import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/backend/lib/supabase';
// ... (rest of imports)

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, petName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      setError(sessionError?.message ?? null);
      setLoading(false);
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setError(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }

    setSession(data.session);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string, petName: string) => {
      setError(null);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            pet_name: petName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        throw signUpError;
      }

      if (data.session) {
        await supabase.auth.signOut();
      }

      setSession(null);
    },
    [],
  );

  const signOut = useCallback(async () => {
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      throw signOutError;
    }

    setSession(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      error,
      signIn,
      signUp,
      signOut,
    }),
    [loading, session, error, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
