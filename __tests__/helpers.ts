import { UserProfile } from '../src/types';

/** A complete profile with sensible defaults; override only what a test cares about. */
export function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: 'u1',
    username: 'user1',
    name: 'User One',
    email: 'user1@student.umn.ac.id',
    age: 20,
    birthDate: '2006-01-01',
    gender: 'M',
    major: 'TI',
    schoolyear: '2023',
    school: 'UMN',
    bio: '',
    photoUrl: '',
    photoUrls: [],
    photoVerified: false,
    friendFirst: false,
    interests: [],
    preference: { gender: 'F', yearPreferences: 'All', majorPreferences: [] },
    ...overrides,
  };
}
