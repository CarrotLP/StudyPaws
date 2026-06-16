/**
 * Centralised React Query key factories and prefetch helper.
 *
 * All query keys live here so screens and the prefetch call in _layout.tsx
 * share identical keys — cache hits are only possible when the keys match.
 */

import { QueryClient } from '@tanstack/react-query';

import { getUserAccessories } from '@/backend/services/accessory.services';
import { getChests } from '@/backend/services/chest.services';
import { getPetPreviews } from '@/backend/services/petPreview.services';
import { getUserDetails } from '@/backend/services/user.services';
import { getCommunitiesForUser } from '@/backend/services/userCommunities.services';
import { getTeamsForUser, getUsersForTeam, type TeamUser, type UserTeam } from '@/backend/services/userTeam.services';
import { getThemeForWeek } from '@/backend/services/weeklyTheme.services';
import { fetchMochiLayers } from '@/lib/fetch-mochi-layers';

// ── Key factories ────────────────────────────────────────────────────────────

export const QK = {
  userDetails: (userId: string) => ['user-details', userId] as const,
  accessories: (userId: string) => ['accessories', userId] as const,
  teams: (userId: string) => ['teams', userId] as const,
  teamMembers: (teamId: string) => ['team-members', teamId] as const,
  communities: (userId: string) => ['communities', userId] as const,
  weeklyTheme: (date: string) => ['weekly-theme', date] as const,
  chests: () => ['chests'] as const,
  petPreviews: () => ['pet-previews'] as const,
  mochiLayers: (characterName: string, userId: string) =>
    ['mochi-layers', characterName, userId] as const,
} as const;

// ── Fire-and-forget prefetch at login ────────────────────────────────────────

export async function prefetchAllForUser(queryClient: QueryClient, userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: QK.userDetails(userId),
      queryFn: () => getUserDetails(userId),
    }),
    queryClient.prefetchQuery({
      queryKey: QK.accessories(userId),
      queryFn: () => getUserAccessories(userId),
    }),
    queryClient.prefetchQuery({
      queryKey: QK.chests(),
      queryFn: getChests,
    }),
    queryClient.prefetchQuery({
      queryKey: QK.petPreviews(),
      queryFn: getPetPreviews,
    }),
    queryClient.prefetchQuery({
      queryKey: QK.teams(userId),
      queryFn: () => getTeamsForUser(userId),
    }),
    queryClient.prefetchQuery({
      queryKey: QK.weeklyTheme(today),
      queryFn: () => getThemeForWeek(today),
    }),
    queryClient.prefetchQuery({
      queryKey: QK.communities(userId),
      queryFn: () => getCommunitiesForUser(userId),
    }),
  ]);

  // After teams are available, prefetch the first team's members and their cats.
  const teams = queryClient.getQueryData<UserTeam[]>(QK.teams(userId));
  if (teams?.[0]) {
    await queryClient.prefetchQuery({
      queryKey: QK.teamMembers(teams[0].teamId),
      queryFn: () => getUsersForTeam(teams[0].teamId),
    });

    const members = queryClient.getQueryData<TeamUser[]>(QK.teamMembers(teams[0].teamId));
    if (members && members.length > 0) {
      await Promise.all(
        members.map((m) =>
          m.character
            ? queryClient.prefetchQuery({
                queryKey: QK.mochiLayers(m.character, m.userId),
                queryFn: () => fetchMochiLayers(m.character, m.userId),
              })
            : Promise.resolve(),
        ),
      );
    }
  }
}
