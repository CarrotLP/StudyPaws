import { supabase } from '@/backend/lib/supabase';

export type UserTeamInput = {
  userId: string;
  teamId: string;
};

export type UserTeam = {
  teamId: string;
  teamName: string;
};

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
    .select('team_uid, team_name')
    .in('team_uid', teamIds);

  if (teamError) {
    throw teamError;
  }

  return teams.map((team) => ({
    teamId: team.team_uid,
    teamName: team.team_name,
  }));
}

export async function getUsersForTeam(teamId: string) {
  // TODO: fetch users for team from DB
  return [];
}

export async function addUserToTeam(userId: string, teamId: string) {
  // TODO: insert into join table
  return { userId, teamId };
}

export async function removeUserFromTeam(userId: string, teamId: string) {
  // TODO: delete from join table
  return { success: true };
}
