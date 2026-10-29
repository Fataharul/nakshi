/**
 * Formats seconds into a short readable duration.
 * 0 -> "0s", 90 -> "1m 30s", 120 -> "2m", 3700 -> "1h 1m"
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}