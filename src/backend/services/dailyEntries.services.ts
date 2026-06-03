import { supabase } from '../lib/supabase';

/**
 * Updates the record for a specific user and date with a quest image.
 */
export async function uploadQuest(userId: string, questImage: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('date_entries')
    .update({ questImage })
    .eq('user', userId)
    .eq('date', today)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Updates the record for a specific user and date with focus minutes.
 */
export async function uploadHabit(userId: string, minutes: number) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('date_entries')
    .update({ minutes })
    .eq('user', userId)
    .eq('date', today)
    .select();

  if (error) throw error;
  return data;
}
