import { demoMessages, demoUser, demoUsers } from '../data/dummyData';
import { Match, Message, User } from '../models/dating';

let currentUser = demoUser;
let users = [...demoUsers];
const passedIds: string[] = [];

const chatKey = (firstId: string, secondId: string) => [firstId, secondId].sort().join('-');

export const datingService = {
    getCurrentUser: () => currentUser,
    getUsers: () => users.filter(user => user.uid !== currentUser.uid && !currentUser.likes.includes(user.uid) && !passedIds.includes(user.uid)),
    getLikedUsers: () => users.filter(user => currentUser.likes.includes(user.uid)),
    getPassedUsers: () => users.filter(user => passedIds.includes(user.uid)),
    swipe: (userId: string, liked: boolean) => {
        if (liked && !currentUser.likes.includes(userId)) currentUser = { ...currentUser, likes: [...currentUser.likes, userId] };
        if (!liked && !passedIds.includes(userId)) passedIds.push(userId);
    },
    getMatches: (): Match[] => users.filter(user => user.uid !== currentUser.uid && currentUser.likes.includes(user.uid) && user.likes.includes(currentUser.uid)).map(user => ({ matchId: chatKey(currentUser.uid, user.uid), user1: currentUser.uid, user2: user.uid, users: [currentUser.uid, user.uid], lastMessage: '', timestamp: Date.now() })),
    getUser: (userId: string) => users.find(user => user.uid === userId),
    updateCurrentUser: (updates: Partial<User>) => { currentUser = { ...currentUser, ...updates }; users = users.map(user => user.uid === currentUser.uid ? currentUser : user); },
    getMessages: (partnerId: string) => demoMessages[chatKey(currentUser.uid, partnerId)] ?? [],
    sendMessage: (partnerId: string, text: string) => {
        const key = chatKey(currentUser.uid, partnerId);
        const message: Message = { messageId: `${key}-${Date.now()}`, senderId: currentUser.uid, text, timestamp: Date.now() };
        demoMessages[key] = [...(demoMessages[key] ?? []), message];
        return message;
    },
};
