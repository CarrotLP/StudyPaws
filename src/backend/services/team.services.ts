import { supabase } from '@/backend/lib/supabase';

export async function createTeam(
  teamName: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      team_name: teamName,
    })
    .select('team_uid')
    .single();

  if (error) {throw error};

  return data.team_uid;
}


export async function getTeamByTeamCode(teamCode: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('team_uid')
    .eq('team_code', teamCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.team_uid ?? null;
}