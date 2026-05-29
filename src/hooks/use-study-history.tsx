import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { dateKey } from '@/lib/haven-format';
import {
  isFirstLaunch,
  loadStudyHistory,
  markFirstLaunchDone,
  saveStudyHistory,
  type StudyHistory,
} from '@/lib/haven-storage';

// Pre-seed ~5 weeks of plausible minutes on first launch, mirroring the
// prototype's generateFakeHistory. Today starts at 0 and grows via sessions.
function generateSeedHistory(): StudyHistory {
  const map: StudyHistory = {};
  const today = new Date();
  for (let i = 0; i < 35; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const r = Math.random();
    let mins: number;
    if (r < 0.25) mins = 0;
    else if (r < 0.55) mins = Math.floor(20 + Math.random() * 40);
    else if (r < 0.85) mins = Math.floor(60 + Math.random() * 60);
    else mins = Math.floor(120 + Math.random() * 90);
    map[dateKey(d)] = mins;
  }
  map[dateKey(today)] = 0;
  return map;
}

type StudyHistoryContextValue = {
  hydrated: boolean;
  history: StudyHistory;
  todayMinutes: number;
  addMinutesToday: (minutes: number) => void;
};

const StudyHistoryContext = createContext<StudyHistoryContextValue | null>(null);

export function StudyHistoryProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory] = useState<StudyHistory>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      let initial: StudyHistory;
      if (await isFirstLaunch()) {
        initial = generateSeedHistory();
        await saveStudyHistory(initial);
        await markFirstLaunchDone();
      } else {
        initial = await loadStudyHistory();
      }
      if (mounted) {
        setHistory(initial);
        setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) saveStudyHistory(history);
  }, [hydrated, history]);

  const addMinutesToday = useCallback((minutes: number) => {
    setHistory((h) => {
      const key = dateKey(new Date());
      return { ...h, [key]: (h[key] ?? 0) + minutes };
    });
  }, []);

  const todayMinutes = history[dateKey(new Date())] ?? 0;

  return (
    <StudyHistoryContext.Provider value={{ hydrated, history, todayMinutes, addMinutesToday }}>
      {children}
    </StudyHistoryContext.Provider>
  );
}

export function useStudyHistory() {
  const ctx = useContext(StudyHistoryContext);
  if (!ctx) throw new Error('useStudyHistory must be used within StudyHistoryProvider');
  return ctx;
}
