import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getUserDetails } from '@/backend/services/user.services';
import type { MochiPersonality } from '@/services/mochiQuotes.services';
import { useAuth } from './use-auth';

type UseUserResult = {
  petName: string | null;
  personality: MochiPersonality | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

/**
 * Hook to fetch the current user's details (pet name, personality) from the
 * users table.
 *
 * Re-fetches whenever the screen using it gains focus. This matters because the
 * tabs stay mounted, so a plain mount-only effect would never pick up changes
 * made on another tab (e.g. choosing a new personality in Settings).
 */
export function useUser(): UseUserResult {
  const { user } = useAuth();
  const [petName, setPetName] = useState<string | null>(null);
  const [personality, setPersonality] = useState<MochiPersonality | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setPetName(null);
      setPersonality(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const details = await getUserDetails(user.id);
      setPetName(details?.pet_name ?? null);
      setPersonality(details?.personality ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user details'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refetch on every focus (and on first focus / user change).
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { petName, personality, loading, error, refresh };
}
