import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/Avatar';
import { TextField } from '../../src/components/ui';
import { useTheme } from '../../src/constants/theme';
import { MatchRow, MatchStatus, useMatches } from '../../src/hooks/useMatches';
import { useAuth } from '../../src/providers/AuthProvider';
import { addFavorite, blockUser, removeFavorite, unblockUser } from '../../src/services/matches';
import { formatListTime } from '../../src/utils/dates';

const TABS: { key: MatchStatus; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'blocked', label: 'Blocked' },
];

// Port of MatchListFragment: tabs, search, favourites filter, block / unblock, pull to refresh.
export default function Matches() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const myId = user?.uid;
  const { rows, error, refreshMeta } = useMatches(myId);

  const [tab, setTab] = useState<MatchStatus>('active');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // A like-back or a new match can change who is "active", so re-read the lookups whenever the tab is shown.
  useFocusEffect(
    useCallback(() => {
      refreshMeta();
    }, [refreshMeta]),
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) => (favoritesOnly ? r.favorite : r.status === tab) && (!q || r.partner.name.toLowerCase().includes(q)),
    );
  }, [rows, tab, favoritesOnly, search]);

  const counts = useMemo(() => {
    const c: Record<MatchStatus, number> = { active: 0, inactive: 0, blocked: 0 };
    (rows ?? []).forEach((r) => c[r.status]++);
    return c;
  }, [rows]);

  function open(r: MatchRow) {
    if (r.status === 'blocked') return Alert.alert('You have blocked this user');
    if (r.blockedByPartner) return Alert.alert('You cannot chat with this user');
    if (r.status === 'inactive') return Alert.alert('Match no longer valid');
    router.push(`/chat/${r.match.id}`);
  }

  async function toggleFavorite(r: MatchRow) {
    if (!myId) return;
    try {
      await (r.favorite ? removeFavorite(myId, r.partner.uid) : addFavorite(myId, r.partner.uid));
      refreshMeta();
    } catch {
      Alert.alert('Failed to update favorites');
    }
  }

  function confirmBlock(r: MatchRow) {
    if (!myId) return;
    const blocked = r.status === 'blocked';
    const action = blocked ? 'Unblock' : 'Block';
    Alert.alert(`${action} ${r.partner.name}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        style: blocked ? 'default' : 'destructive',
        onPress: async () => {
          try {
            await (blocked ? unblockUser(myId, r.partner.uid) : blockUser(myId, r.partner.uid));
            refreshMeta();
          } catch {
            Alert.alert(`Failed to ${action.toLowerCase()} user`);
          }
        },
      },
    ]);
  }

  async function onRefresh() {
    setRefreshing(true);
    await refreshMeta();
    setRefreshing(false);
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.background }}>
      <View style={styles.header}>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>Matches</Text>
        <Pressable onPress={() => setFavoritesOnly((v) => !v)} hitSlop={10} accessibilityLabel="Show favorites">
          <Ionicons name={favoritesOnly ? 'star' : 'star-outline'} size={26} color={favoritesOnly ? '#F5B301' : t.text} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <TextField placeholder="Search matches" value={search} onChangeText={setSearch} />
      </View>

      {!favoritesOnly && (
        <View style={styles.tabs}>
          {TABS.map((x) => (
            <Pressable
              key={x.key}
              onPress={() => setTab(x.key)}
              style={[styles.tab, { backgroundColor: tab === x.key ? t.primary : t.surfaceVariant }]}
            >
              <Text style={{ color: tab === x.key ? t.onPrimary : t.text, fontWeight: '600' }}>
                {x.label} {counts[x.key] > 0 ? `(${counts[x.key]})` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {rows === null && !error && <ActivityIndicator color={t.primary} size="large" style={{ marginTop: 48 }} />}
      {rows === null && error && (
        <Text style={{ color: t.text, textAlign: 'center', marginTop: 48 }}>Failed to load matches. Pull down to retry.</Text>
      )}

      {rows !== null && (
        <FlatList
          data={visible}
          keyExtractor={(r) => r.match.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: t.textSecondary }}>
                {favoritesOnly ? 'No favorites yet.' : tab === 'active' ? 'No matches yet. Keep swiping!' : 'Nothing here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item)} style={[styles.row, { borderColor: t.outline }]}>
              <Pressable onPress={() => router.push(`/profile/${item.partner.uid}`)} accessibilityLabel="View profile">
                <Avatar uri={item.partner.photoUrl} name={item.partner.name} size={56} />
              </Pressable>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                  {item.partner.name}
                </Text>
                <Text style={{ color: t.textSecondary }} numberOfLines={1}>
                  {item.match.lastMessage}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Text style={{ color: t.textSecondary, fontSize: 12 }}>{formatListTime(item.match.timestamp)}</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Pressable onPress={() => toggleFavorite(item)} hitSlop={8} accessibilityLabel="Toggle favorite">
                    <Ionicons name={item.favorite ? 'star' : 'star-outline'} size={20} color={item.favorite ? '#F5B301' : t.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => confirmBlock(item)} hitSlop={8} accessibilityLabel="Block or unblock">
                    <Ionicons name="ban-outline" size={20} color={item.status === 'blocked' ? t.danger : t.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
