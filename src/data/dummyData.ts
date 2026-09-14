import { Message, User } from '../models/dating';

export const demoUser: User = {
    uid: 'alice-id',
    name: 'Alice',
    username: 'alice',
    age: '20',
    email: 'alice@student.umn.ac.id',
    gender: 'F',
    photoUrl: '',
    photoUrls: [],
    photoVerified: true,
    school: 'UMN',
    likes: ['bob-id'],
    bio: 'Coffee, coding, and discovering new places around campus.',
    interests: ['Coffee', 'Coding', 'Travel'],
    schoolyear: '2023',
    major: 'Informatika',
    preference: { yearPreferences: 'All', gender: 'M', majorPreferences: [] },
    isOnline: true,
    isTyping: false,
};

export const demoUsers: User[] = [
    demoUser,
    { ...demoUser, uid: 'bob-id', name: 'Bob', username: 'bob', age: '21', gender: 'M', major: 'Desain Komunikasi Visual', bio: 'Photography, live music, and weekend road trips.', likes: ['alice-id'], interests: ['Photography', 'Music'] },
    { ...demoUser, uid: 'salsa-id', name: 'Salsa', username: 'salsa', age: '20', major: 'Sistem Informasi', bio: 'Bookstores, sunsets, and finding the best food in town.', likes: [], interests: ['Books', 'Food'] },
];

export const demoMessages: Record<string, Message[]> = {
    'alice-id-bob-id': [
        { messageId: 'message-1', senderId: 'alice-id', text: 'Hi Bob!', timestamp: Date.now() - 120000 },
        { messageId: 'message-2', senderId: 'bob-id', text: 'Hey Alice, how are you?', timestamp: Date.now() - 60000 },
    ],
};
