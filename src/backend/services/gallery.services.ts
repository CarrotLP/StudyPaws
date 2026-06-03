// Chooes to use UserTeamInput or use userId, teamId as different params
// Dont know if we wanna keep this same for all services, but for some services with a lot of params this might be annoying(?)

import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
// Use the legacy export to retain the `readAsStringAsync` API and avoid
// the deprecation warning in managed React Native / Expo environments.
import * as FileSystem from 'expo-file-system/legacy';

// and this can be moved to the types folder
export type UserTeamInput = {
  userId: string;
  teamId: string;
};

export async function uploadPhoto(userId: string, uri: string) {
  // Should derive...
  const mimeType = 'image/jpeg'; // or derive if you have it

  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1e9)}.jpg`;
  const path = `${userId}/${fileName}`;

  // read local file properly (NOT fetch)
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const arrayBuffer = decode(base64);

  const { data, error } = await supabase.storage
    .from('gallery')
    .upload(path, arrayBuffer, {
      contentType: mimeType,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('gallery')
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    console.error('Failed to get public URL. urlData:', urlData);
    return null;
  }

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}