import { ageFromBirthDate, daysInMonth, parseIsoDate, toIsoDate } from '../../src/utils/age';

describe('daysInMonth', () => {
  it('knows leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
  });
  it('knows 30 and 31 day months', () => {
    expect(daysInMonth(2023, 4)).toBe(30);
    expect(daysInMonth(2023, 12)).toBe(31);
  });
});

describe('toIsoDate', () => {
  it('pads month and day', () => {
    expect(toIsoDate(2005, 3, 4)).toBe('2005-03-04');
    expect(toIsoDate(2005, 11, 14)).toBe('2005-11-14');
  });
});

describe('parseIsoDate', () => {
  it('parses a valid date', () => {
    expect(parseIsoDate('2005-03-14')).toEqual({ year: 2005, month: 3, day: 14 });
  });
  it('rejects impossible dates', () => {
    expect(parseIsoDate('2005-02-30')).toBeNull();
    expect(parseIsoDate('2005-13-01')).toBeNull();
    expect(parseIsoDate('2005-00-10')).toBeNull();
  });
  it('rejects the wrong format', () => {
    expect(parseIsoDate('abc')).toBeNull();
    expect(parseIsoDate('2005-3-4')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });
});

describe('ageFromBirthDate', () => {
  const today = new Date(2026, 10, 15); // 15 November 2026

  it('counts the birthday on the day itself', () => {
    expect(ageFromBirthDate('2005-11-15', today)).toBe(21);
  });
  it('is one year younger the day before the birthday', () => {
    expect(ageFromBirthDate('2005-11-16', today)).toBe(20);
  });
  it('is the full age after the birthday has passed this year', () => {
    expect(ageFromBirthDate('2005-01-01', today)).toBe(21);
  });
  it('goes up by one at the next birthday (automatic yearly update)', () => {
    expect(ageFromBirthDate('2005-11-15', new Date(2027, 10, 14))).toBe(21);
    expect(ageFromBirthDate('2005-11-15', new Date(2027, 10, 15))).toBe(22);
  });
  it('returns 0 for a baby born today', () => {
    expect(ageFromBirthDate('2026-11-15', today)).toBe(0);
  });
  it('returns null for a date in the future', () => {
    expect(ageFromBirthDate('2026-12-01', today)).toBeNull();
    expect(ageFromBirthDate('2030-01-01', today)).toBeNull();
  });
  it('returns null for an invalid date', () => {
    expect(ageFromBirthDate('not-a-date', today)).toBeNull();
    expect(ageFromBirthDate('2005-02-30', today)).toBeNull();
  });
  it('handles 29 February birthdays', () => {
    expect(ageFromBirthDate('2004-02-29', new Date(2026, 1, 28))).toBe(21); // 28 Feb: not yet
    expect(ageFromBirthDate('2004-02-29', new Date(2026, 2, 1))).toBe(22); // 1 Mar: passed
  });
});
