import { supabase } from '@/backend/lib/supabase';

const GALLERY_BUCKET = 'gallery';

export type WinnerOutput = {
  teamId: string;
  questDate: string;
  winnerName: string;
  winnerPhotoUri: string;
  questExplanation: string;
};

export async function getWinnerItems(): Promise<WinnerOutput | null> {
  const { data, error } = await supabase.rpc('get_unseen_winner_announcements');

  if (error) throw error;

  const winner = data?.[0];
  if (!winner) return null;

  return {
    teamId: winner.team_id,
    questDate: winner.quest_date,
    winnerName: winner.winner_name,
    winnerPhotoUri: supabase.storage
      .from(GALLERY_BUCKET)
      .getPublicUrl(winner.winner_photo_path).data.publicUrl,
    questExplanation: winner.quest_description,
  };
}

export async function markWinnerAnnouncementSeen(
  teamId: string,
  questDate: string,
): Promise<void> {
  const { error } = await supabase.rpc('mark_winner_announcement_seen', {
    p_team: teamId,
    p_quest_date: questDate,
  });

  if (error) throw error;
}
