import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  QueryConstraint,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MajorCode, UserProfile } from '../types';
import { matchesYearPreference } from '../utils/preferences';
import { toUserProfile } from './users';

export type SwipeDirection = 'left' | 'right';

/** Optional overrides from the filter dialog; they win over the saved preferences. */
export interface CandidateFilters {
  year?: string;
  major?: MajorCode;
}

const CANDIDATE_LIMIT = 100;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Profiles to show in the deck. Unlike HomeFragment this asks Firestore for the preferred gender (and an exact year,
 * if one is set) instead of downloading every user, then filters relative year / major / already-swiped / blocked on
 * the device. Known limit: it looks at the first 100 matches. Paging comes with the own-backend move.
 */
export async function loadCandidates(me: UserProfile, filters: CandidateFilters = {}): Promise<UserProfile[]> {
  const [swipeSnap, blockSnap] = await Promise.all([
    getDoc(doc(db, 'swipes', me.uid)),
    getDoc(doc(db, 'blocks', me.uid)),
  ]);
  const excluded = new Set<string>([
    me.uid,
    ...((swipeSnap.data()?.liked as string[] | undefined) ?? []),
    ...((swipeSnap.data()?.passed as string[] | undefined) ?? []),
    ...((blockSnap.data()?.blockedUsers as string[] | undefined) ?? []),
  ]);

  const yearPref = filters.year ?? me.preference.yearPreferences;
  const majors = filters.major ? [filters.major] : me.preference.majorPreferences;

  const constraints: QueryConstraint[] = [where('gender', '==', me.preference.gender)];
  if (/^\d{4}$/.test(yearPref)) constraints.push(where('schoolyear', '==', yearPref));

  const snap = await getDocs(query(collection(db, 'users'), ...constraints, limit(CANDIDATE_LIMIT)));
  const all = snap.docs.map((d) => toUserProfile(d.id, d.data()));
  const notSwiped = all.filter((u) => !excluded.has(u.uid));
  const yearOk = notSwiped.filter((u) => matchesYearPreference(yearPref, me.schoolyear, u.schoolyear));
  const candidates = yearOk.filter((u) => majors.length === 0 || (!!u.major && majors.includes(u.major)));

  if (__DEV__) {
    // Shows in the Metro terminal: where the profiles get filtered out.
    console.log('[discover]', {
      lookingForGender: me.preference.gender,
      yearPref,
      majors,
      fromFirestore: all.length,
      afterSwipedAndBlocked: notSwiped.length,
      afterYear: yearOk.length,
      shown: candidates.length,
    });
    if (all.length === 0) {
      const sample = await getDocs(query(collection(db, 'users'), limit(20)));
      console.log(
        `[discover] no users have gender == "${me.preference.gender}". gender values found in users:`,
        sample.docs.map((d) => `${d.id.slice(0, 6)}: ${JSON.stringify(d.data().gender)}`),
      );
    }
  }
  return shuffle(candidates);
}

export const matchIdFor = (a: string, b: string) => [a, b].sort().join('_'); // same id scheme as the Android app

/** Makes sure the match document exists (keeps the chat history if it already does). */
export async function ensureMatch(a: string, b: string): Promise<string> {
  const matchId = matchIdFor(a, b);
  const ref = doc(db, 'matches', matchId);
  if (!(await getDoc(ref)).exists()) {
    await setDoc(ref, {
      users: [a, b],
      lastMessage: 'You matched! Say hi!',
      timestamp: serverTimestamp(),
    });
  }
  return matchId;
}

/** Records a like/pass. On a mutual like it makes sure the match document exists and returns its id. */
export async function swipeUser(
  myId: string,
  otherId: string,
  direction: SwipeDirection,
): Promise<{ matchId?: string }> {
  const mine = doc(db, 'swipes', myId);

  if (direction === 'left') {
    await setDoc(mine, { passed: arrayUnion(otherId) }, { merge: true });
    return {};
  }

  await setDoc(mine, { liked: arrayUnion(otherId) }, { merge: true });

  const theirs = await getDoc(doc(db, 'swipes', otherId));
  const theyLikedMe = ((theirs.data()?.liked as string[] | undefined) ?? []).includes(myId);
  if (!theyLikedMe) return {};
  return { matchId: await ensureMatch(myId, otherId) };
}
