import { supabase } from "./supabase";

const GALLERY_BUCKET = 'gallery';

export function getPublicImageUrl(imagePath: string): string {
  return supabase.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(imagePath)
    .data.publicUrl;
}

export function findWeekStart(date: Date){
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;

  // Becomes monday
  date.setDate(date.getDate() + diff);
  const weekStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return weekStart
} 