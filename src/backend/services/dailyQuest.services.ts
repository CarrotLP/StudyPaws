import { supabase } from '@/backend/lib/supabase';

export type DailyQuestRecord = {
  questDate: string;
  description: string;
};

export async function getQuestForDate(questDate: string): Promise<DailyQuestRecord | null> {
  const { data, error } = await supabase
    .from('daily_quests')
    .select('quest_date, description')
    .eq('quest_date', questDate)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    questDate: data.quest_date,
    description: data.description,
  };
}
