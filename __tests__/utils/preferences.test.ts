import { isCompatible, matchesYearPreference, oppositeGender, yearPreferenceLabel } from '../../src/utils/preferences';
import { makeUser } from '../helpers';

describe('oppositeGender', () => {
  it('flips M and F', () => {
    expect(oppositeGender('M')).toBe('F');
    expect(oppositeGender('F')).toBe('M');
  });
});

describe('yearPreferenceLabel', () => {
  it('gives friendly labels', () => {
    expect(yearPreferenceLabel('All')).toBe('No preference');
    expect(yearPreferenceLabel('Senior')).toBe('Seniors (earlier batch)');
    expect(yearPreferenceLabel('Seangkatan')).toBe('Same batch');
  });
  it('returns a literal year unchanged', () => {
    expect(yearPreferenceLabel('2023')).toBe('2023');
  });
});

describe('matchesYearPreference', () => {
  it('accepts everyone for "All"', () => {
    expect(matchesYearPreference('All', '2023', '2019')).toBe(true);
  });
  it('Senior means an earlier batch than mine', () => {
    expect(matchesYearPreference('Senior', '2023', '2021')).toBe(true);
    expect(matchesYearPreference('Senior', '2023', '2023')).toBe(false);
    expect(matchesYearPreference('Senior', '2023', '2024')).toBe(false);
  });
  it('Junior means a later batch than mine', () => {
    expect(matchesYearPreference('Junior', '2023', '2024')).toBe(true);
    expect(matchesYearPreference('Junior', '2023', '2023')).toBe(false);
    expect(matchesYearPreference('Junior', '2023', '2021')).toBe(false);
  });
  it('Seangkatan means the same batch', () => {
    expect(matchesYearPreference('Seangkatan', '2023', '2023')).toBe(true);
    expect(matchesYearPreference('Seangkatan', '2023', '2022')).toBe(false);
  });
  it('a literal year matches only that year', () => {
    expect(matchesYearPreference('2024', '2023', '2024')).toBe(true);
    expect(matchesYearPreference('2024', '2023', '2023')).toBe(false);
  });
  it('relative preferences never match non-numeric years', () => {
    expect(matchesYearPreference('Senior', '2023', 'abc')).toBe(false);
    expect(matchesYearPreference('Junior', 'abc', '2024')).toBe(false);
  });
});

describe('isCompatible (who can see whom)', () => {
  const man = makeUser({ uid: 'm1', gender: 'M' });
  const woman = makeUser({ uid: 'w1', gender: 'F' });
  const otherMan = makeUser({ uid: 'm2', gender: 'M' });

  it('dating mode: opposite genders can see each other', () => {
    expect(isCompatible(man, woman)).toBe(true);
    expect(isCompatible(woman, man)).toBe(true);
  });
  it('dating mode: same gender cannot', () => {
    expect(isCompatible(man, otherMan)).toBe(false);
  });
  it('friend mode: friend-first users can see each other, whatever the gender', () => {
    const f1 = makeUser({ uid: 'f1', gender: 'M', friendFirst: true });
    const f2 = makeUser({ uid: 'f2', gender: 'M', friendFirst: true });
    const f3 = makeUser({ uid: 'f3', gender: 'F', friendFirst: true });
    expect(isCompatible(f1, f2)).toBe(true);
    expect(isCompatible(f1, f3)).toBe(true);
  });
  it('friend mode and dating mode never see each other, in either direction', () => {
    const friend = makeUser({ uid: 'f1', gender: 'M', friendFirst: true });
    const dater = makeUser({ uid: 'd1', gender: 'F', friendFirst: false });
    expect(isCompatible(friend, dater)).toBe(false);
    expect(isCompatible(dater, friend)).toBe(false);
  });
  it('nobody is compatible with themselves', () => {
    expect(isCompatible(man, man)).toBe(false);
  });
});
