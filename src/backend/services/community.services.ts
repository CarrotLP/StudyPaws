import { supabase } from '@/backend/lib/supabase';

export async function createCommunity(communityName: string): Promise<string> {
  const { data, error } = await supabase
    .from('communities')
    .insert({
      name: communityName,
    })
    .select('community_uid')
    .single();

  if (error) {
    throw error;
  }

  return data.community_uid;
}

export async function getCommunityByCode(communityCode: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('communities')
    .select('community_uid')
    .eq('community_code', communityCode)
    .single();

  if (error) {
    throw error;
  }

  return data?.community_uid ?? null;
}
