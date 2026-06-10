import { supabase } from '@/backend/lib/supabase';

export type UserCommunity = {
  communityId: string;
  communityName: string;
  communityCode: string;
};

export type CommunityUser = {
  userId: string;
  userName: string;
}

export async function getCommunitiesForUser(userId: string): Promise<UserCommunity[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('users_communities')
    .select('community')
    .eq('user', userId);

  if (membershipError) {
    throw membershipError;
  }

  const communityIds = memberships.map((membership) => membership.community);
  if (communityIds.length === 0) {
    return [];
  }

  const { data: communities, error: communityError } = await supabase
    .from('communities')
    .select('community_uid, name, community_code')
    .in('community_uid', communityIds);

  if (communityError) {
    throw communityError;
  }

  return communities.map((community) => ({
    communityId: community.community_uid,
    communityName: community.name,
    communityCode: community.community_code,
  }));
}

export async function getUsersForCommunity(communityId: string): Promise<CommunityUser[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('users_communities')
    .select('user')
    .eq('community', communityId);

  if (membershipError) {
    throw membershipError;
  }

  const userIds = memberships.map((membership) => membership.user);
  if (userIds.length === 0) {
    return [];
  }

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('user_uid, name')
    .in('user_uid', userIds);

  if (userError) {
    throw userError;
  }

  return users
    .map((user) => ({
      userId: user.user_uid,
      userName: user.name,
    }));
}

export async function addUserToCommunity(userId: string, communityId: string) {
  const { data, error } = await supabase
    .from('users_communities')
    .insert({ user: userId, community: communityId });

  if (error) {
    throw error;
  }

  return data;
}

export async function removeUserFromCommunity(userId: string, communityId: string) {
  const { error } = await supabase
    .from('users_communities')
    .delete()
    .eq('user', userId)
    .eq('community', communityId);

  if (error) {
    throw error;
  }

  return { success: true };
}
