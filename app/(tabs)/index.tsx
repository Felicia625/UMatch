import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { FilterModal } from '../../src/components/FilterModal';
import { MatchModal } from '../../src/components/MatchModal';
import { TutorialModal } from '../../src/components/TutorialModal';
import { SwipeDeckHandle, UserSwipeDeck } from '../../src/components/UserSwipeDeck';
import { Button } from '../../src/components/ui';
import { GENDERS, MAJORS } from '../../src/constants/options';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { LikeIcon } from '../../src/components/LikeIcon';
import { loadCandidates, SwipeDirection, swipeUser } from '../../src/services/swipes';
import { getUser, updateUser } from '../../src/services/users';
import { Preferences, UserProfile } from '../../src/types';
import { yearPreferenceLabel } from '../../src/utils/preferences';

type Status = 'loading' | 'ready' | 'error';

// Changes whenever the mode (Friend first) or the saved preferences change, so Home knows its deck is out of date.
const modeKey = (p: UserProfile) => `${p.friendFirst}|${JSON.stringify(p.preference)}`;

const DEFAULT_PREFERENCES: Preferences = { gender: 'F', yearPreferences: 'All', majorPreferences: [] };

// Plain-language summary of who the deck is looking for, shown when nothing matches.
function describeCriteria(p: Preferences, friendMode: boolean): string {
  return [
    friendMode ? 'Friends, any gender' : GENDERS.find((g) => g.code === p.gender)?.label ?? '',
    p.yearPreferences === 'All' ? 'any batch' : yearPreferenceLabel(p.yearPreferences).toLowerCase(),
    p.majorPreferences.length
      ? p.majorPreferences.map((c) => MAJORS.find((m) => m.code === c)?.label ?? c).join(', ')
      : 'any major',
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
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>No profiles to show</Text>
      {prefs && <Text style={{ color: t.text, textAlign: 'center', marginTop: 8 }}>Showing: {describeCriteria(prefs, friendMode)}</Text>}
      <Text style={{ color: t.textSecondary, textAlign: 'center', marginVertical: 8 }}>
        Change who you want to connect with using the filter button at the top. Profiles you already liked or passed are not shown again.
      </Text>
      <Button title="Refresh" onPress={load} />
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
            <Button title="Try again" onPress={load} />
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
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingVertical: 16 },
  round: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  roundSmall: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
