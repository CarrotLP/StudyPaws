import { useCallback, useEffect, useState } from 'react';

import { getUserDetails, addPointsToUser } from '@/backend/services/user.services';
import { useAuth } from './use-auth';

/**
 * Hook to manage user points directly from the database.
 * No Provider required.
 */
export function useEconomy() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshPoints = useCallback(async () => {
    if (!user) return;
    try {
      const details = await getUserDetails(user.id);
      if (details) {
        setPoints(details.points);
      }
    } catch (err) {
      console.error('Failed to fetch points:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshPoints();
    } else {
      setPoints(0);
      setLoading(false);
    }
  }, [user, refreshPoints]);

  const addPoints = useCallback(async (delta: number) => {
    if (!user) return;
    try {
      const newTotal = await addPointsToUser(user.id, delta);
      setPoints(newTotal);
      return newTotal;
    } catch (err) {
      console.error('Failed to update points in DB:', err);
      throw err;
    }
  }, [user]);

  return { points, addPoints, refreshPoints, loading };
}
