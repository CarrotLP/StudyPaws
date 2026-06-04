import { supabase } from '@/backend/lib/supabase';

export type QuestDeadlines = {
  submissionDeadlineMinutes: number;
  votingDeadlineMinutes: number;
};

export const DEFAULT_QUEST_DEADLINES: QuestDeadlines = {
  submissionDeadlineMinutes: 20 * 60,
  votingDeadlineMinutes: 24 * 60,
};

export async function getQuestDeadlines(teamId: string): Promise<QuestDeadlines> {
  const { data, error } = await supabase
    .from('team_quest_settings')
    .select('submission_deadline_minutes, voting_deadline_minutes')
    .eq('team', teamId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_QUEST_DEADLINES;

  return {
    submissionDeadlineMinutes: data.submission_deadline_minutes,
    votingDeadlineMinutes: data.voting_deadline_minutes,
  };
}

export async function saveQuestDeadlines(
  teamId: string,
  deadlines: QuestDeadlines,
): Promise<void> {
  const { error } = await supabase.from('team_quest_settings').upsert({
    team: teamId,
    submission_deadline_minutes: deadlines.submissionDeadlineMinutes,
    voting_deadline_minutes: deadlines.votingDeadlineMinutes,
  });

  if (error) throw error;
}
