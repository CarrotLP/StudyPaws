import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { Alert, AppState } from 'react-native';

import {
    updateUserActivityStatus,
    type ActivityStatus,
} from '@/backend/services/user.services';
import { HabitColors } from '../constants/havenTheme';
import {
    DEFAULT_SESSION,
    loadSession,
    saveSession,
    type HabitId,
    type SessionPhase,
} from '../lib/haven-storage';
import { useAuth } from './use-auth';
import { useEconomy } from './use-economy';
import { useStudyHistory } from './use-study-history';

export type { HabitId, SessionPhase } from '../lib/haven-storage';

export type BreakHabit = {
  id: HabitId;
  name: string;
  desc: string;
  guidance: [string, string];
  pts: number;
  color: string;
};

// Copy is matched verbatim to haven_prototype.html.
export const HABITS: BreakHabit[] = [
  {
    id: 'phoneoff',
    name: 'Phone Off',
    desc: 'Turn your screen off until the break ends.',
    guidance: ['Mochi is resting too.', 'Come back when it ends.'],
    pts: 15,
    color: HabitColors.phoneoff,
  },
  {
    id: 'stretch',
    name: 'Stretch',
    desc: 'Stand up. Roll your shoulders. Touch your toes.',
    guidance: ['Take five slow stretches.', 'Mochi is waiting for you.'],
    pts: 20,
    color: HabitColors.stretch,
  },
  {
    id: 'steps',
    name: 'Take a Walk',
    desc: 'Step outside, even just to the kitchen.',
    guidance: ['Step away. Move around.', 'Mochi will be here.'],
    pts: 25,
    color: HabitColors.steps,
  },
  {
    id: 'water',
    name: 'Drink Water',
    desc: 'Refill your glass. Finish it.',
    guidance: ['Refill. Drink it all.', 'Mochi approves.'],
    pts: 10,
    color: HabitColors.water,
  },
  {
    id: 'dailyquest',
    name: 'Complete Daily Quest',
    desc: 'Step away from your desk for a quick challenge for +10 study points (until 8pm).',
    guidance: ["Take today's photo.", 'See the quest card for details.'],
    pts: 10,
    color: HabitColors.dailyquest,
  },
];

// What the break activity list actually shows. For now only the daily quest is
// implemented, so it's the sole (and first) option. The other habits stay in the
// HABITS array above (and in HabitId) so existing data/history aren't broken;
// they're hidden from the live list until they're built out.
// To re-enable them later, add their ids back to this allow-list.
const VISIBLE_HABIT_IDS: BreakHabit['id'][] = ['dailyquest'];
const VISIBLE_HABITS = VISIBLE_HABIT_IDS.map(
  (id) => HABITS.find((h) => h.id === id)!,
);

const STUDY_REWARD_POINTS = 50;
const STUDY_STEP = 5 * 60;
const BREAK_STEP = 60;
const STUDY_MIN = 60;
const STUDY_MAX = 60 * 60;
const BREAK_MIN = 60;
const BREAK_MAX = 30 * 60;

type SessionState = {
  hydrated: boolean;
  todayMinutes: number;
  phase: SessionPhase;
  studyDuration: number;
  breakDuration: number;
  secondsLeft: number;
  /** The sub-activity currently open during break_active (null = on the list). */
  activeBreakHabit: BreakHabit | null;
  /** Habits already claimed in this break session (once-per-session). */
  completedBreakHabits: HabitId[];
  /** True if the break timer expired while the user was inside a sub-activity. */
  breakExpiredWhileInActivity: boolean;
  toast: { msg: string; key: number } | null;
  habits: BreakHabit[];
};

type SessionActions = {
  startStudy: () => void;
  stopSession: () => void;
  startBreak: () => void;
  openBreakActivity: (habit: BreakHabit) => void;
  closeBreakActivity: () => void;
  completeBreakActivity: () => void;
  endBreak: () => void;
  devSkip: () => void;
  decStudy: () => void;
  incStudy: () => void;
  decBreak: () => void;
  incBreak: () => void;
};

// Split into two contexts so consumers that only need actions (e.g. the reset
// button) don't re-render every second when the countdown ticks.
const StateContext = createContext<SessionState | null>(null);
const ActionsContext = createContext<SessionActions | null>(null);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

export function StudySessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { todayMinutes, addMinutesToday } = useStudyHistory();
  const { addPoints } = useEconomy();

  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [studyDuration, setStudyDuration] = useState(DEFAULT_SESSION.studyDuration);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_SESSION.breakDuration);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [intendedDuration, setIntendedDuration] = useState<number | null>(null);
  // `breakHabitId` now means "the sub-activity currently open during break_active"
  // (null = on the habit list). It opens/closes freely; it does NOT start a timer.
  const [breakHabitId, setBreakHabitId] = useState<HabitId | null>(null);
  // Per-break-session state (not persisted; resets on launch).
  const [completedBreakHabits, setCompletedBreakHabits] = useState<HabitId[]>([]);
  const [breakExpiredWhileInActivity, setBreakExpiredWhileInActivity] = useState(false);

  // `now` is bumped by the 1s interval and on resume; it only triggers
  // re-renders. Remaining time is derived from wall-clock subtraction below.
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  // Guards completion from firing more than once per started timer.
  const firedRef = useRef(false);
  const lastActivityStatusRef = useRef<{ userId: string; status: ActivityStatus } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const secondsLeft =
    startedAt != null && intendedDuration != null
      ? Math.max(0, Math.ceil(intendedDuration - (now - startedAt) / 1000))
      : 0;

  const showToast = useCallback((msg: string) => {
    setToast({ msg, key: Date.now() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const setActivityStatus = useCallback(
    (status: ActivityStatus) => {
      Alert.alert(
        'Activity status update',
        `setActivityStatus("${status}") was called.\n\nCurrent user: ${user?.id ?? 'none'}`,
      );

      if (!user?.id) {
        Alert.alert('Activity status update failed', 'No signed-in user was available.');
        return;
      }

      const lastActivityStatus = lastActivityStatusRef.current;
      if (lastActivityStatus?.userId === user.id && lastActivityStatus.status === status) return;

      lastActivityStatusRef.current = { userId: user.id, status };
      void updateUserActivityStatus(user.id, status).catch((error) => {
        console.warn('Failed to update activity status:', error);
        if (
          lastActivityStatusRef.current?.userId === user.id &&
          lastActivityStatusRef.current.status === status
        ) {
          lastActivityStatusRef.current = null;
        }
        Alert.alert(
          'Activity status update failed',
          `Tried to set "${status}" for user ${user.id}.\n\n${getErrorMessage(error)}`,
        );
      });
    },
    [user?.id],
  );

  useEffect(() => {
    if (!hydrated) return;

    if (phase === 'studying') {
      setActivityStatus('studying');
    } else if (phase === 'break_active') {
      setActivityStatus('on a break');
    } else {
      setActivityStatus('not studying');
    }
  }, [hydrated, phase, setActivityStatus]);

  // Hydrate from storage once. A timer that already elapsed while the app was
  // killed will resume here and be completed by the effect below.
  useEffect(() => {
    let mounted = true;
    loadSession().then((s) => {
      if (!mounted) return;
      // Migrate any pre-restructure phase value to a known one. (Old saves can
      // hold 'break_choosing'/'break_doing'; those don't exist anymore.)
      const KNOWN: SessionPhase[] = [
        'idle',
        'studying',
        'break_intro',
        'break_active',
        'break_expired_prompt',
        'finished',
      ];
      setPhase((KNOWN as string[]).includes(s.phase) ? s.phase : 'idle');
      setStudyDuration(s.studyDuration);
      setBreakDuration(s.breakDuration);
      setStartedAt(s.startedAt);
      setIntendedDuration(s.intendedDuration);
      setBreakHabitId(s.breakHabitId);
      firedRef.current = false;
      setNow(Date.now());
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Persist the session on any change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    saveSession({ phase, startedAt, intendedDuration, breakHabitId, studyDuration, breakDuration });
  }, [hydrated, phase, startedAt, intendedDuration, breakHabitId, studyDuration, breakDuration]);

  // 1s tick only while a timer is running — purely to re-render the countdown.
  // (Sub-activities inside break_active have no timer; the parent break timer
  // still counts down via this same interval.)
  useEffect(() => {
    if (phase !== 'studying' && phase !== 'break_active') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Recompute against the wall clock the moment the app returns to foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => sub.remove();
  }, []);

  // Completion: fires when the wall clock says the timer reached zero.
  //
  //   - studying  -> award focus block (+pts +chest +today minutes) and move to
  //                  `break_intro`. Points are awarded HERE, before the user
  //                  taps the intro CTA, so closing the app at this moment
  //                  doesn't cost them what they earned.
  //   - break_active on the habit LIST -> jump straight to the expired prompt.
  //   - break_active inside a sub-activity -> DO NOT interrupt. Just mark the
  //                  `breakExpiredWhileInActivity` flag; the prompt fires when
  //                  the user closes the activity (via Complete or back).
  useEffect(() => {
    if (!hydrated) return;
    if (phase !== 'studying' && phase !== 'break_active') return;
    if (secondsLeft > 0 || firedRef.current) return;
    firedRef.current = true;

    if (phase === 'studying') {
      const studiedMinutes = Math.ceil((intendedDuration ?? studyDuration) / 60);
      addMinutesToday(studiedMinutes);
      setActivityStatus('not studying');

      // Stop the timer immediately
      setStartedAt(null);
      setIntendedDuration(null);

      // Await point update before triggering the phase transition/UI refresh
      const handleCompletion = async () => {
        await addPoints(STUDY_REWARD_POINTS);
        showToast(`Focus complete · +${STUDY_REWARD_POINTS} ✦`);
        setPhase('break_intro');
      };
      handleCompletion();
    } else {
      // break_active timer hit zero.
      setActivityStatus('not studying');
      setStartedAt(null);
      setIntendedDuration(null);
      if (breakHabitId) {
        setBreakExpiredWhileInActivity(true); // defer prompt until they exit
      } else {
        setPhase('break_expired_prompt');
      }
    }
  }, [
    hydrated,
    phase,
    secondsLeft,
    intendedDuration,
    studyDuration,
    breakHabitId,
    showToast,
    addMinutesToday,
    addPoints,
    setActivityStatus,
  ]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const startStudy = useCallback(() => {
    firedRef.current = false;
    setBreakHabitId(null);
    setCompletedBreakHabits([]);
    setBreakExpiredWhileInActivity(false);
    setIntendedDuration(studyDuration);
    setStartedAt(Date.now());
    setNow(Date.now());
    setPhase('studying');
  }, [studyDuration]);

  // "Give up" (studying) and dev reset. Returns fully to idle.
  const stopSession = useCallback(() => {
    firedRef.current = false;
    setPhase('idle');
    setStartedAt(null);
    setIntendedDuration(null);
    setBreakHabitId(null);
    setCompletedBreakHabits([]);
    setBreakExpiredWhileInActivity(false);
  }, []);

  // break_intro CTA: kick off the wall-clock break timer and enter the list.
  const startBreak = useCallback(() => {
    firedRef.current = false;
    setBreakHabitId(null);
    setCompletedBreakHabits([]);
    setBreakExpiredWhileInActivity(false);
    setIntendedDuration(breakDuration);
    setStartedAt(Date.now());
    setNow(Date.now());
    setPhase('break_active');
  }, [breakDuration]);

  // Tap a habit in the list — open its sub-activity view. No timer is started.
  const openBreakActivity = useCallback(
    (habit: BreakHabit) => {
      if (completedBreakHabits.includes(habit.id)) return; // once per break
      setBreakHabitId(habit.id);
    },
    [completedBreakHabits],
  );

  // Back out of a sub-activity without claiming. If the break timer expired
  // while we were in here, surface the expired prompt now.
  const closeBreakActivity = useCallback(() => {
    setBreakHabitId(null);
    if (breakExpiredWhileInActivity) {
      setBreakExpiredWhileInActivity(false);
      setPhase('break_expired_prompt');
    }
  }, [breakExpiredWhileInActivity]);

  // Finish a sub-activity: award its points, mark it done, return to the list
  // (or to the expired prompt if the parent timer expired while inside).
  const completeBreakActivity = useCallback(() => {
    if (!breakHabitId) return;
    const habit = HABITS.find((h) => h.id === breakHabitId);
    if (habit && !completedBreakHabits.includes(habit.id)) {
      const finishActivity = async () => {
        await addPoints(habit.pts);
        setCompletedBreakHabits((prev) => [...prev, habit.id]);
        showToast(`${habit.name} · +${habit.pts} ✦`);
      };
      finishActivity();
    }
    setBreakHabitId(null);
    if (breakExpiredWhileInActivity) {
      setBreakExpiredWhileInActivity(false);
      setPhase('break_expired_prompt');
    }
  }, [
    breakHabitId,
    completedBreakHabits,
    breakExpiredWhileInActivity,
    addPoints,
    showToast,
  ]);

  // "End break early" (list) and "End break" (expired prompt) → finished.
  const endBreak = useCallback(() => {
    firedRef.current = false;
    setPhase('finished');
    setStartedAt(null);
    setIntendedDuration(null);
    setBreakHabitId(null);
    setBreakExpiredWhileInActivity(false);
    // `completedBreakHabits` is reset on the next session start.
  }, []);

  // DEV ONLY: rewind the start time so the wall clock leaves ~2s on the active
  // timer; it then completes through the normal transition logic.
  const devSkip = useCallback(() => {
    if (startedAt == null || intendedDuration == null) return;
    setStartedAt(Date.now() - Math.max(0, intendedDuration - 2) * 1000);
    setNow(Date.now());
  }, [startedAt, intendedDuration]);

  const decStudy = useCallback(() => setStudyDuration((d) => Math.max(STUDY_MIN, d - STUDY_STEP)), []);
  const incStudy = useCallback(() => setStudyDuration((d) => Math.min(STUDY_MAX, d + STUDY_STEP)), []);
  const decBreak = useCallback(() => setBreakDuration((d) => Math.max(BREAK_MIN, d - BREAK_STEP)), []);
  const incBreak = useCallback(() => setBreakDuration((d) => Math.min(BREAK_MAX, d + BREAK_STEP)), []);

  const activeBreakHabit = breakHabitId ? (HABITS.find((h) => h.id === breakHabitId) ?? null) : null;

  const state: SessionState = {
    hydrated,
    todayMinutes,
    phase,
    studyDuration,
    breakDuration,
    secondsLeft,
    activeBreakHabit,
    completedBreakHabits,
    breakExpiredWhileInActivity,
    toast,
    habits: VISIBLE_HABITS,
  };

  const actions = useMemo<SessionActions>(
    () => ({
      startStudy,
      stopSession,
      startBreak,
      openBreakActivity,
      closeBreakActivity,
      completeBreakActivity,
      endBreak,
      devSkip,
      decStudy,
      incStudy,
      decBreak,
      incBreak,
    }),
    [
      startStudy,
      stopSession,
      startBreak,
      openBreakActivity,
      closeBreakActivity,
      completeBreakActivity,
      endBreak,
      devSkip,
      decStudy,
      incStudy,
      decBreak,
      incBreak,
    ],
  );

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

/** Full session (state + actions) — for the Home screen. */
export function useStudySession() {
  const state = useContext(StateContext);
  const actions = useContext(ActionsContext);
  if (!state || !actions) throw new Error('useStudySession must be used within StudySessionProvider');
  return { ...state, ...actions };
}

/** Actions only — for consumers (e.g. reset) that must not re-render each tick. */
export function useStudySessionActions() {
  const actions = useContext(ActionsContext);
  if (!actions) throw new Error('useStudySessionActions must be used within StudySessionProvider');
  return actions;
}
