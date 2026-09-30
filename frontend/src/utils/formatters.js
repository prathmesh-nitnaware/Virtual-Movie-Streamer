/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Gets clean initial letter for user avatar
 */
export function getInitial(name) {
  if (!name || typeof name !== 'string') return 'U';
  return name.trim()[0].toUpperCase();
}
