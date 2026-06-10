import { supabase } from '@/backend/lib/supabase';

export type UserDetails = {
  name: string;
  pet_name: string;
  points: number;
  user_uid: string;
};

/**
 * Fetches user details from the users table by user UID.
 * @param userUid - The user's UID from Supabase Auth
 * @returns UserDetails or null if not found
 */
export async function getUserDetails(userUid: string): Promise<UserDetails | null> {
  const { data, error } = await supabase
    .from('users')
    .select('name, pet_name, points, user_uid')
    .eq('user_uid', userUid)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    name: data.name,
    pet_name: data.pet_name,
    points: data.points,
    user_uid: data.user_uid,
  };
}

export async function updateUserPoints(userUid: string, points: number): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ points })
    .eq('user_uid', userUid);

  if (error) {
    console.error('Error updating points:', error);
    throw error;
  }
}

/**
 * Fetches current points, calculates new total, and saves to DB.
 */
export async function addPointsToUser(userUid: string, delta: number): Promise<number> {
  const { data, error } = await supabase
    .from('users')
    .select('points')
    .eq('user_uid', userUid)
    .single();

  if (error) throw error;

  const newPoints = Math.max(0, (data.points || 0) + delta);

  const { error: updateError } = await supabase
    .from('users')
    .update({ points: newPoints })
    .eq('user_uid', userUid);

  if (updateError) throw updateError;
  return newPoints;
}
