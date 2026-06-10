import { supabase } from '@/backend/lib/supabase';

// The cat's personalities. Each study quote in the DB belongs to one of these.
export const MOCHI_PERSONALITIES = [
  'supportive',
  'strict',
  'friendly',
  'cutesy',
  'funny',
] as const;

export type MochiPersonality = (typeof MOCHI_PERSONALITIES)[number];

/**
 * Mochi's study-time encouragement lines, stored in the `mochi_quotes` table so
 * they can be edited without an app release.
 *
 * Expected table (see the SQL handed over with this change):
 *   create table public.mochi_quotes (
 *     id uuid primary key default gen_random_uuid(),
 *     personality text not null
 *       check (personality in ('supportive','strict','friendly','cutesy','funny')),
 *     text text not null
 *   );
 *
 * @param personality if provided, only that personality's lines are returned;
 *        omit to get every quote (e.g. before a personality has been chosen).
 */
export async function getStudyQuotes(personality?: MochiPersonality): Promise<string[]> {
  let query = supabase.from('mochi_quotes').select('text');
  if (personality) query = query.eq('personality', personality);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => row.text).filter((t): t is string => !!t);
}
