const fs = require('fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc, deleteDoc, arrayRemove } = require('firebase/firestore');

let env;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'umatch-rules-test',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/alice'), { uid: 'alice', username: 'alice', name: 'Alice Full', photoVerified: false });
    await setDoc(doc(db, 'users/bob'), { uid: 'bob', username: 'bob', name: 'Bob Full' });
    await setDoc(doc(db, 'swipes/alice'), { liked: ['bob'], passed: [] });
    await setDoc(doc(db, 'swipes/bob'), { liked: ['alice'], passed: [] });
    await setDoc(doc(db, 'swipes/dave'), { liked: ['erin'], passed: [] });
    await setDoc(doc(db, 'swipes/erin'), { liked: ['dave'], passed: [] });
    await setDoc(doc(db, 'favorites/alice'), { favoriteUsers: ['bob'] });
    await setDoc(doc(db, 'matches/alice_bob'), { users: ['alice', 'bob'], lastMessage: 'hi' });
    await setDoc(doc(db, 'matches/alice_bob/chats/m1'), { senderId: 'alice', text: 'hi', pinned: false });
  });
});

const umn = (uid) => env.authenticatedContext(uid, { email: `${uid}@student.umn.ac.id`, email_verified: true }).firestore();
const fake = () => env.authenticatedContext('mallory', { email: 'mallory@example.com', email_verified: false }).firestore();
const guest = () => env.unauthenticatedContext().firestore();

describe('users', () => {
  test('guest cannot read', () => assertFails(getDoc(doc(guest(), 'users/alice'))));
  test('non-UMN / unverified account cannot read', () => assertFails(getDoc(doc(fake(), 'users/alice'))));
  test('verified UMN student can read', () => assertSucceeds(getDoc(doc(umn('bob'), 'users/alice'))));
  test('owner can update own bio', () => assertSucceeds(updateDoc(doc(umn('alice'), 'users/alice'), { bio: 'hello' })));
  test('owner cannot change the full name', () => assertFails(updateDoc(doc(umn('alice'), 'users/alice'), { name: 'Other' })));
  test('owner cannot set photoVerified', () => assertFails(updateDoc(doc(umn('alice'), 'users/alice'), { photoVerified: true })));
  test("another user cannot update someone's profile", () => assertFails(updateDoc(doc(umn('bob'), 'users/alice'), { bio: 'x' })));
});

describe('swipes, blocks, favorites', () => {
  test('non-UMN account cannot read swipes', () => assertFails(getDoc(doc(fake(), 'swipes/alice'))));
  test('verified user can read swipes (needed for mutual-like check)', () => assertSucceeds(getDoc(doc(umn('bob'), 'swipes/alice'))));
  test('account deletion can remove my uid from another user\'s liked list', () =>
    assertSucceeds(updateDoc(doc(umn('alice'), 'swipes/bob'), { liked: arrayRemove('alice') })));
  test('non-UMN account cannot write blocks', () => assertFails(setDoc(doc(fake(), 'blocks/alice'), { blockedUsers: ['x'] })));
  test("another user cannot read someone's favorites", () => assertFails(getDoc(doc(umn('bob'), 'favorites/alice'))));
  test('owner can read own favorites', () => assertSucceeds(getDoc(doc(umn('alice'), 'favorites/alice'))));
});

describe('connections (graph)', () => {
  const conn = (ctx, uid) => doc(ctx, `connections/${uid}`);
  test('verified user can read someone else\'s published connections', () => assertSucceeds(getDoc(conn(umn('bob'), 'alice'))));
  test('non-UMN account cannot read connections', () => assertFails(getDoc(conn(fake(), 'alice'))));
  test('owner can publish a visible list', () => assertSucceeds(setDoc(conn(umn('alice'), 'alice'), { visible: true, partners: ['bob'] })));
  test('owner can hide: visible false with an empty list', () => assertSucceeds(setDoc(conn(umn('alice'), 'alice'), { visible: false, partners: [] })));
  test('hidden cannot still carry a list', () => assertFails(setDoc(conn(umn('alice'), 'alice'), { visible: false, partners: ['bob'] })));
  test("cannot write another person's connections", () => assertFails(setDoc(conn(umn('bob'), 'alice'), { visible: true, partners: ['bob'] })));
  test('no extra fields', () => assertFails(setDoc(conn(umn('alice'), 'alice'), { visible: true, partners: [], note: 'x' })));
  test('owner can delete own document (account deletion)', async () => {
    await assertSucceeds(setDoc(conn(umn('alice'), 'alice'), { visible: true, partners: [] }));
    await assertSucceeds(deleteDoc(conn(umn('alice'), 'alice')));
  });
});

describe('matches', () => {
  test('non-member cannot read a match', () => assertFails(getDoc(doc(umn('carol'), 'matches/alice_bob'))));
  test('member can read a match', () => assertSucceeds(getDoc(doc(umn('bob'), 'matches/alice_bob'))));
  test('cannot create a match without a mutual like', () =>
    assertFails(setDoc(doc(umn('carol'), 'matches/alice_carol'), { users: ['alice', 'carol'], lastMessage: '' })));
  test('can create a match after a mutual like', () =>
    assertSucceeds(setDoc(doc(umn('erin'), 'matches/dave_erin'), { users: ['dave', 'erin'], lastMessage: '' })));
  test('member cannot change the users array', () =>
    assertFails(updateDoc(doc(umn('alice'), 'matches/alice_bob'), { users: ['alice', 'carol'] })));
});

describe('chats', () => {
  const chat = (ctx, id = 'm1') => doc(ctx, `matches/alice_bob/chats/${id}`);
  test('non-member cannot read', () => assertFails(getDoc(chat(umn('carol')))));
  test('non-member cannot send', () => assertFails(setDoc(chat(umn('carol'), 'm2'), { senderId: 'carol', text: 'x' })));
  test('member can send as self', () => assertSucceeds(setDoc(chat(umn('bob'), 'm2'), { senderId: 'bob', text: 'yo' })));
  test('member cannot send as the other person', () => assertFails(setDoc(chat(umn('bob'), 'm2'), { senderId: 'alice', text: 'fake' })));
  test('sender can edit own message', () => assertSucceeds(updateDoc(chat(umn('alice')), { text: 'edited', edited: true })));
  test("partner cannot edit the other person's message", () => assertFails(updateDoc(chat(umn('bob')), { text: 'tampered' })));
  test('partner can pin a message', () => assertSucceeds(updateDoc(chat(umn('bob')), { pinned: true })));
  test('member can delete (account deletion)', () => assertSucceeds(deleteDoc(chat(umn('bob')))));
});
