// Birth dates are stored as 'YYYY-MM-DD' text, so there is no time-zone surprise, and age is always worked out
// from today's date. That is what makes a user's age go up by itself every birthday.

export const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate(); // month is 1-12

const pad = (n: number) => String(n).padStart(2, '0');

export const toIsoDate = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

export function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/** Whole years between the birth date and `today`, or null if the date is invalid or in the future. */
export function ageFromBirthDate(iso: string, today: Date = new Date()): number | null {
  const p = parseIsoDate(iso);
  if (!p) return null;
  const month = today.getMonth() + 1;
  const hadBirthday = month > p.month || (month === p.month && today.getDate() >= p.day);
  const age = today.getFullYear() - p.year - (hadBirthday ? 0 : 1);
  return age >= 0 ? age : null;
}
