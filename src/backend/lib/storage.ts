import { supabase } from "./supabase";

const GALLERY_BUCKET = 'gallery';

export function getPublicImageUrl(imagePath: string): string {
  return supabase.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(imagePath)
    .data.publicUrl;
}