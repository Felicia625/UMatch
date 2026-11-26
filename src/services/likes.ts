import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types';
import { ensureMatch, likeModeName } from './swipes';
import { LikeMode, splitLikers } from '../utils/likeModes';
import { getUser, getUsersByIds as loadUsers } from './users';

async function mySwipes(myId: string) {
  const snap = await getDoc(doc(db, 'swipes', myId));
  return {
    liked: (snap.data()?.liked as string[] | undefined) ?? [],
    passed: (snap.data()?.passed as string[] | undefined) ?? [],
    likeModes: (snap.data()?.likeModes as Record<string, 'friend' | 'dating'> | undefined) ?? {},
  };
}

/** Ids of everyone I currently like (used to mark who in "Who liked me" is already mutual). */
export async function getMyLikedIds(myId: string): Promise<string[]> {
  return (await mySwipes(myId)).liked;
}

/**
 * Who liked me, in the mode I am in now. What counts is the mode each like was made in (stored in the liker's
 * swipes document), not the mode the liker is in today: if B liked me as a friend and later switched to Match mode,
 * B still shows up while I am in Friend Mode, and the other way round. Likes made in the other mode are not listed;
 * the ones I have not liked back are counted so the screen can say how many are waiting there.
 */
export async function getUsersWhoLikedMe(myId: string): Promise<{ users: UserProfile[]; otherMode: number }> {
  const [likedMe, me, mine] = await Promise.all([
    getDocs(query(collection(db, 'swipes'), where('liked', 'array-contains', myId))),
    getUser(myId),
    mySwipes(myId),
  ]);
  const storedMode = new Map<string, LikeMode | undefined>(
    likedMe.docs.map((d) => [d.id, (d.data().likeModes as Record<string, LikeMode> | undefined)?.[myId]]),
  );
  const users = await loadUsers(likedMe.docs.map((d) => d.id).filter((id) => id !== myId));
  if (!me) return { users, otherMode: 0 };
  const { here, waiting } = splitLikers(
    me,
    users.map((user) => ({ user, stored: storedMode.get(user.uid) })),
    new Set(mine.liked),
  );
  return { users: here, otherMode: waiting.length };
}

export async function getUsersILiked(
  myId: string,
): Promise<{ users: UserProfile[]; likeModes: Record<string, 'friend' | 'dating'> }> {
  const mine = await mySwipes(myId);
  return { users: await loadUsers(mine.liked), likeModes: mine.likeModes };
}

export async function getPassedUsers(myId: string): Promise<UserProfile[]> {
  return loadUsers((await mySwipes(myId)).passed);
}

/** Like someone back: records my like, clears any earlier pass, creates the match. Returns the match id. */
export async function likeBack(myId: string, otherId: string, friend = false): Promise<string> {
  await setDoc(
    doc(db, 'swipes', myId),
    { liked: arrayUnion(otherId), passed: arrayRemove(otherId), likeModes: { [otherId]: likeModeName(friend) } },
    { merge: true },
  );
  return ensureMatch(myId, otherId, friend);
}

/** Removes my like only (it is not a pass). Reads the document back so a write that did not stick shows as an error. */
export async function unlikeUser(myId: string, otherId: string): Promise<void> {
  const ref = doc(db, 'swipes', myId);
  const before = ((await getDoc(ref)).data()?.liked as string[] | undefined) ?? [];
  await setDoc(ref, { liked: arrayRemove(otherId), likeModes: { [otherId]: deleteField() } }, { merge: true });
  const after = ((await getDoc(ref)).data()?.liked as string[] | undefined) ?? [];
  if (__DEV__) {
    // Compare "project" and the document path with what you see in the Firebase console.
    console.log('[unlike]', { project: db.app.options.projectId, path: ref.path, other: otherId, before, after });
  }
  if (after.includes(otherId)) throw new Error('Unlike did not save');
}

export const unpassUser = (myId: string, otherId: string) =>
  updateDoc(doc(db, 'swipes', myId), { passed: arrayRemove(otherId) });
