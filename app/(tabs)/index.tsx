import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { FilterModal } from '../../src/components/FilterModal';
import { MatchModal } from '../../src/components/MatchModal';
import { TutorialModal } from '../../src/components/TutorialModal';
import { SwipeDeckHandle, UserSwipeDeck } from '../../src/components/UserSwipeDeck';
import { Button } from '../../src/components/ui';
import { GENDERS, MAJORS } from '../../src/constants/options';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { CandidateFilters, loadCandidates, SwipeDirection, swipeUser } from '../../src/services/swipes';
import { getUser } from '../../src/services/users';
import { UserProfile } from '../../src/types';
import { yearPreferenceLabel } from '../../src/utils/preferences';

type Status = 'loading' | 'ready' | 'error';

// Plain-language summary of who the deck is looking for, shown when nothing matches.
function describeCriteria(me: UserProfile, f: CandidateFilters): string {
  const yearPref = f.year ?? me.preference.yearPreferences;
  const majors = f.major ? [f.major] : me.preference.majorPreferences;
  return [
    GENDERS.find((g) => g.code === me.preference.gender)?.label ?? '',
    yearPref === 'All' ? 'any batch' : yearPreferenceLabel(yearPref).toLowerCase(),
    majors.length ? majors.map((c) => MAJORS.find((m) => m.code === c)?.label ?? c).join(', ') : 'any major',
  ].join(' · ');
}

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
  const [criteria, setCriteria] = useState('');
  const [match, setMatch] = useState<{ user: UserProfile; matchId: string } | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // First-run tutorial (MainActivity.checkAndShowTutorial). Remembered per device, like the Android SharedPreferences flag.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem('tutorial_seen')
      .then((seen) => {
        if (!seen) timer = setTimeout(() => setTutorialOpen(true), 500);
      })
      .catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  function closeTutorial() {
    setTutorialOpen(false);
    AsyncStorage.setItem('tutorial_seen', 'true').catch(() => {});
  }

  const load = useCallback(
    async (f: CandidateFilters) => {
      if (!user) return;
      setStatus('loading');
      try {
        const me = await getUser(user.uid); // re-read so changed preferences are picked up
        if (!me) throw new Error('Profile not found');
        setCriteria(describeCriteria(me, f));
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

  // Refresh and filter live in the title bar, next to the help and settings buttons.
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <>
          <Pressable onPress={() => load(filters)} hitSlop={10} accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={() => setFilterOpen(true)} hitSlop={10} accessibilityLabel="Filter">
            <Ionicons name="options" size={24} color={filters.major || filters.year ? '#FFE082' : '#FFFFFF'} />
          </Pressable>
        </>
      ),
    });
  }, [navigation, load, filters]);

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
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>No profiles to show</Text>
      {!!criteria && <Text style={{ color: t.text, textAlign: 'center', marginTop: 8 }}>Looking for: {criteria}</Text>}
      <Text style={{ color: t.textSecondary, textAlign: 'center', marginVertical: 8 }}>
        Change your preferences under Profile, then Edit Profile, or clear the filter. Profiles you already liked or passed are not shown again.
      </Text>
      <Button title="Refresh" onPress={() => load(filters)} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
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
      <TutorialModal visible={tutorialOpen} onClose={closeTutorial} />
      <MatchModal
        user={match?.user ?? null}
        onClose={() => setMatch(null)}
        onChat={() => {
          const id = match?.matchId;
          setMatch(null);
          if (id) router.push(`/chat/${id}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerButtons: { flexDirection: 'row', gap: 20 },
  deckArea: { flex: 1, marginHorizontal: 16, marginTop: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingVertical: 16 },
  round: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  roundSmall: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
