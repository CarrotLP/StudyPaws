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

  if (!data || data.submission_deadline_minutes === null || data.voting_deadline_minutes === null) {
    return DEFAULT_QUEST_DEADLINES;
  }

  return {
    submissionDeadlineMinutes: data.submission_deadline_minutes,
    votingDeadlineMinutes: data.voting_deadline_minutes,
  };
}

export async function saveQuestDeadlines(
  teamId: string,
  deadlines: QuestDeadlines,
): Promise<void> {
  const { data, error } = await supabase
    .from('team_quest_settings')
    .update({
      submission_deadline_minutes: deadlines.submissionDeadlineMinutes,
      voting_deadline_minutes: deadlines.votingDeadlineMinutes,
    })
    .eq('team', teamId)
    .select();

  if (error) throw error;

  if (!data || data.length === 0) {
    // Row didn't update — almost always a missing RLS UPDATE policy on
    // team_quest_settings for the current user.
    throw new Error(
      'Quest settings were not saved (no row updated). Check the team_quest_settings UPDATE policy.',
    );
  }
}
