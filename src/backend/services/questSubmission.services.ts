import { getPublicImageUrl } from '@/backend/lib/storage';
import { supabase } from '@/backend/lib/supabase';

const GALLERY_BUCKET = 'gallery';

export async function saveQuestSubmission(
  userId: string,
  questDate: string,
  photoUri: string,
): Promise<string> {
  const imagePath = `${userId}/${questDate}-${Date.now()}.jpg`;
  const imageData = await fetch(photoUri).then((response) => response.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(imagePath, imageData, { contentType: 'image/jpeg' });

  if (uploadError) {
    throw uploadError;
  }

  const { error: submissionError } = await supabase.from('quest_submissions').insert({
    quest_date: questDate,
    user_id: userId,
    image_path: imagePath,
  });

  if (submissionError) {
    throw submissionError;
  }

  return getPublicImageUrl(imagePath);
}

export async function getOwnQuestSubmission(
  userId: string,
  questDate: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('quest_submissions')
    .select('image_path')
    .eq('user_id', userId)
    .eq('quest_date', questDate)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? getPublicImageUrl(data.image_path) : null;
}