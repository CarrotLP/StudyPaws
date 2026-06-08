import { useEffect, useState } from 'react';

import { getUserDetails } from '@/backend/services/user.services';
import { useAuth } from './use-auth';

type UseUserResult = {
  petName: string | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Hook to fetch the current user's pet name from the users table.
 * Returns "Mochi" (default) if not yet loaded or if the user is not authenticated.
 */
export function useUser(): UseUserResult {
  const { user } = useAuth();
  const [petName, setPetName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!user?.id) {
      setPetName(null);
      setLoading(false);
      return;
    }

    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const details = await getUserDetails(user.id);
        if (mounted) {
          setPetName(details?.pet_name ?? null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch user details'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchUserDetails();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { petName, loading, error };
}
