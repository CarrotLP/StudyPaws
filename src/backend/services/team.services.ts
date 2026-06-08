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