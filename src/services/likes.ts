import {
  arrayRemove,
  arrayUnion,
  collection,
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
import { ensureMatch } from './swipes';
import { isCompatible } from '../utils/preferences';
import { getUser, getUsersByIds as loadUsers } from './users';

async function mySwipes(myId: string) {
  const snap = await getDoc(doc(db, 'swipes', myId));
  return {
    liked: (snap.data()?.liked as string[] | undefined) ?? [],
    passed: (snap.data()?.passed as string[] | undefined) ?? [],
  };
}

/** Ids of everyone I currently like (used to mark who in "Who liked me" is already mutual). */
export async function getMyLikedIds(myId: string): Promise<string[]> {
  return (await mySwipes(myId)).liked;
}

/**
 * Everyone who liked me, including people I like back (mutual), so the list stays useful after an unlike: I can see
 * who liked me and connect again later. LikesFragment downloaded every swipes document to find these; an
 * array-contains query does the same job on the server.
 */
export async function getUsersWhoLikedMe(myId: string): Promise<UserProfile[]> {
  const [likedMe, me] = await Promise.all([
    getDocs(query(collection(db, 'swipes'), where('liked', 'array-contains', myId))),
    getUser(myId),
  ]);
  const users = await loadUsers(likedMe.docs.map((d) => d.id).filter((id) => id !== myId));
  // Hide people from the other mode (for example, someone who liked you before either of you switched to friend mode).
  return me ? users.filter((u) => isCompatible(me, u)) : users;
}

export async function getUsersILiked(myId: string): Promise<UserProfile[]> {
  return loadUsers((await mySwipes(myId)).liked);
}

export async function getPassedUsers(myId: string): Promise<UserProfile[]> {
  return loadUsers((await mySwipes(myId)).passed);
}

/** Like someone back: records my like, clears any earlier pass, creates the match. Returns the match id. */
export async function likeBack(myId: string, otherId: string, friend = false): Promise<string> {
  await setDoc(
    doc(db, 'swipes', myId),
    { liked: arrayUnion(otherId), passed: arrayRemove(otherId) },
    { merge: true },
  );
  return ensureMatch(myId, otherId, friend);
}

/** Removes my like only (it is not a pass). Reads the document back so a write that did not stick shows as an error. */
export async function unlikeUser(myId: string, otherId: string): Promise<void> {
  const ref = doc(db, 'swipes', myId);
  const before = ((await getDoc(ref)).data()?.liked as string[] | undefined) ?? [];
  await setDoc(ref, { liked: arrayRemove(otherId) }, { merge: true });
  const after = ((await getDoc(ref)).data()?.liked as string[] | undefined) ?? [];
  if (__DEV__) {
    // Compare "project" and the document path with what you see in the Firebase console.
    console.log('[unlike]', { project: db.app.options.projectId, path: ref.path, other: otherId, before, after });
  }
  if (after.includes(otherId)) throw new Error('Unlike did not save');
}

export const unpassUser = (myId: string, otherId: string) =>
  updateDoc(doc(db, 'swipes', myId), { passed: arrayRemove(otherId) });
