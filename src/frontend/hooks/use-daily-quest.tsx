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
import { getQuestForDate, type DailyQuestRecord } from '@/services/dailyQuest.services';
import { getTeamsForUser, type UserTeam } from '@/services/userTeam.services';

type DailyQuestContextValue = {
  loading: boolean;
  quest: DailyQuestRecord | null;
  team: UserTeam | null;
  error: string | null;
  refresh: () => Promise<void>;
};

const DailyQuestContext = createContext<DailyQuestContextValue | null>(null);

export function DailyQuestProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading, user, error: authError } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quest, setQuest] = useState<DailyQuestRecord | null>(null);
  const [team, setTeam] = useState<UserTeam | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setQuest(null);
      setTeam(null);
      setError(authError ?? 'Demo user is not signed in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [teams, todaysQuest] = await Promise.all([
        getTeamsForUser(user.id),
        getQuestForDate(utcDateKey()),
      ]);

      setTeam(teams[0] ?? null);
      setQuest(todaysQuest);
    } catch (loadError) {
      setTeam(null);
      setQuest(null);
      setError(loadError instanceof Error ? loadError.message : 'Could not load today’s quest.');
    } finally {
      setLoading(false);
    }
  }, [authError, user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return (
    <DailyQuestContext.Provider value={{ loading: authLoading || loading, quest, team, error, refresh }}>
      {children}
    </DailyQuestContext.Provider>
  );
}

export function useDailyQuest() {
  const context = useContext(DailyQuestContext);
  if (!context) throw new Error('useDailyQuest must be used within DailyQuestProvider');
  return context;
}
