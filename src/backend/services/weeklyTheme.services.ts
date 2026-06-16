import { supabase } from '@/backend/lib/supabase';
import { findWeekStart } from '@/lib/storage';

export async function getThemeForWeek(quest_date: string): Promise<string | null> {
  const weekStart = findWeekStart(new Date(quest_date));
  const { data, error } = await supabase
    .from('weekly_themes')
    .select('theme')
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) throw error;

  return data?.theme ?? null;
}

export async function submitTeamQuestSuggestion(
  teamId: string,
  weekStart: string,
  description: string,
): Promise<void> {
  const { error } = await supabase.from('team_quest_suggestions').insert({
    team: teamId,
    week_start: weekStart,
    description,
  });

  if (error) throw error;
}
