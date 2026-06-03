import { dateKey } from '@/lib/haven-format';
import { saveQuestPhotoForDay } from '@/lib/haven-storage';

/**
 * Daily-quest data + persistence skeleton.
 *
 * `dailyQuest` is hard-coded for now but kept as a structured object so the UI
 * doesn't need to change when we swap to a Supabase-fetched / randomly-rolled
 * quest. The shape (id / title / description / noun / type) is the planned schema.
 *
 *   - `description` is the instruction shown on the quest card ("Take a picture of a tree")
 *   - `noun` is the display noun shown on the completion card ("a tree")
 *     — split out so generated quests can populate it without parsing.
 */
export type DailyQuestType = 'photo';

export type DailyQuest = {
  id: string;
  title: string;
  description: string;
  noun: string;
  type: DailyQuestType;
};

// TODO: replace this constant with `fetchTodaysQuest()` once the Supabase
// `daily_quests` table exists. Same shape; the UI plugs in unchanged.
export const dailyQuest: DailyQuest = {
  id: 'tree-photo',
  title: 'Complete Daily Quest',
  description: 'Take a picture of a tree',
  noun: 'a tree',
  type: 'photo',
};

/**
 * Persists the captured photo URI under `haven.questPhotos` keyed by today's
 * local date. Best-effort: a failed write doesn't break the immediate popup,
 * which reads the URI from in-memory state.
 *
 * TODO: also upload `photoUri` to Supabase Storage (bucket: `daily-quest-photos`)
 *       and insert a row into `daily_quest_completions` referencing the storage
 *       path + current user + today's quest id.
 */
export async function saveDailyQuestPhoto(photoUri: string): Promise<void> {
  try {
    await saveQuestPhotoForDay(dateKey(new Date()), photoUri);
  } catch {
    // ignore — popup still renders from in-memory URI
  }
}
