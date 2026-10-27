import { GENDERS, MAJORS } from '../constants/options';

export type Gender = (typeof GENDERS)[number]['code']; // 'M' | 'F'
export type MajorCode = (typeof MAJORS)[number]['code'];

export interface Preferences {
  gender: Gender;
  yearPreferences: string; // a school year like '2023', or 'All'
  majorPreferences: MajorCode[];
}

// users/{uid}
// Note: the old Android app also stored the plain-text password here. It is intentionally NOT part of this type.
export interface UserProfile {
  uid: string;
  username: string;
  name: string;
  email: string;
  age: number;
  gender: Gender;
  major?: MajorCode;
  schoolyear: string;
  school: string;
  bio: string;
  photoUrl: string;
  photoUrls: string[];
  photoVerified: boolean;
  interests: string[];
  preference: Preferences;
}

export interface RegistrationInput {
  username: string;
  name: string;
  email: string;
  password: string;
  age: number;
  gender: Gender;
  schoolyear: string;
  major: MajorCode;
}

// swipes/{uid}
export interface Swipes {
  liked: string[];
  passed: string[];
}

// matches/{uidA_uidB}  (ids sorted alphabetically, same as the Android app)
export interface Match {
  id: string;
  users: [string, string];
  lastMessage: string;
  timestamp: Date | null;
}

// matches/{matchId}/chats/{messageId}
export interface Message {
  id: string; // Firestore document id (the Android app queried by text+timestamp instead)
  senderId: string;
  text: string;
  timestamp: Date | null;
  replyTo?: string;
  replyText?: string;
  edited: boolean;
  pinned: boolean;
}
