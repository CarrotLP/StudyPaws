import { useQuery, useQueryClient } from '@tanstack/react-query';

import { addPointsToUser, getUserDetails } from '@/backend/services/user.services';
import { QK } from './queries';
import { useAuth } from './use-auth';

export function useEconomy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QK.userDetails(user?.id ?? ''),
    queryFn: () => getUserDetails(user!.id),
    enabled: !!user?.id,
  });

  const refreshPoints = async () => {
    await queryClient.invalidateQueries({ queryKey: QK.userDetails(user?.id ?? '') });
  };

  const addPoints = async (delta: number): Promise<number> => {
    if (!user) throw new Error('Not signed in');
    const newTotal = await addPointsToUser(user.id, delta);
    // Update the cache optimistically with the new total so the UI reflects it
    // immediately without a round-trip.
    queryClient.setQueryData(QK.userDetails(user.id), (old: Awaited<ReturnType<typeof getUserDetails>>) =>
      old ? { ...old, points: newTotal } : old,
    );
    return newTotal;
  };

  return {
    points: data?.points ?? 0,
    addPoints,
    refreshPoints,
    loading: isLoading,
  };
}
