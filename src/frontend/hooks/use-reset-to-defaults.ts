import { useCallback } from 'react';

import { useEconomy } from './use-economy';
import { useStudyHistory } from './use-study-history';
import { useStudySessionActions } from './use-study-session';
import { updateUserPoints } from '@/backend/services/user.services';
import { useAuth } from './use-auth';

/**
 * DEV reset: restore defaults for TODAY's study minutes and points.
 */
export function useResetToDefaults() {
  const { user } = useAuth();
  const { refreshPoints } = useEconomy();
  const { resetToday } = useStudyHistory();
  const { stopSession } = useStudySessionActions();

  return useCallback(async () => {
    stopSession(); // cancel any in-progress session
    resetToday(); // today's minutes -> 0

    if (user) {
      const DEFAULT_POINTS = 300;
      try {
        await updateUserPoints(user.id, DEFAULT_POINTS);
        await refreshPoints();
      } catch (err) {
        console.error('Failed to reset points:', err);
      }
    }
  }, [stopSession, resetToday, user, refreshPoints]);
}
