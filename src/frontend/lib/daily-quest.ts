import questPrompts from '@/constants/questPrompts.json';
import { dateKey } from '@/lib/haven-format';
import { saveQuestPhotoForDay } from '@/lib/haven-storage';

/**
 * Daily-quest data + persistence skeleton.
 *
 * `dailyQuest` is derived once per UTC day so the UI doesn't change when we swap
 * to a Supabase-fetched quest. The shape (id / title / description / noun / type)
 * is the planned schema.
 *
 *   - `description` is the instruction shown on the quest card
 *     ("Take a picture of ${DAILY_QUEST_SUBJECT}")
 *   - `noun` is the bare subject phrase shown on the completion card
 *     ("${DAILY_QUEST_SUBJECT}") — split out so generated quests can populate it
 *     without parsing.
 *
 * Note: each prompt in questPrompts.json already includes its own article
 * ("a tree", "the clouds", "something red"), so we DON'T prepend "a/an" here.
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

/** Hand-editable pool of quest subjects. Edit src/frontend/constants/questPrompts.json
 *  (add/remove array lines) to change the rotation — ships via OTA, no rebuild. */
const PROMPTS: readonly string[] = questPrompts.prompts;

/**
 * Picks ONE prompt per day, deterministically from the date.
 *
 * Uses whole days since the Unix epoch in UTC, so:
 *   - it is STABLE for the entire calendar day (never re-rolls on open / focus /
 *     render — there's no randomness and no per-session state), and
 *   - it is IDENTICAL across devices in the same UTC day, so the whole team
 *     shares one quest and submissions stay coherent with scoring.
 *
 * TODO(supabase): replace this whole function with a `fetchTodaysQuest()` lookup
 * against a "quest of the day" table once it exists. Callers read the exported
 * `dailyQuest` object unchanged.
 */
export function getTodaysQuestSubject(now: Date = new Date()): string {
  const daysSinceEpoch = Math.floor(now.getTime() / 86_400_000);
  const index = ((daysSinceEpoch % PROMPTS.length) + PROMPTS.length) % PROMPTS.length;
  return PROMPTS[index];
}

/** Single source of truth for today's quest subject. Derived once at module load
 *  (stable for the UTC day); every consumer reads this automatically. */
export const DAILY_QUEST_SUBJECT = getTodaysQuestSubject();

/** Single source of truth for the team name shown in the gallery header. */
export const TEAM_NAME = 'Unicorns';

export const dailyQuest: DailyQuest = {
  id: 'daily-photo',
  title: 'Complete Daily Quest',
  description: `Take a picture of ${DAILY_QUEST_SUBJECT}`,
  noun: DAILY_QUEST_SUBJECT,
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
