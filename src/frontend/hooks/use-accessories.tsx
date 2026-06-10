import { useCallback, useEffect, useState, useRef } from 'react';

import { addAccessoryToUser, getUserAccessories } from '@/backend/services/accessory.services';
import { useAuth } from './use-auth';

/**
 * Hook to manage owned accessories directly from the database.
 * No Provider required.
 */
export function useAccessories() {
  const { user } = useAuth();
  const [owned, setOwned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refreshOwned = useCallback(async () => {
    if (!user) {
      if (isMounted.current) setOwned([]);
      return;
    }
    try {
      const data = await getUserAccessories(user.id);
      if (isMounted.current) {
        setOwned(data.map(item => item.accessory));
      }
    } catch (err) {
      console.error('Failed to fetch accessories:', err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshOwned();
  }, [refreshOwned]);

  const addOwned = async (accessoryName: string) => {
    if (!user) return;
    try {
      await addAccessoryToUser(user.id, accessoryName);
      await refreshOwned();
    } catch (err) {
      console.error('Failed to add accessory to DB:', err);
    }
  };

  const isOwned = (accessoryName: string) => {
    return owned.includes(accessoryName);
  };

  return { owned, addOwned, refreshOwned, isOwned, loading };
}
