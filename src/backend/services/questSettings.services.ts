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
ole.log('[getQuestDeadlines] teamId:', teamId);
  const { data, error } = await supabase
    .from('teams')
    .select('submission_deadline_minutes, voting_deadline_minutes')
    .eq('team_uid', teamId)
    .maybeSingle();

  if (error) {
    console.error('[getQuestDeadlines] Error:', error);
    throw error;
  }

  console.log('[getQuestDeadlines] data:', data);

  if (!data || data.submission_deadline_minutes === null || data.voting_deadline_minutes === null) {
    console.log('[getQuestDeadlines] Returning DEFAULT_QUEST_DEADLINES');
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
  console.log('[saveQuestDeadlines] teamId:', teamId, 'deadlines:', deadlines);

  const { data: { session } } = await supabase.auth.getSession();
  console.log('[saveQuestDeadlines] Current User ID:', session?.user?.id);

  const { data, error } = await supabase
    .from('teams')
    .update({
      submission_deadline_minutes: deadlines.submissionDeadlineMinutes,
      voting_deadline_minutes: deadlines.votingDeadlineMinutes,
    })
    .eq('team_uid', teamId)
    .select();

  if (error) {
    console.error('[saveQuestDeadlines] Error:', error);
    throw error;
  }

  console.log('[saveQuestDeadlines] Row update result:', data);

  if (!data || data.length === 0) {
    console.warn('[saveQuestDeadlines] No rows were updated. Check if team_uid exists or RLS policies.');

    // Check if the team exists at all (ignoring RLS if possible, though maybeSingle still respects it)
    const { data: teamCheck } = await supabase.from('teams').select('team_uid').eq('team_uid', teamId).maybeSingle();
    console.log('[saveQuestDeadlines] Team existence check (respects RLS):', teamCheck);
  } else {
    console.log('[saveQuestDeadlines] Success');
  }  if (error) throw error;
}
