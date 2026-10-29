import {
  collection,
  doc,
  DocumentData,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MAJORS } from '../constants/options';
import { Gender, MajorCode, RegistrationInput, UserProfile } from '../types';
import { ageFromBirthDate } from '../utils/age';
import { oppositeGender } from '../utils/preferences';

// The existing Firestore data is a little inconsistent (age is a string, gender sometimes 'Male', majors sometimes
// display names). These helpers accept both old and new shapes so existing users keep working.
const toGender = (v: unknown): Gender | undefined => {
  if (v === 'M' || v === 'Male') return 'M';
  if (v === 'F' || v === 'Female') return 'F';
  return undefined;
};

const toMajor = (v: unknown): MajorCode | undefined => MAJORS.find((m) => m.code === v || m.label === v)?.code;

// Old data holds 'All', 'ANY', 'No Preferences', 'Senior', 'Junior', 'Seangkatan' or a literal year.
const toYearPref = (v: unknown): string => {
  if (typeof v !== 'string') return 'All';
  const s = v.trim();
  if (!s || /^(all|any|no preferences?)$/i.test(s)) return 'All';
  const canonical = ['Senior', 'Junior', 'Seangkatan'].find((c) => c.toLowerCase() === s.toLowerCase());
  return canonical ?? s;
};

export function toUserProfile(uid: string, d: DocumentData): UserProfile {
  const gender = toGender(d.gender) ?? 'M';
  const pref = d.preference ?? {};
  const birthDate = typeof d.birthDate === 'string' ? d.birthDate : undefined;
  // Deliberately never reads `password` or `fcmToken` into the profile object.
  return {
    uid,
    username: d.username ?? '',
    name: d.name ?? '',
    email: d.email ?? '',
    birthDate,
    // Age comes from the birth date, so it increases by itself each birthday. Old accounts that only stored an age keep it.
    age: (birthDate ? ageFromBirthDate(birthDate) : null) ?? (Number(d.age) || 0),
    gender,
    major: toMajor(d.major),
    schoolyear: String(d.schoolyear ?? ''),
    school: d.school ?? 'UMN',
    bio: d.bio ?? '',
    photoUrl: d.photoUrl ?? '',
    photoUrls: Array.isArray(d.photoUrls) ? d.photoUrls : [],
    photoVerified: d.photoVerified === true,
    interests: Array.isArray(d.interests) ? d.interests : [],
    preference: {
      gender: oppositeGender(gender), // always the opposite gender, whatever an older document says
      yearPreferences: toYearPref(pref.yearPreferences),
      majorPreferences: (Array.isArray(pref.majorPreferences) ? pref.majorPreferences : [])
        .map(toMajor)
        .filter((m: MajorCode | undefined): m is MajorCode => !!m),
    },
  };
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? toUserProfile(snap.id, snap.data()) : null;
}

// Firestore allows at most 10 ids per `in` query, so load in chunks.
export async function getUsersByIds(ids: string[]): Promise<UserProfile[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
  const snaps = await Promise.all(
    chunks.map((c) => getDocs(query(collection(db, 'users'), where(documentId(), 'in', c)))),
  );
  return snaps.flatMap((s) => s.docs.map((d) => toUserProfile(d.id, d.data())));
}

export async function createUserDocument(uid: string, input: RegistrationInput): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    uid,
    username: input.username,
    name: input.name,
    email: input.email,
    birthDate: input.birthDate,
    gender: input.gender,
    major: input.major,
    schoolyear: input.schoolyear,
    school: 'UMN',
    bio: '',
    photoUrl: '',
    photoUrls: [],
    photoVerified: false,
    interests: [],
    // Default preference = opposite gender, same as the Android app
    preference: {
      gender: oppositeGender(input.gender),
      yearPreferences: 'All',
      majorPreferences: [],
    },
    createdAt: serverTimestamp(),
  });
}

export async function updateUser(uid: string, patch: Partial<Omit<UserProfile, 'uid' | 'email'>>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), patch as DocumentData);
}
