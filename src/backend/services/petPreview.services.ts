import { supabase } from '@/backend/lib/supabase';

export type PetPreview = {
  /** The model's name (e.g. "c1") — this is the value to capture as the choice. */
  name: string;
  /** Public URL to the static preview image. */
  imageUrl: string;
};

/**
 * Fetches the selectable cat models from the `pet_preview` table and resolves
 * each `image_address` (a storage path like "cats/c1.png") to a public URL.
 *
 * NOTE: the registration screen calls this while signed OUT, so the `anon` role
 * must have SELECT access to `pet_preview` (and the bucket must be public).
 */
export async function getPetPreviews(): Promise<PetPreview[]> {
  const { data, error } = await supabase
    .from('pet_preview')
    .select('name, image_address')
    .order('name');

  if (error) throw error;

  return (data ?? []).map((row) => {
    // image_address is "<bucket>/<path>", e.g. "cats/c1.png".
    const [bucket, ...rest] = String(row.image_address).split('/');
    const path = rest.join('/');
    return {
      name: row.name,
      imageUrl: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl,
    };
  });
}
