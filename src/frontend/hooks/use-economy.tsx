import { useCallback, useEffect, useState, useRef } from 'react';

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
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refreshPoints = useCallback(async () => {
    if (!user) {
      if (isMounted.current) setPoints(0);
      return;
    }
    try {
      const details = await getUserDetails(user.id);
      if (isMounted.current && details) {
        setPoints(details.points);
      }
    } catch (err) {
      console.error('Failed to fetch points:', err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshPoints();
  }, [refreshPoints]);

  const addPoints = useCallback(async (delta: number) => {
    if (!user) return;
    try {
      const newTotal = await addPointsToUser(user.id, delta);
      if (isMounted.current) {
        setPoints(newTotal);
      }
      return newTotal;
    } catch (err) {
      console.error('Failed to update points in DB:', err);
      throw err;
    }
  }, [user]);

  return { points, addPoints, refreshPoints, loading };
}
