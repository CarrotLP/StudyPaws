import { useCallback } from 'react';

import { useEconomy } from '@/hooks/use-economy';
import { useOutfit } from '@/hooks/use-outfit';
import { useStudyHistory } from '@/hooks/use-study-history';
import { useStudySessionActions } from '@/hooks/use-study-session';

/**
 * DEV reset: restore first-launch defaults for points, chests, owned items,
 * outfit, and TODAY's study minutes. Every prior day in the history map and the
 * "first launch" sentinel are left untouched. Each provider persists its own
 * slice via its save-on-change effect, so the reset survives a relaunch.
 */
export function useResetToDefaults() {
  const { resetEconomy } = useEconomy();
  const { resetOutfit } = useOutfit();
  const { resetToday } = useStudyHistory();
  const { stopSession } = useStudySessionActions();

  return useCallback(() => {
    stopSession(); // cancel any in-progress session like "give up" — no award
    resetEconomy(); // points -> 245, chests -> { small: 1, ornate: 0 }
    resetOutfit(); // owned -> [scarf, glasses], outfit -> default
    resetToday(); // today's minutes -> 0 (prior days preserved)
  }, [stopSession, resetEconomy, resetOutfit, resetToday]);
}
