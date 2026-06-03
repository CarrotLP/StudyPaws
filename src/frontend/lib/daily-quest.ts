import { dateKey } from '@/lib/haven-format';
import { saveQuestPhotoForDay } from '@/lib/haven-storage';

/**
 * Daily-quest data + persistence skeleton.
 *
 * `dailyQuest` is hard-coded for now but kept as a structured object so the UI
 * doesn't need to change when we swap to a Supabase-fetched / randomly-rolled
 * quest. The shape (id / title / description / noun / type) is the planned schema.
 *
 *   - `description` is the instruction shown on the quest card
 *     ("Take a picture of a ${DAILY_QUEST_SUBJECT}")
 *   - `noun` is the display noun shown on the completion card
 *     ("a ${DAILY_QUEST_SUBJECT}")
 *     — split out so generated quests can populate it without parsing.
 *
 * Change DAILY_QUEST_SUBJECT here to update the quest subject everywhere at once.
 * Note: the "a/an" article in `noun` won't auto-adjust for vowel-initial subjects.
 *
 * Change TEAM_NAME here to update the gallery header everywhere at once.
 * This will become data-driven once Buddies is Supabase-backed.
 */
export type DailyQuestType = 'photo';

export type DailyQuest = {
  id: string;
  title: string;
  description: string;
  noun: string;
  type: DailyQuestType;
};

/** Single source of truth for the quest subject. Change this to update all UI copy. */
export const DAILY_QUEST_SUBJECT = 'tree';

/** Single source of truth for the team name shown in the gallery header. */
export const TEAM_NAME = 'Unicorns';

// TODO: replace this constant with `fetchTodaysQuest()` once the Supabase
// `daily_quests` table exists. Same shape; the UI plugs in unchanged.
export const dailyQuest: DailyQuest = {
  id: 'tree-photo',
  title: 'Complete Daily Quest',
  description: `Take a picture of a ${DAILY_QUEST_SUBJECT}`,
  noun: `a ${DAILY_QUEST_SUBJECT}`,
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
