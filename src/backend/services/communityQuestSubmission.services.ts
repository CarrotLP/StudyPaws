import { supabase } from '@/backend/lib/supabase';
import { Alert } from 'react-native';

const GALLERY_BUCKET = 'gallery';
export type Submission = {
  userId: string,
  photoUri: string
}

function findWeekStart(date: Date){
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;

  // Becomes monday
  date.setDate(date.getDate() + diff);
  const weekStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return weekStart
} 

export async function uploadSubmissionToCommunity(
  userId: string,
  communityId: string,
  questDate: string,
  photoUri: string,
): Promise<void> {
  const date = new Date(questDate);
  const weekStart = findWeekStart(date)
  const photoUriSliced = photoUri.split('/').slice(-2).join('/');
  const { error: submissionError } = await supabase.from('community_quest_submissions').insert({
    community: communityId,
    user: userId,
    week_start: weekStart,
    image_path: photoUriSliced,
    quest_date: questDate
  })

  if (submissionError) {
    console.log(submissionError.message);
    throw submissionError;
  }

  Alert.alert('Upload successful!')
}

export async function getCommunitySubmissionOfDate(userId: string, questDate: string): Promise<String> {
  const { data: memberships, error: membershipError } = await supabase
    .from('community_quest_submissions')
    .select('submission_uid')
    .eq('user', userId)
    .eq('quest_date', questDate);

  if (membershipError) {
    throw membershipError;
  }

  const submissions = memberships.map((membership) => membership.submission_uid);
  if (submissions.length === 0) {
    return '';
  }
  return submissions[0];
}

export async function getCommunityImagesOfWeek(quest_date: string, communityId: string): Promise<Submission[]> {
  const weekStart = findWeekStart(new Date(quest_date))
  const { data: memberships, error: membershipError } = await supabase
    .from('community_quest_submissions')
    .select('user, image_path')
    .eq('community', communityId)
    .eq('week_start', weekStart);

  if (membershipError) {
    throw membershipError;
  }

  return memberships.map((membership) => ({
    userId: membership.user,
    photoUri: membership.image_path,
  }));

}

