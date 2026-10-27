import { EMAIL_DOMAIN, GENDERS, MAJORS, MIN_AGE, SCHOOL_YEARS } from '../constants/options';
import { RegistrationInput } from '../types';

export interface RegistrationForm {
  username: string;
  password: string;
  name: string;
  email: string;
  age: string;
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

  if (!username || !password || !name || !email || !f.age.trim() || !f.gender || !f.schoolyear || !f.major) {
    return { error: 'Please fill all fields' };
  }
  if (!acceptedTerms) return { error: 'Please agree to the Terms and Conditions' };
  if (password.length < 6) return { error: 'Password must be at least 6 characters' };

  const age = Number(f.age);
  if (!Number.isInteger(age) || age < MIN_AGE) return { error: `Minimum age is ${MIN_AGE}` };
  if (!email.endsWith(EMAIL_DOMAIN)) return { error: `Only ${EMAIL_DOMAIN} emails are allowed` };

  const gender = GENDERS.find((g) => g.code === f.gender)?.code;
  const major = MAJORS.find((m) => m.code === f.major)?.code;
  const schoolyear = SCHOOL_YEARS.find((y) => y === f.schoolyear);
  if (!gender || !major || !schoolyear) return { error: 'Please fill all fields' };

  return { input: { username, name, email, password, age, gender, schoolyear, major } };
}
