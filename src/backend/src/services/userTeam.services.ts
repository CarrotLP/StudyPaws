// Chooes to use UserTeamInput or use userId, teamId as different params
// Dont know if we wanna keep this same for all services, but for some services with a lot of params this might be annoying(?)
// and this can be moved to the types folder
export type UserTeamInput = {
  userId: string;
  teamId: string;
};

export async function getTeamsForUser(userId: string) {
  // TODO: fetch teams for user from DB
  return [];
}

export async function getUsersForTeam(teamId: string) {
  // TODO: fetch users for team from DB
  return [];
}

export async function addUserToTeam(userId: string, teamId: string) {
  // TODO: insert into join table
  return { userId, teamId };
}

export async function removeUserFromTeam(userId: string, teamId: string) {
  // TODO: delete from join table
  return { success: true };
}
