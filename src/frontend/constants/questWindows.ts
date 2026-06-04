/**
 * Daily-quest time windows — LOCAL (device-clock) verification for the MVP.
 *
 * Prototype-grade: there is NO server/DB enforcement. Both the UI gating and the
 * submit/vote action guards read the device clock via `isWithinWindow`. Edit the
 * windows here in ONE place.
 *
 * Note: "24:00" → 1440 minutes; the latest a real clock reads is 23:59 (1439),
 * so the voting window stays open through the end of the day.
 */
export type QuestWindow = { start: string; end: string };

export const QUEST_WINDOWS = {
  // Submissions allowed 12am → 8pm; closed 8pm → 12am (matches the break-page hint).
  submission: { start: '00:00', end: '20:00' },
  // Voting / gallery viewing allowed 8pm → 12am (matches the gallery hint).
  voting: { start: '20:00', end: '24:00' },
} as const;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isWithinWindow(win: QuestWindow): boolean {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(win.start);
  const end = toMinutes(win.end);
  // Same-day window (start < end) vs. overnight window that wraps past midnight
  // (start > end, e.g. 20:00 → 04:00): in the wrap case "inside" means after the
  // start OR before the end.
  return start <= end ? cur >= start && cur < end : cur >= start || cur < end;
}
