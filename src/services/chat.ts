import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Unsubscribe,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message } from '../types';
import { toDate } from '../utils/dates';

const chatsOf = (matchId: string) => collection(db, 'matches', matchId, 'chats');
const messageRef = (matchId: string, messageId: string) => doc(db, 'matches', matchId, 'chats', messageId);

function toMessage(id: string, d: DocumentData): Message {
  return {
    id,
    senderId: d.senderId ?? '',
    text: d.text ?? '',
    timestamp: toDate(d.timestamp),
    replyTo: d.replyTo || undefined,
    replyText: d.replyText || undefined,
    edited: d.edited === true,
    pinned: d.pinned === true,
  };
}

/** Real-time messages, oldest first (ChatFragment's snapshot listener). */
export function subscribeToChat(
  matchId: string,
  onData: (messages: Message[]) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    query(chatsOf(matchId), orderBy('timestamp', 'asc')),
    (snap) => onData(snap.docs.map((d) => toMessage(d.id, d.data({ serverTimestamps: 'estimate' })))),
    onError,
  );
}

/**
 * Sends a message (optionally as a reply) and updates the match's last message in one batch.
 * The old app stored a separate `messageId` that did not equal the document id; edits and deletes then had to search
 * by text+timestamp. Here the document id is the message id.
 */
export async function sendMessage(matchId: string, myId: string, text: string, replyTo?: Message): Promise<void> {
  const ref = doc(chatsOf(matchId));
  const data: Record<string, unknown> = {
    senderId: myId,
    text,
    timestamp: serverTimestamp(),
    messageId: ref.id,
    edited: false,
    pinned: false,
  };
  if (replyTo) {
    data.replyTo = replyTo.id;
    data.replyText = replyTo.text;
  }
  const batch = writeBatch(db);
  batch.set(ref, data);
  batch.update(doc(db, 'matches', matchId), { lastMessage: text, timestamp: serverTimestamp() });
  await batch.commit();
}

export const editMessage = (matchId: string, messageId: string, text: string) =>
  updateDoc(messageRef(matchId, messageId), { text, edited: true });

export const deleteMessage = (matchId: string, messageId: string) => deleteDoc(messageRef(matchId, messageId));

export const setPinned = (matchId: string, messageId: string, pinned: boolean) =>
  updateDoc(messageRef(matchId, messageId), { pinned });
