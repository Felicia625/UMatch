import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { FilterModal } from '../../src/components/FilterModal';
import { MatchModal } from '../../src/components/MatchModal';
import { TutorialModal } from '../../src/components/TutorialModal';
import { SwipeDeckHandle, UserSwipeDeck } from '../../src/components/UserSwipeDeck';
import { GENDERS, MAJORS } from '../../src/constants/options';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { LikeIcon } from '../../src/components/LikeIcon';
import { Button } from '../../src/components/ui';
import { loadCandidates, SwipeDirection, swipeUser } from '../../src/services/swipes';
import { getUser, updateUser } from '../../src/services/users';
import { Preferences, UserProfile } from '../../src/types';
import { yearPreferenceLabel } from '../../src/utils/preferences';

type Status = 'loading' | 'ready' | 'error';

// Changes whenever the mode (Friend first) or the saved preferences change, so Home knows its deck is out of date.
const modeKey = (p: UserProfile) => `${p.friendFirst}|${JSON.stringify(p.preference)}`;

const DEFAULT_PREFERENCES: Preferences = { gender: 'F', yearPreferences: 'All', majorPreferences: [] };

// Plain-language summary of who the deck is looking for, shown when nothing matches.
function describeCriteria(p: Preferences, friendMode: boolean): string[] {
  return [
    friendMode ? 'Friends, any gender' : GENDERS.find((g) => g.code === p.gender)?.label ?? '',
    p.yearPreferences === 'All' ? 'any batch' : yearPreferenceLabel(p.yearPreferences).toLowerCase(),
    p.majorPreferences.length
      ? p.majorPreferences.map((c) => MAJORS.find((m) => m.code === c)?.label ?? c).join(', ')
      : 'any major',
  ];
}

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const deck = useRef<SwipeDeckHandle>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [deckKey, setDeckKey] = useState(0); // remount the deck on every reload so it starts at card 0
  const [prefs, setPrefs] = useState<Preferences | null>(null); // the saved "I'm looking for" preferences
  const [friendMode, setFriendMode] = useState(false);
  const loadedKey = useRef(''); // modeKey of the profile the current deck was built from
  const [filterOpen, setFilterOpen] = useState(false);
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

  const load = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    try {
      const me = await getUser(user.uid); // re-read so preferences changed in Edit Profile are picked up
      if (!me) throw new Error('Profile not found');
      setPrefs(me.preference);
      setFriendMode(me.friendFirst);
      loadedKey.current = modeKey(me);
      setUsers(await loadCandidates(me));
      setDeckKey((k) => k + 1);
      setStatus('ready');
    } catch (e) {
      console.warn('Failed to load candidates', e);
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Home stays mounted behind the other tabs, so switching Friend first on the Profile tab (or changing preferences in
  // Edit Profile) used to leave the old deck on screen. When this tab is focused again, rebuild the deck if the mode or
  // preferences changed. An unchanged profile keeps the deck as it is.
  useFocusEffect(
    useCallback(() => {
      if (!user || !loadedKey.current) return;
      let active = true;
      getUser(user.uid)
        .then((me) => {
          if (active && me && modeKey(me) !== loadedKey.current) load();
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user, load]),
  );

  // Saves the new preferences (the same ones Edit Profile shows) and rebuilds the deck from them.
  async function applyPreferences(next: Preferences) {
    if (!user) return;
    setFilterOpen(false);
    try {
      await updateUser(user.uid, { preference: next });
    } catch (e) {
      console.warn('Saving preferences failed', e);
      Alert.alert("Couldn't save your preferences", 'Check your connection and try again.');
      return;
    }
    load();
  }

  // Refresh and filter live in the title bar, next to the help and settings buttons.
  const navigation = useNavigation();
  const filtered = !!prefs && (prefs.yearPreferences !== 'All' || prefs.majorPreferences.length > 0);
  useLayoutEffect(() => {
    navigation.setOptions({
      title: friendMode ? 'Find Friends' : 'Discover',
      headerRight: () => (
        <>
          <Pressable onPress={load} hitSlop={10} accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={() => prefs && setFilterOpen(true)} hitSlop={10} accessibilityLabel="Filter">
            <Ionicons name="options" size={24} color={filtered ? '#FFE082' : '#FFFFFF'} />
          </Pressable>
        </>
      ),
    });
  }, [navigation, load, prefs, filtered, friendMode]);

  async function onSwipe(target: UserProfile, direction: SwipeDirection) {
    if (!user) return;
    try {
      const result = await swipeUser(user.uid, target.uid, direction, friendMode);
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
      <View style={[styles.emptyCard, { backgroundColor: t.surface }]}>
        <View style={[styles.emptyIcon, { backgroundColor: t.surfaceVariant }]}>
          <Ionicons name="people-outline" size={44} color={t.primary} />
        </View>
        <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>You're all caught up!</Text>
        <Text style={{ color: t.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
          No more profiles match your current filters. Try broadening your preferences or check back later!
        </Text>
        {prefs && (
          <View style={styles.chips}>
            {describeCriteria(prefs, friendMode).map((c) => (
              <View key={c} style={[styles.chip, { backgroundColor: t.surfaceVariant }]}>
                <Text style={{ color: t.primary, fontSize: 13, fontWeight: '600' }}>{c}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.emptyButtons}>
          <Button title="Adjust filters" onPress={() => prefs && setFilterOpen(true)} icon={(c) => <Ionicons name="options" size={18} color={c} />} />
          <Button title="Refresh" variant="outline" onPress={load} icon={(c) => <Ionicons name="refresh" size={18} color={c} />} />
        </View>
        <Text style={{ color: t.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 14 }}>
          Profiles you already liked or passed are not shown again.
        </Text>
      </View>
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
            <View style={[styles.emptyCard, { backgroundColor: t.surface }]}>
              <View style={[styles.emptyIcon, { backgroundColor: t.surfaceVariant }]}>
                <Ionicons name="cloud-offline-outline" size={44} color={t.primary} />
              </View>
              <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>Couldn't load profiles</Text>
              <Text style={{ color: t.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                Failed to load profiles. Check your connection, then tap Refresh or use the refresh button at the top to try again.
              </Text>
              <View style={styles.emptyButtons}>
                <Button title="Refresh" onPress={load} icon={(c) => <Ionicons name="refresh" size={18} color={c} />} />
              </View>
            </View>
          </View>
        )}
        {status === 'ready' && <UserSwipeDeck key={deckKey} ref={deck} users={users} onSwipe={onSwipe} empty={empty} friendMode={friendMode} />}
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
            <LikeIcon friend={friendMode} size={30} color={t.primary} />
          </Pressable>
        </View>
      )}

      <FilterModal
        visible={filterOpen}
        value={prefs ?? DEFAULT_PREFERENCES}
        onClose={() => setFilterOpen(false)}
        onApply={applyPreferences}
      />
      <TutorialModal visible={tutorialOpen} onClose={closeTutorial} />
      <MatchModal
        user={match?.user ?? null}
        friend={friendMode}
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
  deckArea: { flex: 1, marginHorizontal: 16, marginTop: 16, width: '100%', maxWidth: 460, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyCard: { width: '100%', maxWidth: 420, borderRadius: 20, padding: 28, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  emptyButtons: { width: '100%', gap: 10, marginTop: 20 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingVertical: 16 },
  round: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  roundSmall: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
