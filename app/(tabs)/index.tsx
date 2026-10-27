import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterModal } from '../../src/components/FilterModal';
import { MatchModal } from '../../src/components/MatchModal';
import { SwipeDeckHandle, UserSwipeDeck } from '../../src/components/UserSwipeDeck';
import { Button } from '../../src/components/ui';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { CandidateFilters, loadCandidates, SwipeDirection, swipeUser } from '../../src/services/swipes';
import { getUser } from '../../src/services/users';
import { UserProfile } from '../../src/types';

type Status = 'loading' | 'ready' | 'error';

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const deck = useRef<SwipeDeckHandle>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [deckKey, setDeckKey] = useState(0); // remount the deck on every reload so it starts at card 0
  const [filters, setFilters] = useState<CandidateFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [match, setMatch] = useState<{ user: UserProfile; matchId: string } | null>(null);

  const load = useCallback(
    async (f: CandidateFilters) => {
      if (!user) return;
      setStatus('loading');
      try {
        const me = await getUser(user.uid); // re-read so changed preferences are picked up
        if (!me) throw new Error('Profile not found');
        setUsers(await loadCandidates(me, f));
        setDeckKey((k) => k + 1);
        setStatus('ready');
      } catch (e) {
        console.warn('Failed to load candidates', e);
        setStatus('error');
      }
    },
    [user],
  );

  useEffect(() => {
    load({});
  }, [load]);

  async function onSwipe(target: UserProfile, direction: SwipeDirection) {
    if (!user) return;
    try {
      const result = await swipeUser(user.uid, target.uid, direction);
      if (result.matchId) setMatch({ user: target, matchId: result.matchId });
    } catch (e) {
      console.warn('Swipe failed', e);
      Alert.alert("Couldn't save your swipe", 'Check your connection and try again.');
    }
  }

  function onInspect() {
    const current = deck.current?.current();
    if (current) router.push(`/profile/${current.uid}`);
  }

  const empty = (
    <View style={styles.center}>
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>No more profiles</Text>
      <Text style={{ color: t.textSecondary, textAlign: 'center', marginVertical: 8 }}>
        Try changing your filters or check back later.
      </Text>
      <Button title="Refresh" onPress={() => load(filters)} />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.background }}>
      <View style={styles.header}>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>Discover</Text>
        <View style={styles.headerButtons}>
          <Pressable onPress={() => load(filters)} hitSlop={10} accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={24} color={t.text} />
          </Pressable>
          <Pressable onPress={() => setFilterOpen(true)} hitSlop={10} accessibilityLabel="Filter">
            <Ionicons name="options" size={24} color={filters.major || filters.year ? t.primary : t.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.deckArea}>
        {status === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator color={t.primary} size="large" />
          </View>
        )}
        {status === 'error' && (
          <View style={styles.center}>
            <Text style={{ color: t.text, marginBottom: 8 }}>Failed to load profiles.</Text>
            <Button title="Try again" onPress={() => load(filters)} />
          </View>
        )}
        {status === 'ready' && <UserSwipeDeck key={deckKey} ref={deck} users={users} onSwipe={onSwipe} empty={empty} />}
      </View>

      {status === 'ready' && users.length > 0 && (
        <View style={styles.actions}>
          <Pressable onPress={() => deck.current?.swipe('left')} style={[styles.round, { backgroundColor: t.surface }]} accessibilityLabel="Pass">
            <Ionicons name="close" size={32} color="#D32F2F" />
          </Pressable>
          <Pressable onPress={onInspect} style={[styles.roundSmall, { backgroundColor: t.surface }]} accessibilityLabel="View profile">
            <Ionicons name="information" size={24} color={t.textSecondary} />
          </Pressable>
          <Pressable onPress={() => deck.current?.swipe('right')} style={[styles.round, { backgroundColor: t.surface }]} accessibilityLabel="Like">
            <Ionicons name="heart" size={30} color={t.primary} />
          </Pressable>
        </View>
      )}

      <FilterModal
        key={filterOpen ? 'open' : 'closed'}
        visible={filterOpen}
        value={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
          load(f);
        }}
      />
      <MatchModal
        user={match?.user ?? null}
        onClose={() => setMatch(null)}
        onChat={() => {
          const id = match?.matchId;
          setMatch(null);
          if (id) router.push(`/chat/${id}`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerButtons: { flexDirection: 'row', gap: 20 },
  deckArea: { flex: 1, marginHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingVertical: 16 },
  round: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  roundSmall: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
