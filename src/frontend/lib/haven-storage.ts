import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadPhoto } from '@/services/gallery.services';

export type SessionPhase =
  | 'idle'
  | 'studying'
  | 'break_intro'
  | 'break_active'
  | 'break_expired_prompt'
  | 'finished';
export type HabitId = 'phoneoff' | 'stretch' | 'steps' | 'water' | 'dailyquest';
export type StudyHistory = Record<string, number>; // YYYY-MM-DD -> study minutes
export type ChestId = 'small' | 'ornate';
export type ChestCounts = { small: number; ornate: number };

/**
 * The persisted study session. `startedAt` is wall-clock epoch ms and
 * `intendedDuration` is the timer length in seconds, so remaining time is always
 * recomputed from the clock — never from a counter that pauses when the app is
 * suspended. Points, chests, history, owned, and outfit each live under their
 * own keys (below) so they can be shared across screens via context.
 */
export type PersistedSession = {
  phase: SessionPhase;
  startedAt: number | null;
  intendedDuration: number | null;
  breakHabitId: HabitId | null;
  studyDuration: number;
  breakDuration: number;
};

export const DEFAULT_STUDY_DURATION = 25 * 60;
export const DEFAULT_BREAK_DURATION = 5 * 60;

export const DEFAULT_SESSION: PersistedSession = {
  phase: 'idle',
  startedAt: null,
  intendedDuration: null,
  breakHabitId: null,
  studyDuration: DEFAULT_STUDY_DURATION,
  breakDuration: DEFAULT_BREAK_DURATION,
};

export const DEFAULT_POINTS = 245;
export const DEFAULT_CHESTS: ChestCounts = { small: 1, ornate: 0 };

// Prototype starting wardrobe: owns + wears scarf and glasses.
export const DEFAULT_OWNED: string[] = ['scarf', 'glasses'];
export const DEFAULT_OUTFIT: Record<string, string | null> = {
  head: null,
  face: 'glasses',
  neck: 'scarf',
  body: null,
};

/** Daily quest photo URIs, keyed by ISO local date (YYYY-MM-DD). */
export type QuestPhotoMap = Record<string, string>;

// Every AsyncStorage key is defined here once and imported elsewhere.
const SESSION_KEY = 'haven.session';
const POINTS_KEY = 'haven.points';
const CHESTS_KEY = 'haven.chests';
const STUDY_HISTORY_KEY = 'haven.studyHistory';
const FIRST_LAUNCH_KEY = 'haven.firstLaunchDone';
const OWNED_KEY = 'haven.owned';
const OUTFIT_KEY = 'haven.outfit';
const QUEST_PHOTOS_KEY = 'haven.questPhotos';

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; a failed write shouldn't crash anything.
  }
}

export async function loadSession(): Promise<PersistedSession> {
  const parsed = await readJSON<Partial<PersistedSession>>(SESSION_KEY, {});
  return { ...DEFAULT_SESSION, ...parsed };
}

export function saveSession(session: PersistedSession): Promise<void> {
  return writeJSON(SESSION_KEY, session);
}

export async function loadPoints(): Promise<number> {
  return readJSON<number>(POINTS_KEY, DEFAULT_POINTS);
}

export function savePoints(points: number): Promise<void> {
  return writeJSON(POINTS_KEY, points);
}

export async function loadChests(): Promise<ChestCounts> {
  const parsed = await readJSON<Partial<ChestCounts>>(CHESTS_KEY, {});
  return { ...DEFAULT_CHESTS, ...parsed };
}

export function saveChests(chests: ChestCounts): Promise<void> {
  return writeJSON(CHESTS_KEY, chests);
}

export async function loadStudyHistory(): Promise<StudyHistory> {
  return readJSON<StudyHistory>(STUDY_HISTORY_KEY, {});
}

export function saveStudyHistory(history: StudyHistory): Promise<void> {
  return writeJSON(STUDY_HISTORY_KEY, history);
}

export async function isFirstLaunch(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(FIRST_LAUNCH_KEY)) == null;
  } catch {
    return false;
  }
}

export function markFirstLaunchDone(): Promise<void> {
  return writeJSON(FIRST_LAUNCH_KEY, '1');
}

export async function loadOwned(): Promise<string[]> {
  return readJSON<string[]>(OWNED_KEY, DEFAULT_OWNED);
}

export function saveOwned(owned: string[]): Promise<void> {
  return writeJSON(OWNED_KEY, owned);
}

export async function loadOutfit(): Promise<Record<string, string | null>> {
  const parsed = await readJSON<Record<string, string | null>>(OUTFIT_KEY, {});
  return { ...DEFAULT_OUTFIT, ...parsed };
}

export function saveOutfit(outfit: Record<string, string | null>): Promise<void> {
  return writeJSON(OUTFIT_KEY, outfit);
}

export async function loadQuestPhotos(): Promise<QuestPhotoMap> {
  return readJSON<QuestPhotoMap>(QUEST_PHOTOS_KEY, {});
}

export async function saveQuestPhotoForDay(dateKey: string, uri: string): Promise<void> {
  const existing = await loadQuestPhotos();
  return writeJSON(QUEST_PHOTOS_KEY, { ...existing, [dateKey]: uri });
}

// Also try to upload the quest photo to Supabase Storage. Best-effort: failures
// are ignored so local persistence remains the source of truth for the UI.
export async function saveAndUploadQuestPhoto(dateKey: string, uri: string, userId = '0a058ab2-140b-4869-9061-f4d0b16f1bc6') {
  await saveQuestPhotoForDay(dateKey, uri);
  try {
    await uploadPhoto(userId, uri);
  } catch (e) {
    // Swallow upload errors; log for debugging.
    // eslint-disable-next-line no-console
    console.error('Quest photo upload failed', e);
  }
}
