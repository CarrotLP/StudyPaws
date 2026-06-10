import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/hooks/use-auth';
import { utcDateKey } from '@/lib/haven-format';
import { getQuestForTeamDate, type DailyQuestRecord } from '@/services/dailyQuest.services';
import {
  DEFAULT_QUEST_DEADLINES,
  getQuestDeadlines,
  saveQuestDeadlines,
  type QuestDeadlines,
} from '@/services/questSettings.services';
import { getOwnQuestSubmission } from '@/services/questSubmission.services';
import { getTeamsForUser, type UserTeam } from '@/services/userTeam.services';

type DailyQuestContextValue = {
  loading: boolean;
  quest: DailyQuestRecord | null;
  team: UserTeam | null;
  deadlines: QuestDeadlines;
  hasSubmittedToday: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateDeadlines: (deadlines: QuestDeadlines) => Promise<void>;
  markSubmittedToday: () => void;
};

const DailyQuestContext = createContext<DailyQuestContextValue | null>(null);

export function DailyQuestProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading, user, error: authError } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quest, setQuest] = useState<DailyQuestRecord | null>(null);
  const [team, setTeam] = useState<UserTeam | null>(null);
  const [deadlines, setDeadlines] = useState(DEFAULT_QUEST_DEADLINES);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setQuest(null);
      setTeam(null);
      setDeadlines(DEFAULT_QUEST_DEADLINES);
      setHasSubmittedToday(false);
      setError(authError ?? 'User is not signed in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const teams = await getTeamsForUser(user.id);
      const firstTeam = teams[0] ?? null;

      setTeam(firstTeam);
      setDeadlines(firstTeam ? await getQuestDeadlines(firstTeam.teamId) : DEFAULT_QUEST_DEADLINES);

      if (!firstTeam) {
        setQuest(null);
        setHasSubmittedToday(false);
        return;
      }

      try {
        const todaysQuest = await getQuestForTeamDate(firstTeam.teamId, utcDateKey());
        setQuest(todaysQuest);
        setHasSubmittedToday(
          todaysQuest ? (await getOwnQuestSubmission(user.id, todaysQuest.questDate)) !== null : false,
        );
      } catch (questError) {
        setQuest(null);
        setHasSubmittedToday(false);
        setError(questError instanceof Error ? questError.message : "Could not load today's quest.");
      }
    } catch (loadError) {
      setTeam(null);
      setQuest(null);
      setDeadlines(DEFAULT_QUEST_DEADLINES);
      setHasSubmittedToday(false);
      setError(loadError instanceof Error ? loadError.message : "Could not load today's quest.");
    } finally {
      setLoading(false);
    }
  }, [authError, user]);

  const updateDeadlines = useCallback(
    async (nextDeadlines: QuestDeadlines) => {
      if (!team) return;
      await saveQuestDeadlines(team.teamId, nextDeadlines);
      setDeadlines(nextDeadlines);
    },
    [team],
  );

  const markSubmittedToday = useCallback(() => {
    setHasSubmittedToday(true);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return (
    <DailyQuestContext.Provider
      value={{
        loading: authLoading || loading,
        quest,
        team,
        deadlines,
        hasSubmittedToday,
        error,
        refresh,
        updateDeadlines,
        markSubmittedToday,
      }}>
      {children}
    </DailyQuestContext.Provider>
  );
}

export function useDailyQuest() {
  const context = useContext(DailyQuestContext);
  if (!context) throw new Error('useDailyQuest must be used within DailyQuestProvider');
  return context;
}
