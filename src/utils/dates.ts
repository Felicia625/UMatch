/** Firestore gives a Timestamp; older documents may hold a number (milliseconds) or nothing yet (pending write). */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'number') return new Date(value);
  return null;
}

export function formatTime(date: Date | null): string {
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

/** Time for today, otherwise day/month. Used in the match list. */
export function formatListTime(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return formatTime(date);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}
