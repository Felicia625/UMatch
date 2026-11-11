/**
 * Suggests a full name from the part of an email before the "@":
 * "felicia.sabatini2@student.umn.ac.id" -> "Felicia Sabatini". Returns '' until the email has an "@".
 */
export function nameFromEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '';
  return email
    .slice(0, at)
    .replace(/[._\-+]+/g, ' ')
    .replace(/\d+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** The full name that gets saved: the name suggested by the email, or the part before "@" when it has no letters (e.g. a student number). */
export function displayNameFromEmail(email: string): string {
  const suggested = nameFromEmail(email);
  if (suggested) return suggested;
  const at = email.indexOf('@');
  return at > 0 ? email.slice(0, at) : '';
}
