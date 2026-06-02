/**
 * Daily-quest data + persistence skeleton.
 *
 * `dailyQuest` is hard-coded for now but kept as a structured object so the UI
 * doesn't need to change when we swap to a Supabase-fetched / randomly-rolled
 * quest. The shape (id / title / description / type) is the planned schema.
 */
export type DailyQuestType = 'photo';

export type DailyQuest = {
  id: string;
  title: string;
  description: string;
  type: DailyQuestType;
};

// TODO: replace this constant with `fetchTodaysQuest()` once the Supabase
// `daily_quests` table exists. The UI reads only `title` / `description` so a
// random or server-fetched quest with the same shape will plug in unchanged.
export const dailyQuest: DailyQuest = {
  id: 'tree-photo',
  title: 'Complete Daily Quest',
  description: 'Take a picture of a tree',
  type: 'photo',
};

/**
 * Skeleton — called by the DailyQuestOverlay after a photo is captured.
 * Receives the local file URI of the photo so the eventual Supabase upload
 * can read the file directly (`fetch(uri).blob()` → Supabase Storage).
 *
 * TODO: upload `photoUri` to Supabase Storage (bucket: `daily-quest-photos`)
 *       and insert a row into the `daily_quest_completions` table
 *       referencing the storage path + the current user + today's quest id.
 */
export async function saveDailyQuestPhoto(photoUri: string): Promise<void> {
  // Kept intentionally inert for now. Don't remove the parameter — it pins
  // the call site so the real implementation slots in without a signature change.
  void photoUri;
}
