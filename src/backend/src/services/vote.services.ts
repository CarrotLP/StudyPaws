// Chooes to use Input object or use a bunch of different params
// Dont know if we wanna keep this same for all services, but for some services with a lot of params this might be annoying(?)
// and this can be moved to the types folder
export type CreateVoteInput = {
  teamId: string;
  entryId: string;
  voterId: string;
  voteValue: number;
};

export async function createVoteItem(data: CreateVoteInput) {
  // TODO: insert into DB
  return { id: "temp-id", ...data };
}
