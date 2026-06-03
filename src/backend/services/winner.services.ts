import { supabase } from '../lib/supabase';

// You can decide if we need one maybe not
// can move to types folder if needed
export type WinnerOutput = {
  winner: string;
};

export async function getWinnerItems(teamId: string, date: string) {
  const { data, error } = await supabase
    .from('winners')
    .select('winner')
    .eq('team', teamId)
    .eq('date', date);

  if (error) throw error;
  return data;
}
