import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useDialog } from '../../src/components/AppDialog';
import { Button, TextField } from '../../src/components/ui';
import { PersonPlaceholder } from '../../src/components/Avatar';
import { WIDE_SCREEN } from '../../src/constants/layout';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import {
  getMyLikedIds,
  getPassedUsers,
  getUsersILiked,
  getUsersWhoLikedMe,
  likeBack,
  unlikeUser,
  unpassUser,
} from '../../src/services/likes';
import { matchIdFor } from '../../src/services/swipes';
import { getUser } from '../../src/services/users';
import { UserProfile } from '../../src/types';

type Kind = 'liked-me' | 'my-likes' | 'passed';

// One screen for LikesFragment, MyLikesFragment and PassedUsersFragment: same grid, different data and action.
const CONFIG: Record<
  Kind,
  {
    title: string;
    intro: string; // one line under the title bar, above the list
    icon: keyof typeof Ionicons.glyphMap; // watermark when the list is empty
    emptyHint: string;
    empty: string;
    action: string;
    load: (myId: string) => Promise<{ users: UserProfile[]; otherMode?: number; likeModes?: Record<string, 'friend' | 'dating'> }>;
    run: (myId: string, otherId: string, friend: boolean) => Promise<string | void>;
    confirm?: (u: UserProfile) => { title: string; message: string };
    done: (u: UserProfile) => string;
  }
> = {
  'liked-me': {
    title: 'Who liked me',
    intro: "See who's interested in you",
    icon: 'thumbs-up',
    emptyHint: 'Users interested in you will appear here',
    empty: 'Nobody yet. Keep swiping!',
    action: 'Like back',
    load: getUsersWhoLikedMe,
    run: likeBack,
    done: (u) => `Matched with ${u.username}!`,
  },
  'my-likes': {
    title: 'People I liked',
    intro: 'Manage your likes',
    icon: 'thumbs-up',
    emptyHint: 'Users you like will appear here',
    empty: "You haven't liked anyone yet.",
    action: 'Unlike',
    load: getUsersILiked,
    run: unlikeUser,
    confirm: (u) => ({ title: `Unlike ${u.username}?`, message: 'This will remove them from your liked list.' }),
    done: (u) => `Unliked ${u.username}`,
  },
  passed: {
    title: 'People I passed',
    intro: 'Give another chance',
    icon: 'close',
    emptyHint: 'Users you passed will appear here',
    empty: "You haven't passed anyone.",
    action: 'Undo pass',
    load: async (id) => ({ users: await getPassedUsers(id) }),
    run: unpassUser,
    done: () => 'Removed from passed list',
  },
};

export default function UserList() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { kind } = useLocalSearchParams<{ kind: Kind }>();
  const cfg = CONFIG[kind] ?? CONFIG['my-likes'];
  const { width } = useWindowDimensions();
  const { dialog, ask, notify } = useDialog();
  const columns = width >= WIDE_SCREEN ? 4 : 2; // phones keep two columns

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [me, setMe] = useState<UserProfile | null>(null);
  const [likeModes, setLikeModes] = useState<Record<string, 'friend' | 'dating'>>({}); // "People I liked": the mode of each like
  const [otherMode, setOtherMode] = useState(0); // "Who liked me": people waiting in the other mode
  const [search, setSearch] = useState('');
  const [mutual, setMutual] = useState<Set<string>>(new Set()); // "Who liked me": people I like back, so already connected

  const load = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    try {
      const [list, liked, me] = await Promise.all([
        cfg.load(user.uid),
        kind === 'liked-me' ? getMyLikedIds(user.uid) : Promise.resolve([]),
        getUser(user.uid).catch(() => null),
      ]);
      setMe(me);
      setOtherMode(list.otherMode ?? 0);
      setLikeModes(list.likeModes ?? {});
      setUsers(list.users);
      setMutual(new Set(liked));
      setStatus('ready');
    } catch (e) {
      console.warn('Failed to load list', e);
      setStatus('error');
    }
  }, [user, cfg, kind]);

  // Empty slots fill the last row, so a single card in a row keeps the width of the others instead of stretching.
  // Search by username (case-insensitive, any part of the name).
  const q = search.trim().toLowerCase();
  const shown = useMemo(() => (q ? users.filter((u) => u.username.toLowerCase().includes(q)) : users), [users, q]);
  const padded: (UserProfile | { filler: string })[] = [...shown];
  while (shown.length > 0 && padded.length % columns !== 0) padded.push({ filler: `filler-${padded.length}` });

  useEffect(() => {
    load();
  }, [load]);

  async function perform(target: UserProfile) {
    if (!user) return;
    try {
      await cfg.run(user.uid, target.uid, me?.friendFirst === true); // the user id, not the whole profile
      // "Who liked me" keeps everyone (a like back makes them mutual); the other lists drop the person.
      if (kind === 'liked-me') setMutual((s) => new Set(s).add(target.uid));
      else setUsers((list) => list.filter((u) => u.uid !== target.uid));
      notify(cfg.done(target), undefined, 'checkmark-circle-outline');
    } catch (e) {
      console.warn(e);
      notify('Something went wrong', 'Please try again.', 'alert-circle-outline');
    }
  }

  function onAction(target: UserProfile) {
    const confirm = cfg.confirm?.(target);
    if (!confirm) return perform(target);
    ask({
      title: confirm.title,
      message: confirm.message,
      icon: 'heart-dislike-outline',
      confirmLabel: cfg.action,
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: () => perform(target),
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: cfg.title }} />

      <Text style={[styles.intro, { color: t.textSecondary }]}>{cfg.intro}</Text>

      {kind === 'liked-me' && status === 'ready' && otherMode > 0 && (
        <View style={styles.noticeWrap}>
          <View style={[styles.notice, { backgroundColor: t.surface, borderColor: t.outline }]}>
            <Ionicons name="information-circle-outline" size={20} color={t.primary} />
            <Text style={{ flex: 1, color: t.text, fontSize: 13 }}>
              {`${otherMode} ${otherMode === 1 ? 'person' : 'people'} in ${me?.friendFirst ? 'Dating' : 'Friend first'} mode also liked you. ` +
                `Switch to ${me?.friendFirst ? 'Dating' : 'Friend first'} mode with the Friend first switch on your Profile tab to see them.`}
            </Text>
          </View>
        </View>
      )}

      {status === 'ready' && users.length > 0 && (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={t.textSecondary} style={styles.searchIcon} />
          <TextField
            value={search}
            onChangeText={setSearch}
            placeholder="Search by username"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchField}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8} style={styles.searchClear} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={t.textSecondary} />
            </Pressable>
          )}
        </View>
      )}

      {status === 'loading' && <ActivityIndicator color={t.primary} size="large" style={{ marginTop: 48 }} />}
      {status === 'error' && (
        <View style={styles.center}>
          <Text style={{ color: t.text, marginBottom: 8 }}>Failed to load.</Text>
          <Button title="Try again" onPress={load} />
        </View>
      )}
      {status === 'ready' && (
        <FlatList
          data={padded}
          keyExtractor={(u) => ('filler' in u ? u.filler : u.uid)}
          key={columns}
          numColumns={columns}
          contentContainerStyle={{ padding: 12, flexGrow: 1, width: '100%', maxWidth: 1000, alignSelf: 'center' }}
          columnWrapperStyle={{ gap: 12 }}
          ListEmptyComponent={
            users.length > 0 ? (
              <View style={styles.center}>
                <Ionicons name="search" size={80} color={t.textSecondary} style={{ opacity: 0.18 }} />
                <Text style={{ color: t.textSecondary, marginTop: 16, fontSize: 16, textAlign: 'center' }}>No one matches your search.</Text>
              </View>
            ) : (
            <View style={styles.center}>
              <Ionicons name={cfg.icon} size={120} color={t.textSecondary} style={{ opacity: 0.18 }} />
              <Text style={{ color: t.textSecondary, marginTop: 16, fontSize: 16, textAlign: 'center' }}>{cfg.empty}</Text>
              <Text style={{ color: t.textSecondary, marginTop: 4, textAlign: 'center' }}>{cfg.emptyHint}</Text>
            </View>
            )
          }
          renderItem={({ item }) =>
            'filler' in item ? (
              <View style={{ flex: 1 }} />
            ) : (
            <View style={[styles.card, { backgroundColor: t.card }]}>
              <Pressable onPress={() => router.push(`/profile/${item.uid}`)}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.photo} contentFit="cover" />
                ) : (
                  <PersonPlaceholder style={styles.photo} iconSize={80} />
                )}
                {kind === 'my-likes' && !!likeModes[item.uid] && (
                  <View style={[styles.modeBadge, { backgroundColor: t.surface }]}>
                    <Ionicons name={likeModes[item.uid] === 'friend' ? 'thumbs-up' : 'heart'} size={13} color={t.primary} />
                    <Text style={{ color: t.text, fontSize: 11, fontWeight: '600' }}>
                      {likeModes[item.uid] === 'friend' ? 'Friend first' : 'Dating'}
                    </Text>
                  </View>
                )}
                <Text style={{ color: t.text, fontWeight: '700', padding: 8 }} numberOfLines={1}>
                  {item.username}
                  {item.age ? `, ${item.age}` : ''}
                </Text>
              </Pressable>
              <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
                {kind === 'liked-me' && mutual.has(item.uid) ? (
                  <Button title="Open chat" variant="outline" onPress={() => user && router.push(`/chat/${matchIdFor(user.uid, item.uid)}`)} />
                ) : (
                  <Button
                    title={cfg.action}
                    variant={kind === 'liked-me' ? 'primary' : 'outline'}
                    icon={kind === 'liked-me' && me ? (color) => <Ionicons name={me.friendFirst ? 'thumbs-up' : 'heart'} size={18} color={color} /> : undefined}
                    onPress={() => onAction(item)}
                  />
                )}
              </View>
            </View>
            )
          }
        />
      )}
      {dialog}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 15, textAlign: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, width: '100%', maxWidth: 1000, alignSelf: 'center' },
  searchWrap: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 12, paddingTop: 8 },
  searchField: { height: 44, marginBottom: 0, paddingLeft: 40, paddingRight: 40 },
  searchIcon: { position: 'absolute', left: 26, top: 21, zIndex: 1 },
  searchClear: { position: 'absolute', right: 26, top: 21, zIndex: 1 },
  noticeWrap: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 12, paddingTop: 8 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { flex: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  photo: { width: '100%', aspectRatio: 1 },
  modeBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, elevation: 2, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
});
