import { EMAIL_DOMAIN, GENDERS, MAJORS, MIN_AGE, schoolYearOptions } from '../constants/options';
import { RegistrationInput } from '../types';
import { ageFromBirthDate } from './age';

export interface RegistrationForm {
  username: string;
  password: string;
  name: string;
  email: string;
  birthDate: string; // 'YYYY-MM-DD', or '' until all three dropdowns are chosen
  gender: string; // Gender code
  schoolyear: string;
  major: string; // MajorCode
}

type Result = { input: RegistrationInput } | { error: string };

// Same rules as RegisterActivity.kt
export function validateRegistration(f: RegistrationForm, acceptedTerms: boolean): Result {
  const username = f.username.trim();
  const name = f.name.trim();
  const email = f.email.trim().toLowerCase();
  const password = f.password.trim();

  if (!username || !password || !name || !email || !f.birthDate || !f.gender || !f.schoolyear || !f.major) {
    return { error: 'Please fill all fields' };
  }
  if (!acceptedTerms) return { error: 'Please agree to the Terms and Conditions' };
  if (password.length < 6) return { error: 'Password must be at least 6 characters' };

  const age = ageFromBirthDate(f.birthDate);
  if (age === null) return { error: 'Please enter a valid date of birth' };
  if (age < MIN_AGE) return { error: `Minimum age is ${MIN_AGE}` };
  if (!email.endsWith(EMAIL_DOMAIN)) return { error: `Only ${EMAIL_DOMAIN} emails are allowed` };

  const gender = GENDERS.find((g) => g.code === f.gender)?.code;
  const major = MAJORS.find((m) => m.code === f.major)?.code;
  const schoolyear = schoolYearOptions().find((y) => y === f.schoolyear);
  if (!gender || !major || !schoolyear) return { error: 'Please fill all fields' };

  return { input: { username, name, email, password, birthDate: f.birthDate, gender, schoolyear, major } };
}
