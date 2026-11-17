import { toUserProfile } from '../../src/services/users';

// users.ts imports Firebase; the pure conversion function does not need it, so Firebase is replaced with empty stubs.
jest.mock('../../src/config/firebase', () => ({ db: {}, auth: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  documentId: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

afterEach(() => {
  jest.useRealTimers();
});

describe('toUserProfile', () => {
  it('normalises an old-style document', () => {
    const profile = toUserProfile('abc', {
      username: 'a',
      name: 'A',
      email: 'a@student.umn.ac.id',
      password: 'plain-text-secret',
      age: '21',
      gender: 'Female',
      major: 'Informatika',
      schoolyear: 2023,
      preference: { gender: 'Male', yearPreferences: 'No Preferences', majorPreferences: ['Informatika', 'Teknik Elektro', '???'] },
    });
    expect(profile.uid).toBe('abc');
    expect(profile.gender).toBe('F');
    expect(profile.age).toBe(21);
    expect(profile.major).toBe('TI');
    expect(profile.schoolyear).toBe('2023');
    expect(profile.preference.gender).toBe('M'); // always the opposite gender
    expect(profile.preference.yearPreferences).toBe('All');
    expect(profile.preference.majorPreferences).toEqual(['TI', 'TE']); // unknown values are dropped
  });

  it('never copies the stored password', () => {
    const profile = toUserProfile('abc', { password: 'plain-text-secret' });
    expect(profile).not.toHaveProperty('password');
  });

  it('works out age from the birth date and ignores the old age field', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 15));
    const profile = toUserProfile('abc', { birthDate: '2000-05-20', age: '99' });
    expect(profile.age).toBe(26);
    expect(profile.birthDate).toBe('2000-05-20');
  });

  it('reads friendFirst, which is false when missing', () => {
    expect(toUserProfile('a', { friendFirst: true }).friendFirst).toBe(true);
    expect(toUserProfile('a', {}).friendFirst).toBe(false);
  });

  it('fills sensible defaults for an empty document', () => {
    const profile = toUserProfile('a', {});
    expect(profile.gender).toBe('M');
    expect(profile.preference.gender).toBe('F');
    expect(profile.preference.yearPreferences).toBe('All');
    expect(profile.bio).toBe('');
    expect(profile.photoUrls).toEqual([]);
    expect(profile.age).toBe(0);
  });

  it('understands the other year-preference spellings', () => {
    expect(toUserProfile('a', { preference: { yearPreferences: 'ANY' } }).preference.yearPreferences).toBe('All');
    expect(toUserProfile('a', { preference: { yearPreferences: 'senior' } }).preference.yearPreferences).toBe('Senior');
    expect(toUserProfile('a', { preference: { yearPreferences: '2024' } }).preference.yearPreferences).toBe('2024');
  });
});
