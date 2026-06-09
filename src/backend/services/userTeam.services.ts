import { supabase } from '@/backend/lib/supabase';

export type UserTeamInput = {
  userId: string;
  teamId: string;
};

export type UserTeam = {
  teamId: string;
  teamName: string;
  teamCode: string;
};

export type TeamUser = {
  userId: string;
  userName: string;
}

export async function getTeamsForUser(userId: string): Promise<UserTeam[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('users_teams')
    .select('team')
    .eq('user', userId);

  if (membershipError) {
    throw membershipError;
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
    throw teamError;
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
    .select('user')
    .eq('team', teamId);

  if (membershipError) {
    throw membershipError;
  }

  const userIds = memberships.map((membership) => membership.user);
  if (userIds.length === 0) {
    return [];
  }

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('user_uid, name')
    .in('user_uid', userIds);

  if (userError) {
    throw userError;
  }

  return users.map((user) => ({
    userId: user.user_uid,
    userName: user.name,
  }));
}

export async function addUserToTeam(userId: string, teamId: string) {
  const { data, error } = await supabase
    .from('users_teams')
    .insert({ user: userId, team: teamId });

  if (error) {
    throw error;
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
    throw error;
  }

  return { success: true };
}
