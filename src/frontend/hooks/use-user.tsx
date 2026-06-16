import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getUserDetails } from '@/backend/services/user.services';
import type { MochiPersonality } from '@/services/mochiQuotes.services';
import { QK } from './queries';
import { useAuth } from './use-auth';

type UseUserResult = {
  name: string | null;
  petName: string | null;
  personality: MochiPersonality | null;
  character: string | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useUser(): UseUserResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: QK.userDetails(user?.id ?? ''),
    queryFn: () => getUserDetails(user!.id),
    enabled: !!user?.id,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: QK.userDetails(user?.id ?? '') });
  };

  return {
    name: data?.name ?? null,
    petName: data?.pet_name ?? null,
    personality: (data?.personality as MochiPersonality | undefined) ?? null,
    character: data?.character ?? null,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    refresh,
  };
}
