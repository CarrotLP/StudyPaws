import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  type ChestCounts,
  type ChestId,
  DEFAULT_CHESTS,
  DEFAULT_POINTS,
  loadChests,
  loadPoints,
  saveChests,
  savePoints,
} from '@/lib/haven-storage';

type EconomyContextValue = {
  hydrated: boolean;
  points: number;
  chests: ChestCounts;
  /** Add (or subtract, with a negative delta) points; never goes below 0. */
  addPoints: (delta: number) => void;
  /** Add or remove (negative n) earned chests of a type; never below 0. */
  addChest: (id: ChestId, n?: number) => void;
};

const EconomyContext = createContext<EconomyContextValue | null>(null);

export function EconomyProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [chests, setChests] = useState<ChestCounts>(DEFAULT_CHESTS);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadPoints(), loadChests()]).then(([p, c]) => {
      if (!mounted) return;
      setPoints(p);
      setChests(c);
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) savePoints(points);
  }, [hydrated, points]);

  useEffect(() => {
    if (hydrated) saveChests(chests);
  }, [hydrated, chests]);

  const addPoints = useCallback((delta: number) => {
    setPoints((p) => Math.max(0, p + delta));
  }, []);

  const addChest = useCallback((id: ChestId, n = 1) => {
    setChests((c) => ({ ...c, [id]: Math.max(0, c[id] + n) }));
  }, []);

  return (
    <EconomyContext.Provider value={{ hydrated, points, chests, addPoints, addChest }}>
      {children}
    </EconomyContext.Provider>
  );
}

export function useEconomy() {
  const ctx = useContext(EconomyContext);
  if (!ctx) throw new Error('useEconomy must be used within EconomyProvider');
  return ctx;
}
