import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionPhase = 'idle' | 'studying' | 'break_choosing' | 'break_doing' | 'finished';
export type HabitId = 'phoneoff' | 'stretch' | 'steps' | 'water';

/**
 * The single persisted blob for Haven. `session` captures everything needed to
 * resume an in-flight timer after backgrounding, locking, or a cold restart:
 * `startedAt` is wall-clock epoch ms, `intendedDuration` is the timer length in
 * seconds, so remaining time is always recomputed from the clock — never from a
 * counter that pauses when the app is suspended.
 */
export type PersistedHaven = {
  points: number;
  chests: { small: number; ornate: number };
  history: Record<string, number>; // ISO date (YYYY-MM-DD) -> study minutes
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
  history: {},
  session: {
    phase: 'idle',
    startedAt: null,
    intendedDuration: null,
    breakHabitId: null,
    studyDuration: DEFAULT_STUDY_DURATION,
    breakDuration: DEFAULT_BREAK_DURATION,
  },
};

const STORAGE_KEY = 'haven.state.v1';

export async function loadHavenState(): Promise<PersistedHaven> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HAVEN_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedHaven>;
    return {
      ...DEFAULT_HAVEN_STATE,
      ...parsed,
      chests: { ...DEFAULT_HAVEN_STATE.chests, ...(parsed.chests ?? {}) },
      history: parsed.history ?? {},
      session: { ...DEFAULT_HAVEN_STATE.session, ...(parsed.session ?? {}) },
    };
  } catch {
    return DEFAULT_HAVEN_STATE;
  }
}

export async function saveHavenState(state: PersistedHaven): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is best-effort; a failed write shouldn't crash the session.
  }
}
