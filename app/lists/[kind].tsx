import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/ui';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import {
  getPassedUsers,
  getUsersILiked,
  getUsersWhoLikedMe,
  likeBack,
  unlikeUser,
  unpassUser,
} from '../../src/services/likes';
import { UserProfile } from '../../src/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Kind = 'liked-me' | 'my-likes' | 'passed';

// One screen for LikesFragment, MyLikesFragment and PassedUsersFragment: same grid, different data and action.
const CONFIG: Record<
  Kind,
  {
    title: string;
    empty: string;
    action: string;
    load: (myId: string) => Promise<UserProfile[]>;
    run: (myId: string, other: UserProfile) => Promise<string | void>;
    confirm?: (u: UserProfile) => { title: string; message: string };
    done: (u: UserProfile) => string;
  }
> = {
  'liked-me': {
    title: 'Who liked me',
    empty: 'Nobody yet. Keep swiping!',
    action: 'Like back',
    load: getUsersWhoLikedMe,
    run: likeBack,
    done: (u) => `Matched with ${u.name}!`,
  },
  'my-likes': {
    title: 'People I liked',
    empty: "You haven't liked anyone yet.",
    action: 'Unlike',
    load: getUsersILiked,
    run: unlikeUser,
    confirm: (u) => ({ title: `Unlike ${u.name}?`, message: 'This will remove them from your liked list.' }),
    done: (u) => `Unliked ${u.name}`,
  },
  passed: {
    title: 'People I passed',
    empty: "You haven't passed anyone.",
    action: 'Undo pass',
    load: getPassedUsers,
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

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    try {
      setUsers(await cfg.load(user.uid));
      setStatus('ready');
    } catch (e) {
      console.warn('Failed to load list', e);
      setStatus('error');
    }
  }, [user, cfg]);

  useEffect(() => {
    load();
  }, [load]);

  async function perform(target: UserProfile) {
    if (!user) return;
    try {
      await cfg.run(user.uid, target);
      setUsers((list) => list.filter((u) => u.uid !== target.uid));
      Alert.alert(cfg.done(target));
    } catch (e) {
      console.warn(e);
      Alert.alert('Something went wrong', 'Please try again.');
    }
  }

  function onAction(target: UserProfile) {
    const confirm = cfg.confirm?.(target);
    if (!confirm) return perform(target);
    Alert.alert(confirm.title, confirm.message, [
      { text: 'Cancel', style: 'cancel' },
      { text: cfg.action, style: 'destructive', onPress: () => perform(target) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
          <Text style={{ color: t.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>{cfg.title}</Text>
      </View>

      {status === 'loading' && <ActivityIndicator color={t.primary} size="large" style={{ marginTop: 48 }} />}
      {status === 'error' && (
        <View style={styles.center}>
          <Text style={{ color: t.text, marginBottom: 8 }}>Failed to load.</Text>
          <Button title="Try again" onPress={load} />
        </View>
      )}
      {status === 'ready' && (
        <FlatList
          data={users}
          keyExtractor={(u) => u.uid}
          numColumns={2}
          contentContainerStyle={{ padding: 12, flexGrow: 1 }}
          columnWrapperStyle={{ gap: 12 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: t.textSecondary }}>{cfg.empty}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: t.card }]}>
              <Pressable onPress={() => router.push(`/profile/${item.uid}`)}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.photo} contentFit="cover" />
                ) : (
                  <View style={[styles.photo, { backgroundColor: t.surfaceVariant }]} />
                )}
                <Text style={{ color: t.text, fontWeight: '700', padding: 8 }} numberOfLines={1}>
                  {item.name}
                  {item.age ? `, ${item.age}` : ''}
                </Text>
              </Pressable>
              <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
                <Button title={cfg.action} variant={kind === 'liked-me' ? 'primary' : 'outline'} onPress={() => onAction(item)} />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { flex: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  photo: { width: '100%', aspectRatio: 1 },
});
