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
