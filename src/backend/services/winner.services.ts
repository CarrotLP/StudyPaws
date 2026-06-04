export type WinnerOutput = {
  winnerName: string;
  winnerPhotoUri: string;
  questExplanation: string;
};

/**
 * TODO(supabase): replace this mock with the previous quest's winning
 * submission returned by the vote calculation query.
 */
export const mockPreviousQuestWinner: WinnerOutput = {
  winnerName: 'Lily',
  winnerPhotoUri: 'https://picsum.photos/200',
  questExplanation:
    'Go somewhere with a better view and take a picture of something that makes you happy.',
};

export async function getWinnerItems(): Promise<WinnerOutput> {
  // TODO(supabase): fetch the previous quest winner from the database.
  return mockPreviousQuestWinner;
}
