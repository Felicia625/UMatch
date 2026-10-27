import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { RegistrationInput } from '../types';
import { createUserDocument } from './users';

export class AppError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const isAppError = (e: unknown): e is AppError =>
  typeof e === 'object' && e !== null && (e as { name?: string }).name === 'AppError';

export function friendlyAuthError(e: unknown): string {
  console.warn('friendlyAuthError:', e);
  switch ((e as { code?: string })?.code) {
    case 'permission-denied':
      return 'Permission denied by Firestore rules. Check the Rules tab in the Firebase console.';
    case 'not-found':
      return 'Your profile document was not found in Firestore.';
    case 'unavailable':
      return 'Cannot reach the server. Check your internet connection.';
    case 'invalid-argument':
      return `Firestore rejected the data (${(e as Error).message}).`;
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'That password is too weak.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
  }
  if (isAppError(e)) return e.message;
  const detail = e instanceof Error ? e.message : String(e);
  return `Something went wrong: ${detail}`;
}

/** Creates the account + profile, sends the verification email, then signs out (user must verify first). */
export async function register(input: RegistrationInput): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
  try {
    await createUserDocument(cred.user.uid, input);
    await sendEmailVerification(cred.user);
  } catch (e) {
    // Don't leave an auth account without a profile behind (the Android app did).
    await deleteUser(cred.user).catch(() => {});
    throw e;
  } finally {
    await signOut(auth).catch(() => {});
  }
}

export async function login(email: string, password: string): Promise<void> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  if (!cred.user.emailVerified) {
    await signOut(auth);
    throw new AppError('email-not-verified', 'Please verify your email first.');
  }
}

export async function resendVerificationEmail(email: string, password: string): Promise<void> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  try {
    if (!cred.user.emailVerified) await sendEmailVerification(cred.user);
  } finally {
    await signOut(auth).catch(() => {});
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new AppError('not-signed-in', 'You are not signed in.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, oldPassword));
  await updatePassword(user, newPassword);
}

export const logout = () => signOut(auth);
