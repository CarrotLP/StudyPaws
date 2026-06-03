import { supabase } from '../lib/supabase';

// Chooes to use Input object or use a bunch of different params
// Dont know if we wanna keep this same for all services, but for some services with a lot of params this might be annoying(?)
// and this can be moved to the types folder
export type CreateVoteInput = {
  teamId: string;
  voteeId: string;
  voterId: string;
  voteValue: number;
};

export async function createVoteItem(data: CreateVoteInput) {
  const { teamId, voterId, voteeId, voteValue } = data;
  const { data: insertedData, error } = await supabase
    .from('votes')
    .insert({
      team: teamId,
      voter: voterId,
      votee: voteeId,
      vote_value: voteValue,
      createdAt: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return insertedData;
}
