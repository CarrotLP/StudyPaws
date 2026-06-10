import { supabase } from '@/backend/lib/supabase';

export type DailyQuestRecord = {
  questDate: string;
  description: string;
};

export async function getQuestForTeamDate(
  teamId: string,
  questDate: string,
): Promise<DailyQuestRecord | null> {
  const { data, error } = await supabase.rpc('get_or_create_team_daily_quest', {
    p_team: teamId,
    p_quest_date: questDate,
  });

  if (error) {
    throw error;
  }

  const quest = data?.[0];
  if (!quest) {
    return null;
  }

  return {
    questDate: quest.quest_date,
    description: quest.description,
  };
}
