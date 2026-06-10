import { supabase } from '@/backend/lib/supabase';

const BODYPARTS_BUCKET = 'mochi_bodyparts';

// Model-specific parts live in the chosen model's folder, named `<model>_<file>.png`,
// e.g. cat/c1/c1_body.png. The value is the file suffix.
const MODEL_PARTS = {
  body: 'body',
  larm: 'larm',
  rarm: 'rarm',
  tail: 'tail',
} as const;

// Generic parts are shared across all cats, from the `c_base` folder, named
// `c_<file>.png`, e.g. cat/c_base/c_foot.png. Note rfoot & lfoot both reuse
// `c_foot.png`, so the file suffix can differ from the column name.
const BASE_PARTS = {
  eyes: 'eyes',
  rfoot: 'foot',
  lfoot: 'foot',
  shadow: 'shadow',
  whirly_eyes: 'whirly_eyes',
} as const;

type PartColumn = keyof typeof MODEL_PARTS | keyof typeof BASE_PARTS;

export type CharacterRecord = { name: string } & Record<PartColumn, string>;

/**
 * Builds a `characters` row for a chosen model (e.g. "c1").
 *
 *   - Model-specific parts → cat/<model>/<model>_<file>.png   (body, larm, rarm, tail)
 *   - Generic parts        → cat/c_base/c_<file>.png          (eyes, rfoot, lfoot, shadow, whirly_eyes)
 *   - name                 → the model name itself
 */
export function buildCharacterRecord(model: string): CharacterRecord {
  const publicUrl = (path: string) =>
    supabase.storage.from(BODYPARTS_BUCKET).getPublicUrl(path).data.publicUrl;

  const record = { name: model } as CharacterRecord;

  for (const [column, file] of Object.entries(MODEL_PARTS)) {
    record[column as keyof typeof MODEL_PARTS] = publicUrl(`cat/${model}/${model}_${file}.png`);
  }
  for (const [column, file] of Object.entries(BASE_PARTS)) {
    record[column as keyof typeof BASE_PARTS] = publicUrl(`cat/c_base/c_${file}.png`);
  }

  return record;
}

/**
 * Idempotently inserts the character row for `model` (keyed by name), so the
 * same model chosen by many users only ever has one shared row.
 */
export async function ensureCharacter(model: string): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .upsert(buildCharacterRecord(model), { onConflict: 'name' });
  if (error) throw error;
}
