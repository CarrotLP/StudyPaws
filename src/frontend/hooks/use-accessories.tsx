import { useCallback, useEffect, useState } from 'react';

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

  const refreshOwned = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserAccessories(user.id);
      setOwned(data.map(item => item.accessory));
    } catch (err) {
      console.error('Failed to fetch accessories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshOwned();
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
