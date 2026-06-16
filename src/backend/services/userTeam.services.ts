import { supabase } from '@/backend/lib/supabase';
import type { ActivityStatus } from '@/backend/services/user.services';

export type UserTeam = {
  teamId: string;
  teamName: string;
  teamCode: string;
};

export type TeamUser = {
  userId: string;
  userName: string;
  winsCount: number;
  character: string | null;
  activityStatus: ActivityStatus;
}

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function throwSupabaseError(context: string, error: unknown): never {
  if (error && typeof error === 'object') {
    const supabaseError = error as SupabaseErrorLike;
    const parts = [
      supabaseError.message,
      supabaseError.code ? `code: ${supabaseError.code}` : null,
      supabaseError.details ? `details: ${supabaseError.details}` : null,
      supabaseError.hint ? `hint: ${supabaseError.hint}` : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      throw new Error(`${context}: ${parts.join(' | ')}`);
    }
  }

  throw new Error(`${context}: ${String(error)}`);
}

export async function getTeamsForUser(userId: string): Promise<UserTeam[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('users_teams')
    .select('team')
    .eq('user', userId);

  if (membershipError) {
    throwSupabaseError('Could not load team memberships', membershipError);
  }

  const teamIds = memberships.map((membership) => membership.team);
  if (teamIds.length === 0) {
    return [];
  }

  const { data: teams, error: teamError } = await supabase
    .from('teams')
    .select('team_uid, team_name, team_code')
    .in('team_uid', teamIds);

  if (teamError) {
    throwSupabaseError('Could not load teams', teamError);
  }

  return teams.map((team) => ({
    teamId: team.team_uid,
    teamName: team.team_name,
    teamCode: team.team_code,
  }));
}

export async function getUsersForTeam(teamId: string): Promise<TeamUser[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('users_teams')
    .select('user, wins_count')
    .eq('team', teamId);

  if (membershipError) {
    throwSupabaseError('Could not load team members', membershipError);
  }

  const userIds = memberships.map((membership) => membership.user);
  if (userIds.length === 0) {
    return [];
  }

  const winsByUserId = new Map(
    memberships.map((membership) => [membership.user, membership.wins_count ?? 0]),
  );

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('user_uid, name, character, activity_status')
    .in('user_uid', userIds);

  if (userError) {
    throwSupabaseError('Could not load team member profiles', userError);
  }

  return users
    .map((user) => ({
      userId: user.user_uid,
      userName: user.name,
      winsCount: winsByUserId.get(user.user_uid) ?? 0,
      character: user.character ?? null,
      activityStatus: (user.activity_status as ActivityStatus | null) ?? 'not studying',
    }))
    .sort((a, b) => b.winsCount - a.winsCount || a.userName.localeCompare(b.userName));
}

export async function addUserToTeam(userId: string, teamId: string) {
  const { data, error } = await supabase
    .from('users_teams')
    .insert({ user: userId, team: teamId });

  if (error) {
    throwSupabaseError('Could not join team', error);
  }

  return data;
}

export async function removeUserFromTeam(userId: string, teamId: string) {
  const { error } = await supabase
    .from('users_teams')
    .delete()
    .eq('user', userId)
    .eq('team', teamId);

  if (error) {
    throwSupabaseError('Could not leave team', error);
  }

  return { success: true };
}
