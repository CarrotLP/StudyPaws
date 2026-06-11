import { supabase } from '@/backend/lib/supabase';
import { findWeekStart } from '@/lib/storage';
import { Alert } from 'react-native';
import { getThemeForWeek } from './weeklyTheme.services';

const GALLERY_BUCKET = 'gallery';
export type Submission = {
  userId: string,
  photoUri: string
  submissionId: string
}

export type CommunityWinner = {
  weekStart: string,
  imagePath: string,
  user: string,
  votes: number,
  theme: string
}

type WeeklySubmissionRow = {
  user_id: string;
  image_path: string;
  submission_uid: string;
};

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

  const { data, error } = await supabase.rpc(
    'get_weekly_submissions_random',
    {
      p_community: communityId,
      p_week_start: weekStart
    }
  );

  if (error) throw error;

  const memberships = data as {
    user_id: string;
    image_path: string;
    submission_uid: string;
  }[];

  return (memberships ?? []).map((membership) => ({
    userId: membership.user_id,
    photoUri: membership.image_path,
    submissionId: membership.submission_uid
  }));

}

export async function likeCommunityQuest(userId: string, submissionId: string): Promise<void> {
  const { data, error } = await supabase
    .from('community_quest_likes')
    .insert({
      voter: userId,
      submission: submissionId,
    });

  if (error) throw error;
}

export async function unlikeCommunityQuest(userId: string, submissionId: string): Promise<void> {
  const { error } = await supabase
    .from('community_quest_likes')
    .delete()
    .eq('voter', userId)
    .eq('submission', submissionId);

  if (error) throw error;
}

export async function getUserCommunityQuestLikes(userId: string): Promise<string[]> {
  const { data: submissions, error } = await supabase
    .from('community_quest_likes')
    .select('submission')
    .eq('voter', userId);

  if (error) throw error;

  return (submissions ?? []).map((row) => row.submission);

}

export async function getSubmissionById(submissionId: string): Promise<string> {
  const { data, error } = await supabase
    .from('community_quest_submissions')
    .select('image_path')
    .eq('submission_uid', submissionId)
    .single();

  if (error) {
    throw error;
  }

  return data.image_path;
}

export async function getCommunityWinners(communityId: string): Promise<CommunityWinner[]> {
  const { data, error } = await supabase
    .from('community_quest_winners')
    .select('week_start, submission, user, votes')
    .eq('community', communityId);
  if (error) throw error;

  const winners = await Promise.all(
    (data ?? []).map(async (row) => {
      const photoUri = await getSubmissionById(row.submission);
      const theme = await getThemeForWeek(row.week_start);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('user_uid', row.user)
        .single();

      if (userError) throw userError;

      return {
        weekStart: row.week_start,
        user: userData.name,
        votes: row.votes,
        imagePath: photoUri,
        theme,
      };
    })
);

  return winners
}

