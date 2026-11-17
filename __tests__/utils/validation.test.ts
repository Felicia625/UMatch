import { schoolYearOptions } from '../../src/constants/options';
import { RegistrationForm, validateRegistration } from '../../src/utils/validation';

const thisYear = new Date().getFullYear();

const validForm = (): RegistrationForm => ({
  username: 'felicia',
  password: 'secret1',
  email: 'felicia.sabatini@student.umn.ac.id',
  birthDate: '2000-05-20',
  gender: 'F',
  schoolyear: schoolYearOptions()[4], // the current year, so this test never goes stale
  major: 'TI',
  friendFirst: false,
});

const errorOf = (form: RegistrationForm, accepted = true) => {
  const result = validateRegistration(form, accepted);
  return 'error' in result ? result.error : null;
};

describe('validateRegistration', () => {
  it('accepts a valid form and sets the name from the email', () => {
    const result = validateRegistration(validForm(), true);
    expect('input' in result).toBe(true);
    if ('input' in result) {
      expect(result.input.name).toBe('Felicia Sabatini');
      expect(result.input.email).toBe('felicia.sabatini@student.umn.ac.id');
      expect(result.input.birthDate).toBe('2000-05-20');
      expect(result.input.friendFirst).toBe(false);
    }
  });

  it('trims and lower-cases the email before deriving the name', () => {
    const result = validateRegistration({ ...validForm(), email: '  Felicia.Sabatini@STUDENT.UMN.AC.ID ' }, true);
    expect('input' in result).toBe(true);
    if ('input' in result) {
      expect(result.input.email).toBe('felicia.sabatini@student.umn.ac.id');
      expect(result.input.name).toBe('Felicia Sabatini');
    }
  });

  it('passes friendFirst through', () => {
    const result = validateRegistration({ ...validForm(), friendFirst: true }, true);
    expect('input' in result && result.input.friendFirst).toBe(true);
  });

  it('requires every field', () => {
    expect(errorOf({ ...validForm(), username: '  ' })).toBe('Please fill all fields');
    expect(errorOf({ ...validForm(), password: '' })).toBe('Please fill all fields');
    expect(errorOf({ ...validForm(), email: '' })).toBe('Please fill all fields');
    expect(errorOf({ ...validForm(), birthDate: '' })).toBe('Please fill all fields');
    expect(errorOf({ ...validForm(), gender: '' })).toBe('Please fill all fields');
    expect(errorOf({ ...validForm(), major: '' })).toBe('Please fill all fields');
  });

  it('requires the terms to be accepted', () => {
    expect(errorOf(validForm(), false)).toBe('Please agree to the Terms and Conditions');
  });

  it('requires a password of at least 6 characters', () => {
    expect(errorOf({ ...validForm(), password: '12345' })).toBe('Password must be at least 6 characters');
    expect(errorOf({ ...validForm(), password: '123456' })).toBeNull();
  });

  it('rejects an impossible birth date', () => {
    expect(errorOf({ ...validForm(), birthDate: '2000-02-30' })).toBe('Please enter a valid date of birth');
  });

  it('enforces the minimum age of 17', () => {
    expect(errorOf({ ...validForm(), birthDate: `${thisYear - 16}-12-31` })).toBe('Minimum age is 17');
    expect(errorOf({ ...validForm(), birthDate: `${thisYear - 17}-01-01` })).toBeNull(); // turned 17 on 1 January
  });

  it('only allows @student.umn.ac.id emails', () => {
    expect(errorOf({ ...validForm(), email: 'felicia@gmail.com' })).toBe('Only @student.umn.ac.id emails are allowed');
  });

  it('rejects an email with nothing before the @', () => {
    expect(errorOf({ ...validForm(), email: '@student.umn.ac.id' })).toBe('Please enter a valid email address');
  });

  it('accepts a student-number email, using the number as the name', () => {
    const result = validateRegistration({ ...validForm(), email: '00000093843@student.umn.ac.id' }, true);
    expect('input' in result && result.input.name).toBe('00000093843');
  });

  it('rejects a school year outside the current window', () => {
    expect(errorOf({ ...validForm(), schoolyear: '1999' })).toBe('Please fill all fields');
  });

  it('rejects unknown gender and major codes', () => {
    expect(errorOf({ ...validForm(), gender: 'X' })).toBe('Please fill all fields');
    expect(errorOf({ ...validForm(), major: 'NOPE' })).toBe('Please fill all fields');
  });
});
