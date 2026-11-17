import { EMAIL_DOMAIN, MIN_AGE, schoolYearOptions } from '../../src/constants/options';

describe('schoolYearOptions', () => {
  it('lists the last five years up to the current one', () => {
    expect(schoolYearOptions(new Date(2026, 0, 1))).toEqual(['2022', '2023', '2024', '2025', '2026']);
  });
  it('moves forward by itself every year', () => {
    expect(schoolYearOptions(new Date(2027, 5, 1))).toEqual(['2023', '2024', '2025', '2026', '2027']);
  });
});

describe('constants', () => {
  it('keeps the registration rules in one place', () => {
    expect(MIN_AGE).toBe(17);
    expect(EMAIL_DOMAIN).toBe('@student.umn.ac.id');
  });
});
