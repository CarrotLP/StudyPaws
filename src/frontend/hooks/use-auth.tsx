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
import { ensureCharacter } from '@/services/character.services';
// ... (rest of imports)

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    petName: string,
    character: string,
    personality: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Ensures the signed-in user's chosen character (stored in auth metadata at
 * sign-up) exists in `characters` and is set on their `users` row. Runs whenever
 * a session appears, so it works even when email confirmation delays the session
 * past sign-up time. Idempotent: only writes when the row isn't set yet.
 */
async function backfillCharacter(session: Session | null): Promise<void> {
  const meta = session?.user?.user_metadata ?? {};
  const character = meta.character as string | undefined;
  const personality = meta.personality as string | undefined;
  if (!session || !character) return;

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('name, pet_name, character, personality')
      .eq('user_uid', session.user.id)
      .maybeSingle();

    // Skip only if BOTH already match the chosen values. (Don't treat the
    // column DEFAULTs as "already chosen" — that would block the real choice.)
    if (existing?.character === character && existing?.personality === personality) return;

    await ensureCharacter(character);

    if (existing) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          character,
          ...(personality ? { personality } : {}),
        })
        .eq('user_uid', session.user.id);
      if (updateError) throw updateError;
      return;
    }

    const metadataName = typeof meta.name === 'string' ? meta.name.trim() : '';
    if (!metadataName) {
      throw new Error('Cannot create users row during login because auth metadata has no name.');
    }

    const { error: insertError } = await supabase.from('users').insert({
      user_uid: session.user.id,
      name: metadataName,
      pet_name: typeof meta.pet_name === 'string' ? meta.pet_name.trim() : null,
      character,
      ...(personality ? { personality } : {}),
    });
    if (insertError) throw insertError;
  } catch (backfillError) {
    console.warn('character backfill failed:', backfillError);
  }
}

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
      void backfillCharacter(data.session);
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setError(null);
      void backfillCharacter(nextSession);
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
    async (
      email: string,
      password: string,
      name: string,
      petName: string,
      character: string,
      personality: string,
    ) => {
      setError(null);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            pet_name: petName.trim(),
            // Fallback for a DB trigger that copies metadata → users columns.
            character,
            personality,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        throw signUpError;
      }

      // While a session exists right after sign-up (email confirmation off), we're
      // authenticated as the new user: create the shared character row and set the
      // user's chosen character + personality before signing out.
      if (data.session && data.user) {
        try {
          await ensureCharacter(character);
          await supabase
            .from('users')
            .update({ character, personality })
            .eq('user_uid', data.user.id);
        } catch (writeError) {
          // Non-fatal: account is created; surface but don't block registration.
          console.warn('Failed to persist character/personality on sign-up:', writeError);
        }
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
