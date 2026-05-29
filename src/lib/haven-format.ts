/** mm:ss for a countdown. */
export function fmt(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const r = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** Human study time: "45m", "1h", "1h 20m". */
export function fmtMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Local-date key (YYYY-MM-DD). Uses local calendar components rather than
 * toISOString so a day's key is stable regardless of timezone — the calendar
 * grid and "today" always agree.
 */
export function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
