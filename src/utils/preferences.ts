import { YEAR_PREFERENCES } from '../constants/options';
import { Gender } from '../types';

/** The app only shows people of the opposite gender, so this is derived instead of being a setting. */
export const oppositeGender = (g: Gender): Gender => (g === 'M' ? 'F' : 'M');

export function yearPreferenceLabel(pref: string): string {
  return YEAR_PREFERENCES.find((p) => p.value === pref)?.label ?? pref;
}

/**
 * Does `theirYear` satisfy my year preference?
 * The Android app compared schoolyear to the literal text "Senior" / "Junior", so those preferences never matched
 * anyone. Here they are relative to my own batch year.
 */
export function matchesYearPreference(pref: string, myYear: string, theirYear: string): boolean {
  if (pref === 'All') return true;
  const mine = Number(myYear);
  const theirs = Number(theirYear);
  const comparable = Number.isFinite(mine) && Number.isFinite(theirs);
  switch (pref) {
    case 'Senior':
      return comparable && theirs < mine;
    case 'Junior':
      return comparable && theirs > mine;
    case 'Seangkatan':
      return theirYear === myYear;
    default:
      return theirYear === pref; // a literal year such as '2023'
  }
}
