import { supabase } from '@/backend/lib/supabase';

import type { MochiPersonality } from '@/services/mochiQuotes.services';

export type UserDetails = {
  name: string;
  pet_name: string;
  points: number;
  user_uid: string;
  personality: MochiPersonality | null;
};

/**
 * Fetches user details from the users table by user UID.
 * @param userUid - The user's UID from Supabase Auth
 * @returns UserDetails or null if not found
 */
export async function getUserDetails(userUid: string): Promise<UserDetails | null> {
  const { data, error } = await supabase
    .from('users')
    .select('name, pet_name, points, user_uid, personality')
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
    personality: (data.personality as MochiPersonality) ?? null,
  };
}

/**
 * Updates the user's chosen cat personality. Upserts so it also creates the
 * `users` row if one doesn't exist yet (`name` is required on insert).
 */
export async function updateUserPersonality(
  userUid: string,
  personality: MochiPersonality,
  name: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('users')
    .upsert({ user_uid: userUid, name, personality }, { onConflict: 'user_uid' })
    .select('user_uid');
  // Supabase returns a plain PostgrestError object (not an Error instance), so
  // wrap it so callers can read `.message`.
  if (error) throw new Error(`${error.message}${error.hint ? ` (${error.hint})` : ''}`);
  // A row-level-security block returns no error but 0 rows written — surface it
  // so the change isn't silently lost.
  if (!data || data.length === 0) {
    throw new Error('No row written — check the users insert/update RLS policy.');
  }
}
