import { modeOfLike, splitLikers } from '../../src/utils/likeModes';
import { UserProfile } from '../../src/types';

const user = (uid: string, gender: 'M' | 'F', friendFirst: boolean) => ({ uid, gender, friendFirst, username: uid } as unknown as UserProfile);

describe('modeOfLike', () => {
  it('uses the stored mode even when the liker has switched since', () => {
    const a = user('a', 'F', true);
    const b = user('b', 'M', false); // B is in Match mode now
    expect(modeOfLike(a, b, 'friend')).toBe('friend');
  });
  it('falls back to the liker\'s current mode for old likes', () => {
    expect(modeOfLike(user('a', 'F', true), user('b', 'M', true))).toBe('friend');
    expect(modeOfLike(user('a', 'F', true), user('b', 'M', false))).toBe('dating');
    expect(modeOfLike(user('a', 'F', false), user('b', 'M', false))).toBe('dating');
    expect(modeOfLike(user('a', 'F', false), user('b', 'F', false))).toBe('friend'); // not compatible = the other mode
  });
});

describe('splitLikers', () => {
  const b = user('b', 'M', false);
  const c = user('c', 'F', true);
  const d = user('d', 'M', false);

  it('B liked A as a friend, then switched to Match mode: still listed while A is in Friend Mode', () => {
    const a = user('a', 'F', true);
    const r = splitLikers(a, [{ user: b, stored: 'friend' }], new Set());
    expect(r.here).toEqual([b]);
    expect(r.waiting).toEqual([]);
  });
  it('is not listed in the other mode, and only counted when not liked back', () => {
    const a = user('a', 'F', false); // Match mode
    expect(splitLikers(a, [{ user: b, stored: 'friend' }], new Set()).waiting).toEqual([b]);
    expect(splitLikers(a, [{ user: b, stored: 'friend' }], new Set(['b'])).waiting).toEqual([]);
    expect(splitLikers(a, [{ user: b, stored: 'friend' }], new Set(['b'])).here).toEqual([]);
  });
  it('splits a mixed list', () => {
    const a = user('a', 'F', true);
    const r = splitLikers(a, [{ user: b, stored: 'friend' }, { user: c, stored: 'friend' }, { user: d, stored: 'dating' }], new Set());
    expect(r.here).toEqual([b, c]);
    expect(r.waiting).toEqual([d]);
  });
});
