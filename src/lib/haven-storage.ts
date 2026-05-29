import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionPhase = 'idle' | 'studying' | 'break_choosing' | 'break_doing' | 'finished';
export type HabitId = 'phoneoff' | 'stretch' | 'steps' | 'water';
export type StudyHistory = Record<string, number>; // YYYY-MM-DD -> study minutes

/**
 * The persisted session/economy blob. `session` captures everything needed to
 * resume an in-flight timer after backgrounding, locking, or a cold restart:
 * `startedAt` is wall-clock epoch ms, `intendedDuration` is the timer length in
 * seconds, so remaining time is always recomputed from the clock — never from a
 * counter that pauses when the app is suspended. Study history lives under its
 * own key (see below), shared between Home and Calendar.
 */
export type PersistedHaven = {
  points: number;
  chests: { small: number; ornate: number };
  session: {
    phase: SessionPhase;
    startedAt: number | null;
    intendedDuration: number | null;
    breakHabitId: HabitId | null;
    studyDuration: number;
    breakDuration: number;
  };
};

export const DEFAULT_STUDY_DURATION = 25 * 60;
export const DEFAULT_BREAK_DURATION = 5 * 60;

export const DEFAULT_HAVEN_STATE: PersistedHaven = {
  points: 245,
  chests: { small: 1, ornate: 0 },
  session: {
    phase: 'idle',
    startedAt: null,
    intendedDuration: null,
    breakHabitId: null,
    studyDuration: DEFAULT_STUDY_DURATION,
    breakDuration: DEFAULT_BREAK_DURATION,
  },
};

// Every AsyncStorage key is defined here once and imported elsewhere.
const STATE_KEY = 'haven.state.v1';
const STUDY_HISTORY_KEY = 'haven.studyHistory';
const FIRST_LAUNCH_KEY = 'haven.firstLaunchDone';

export async function loadHavenState(): Promise<PersistedHaven> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) return DEFAULT_HAVEN_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedHaven>;
    return {
      ...DEFAULT_HAVEN_STATE,
      ...parsed,
      chests: { ...DEFAULT_HAVEN_STATE.chests, ...(parsed.chests ?? {}) },
      session: { ...DEFAULT_HAVEN_STATE.session, ...(parsed.session ?? {}) },
    };
  } catch {
    return DEFAULT_HAVEN_STATE;
  }
}

export async function saveHavenState(state: PersistedHaven): Promise<void> {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is best-effort; a failed write shouldn't crash the session.
  }
}

export async function loadStudyHistory(): Promise<StudyHistory> {
  try {
    const raw = await AsyncStorage.getItem(STUDY_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as StudyHistory) : {};
  } catch {
    return {};
  }
}

export async function saveStudyHistory(history: StudyHistory): Promise<void> {
  try {
    await AsyncStorage.setItem(STUDY_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Best-effort.
  }
}

export async function isFirstLaunch(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(FIRST_LAUNCH_KEY)) == null;
  } catch {
    return false;
  }
}

export async function markFirstLaunchDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, '1');
  } catch {
    // Best-effort.
  }
}
