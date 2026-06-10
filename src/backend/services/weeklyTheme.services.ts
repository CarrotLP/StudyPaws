import { supabase } from '@/backend/lib/supabase';
import { findWeekStart } from '@/lib/storage';

export async function getThemeForWeek(quest_date: string): Promise<string[]> {
  const weekStart = findWeekStart(new Date(quest_date));
  const { data: memberships, error } = await supabase
    .from('weekly_themes')
    .select('theme')
    .eq('week_start', weekStart);

  if (error) throw error;

  return (memberships ?? []).map((row) => row.theme);
}