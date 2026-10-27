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
import { getUsersByIds as loadUsers } from './users';

async function mySwipes(myId: string) {
  const snap = await getDoc(doc(db, 'swipes', myId));
  return {
    liked: (snap.data()?.liked as string[] | undefined) ?? [],
    passed: (snap.data()?.passed as string[] | undefined) ?? [],
  };
}

/**
 * People who liked me and that I have not liked back yet. LikesFragment downloaded every swipes document to find
 * these; an array-contains query does the same job on the server.
 */
export async function getUsersWhoLikedMe(myId: string): Promise<UserProfile[]> {
  const [likedMe, mine] = await Promise.all([
    getDocs(query(collection(db, 'swipes'), where('liked', 'array-contains', myId))),
    mySwipes(myId),
  ]);
  const already = new Set(mine.liked);
  return loadUsers(likedMe.docs.map((d) => d.id).filter((id) => id !== myId && !already.has(id)));
}

export async function getUsersILiked(myId: string): Promise<UserProfile[]> {
  return loadUsers((await mySwipes(myId)).liked);
}

export async function getPassedUsers(myId: string): Promise<UserProfile[]> {
  return loadUsers((await mySwipes(myId)).passed);
}

/** Like someone back: records my like, clears any earlier pass, creates the match. Returns the match id. */
export async function likeBack(myId: string, otherId: string): Promise<string> {
  await setDoc(
    doc(db, 'swipes', myId),
    { liked: arrayUnion(otherId), passed: arrayRemove(otherId) },
    { merge: true },
  );
  return ensureMatch(myId, otherId);
}

export const unlikeUser = (myId: string, otherId: string) =>
  updateDoc(doc(db, 'swipes', myId), { liked: arrayRemove(otherId) });

export const unpassUser = (myId: string, otherId: string) =>
  updateDoc(doc(db, 'swipes', myId), { passed: arrayRemove(otherId) });
