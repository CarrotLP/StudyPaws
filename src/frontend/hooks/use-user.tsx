import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect, useRef } from 'react';

import { getUserDetails } from '@/backend/services/user.services';
import type { MochiPersonality } from '@/services/mochiQuotes.services';
import { useAuth } from './use-auth';

type UseUserResult = {
  petName: string | null;
  personality: MochiPersonality | null;
  character: string | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

/**
 * Hook to fetch the current user's details (pet name, personality) from the
 * users table.
 */
export function useUser(): UseUserResult {
  const { user } = useAuth();
  const [petName, setPetName] = useState<string | null>(null);
  const [personality, setPersonality] = useState<MochiPersonality | null>(null);
  const [character, setCharacter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      if (isMounted.current) {
        setPetName(null);
        setPersonality(null);
        setCharacter(null);
      }
      return;
    }

    if (isMounted.current) setLoading(true);
    if (isMounted.current) setError(null);

    try {
      const details = await getUserDetails(user.id);
      if (isMounted.current) {
        setPetName(details?.pet_name ?? null);
        setPersonality(details?.personality ?? null);
        setCharacter(details?.character ?? null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user details'));
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Refetch on focus
  useFocusEffect(
    useCallback(() => {
      // Only refetch if we are already mounted (to avoid the "not mounted yet" error on first focus)
      if (isMounted.current) {
        void refresh();
      }
    }, [refresh]),
  );

  return { petName, personality, character, loading, error, refresh };
}
