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
    throw new Error(
      [
        error.message,
        error.details ? `Details: ${error.details}` : null,
        error.hint ? `Hint: ${error.hint}` : null,
        error.code ? `Code: ${error.code}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    );
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
