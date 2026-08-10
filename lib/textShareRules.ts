export const MAX_SHARED_TEXT_CHARS = 10000;
export const TEXT_SHARE_WINDOW_MS = 60 * 1000;

export const TEXT_SHARE_EXPIRY_OPTIONS = [
  { id: '5m', label: '5 min', seconds: 5 * 60 },
  { id: '1h', label: '1 hour', seconds: 60 * 60 },
  { id: '24h', label: '24 hours', seconds: 24 * 60 * 60 },
] as const;

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}
