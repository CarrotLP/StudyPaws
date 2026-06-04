import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { isWithinWindow, type QuestWindow } from '@/constants/questWindows';

/** How often the gate re-checks the device clock while the screen is open. */
const TICK_MS = 30_000;

/**
 * Returns whether the device clock is currently inside `win`, re-evaluating both
 * when the screen regains focus and on a ~30s interval — so a quest option /
 * voting UI appears or disappears as a window boundary passes while open.
 *
 * Local/device-clock only (prototype). `win` is expected to be a stable
 * reference from QUEST_WINDOWS.
 */
export function useWithinWindow(win: QuestWindow): boolean {
  const [open, setOpen] = useState(() => isWithinWindow(win));

  useEffect(() => {
    const id = setInterval(() => setOpen(isWithinWindow(win)), TICK_MS);
    return () => clearInterval(id);
  }, [win]);

  useFocusEffect(
    useCallback(() => {
      setOpen(isWithinWindow(win));
    }, [win]),
  );

  return open;
}
