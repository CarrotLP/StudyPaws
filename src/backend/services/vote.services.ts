import { supabase } from '@/backend/lib/supabase';

const GALLERY_BUCKET = 'gallery';

export type GallerySubmission = {
  userId: string;
  imageUrl: string;
  voteValue: number;
};

export async function getTeamGallery(
  teamId: string,
  questDate: string,
  currentUserId: string,
): Promise<GallerySubmission[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('users_teams')
    .select('user')
    .eq('team', teamId);

  if (membershipError) throw membershipError;

  const teammateIds = memberships
    .map((membership) => membership.user)
    .filter((userId) => userId !== currentUserId);

  if (teammateIds.length === 0) return [];

  const [{ data: submissions, error: submissionError }, { data: votes, error: voteError }] =
    await Promise.all([
      supabase
        .from('quest_submissions')
        .select('user_id, image_path')
        .eq('quest_date', questDate)
        .in('user_id', teammateIds),
      supabase
        .from('votes')
        .select('votee, vote_value')
        .eq('team', teamId)
        .eq('quest_date', questDate)
        .eq('voter', currentUserId),
    ]);

  if (submissionError) throw submissionError;
  if (voteError) throw voteError;

  const voteByUser = new Map(votes.map((vote) => [vote.votee, vote.vote_value]));

  return submissions.map((submission) => ({
    userId: submission.user_id,
    imageUrl: supabase.storage.from(GALLERY_BUCKET).getPublicUrl(submission.image_path).data.publicUrl,
    voteValue: voteByUser.get(submission.user_id) ?? 0,
  }));
}

export async function submitVote(
  teamId: string,
  questDate: string,
  voteeId: string,
  voteValue: number,
): Promise<void> {
  const { error } = await supabase.rpc('submit_vote', {
    p_team: teamId,
    p_quest_date: questDate,
    p_votee: voteeId,
    p_vote_value: voteValue,
  });

  if (error) throw error;
}
