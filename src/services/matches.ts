import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Match } from '../types';
import { toDate } from '../utils/dates';

export const partnerOf = (match: Match, myId: string) => match.users.find((u) => u !== myId);

/** Live list of my matches (same query as MatchListFragment). */
export function subscribeToMatches(
  myId: string,
  onData: (matches: Match[]) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'matches'), where('users', 'array-contains', myId)),
    (snap) => {
      const matches: Match[] = [];
      snap.docs.forEach((d) => {
        const data = d.data({ serverTimestamps: 'estimate' });
        if (!Array.isArray(data.users) || data.users.length !== 2) return;
        matches.push({
          id: d.id,
          users: [data.users[0], data.users[1]],
          lastMessage: data.lastMessage ?? '',
          timestamp: toDate(data.timestamp),
        });
      });
      onData(matches);
    },
    onError,
  );
}

export interface MatchMeta {
  iLiked: Set<string>;
  likedMe: Set<string>;
  iBlocked: Set<string>;
  blockedMe: Set<string>;
  favorites: Set<string>;
}

const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

/**
 * Everything needed to sort matches into Active / Inactive / Blocked and mark favourites. MatchListFragment read two
 * swipes documents per match; these five reads cover all matches at once.
 */
export async function loadMatchMeta(myId: string): Promise<MatchMeta> {
  const [mine, likedMe, myBlocks, blockedMe, favs] = await Promise.all([
    getDoc(doc(db, 'swipes', myId)),
    getDocs(query(collection(db, 'swipes'), where('liked', 'array-contains', myId))),
    getDoc(doc(db, 'blocks', myId)),
    getDocs(query(collection(db, 'blocks'), where('blockedUsers', 'array-contains', myId))),
    getDoc(doc(db, 'favorites', myId)),
  ]);
  return {
    iLiked: new Set(list(mine.data()?.liked)),
    likedMe: new Set(likedMe.docs.map((d) => d.id)),
    iBlocked: new Set(list(myBlocks.data()?.blockedUsers)),
    blockedMe: new Set(blockedMe.docs.map((d) => d.id)),
    favorites: new Set(list(favs.data()?.favoriteUsers)),
  };
}

export const blockUser = (myId: string, otherId: string) =>
  setDoc(doc(db, 'blocks', myId), { blockedUsers: arrayUnion(otherId) }, { merge: true });

export const unblockUser = (myId: string, otherId: string) =>
  setDoc(doc(db, 'blocks', myId), { blockedUsers: arrayRemove(otherId) }, { merge: true });

export const addFavorite = (myId: string, otherId: string) =>
  setDoc(doc(db, 'favorites', myId), { favoriteUsers: arrayUnion(otherId) }, { merge: true });

export const removeFavorite = (myId: string, otherId: string) =>
  setDoc(doc(db, 'favorites', myId), { favoriteUsers: arrayRemove(otherId) }, { merge: true });

/** The checks ChatFragment ran before opening: still a mutual match, and nobody blocked anybody. */
export async function canChat(myId: string, partnerId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const [mine, theirs, myBlocks, theirBlocks] = await Promise.all([
    getDoc(doc(db, 'swipes', myId)),
    getDoc(doc(db, 'swipes', partnerId)),
    getDoc(doc(db, 'blocks', myId)),
    getDoc(doc(db, 'blocks', partnerId)),
  ]);
  if (!list(mine.data()?.liked).includes(partnerId) || !list(theirs.data()?.liked).includes(myId)) {
    return { ok: false, reason: 'This match is no longer valid.' };
  }
  if (list(myBlocks.data()?.blockedUsers).includes(partnerId)) return { ok: false, reason: 'You have blocked this user.' };
  if (list(theirBlocks.data()?.blockedUsers).includes(myId)) return { ok: false, reason: 'You cannot chat with this user.' };
  return { ok: true };
}
