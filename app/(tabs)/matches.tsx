import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Avatar } from '../../src/components/Avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatView, PANEL_HEADER_HEIGHT } from '../../src/components/ChatView';
import { TextField } from '../../src/components/ui';
import { WIDE_SCREEN } from '../../src/constants/layout';
import { useTheme } from '../../src/constants/theme';
import { MatchRow, MatchStatus, useMatches } from '../../src/hooks/useMatches';
import { useAuth } from '../../src/providers/AuthProvider';
import { addFavorite, blockUser, removeFavorite, unblockUser } from '../../src/services/matches';
import { syncMyConnections } from '../../src/services/connections';
import { formatListTime } from '../../src/utils/dates';

const TABS: { key: MatchStatus; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'blocked', label: 'Blocked' },
];

type ModeFilter = 'all' | 'dating' | 'friend';
const MODES: { key: ModeFilter; label: string; icon: 'heart' | 'thumbs-up' | null }[] = [
  { key: 'all', label: 'All', icon: null },
  { key: 'dating', label: 'Match', icon: 'heart' },
  { key: 'friend', label: 'Friend', icon: 'thumbs-up' },
];

/** The mode a match was formed in. Matches made before it was stored use the partner's current mode. */
const isFriendMatch = (r: MatchRow) => r.match.friend ?? r.partner.friendFirst === true;

// Port of MatchListFragment: tabs, search, favourites filter, block / unblock, pull to refresh.
export default function Matches() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const myId = user?.uid;
  const { rows, error, refreshMeta } = useMatches(myId);

  const [tab, setTab] = useState<MatchStatus>('active');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Wide screens: list on the left, the selected chat on the right. Phones keep opening the chat full screen.
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_SCREEN;
  const { open: openParam } = useLocalSearchParams<{ open?: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof openParam === 'string') setSelectedId(openParam);
  }, [openParam]);

  // The favourites toggle lives in the title bar.
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      // Wide screens draw their own title bar (list title + star on the left, the open chat's person on the right).
      headerShown: !wide,
      headerRight: () => (
        <Pressable onPress={() => setFavoritesOnly((v) => !v)} hitSlop={10} accessibilityLabel="Show favorites">
          <Ionicons name={favoritesOnly ? 'star' : 'star-outline'} size={24} color={favoritesOnly ? '#FFE082' : '#FFFFFF'} />
        </Pressable>
      ),
    });
  }, [navigation, favoritesOnly, wide]);

  // A like-back or a new match can change who is "active", so re-read the lookups whenever the tab is shown.
  useFocusEffect(
    useCallback(() => {
      refreshMeta();
      if (myId) syncMyConnections(myId); // keeps the published connections list current (only if I chose to share it)
    }, [refreshMeta, myId]),
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (favoritesOnly ? r.favorite : r.status === tab) &&
        (modeFilter === 'all' || isFriendMatch(r) === (modeFilter === 'friend')) &&
        (!q || r.partner.username.toLowerCase().includes(q)),
    );
  }, [rows, tab, favoritesOnly, search, modeFilter]);

  const counts = useMemo(() => {
    const c: Record<MatchStatus, number> = { active: 0, inactive: 0, blocked: 0 };
    (rows ?? []).forEach((r) => {
      if (modeFilter === 'all' || isFriendMatch(r) === (modeFilter === 'friend')) c[r.status]++;
    });
    return c;
  }, [rows, modeFilter]);

  function open(r: MatchRow) {
    if (r.status === 'blocked') return Alert.alert('You have blocked this user');
    if (r.blockedByPartner) return Alert.alert('You cannot chat with this user');
    if (r.status === 'inactive') return Alert.alert('Match no longer valid');
    if (wide) setSelectedId(r.match.id);
    else router.push(`/chat/${r.match.id}`);
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
    Alert.alert(`${action} ${r.partner.username}?`, undefined, [
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

  const list = (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        {/* The field's own bottom margin is removed here, otherwise the box is taller than the field and the icon sits low. */}
        <View style={{ justifyContent: 'center', marginBottom: 12 }}>
          <Ionicons name="search" size={18} color={t.textSecondary} style={styles.searchIcon} />
          <TextField placeholder="Search matches" value={search} onChangeText={setSearch} style={{ paddingLeft: 42, marginBottom: 0 }} />
        </View>
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

      <View style={styles.modes}>
        {MODES.map((m) => {
          const on = modeFilter === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setModeFilter(m.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.modeChip, { borderColor: t.primary, backgroundColor: on ? t.primary : 'transparent' }]}
            >
              {m.icon && <Ionicons name={m.icon} size={14} color={on ? t.onPrimary : t.primary} />}
              <Text style={{ color: on ? t.onPrimary : t.primary, fontWeight: '600', fontSize: 13 }}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

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
                {rows?.length === 0 ? 'No match yet' : modeFilter !== 'all' && rows?.length ? `No ${modeFilter} matches here.` : favoritesOnly ? 'No favorites yet.' : tab === 'active' ? 'No match yet' : 'Nothing here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              style={[styles.row, { borderColor: t.outline }, wide && selectedId === item.match.id && { backgroundColor: t.tint }]}
            >
              <Pressable onPress={() => router.push(`/profile/${item.partner.uid}`)} accessibilityLabel="View profile">
                <Avatar uri={item.partner.photoUrl} name={item.partner.username} size={56} />
              </Pressable>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, flexShrink: 1 }} numberOfLines={1}>
                    {item.partner.username}
                  </Text>
                  <Ionicons
                    name={isFriendMatch(item) ? 'thumbs-up' : 'heart'}
                    size={14}
                    color={t.primary}
                    accessibilityLabel={isFriendMatch(item) ? 'Friend match' : 'Match'}
                  />
                </View>
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
    </View>
  );

  if (!wide) return list;

  // One title bar across the top: "Matches" and the favourites star on the left, the open chat's person on the right,
  // with a clearly visible line between the two sections.
  const barHeight = PANEL_HEADER_HEIGHT + insets.top;
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: t.background }}>
      <View style={{ width: 380 }}>
        <View style={[styles.listBar, { backgroundColor: t.primary, height: barHeight, paddingTop: insets.top }]}>
          <Text style={styles.listBarTitle}>Matches</Text>
          <Pressable onPress={() => setFavoritesOnly((v) => !v)} hitSlop={10} accessibilityLabel="Show favorites">
            <Ionicons name={favoritesOnly ? 'star' : 'star-outline'} size={24} color={favoritesOnly ? '#FFE082' : '#FFFFFF'} />
          </Pressable>
        </View>
        {list}
      </View>
      <View style={{ width: 1 }}>
        <View style={{ height: barHeight, backgroundColor: 'rgba(255,255,255,0.45)' }} />
        <View style={{ flex: 1, backgroundColor: t.outline }} />
      </View>
      <View style={{ flex: 1 }}>
        {selectedId ? (
          <ChatView key={selectedId} matchId={selectedId} embedded onClose={() => setSelectedId(null)} />
        ) : (
          <>
            <View style={{ height: barHeight, backgroundColor: t.primary }} />
            <View style={styles.empty}>
              <Text style={{ color: t.textSecondary, fontSize: 16 }}>Select a conversation to start chatting</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  listBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  listBarTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  modes: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
