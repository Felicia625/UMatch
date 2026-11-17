import { displayNameFromEmail, nameFromEmail } from '../../src/utils/names';

describe('nameFromEmail', () => {
  it('builds a capitalised name from first.last', () => {
    expect(nameFromEmail('felicia.sabatini@student.umn.ac.id')).toBe('Felicia Sabatini');
  });
  it('treats dots, underscores, dashes and digits as word breaks', () => {
    expect(nameFromEmail('john_doe2@x.com')).toBe('John Doe');
    expect(nameFromEmail('BUDI-santoso@x.com')).toBe('Budi Santoso');
    expect(nameFromEmail('a.b.c@x.com')).toBe('A B C');
  });
  it('returns an empty string when there is no @ or nothing before it', () => {
    expect(nameFromEmail('noatsign')).toBe('');
    expect(nameFromEmail('@student.umn.ac.id')).toBe('');
    expect(nameFromEmail('')).toBe('');
  });
  it('returns an empty string for a student-number-only email', () => {
    expect(nameFromEmail('00000093843@student.umn.ac.id')).toBe('');
  });
});

describe('displayNameFromEmail', () => {
  it('uses the suggested name when there is one', () => {
    expect(displayNameFromEmail('felicia.sabatini@student.umn.ac.id')).toBe('Felicia Sabatini');
  });
  it('falls back to the part before @ for a student number', () => {
    expect(displayNameFromEmail('00000093843@student.umn.ac.id')).toBe('00000093843');
  });
  it('stays empty when the email is unusable', () => {
    expect(displayNameFromEmail('noatsign')).toBe('');
  });
});
