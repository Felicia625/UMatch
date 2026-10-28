import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/Avatar';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { deleteMessage, editMessage, sendMessage, setPinned, subscribeToChat } from '../../src/services/chat';
import { canChat } from '../../src/services/matches';
import { getUser } from '../../src/services/users';
import { Message, UserProfile } from '../../src/types';
import { formatTime } from '../../src/utils/dates';

// Port of ChatFragment + ChatAdapter: real-time messages, reply, edit, delete, pin.
export default function Chat() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const myId = user?.uid ?? '';
  const partnerId = matchId?.split('_').find((p) => p !== myId);

  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [menuFor, setMenuFor] = useState<Message | null>(null);

  // Same gate as ChatFragment.checkIfBlocked(): still a mutual match and nobody is blocked.
  useEffect(() => {
    if (!myId || !partnerId) return;
    let cancelled = false;
    (async () => {
      try {
        const [result, profile] = await Promise.all([canChat(myId, partnerId), getUser(partnerId)]);
        if (cancelled) return;
        if (!result.ok) {
          Alert.alert(result.reason);
          router.back();
          return;
        }
        setPartner(profile);
        setAllowed(true);
      } catch (e) {
        console.warn('Chat gate failed', e);
        if (!cancelled) {
          Alert.alert('Could not open chat');
          router.back();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [myId, partnerId, router]);

  useEffect(() => {
    if (!allowed || !matchId) return;
    return subscribeToChat(matchId, setMessages, (e) => console.warn('Chat listener failed', e));
  }, [allowed, matchId]);

  const pinned = useMemo(() => messages.filter((m) => m.pinned), [messages]);
  // Inverted list: newest first, so the chat opens at the bottom and the keyboard behaves.
  const regular = useMemo(() => messages.filter((m) => !m.pinned).reverse(), [messages]);

  function onSend() {
    const body = text.trim();
    if (!body || !matchId) return;
    const editTarget = editing;
    const replyTarget = replyTo;
    setText('');
    setEditing(null);
    setReplyTo(null);
    const job = editTarget ? editMessage(matchId, editTarget.id, body) : sendMessage(matchId, myId, body, replyTarget ?? undefined);
    job.catch(() => Alert.alert(editTarget ? 'Failed to edit message' : 'Failed to send message.'));
  }

  function cancelComposer() {
    if (editing) setText('');
    setEditing(null);
    setReplyTo(null);
  }

  function confirmDelete(m: Message) {
    Alert.alert('Delete message?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMessage(matchId, m.id).catch(() => Alert.alert('Failed to delete')),
      },
    ]);
  }

  const menuOptions = menuFor
    ? [
        { label: 'Reply', run: () => { setEditing(null); setReplyTo(menuFor); } },
        { label: menuFor.pinned ? 'Unpin' : 'Pin', run: () => setPinned(matchId, menuFor.id, !menuFor.pinned).catch(() => Alert.alert('Failed to update')) },
        ...(menuFor.senderId === myId
          ? [
              { label: 'Edit', run: () => { setReplyTo(null); setEditing(menuFor); setText(menuFor.text); } },
              { label: 'Delete', run: () => confirmDelete(menuFor), danger: true },
            ]
          : []),
      ]
    : [];

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable onPress={() => partnerId && router.push(`/profile/${partnerId}`)} style={styles.headerPartner}>
              <Avatar uri={partner?.photoUrl} name={partner?.name} size={34} />
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
                {partner?.name ?? ' '}
              </Text>
            </Pressable>
          ),
        }}
      />

      {pinned.length > 0 && (
        <View style={[styles.pinnedBar, { backgroundColor: t.surfaceVariant, borderColor: t.outline }]}>
          <ScrollView>
            {pinned.map((m) => (
              <Pressable key={m.id} onLongPress={() => setMenuFor(m)} style={{ paddingVertical: 4 }}>
                <Text style={{ color: t.text }} numberOfLines={2}>
                  📌 {m.text}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          data={regular}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => <Bubble message={item} mine={item.senderId === myId} onLongPress={() => setMenuFor(item)} />}
        />

        {(replyTo || editing) && (
          <View style={[styles.composerNote, { backgroundColor: t.surfaceVariant, borderColor: t.outline }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.primary, fontWeight: '700', fontSize: 12 }}>{editing ? 'Editing message' : 'Replying to'}</Text>
              <Text style={{ color: t.textSecondary }} numberOfLines={1}>
                {(editing ?? replyTo)?.text}
              </Text>
            </View>
            <Pressable onPress={cancelComposer} hitSlop={10} accessibilityLabel="Cancel">
              <Ionicons name="close" size={22} color={t.textSecondary} />
            </Pressable>
          </View>
        )}

        <View style={[styles.composer, { borderColor: t.outline, backgroundColor: t.surface }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={editing ? 'Editing message...' : 'Type a message...'}
            placeholderTextColor={t.textSecondary}
            multiline
            style={[styles.input, { color: t.text, backgroundColor: t.surfaceVariant }]}
          />
          <Pressable
            onPress={onSend}
            disabled={!text.trim() || !allowed}
            style={[styles.send, { backgroundColor: t.primary, opacity: text.trim() && allowed ? 1 : 0.5 }]}
            accessibilityLabel="Send"
          >
            <Ionicons name={editing ? 'checkmark' : 'send'} size={20} color={t.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!menuFor} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuFor(null)}>
          <View style={[styles.menu, { backgroundColor: t.surface }]}>
            {menuOptions.map((o) => (
              <Pressable
                key={o.label}
                style={styles.menuRow}
                onPress={() => {
                  setMenuFor(null);
                  o.run();
                }}
              >
                <Text style={{ color: o.danger ? t.danger : t.text, fontSize: 16 }}>{o.label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.menuRow} onPress={() => setMenuFor(null)}>
              <Text style={{ color: t.textSecondary, fontSize: 16 }}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Bubble({ message, mine, onLongPress }: { message: Message; mine: boolean; onLongPress: () => void }) {
  const t = useTheme();
  const textColor = mine ? t.onPrimary : t.text;
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginVertical: 3 }}>
      <Pressable
        onLongPress={onLongPress}
        style={[styles.bubble, mine ? { backgroundColor: t.primary, borderBottomRightRadius: 4 } : { backgroundColor: t.surface, borderBottomLeftRadius: 4 }]}
      >
        {!!message.replyText && (
          <View style={[styles.quote, { borderColor: mine ? '#FFFFFF99' : t.primary }]}>
            <Text style={{ color: mine ? '#FFFFFFCC' : t.textSecondary }} numberOfLines={2}>
              {message.replyText}
            </Text>
          </View>
        )}
        <Text style={{ color: textColor, fontSize: 16 }}>{message.text}</Text>
        <Text style={{ color: mine ? '#FFFFFFB3' : t.textSecondary, fontSize: 11, alignSelf: 'flex-end', marginTop: 2 }}>
          {message.edited ? 'edited · ' : ''}
          {formatTime(message.timestamp)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerPartner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pinnedBar: { maxHeight: 110, paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  quote: { borderLeftWidth: 3, paddingLeft: 8, marginBottom: 6 },
  composerNote: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, maxHeight: 120, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 40 },
  menu: { borderRadius: 16, paddingVertical: 8 },
  menuRow: { paddingHorizontal: 20, paddingVertical: 14 },
});
