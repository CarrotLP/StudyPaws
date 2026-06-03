import { supabase } from '../lib/supabase';

// Chooes to use UserTeamInput or use userId, teamId as different params
// Dont know if we wanna keep this same for all services, but for some services with a lot of params this might be annoying(?)
// and this can be moved to the types folder
export type UserTeamInput = {
  userId: string;
  teamId: string;
};

// --- Specific Service Queries ("The SQL") ---

// example of how to set the function up if you want to put the result in the ui
export async function devFetchAndShowUser(targetUid: string, setter: (text: string) => void) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('user_uid', targetUid)
      .single();

    if (error) throw error;
    setter(`User Name: ${data?.name || 'No name found'}`);
  } catch (err: any) {
    setter(`Query Error: ${err.message}`);
  }
}

/**
 * Returns the team_uid for any users_teams entries with the user_uid.
 */
export async function getTeamsForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('users_teams')
    .select('team')
    .eq('user', userId);

  if (error) throw error;
  return data.map((item) => item.team);
}

/**
 * Returns the user_uid for any users_teams entries with the team_uid.
 */
export async function getUsersForTeam(teamId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('users_teams')
    .select('user')
    .eq('team', teamId);

  if (error) throw error;
  return data.map((item) => item.user);
}
