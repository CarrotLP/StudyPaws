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
import { AppState } from 'react-native';

import { HabitColors } from '../constants/havenTheme';
import {
    DEFAULT_SESSION,
    loadSession,
    saveSession,
    type HabitId,
    type SessionPhase,
} from '../lib/haven-storage';
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
];

const STUDY_REWARD_POINTS = 50;
const STUDY_STEP = 5 * 60;
const BREAK_STEP = 60;
const STUDY_MIN = 60;
const STUDY_MAX = 60 * 60;
const BREAK_MIN = 60;
const BREAK_MAX = 30 * 60;

type SessionState = {
  hydrated: boolean;
  points: number;
  todayMinutes: number;
  phase: SessionPhase;
  studyDuration: number;
  breakDuration: number;
  secondsLeft: number;
  activeBreakHabit: BreakHabit | null;
  toast: { msg: string; key: number } | null;
  habits: BreakHabit[];
};

type SessionActions = {
  startStudy: () => void;
  stopSession: () => void;
  chooseBreakHabit: (habit: BreakHabit) => void;
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

export function StudySessionProvider({ children }: { children: ReactNode }) {
  const { todayMinutes, addMinutesToday } = useStudyHistory();
  const { points, addPoints, addChest } = useEconomy();

  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [studyDuration, setStudyDuration] = useState(DEFAULT_SESSION.studyDuration);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_SESSION.breakDuration);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [intendedDuration, setIntendedDuration] = useState<number | null>(null);
  const [breakHabitId, setBreakHabitId] = useState<HabitId | null>(null);

  // `now` is bumped by the 1s interval and on resume; it only triggers
  // re-renders. Remaining time is derived from wall-clock subtraction below.
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  // Guards completion from firing more than once per started timer.
  const firedRef = useRef(false);
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

  // Hydrate from storage once. A timer that already elapsed while the app was
  // killed will resume here and be completed by the effect below.
  useEffect(() => {
    let mounted = true;
    loadSession().then((s) => {
      if (!mounted) return;
      setPhase(s.phase);
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
  useEffect(() => {
    if (phase !== 'studying' && phase !== 'break_doing') return;
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
  useEffect(() => {
    if (!hydrated) return;
    if (phase !== 'studying' && phase !== 'break_doing') return;
    if (secondsLeft > 0 || firedRef.current) return;
    firedRef.current = true;

    if (phase === 'studying') {
      const studiedMinutes = Math.ceil((intendedDuration ?? studyDuration) / 60);
      addMinutesToday(studiedMinutes);
      addPoints(STUDY_REWARD_POINTS);
      addChest('small');
      showToast(`Focus complete · +${STUDY_REWARD_POINTS} ✦ · +1 chest`);
      setPhase('break_choosing');
      setStartedAt(null);
      setIntendedDuration(null);
    } else {
      const habit = HABITS.find((h) => h.id === breakHabitId);
      if (habit) {
        addPoints(habit.pts);
        showToast(`${habit.name} · +${habit.pts} ✦`);
      }
      setPhase('finished');
      setStartedAt(null);
      setIntendedDuration(null);
      setBreakHabitId(null);
    }
  }, [hydrated, phase, secondsLeft, intendedDuration, studyDuration, breakHabitId, showToast, addMinutesToday, addPoints, addChest]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const startStudy = useCallback(() => {
    firedRef.current = false;
    setBreakHabitId(null);
    setIntendedDuration(studyDuration);
    setStartedAt(Date.now());
    setNow(Date.now());
    setPhase('studying');
  }, [studyDuration]);

  const stopSession = useCallback(() => {
    firedRef.current = false;
    setPhase('idle');
    setStartedAt(null);
    setIntendedDuration(null);
    setBreakHabitId(null);
  }, []);

  const chooseBreakHabit = useCallback(
    (habit: BreakHabit) => {
      firedRef.current = false;
      setBreakHabitId(habit.id);
      setIntendedDuration(breakDuration);
      setStartedAt(Date.now());
      setNow(Date.now());
      setPhase('break_doing');
    },
    [breakDuration],
  );

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
    points,
    todayMinutes,
    phase,
    studyDuration,
    breakDuration,
    secondsLeft,
    activeBreakHabit,
    toast,
    habits: HABITS,
  };

  const actions = useMemo<SessionActions>(
    () => ({ startStudy, stopSession, chooseBreakHabit, devSkip, decStudy, incStudy, decBreak, incBreak }),
    [startStudy, stopSession, chooseBreakHabit, devSkip, decStudy, incStudy, decBreak, incBreak],
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
