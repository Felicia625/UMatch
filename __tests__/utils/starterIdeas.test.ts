import { ruleBasedStarters } from '../../src/utils/starterIdeas';
import { makeUser } from '../helpers';

describe('ruleBasedStarters', () => {
  it('always returns three different ideas', () => {
    const partner = makeUser({ bio: '' });
    for (let round = 0; round < 12; round++) {
      const ideas = ruleBasedStarters(partner, null, round);
      expect(ideas).toHaveLength(3);
      expect(new Set(ideas).size).toBe(3);
    }
  });

  it('puts a bio-based idea first', () => {
    const ideas = ruleBasedStarters(makeUser({ bio: 'Suka hiking dan kopi' }), null);
    expect(ideas[0]).toMatch(/outdoor/i);
  });

  it('mentions the major', () => {
    const ideas = ruleBasedStarters(makeUser({ bio: '', major: 'TI' }), null);
    expect(ideas.some((i) => i.includes('Informatika'))).toBe(true);
  });

  it('notices the same batch', () => {
    const me = makeUser({ uid: 'me', schoolyear: '2023' });
    const partner = makeUser({ uid: 'p', schoolyear: '2023', major: undefined, bio: '' });
    expect(ruleBasedStarters(partner, me).some((i) => i.includes('seangkatan'))).toBe(true);
  });

  it('does not mention the batch for a different batch', () => {
    const me = makeUser({ uid: 'me', schoolyear: '2021' });
    const partner = makeUser({ uid: 'p', schoolyear: '2023', major: undefined, bio: '' });
    expect(ruleBasedStarters(partner, me, 0).some((i) => i.includes('seangkatan'))).toBe(false);
  });

  it('uses a friendly tone for friend mode and a match tone for dating mode', () => {
    const base = { major: undefined, bio: '' };
    expect(ruleBasedStarters(makeUser({ ...base, friendFirst: true }), null, 0).some((i) => i.includes('kenalan'))).toBe(true);
    expect(ruleBasedStarters(makeUser({ ...base, friendFirst: false }), null, 0).some((i) => i.includes('match'))).toBe(true);
  });

  it('gives a different set when the round changes', () => {
    const partner = makeUser({ bio: '' });
    expect(ruleBasedStarters(partner, null, 0)).not.toEqual(ruleBasedStarters(partner, null, 1));
  });
});
