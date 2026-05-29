import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { HabitColors } from '@/constants/havenTheme';
import { useStudyHistory } from '@/hooks/use-study-history';
import {
  DEFAULT_HAVEN_STATE,
  type HabitId,
  loadHavenState,
  saveHavenState,
  type SessionPhase,
} from '@/lib/haven-storage';

export type { HabitId, SessionPhase } from '@/lib/haven-storage';

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

export function useStudySession() {
  const { todayMinutes, addMinutesToday } = useStudyHistory();

  const [hydrated, setHydrated] = useState(false);
  const [points, setPoints] = useState(DEFAULT_HAVEN_STATE.points);
  const [chests, setChests] = useState(DEFAULT_HAVEN_STATE.chests);

  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [studyDuration, setStudyDuration] = useState(DEFAULT_HAVEN_STATE.session.studyDuration);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_HAVEN_STATE.session.breakDuration);
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
    loadHavenState().then((s) => {
      if (!mounted) return;
      setPoints(s.points);
      setChests(s.chests);
      setPhase(s.session.phase);
      setStudyDuration(s.session.studyDuration);
      setBreakDuration(s.session.breakDuration);
      setStartedAt(s.session.startedAt);
      setIntendedDuration(s.session.intendedDuration);
      setBreakHabitId(s.session.breakHabitId);
      firedRef.current = false;
      setNow(Date.now());
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Persist on any change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    saveHavenState({
      points,
      chests,
      session: { phase, startedAt, intendedDuration, breakHabitId, studyDuration, breakDuration },
    });
  }, [
    hydrated,
    points,
    chests,
    phase,
    startedAt,
    intendedDuration,
    breakHabitId,
    studyDuration,
    breakDuration,
  ]);

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
      setPoints((p) => p + STUDY_REWARD_POINTS);
      setChests((c) => ({ ...c, small: c.small + 1 }));
      showToast(`Focus complete · +${STUDY_REWARD_POINTS} ✦ · +1 chest`);
      setPhase('break_choosing');
      setStartedAt(null);
      setIntendedDuration(null);
    } else {
      const habit = HABITS.find((h) => h.id === breakHabitId);
      if (habit) {
        setPoints((p) => p + habit.pts);
        showToast(`${habit.name} · +${habit.pts} ✦`);
      }
      setPhase('finished');
      setStartedAt(null);
      setIntendedDuration(null);
      setBreakHabitId(null);
    }
  }, [hydrated, phase, secondsLeft, intendedDuration, studyDuration, breakHabitId, showToast, addMinutesToday]);

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

  const decStudy = useCallback(() => setStudyDuration((d) => Math.max(STUDY_MIN, d - STUDY_STEP)), []);
  const incStudy = useCallback(() => setStudyDuration((d) => Math.min(STUDY_MAX, d + STUDY_STEP)), []);
  const decBreak = useCallback(() => setBreakDuration((d) => Math.max(BREAK_MIN, d - BREAK_STEP)), []);
  const incBreak = useCallback(() => setBreakDuration((d) => Math.min(BREAK_MAX, d + BREAK_STEP)), []);

  const activeBreakHabit = breakHabitId ? (HABITS.find((h) => h.id === breakHabitId) ?? null) : null;

  return {
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
    startStudy,
    stopSession,
    chooseBreakHabit,
    decStudy,
    incStudy,
    decBreak,
    incBreak,
  };
}
