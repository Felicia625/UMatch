import { User } from '../models/dating';
import { demoUser } from '../data/dummyData';

export type RegistrationInput = {
    username: string;
    password: string;
    name: string;
    email: string;
    age: string;
    gender: string;
    schoolyear: string;
    major: string;
    acceptedTerms: boolean;
};

export const validateRegistration = (input: RegistrationInput): string | null => {
    if (Object.values(input).some(value => typeof value === 'string' && !value.trim())) return 'Please fill all fields';
    if (!input.acceptedTerms) return 'Please agree to the Terms and Conditions';
    if (input.password.length < 6) return 'Password must be at least 6 characters';
    if (Number.isNaN(Number(input.age)) || Number(input.age) < 17) return 'Minimum age is 17';
    if (!input.email.endsWith('@student.umn.ac.id')) return 'Only @student.umn.ac.id emails are allowed';
    return null;
};

export const authService = {
    signIn: (email: string, password: string): User | null => email === demoUser.email && password.length >= 6 ? demoUser : null,
    register: (input: RegistrationInput): User => ({
        ...demoUser,
        uid: `${input.username}-${Date.now()}`,
        name: input.name,
        username: input.username,
        email: input.email,
        age: input.age,
        gender: input.gender === 'Female' ? 'F' : 'M',
        schoolyear: input.schoolyear,
        major: input.major,
        likes: [],
    }),
    signOut: () => undefined,
};
