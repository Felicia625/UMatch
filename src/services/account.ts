import {
  arrayRemove,
  collection,
  doc,
  DocumentReference,
  getDocs,
  query,
  where,
  writeBatch,
  WriteBatch,
} from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { AppError } from './auth';

type Op = (batch: WriteBatch) => void;

async function commit(ops: Op[]): Promise<void> {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    ops.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }
}

/**
 * Same clean-up as ProfileFragment.deleteAccount(), with two changes:
 *  - it asks for the password first and re-authenticates, so the final account deletion cannot fail halfway
 *    ("requires recent login") after the data is already gone;
 *  - it finds other people's references with array-contains queries instead of downloading whole collections.
 * When you build your own backend this belongs in one server-side function.
 */
export async function deleteAccount(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new AppError('not-signed-in', 'You are not signed in.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  const uid = user.uid;

  const [likedBy, passedBy, blockedBy, matches] = await Promise.all([
    getDocs(query(collection(db, 'swipes'), where('liked', 'array-contains', uid))),
    getDocs(query(collection(db, 'swipes'), where('passed', 'array-contains', uid))),
    getDocs(query(collection(db, 'blocks'), where('blockedUsers', 'array-contains', uid))),
    getDocs(query(collection(db, 'matches'), where('users', 'array-contains', uid))),
  ]);

  const ops: Op[] = [];
  likedBy.docs.forEach((d) => ops.push((b) => b.update(d.ref, { liked: arrayRemove(uid) })));
  passedBy.docs.forEach((d) => ops.push((b) => b.update(d.ref, { passed: arrayRemove(uid) })));
  blockedBy.docs.forEach((d) => ops.push((b) => b.update(d.ref, { blockedUsers: arrayRemove(uid) })));

  for (const match of matches.docs) {
    const chats = await getDocs(collection(match.ref, 'chats'));
    chats.docs.forEach((c) => ops.push((b) => b.delete(c.ref)));
    ops.push((b) => b.delete(match.ref));
  }

  const own: DocumentReference[] = [doc(db, 'swipes', uid), doc(db, 'blocks', uid), doc(db, 'users', uid)];
  own.forEach((ref) => ops.push((b) => b.delete(ref)));

  await commit(ops);
  await deleteUser(user); // AuthGate sends the user back to onboarding once the auth state clears
}
