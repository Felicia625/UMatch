export type Gender = 'M' | 'F';

export type User = {
    uid: string;
    name: string;
    username: string;
    age: string;
    email: string;
    gender: Gender;
    photoUrl: string;
    photoUrls: string[];
    photoVerified: boolean;
    school: string;
    likes: string[];
    bio: string;
    interests: string[];
    schoolyear: string;
    major: string;
    preference: Preferences;
    isOnline: boolean;
    isTyping: boolean;
};

export type Preferences = {
    yearPreferences: string;
    gender: Gender | null;
    majorPreferences: string[];
};

export type Match = {
    matchId: string;
    user1: string;
    user2: string;
    users: string[];
    lastMessage: string;
    timestamp: number;
};

export type Message = {
    messageId: string;
    senderId: string;
    text: string;
    timestamp: number;
    replyTo?: string;
    replyText?: string;
    edited?: boolean;
    pinned?: boolean;
};

export const majors = [
    'Informatika',
    'Teknik Elektro',
    'Teknik Fisika',
    'Teknik Komputer',
    'Sistem Informasi',
    'Strategic Communication',
    'Jurnalistik',
    'Management',
    'Akuntansi',
    'Perhotelan',
    'Desain Komunikasi Visual',
    'Film & Animasi',
    'Arsitektur',
] as const;

export const years = ['2021', '2022', '2023', '2024', '2025', 'All'] as const;
