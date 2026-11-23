import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { HEADER_EDGES, Screen } from '../../src/components/ui';
import { MAJORS } from '../../src/constants/options';
import { PersonPlaceholder } from '../../src/components/Avatar';
import { useTheme } from '../../src/constants/theme';
import { ConnectionGraph } from '../../src/components/ConnectionGraph';
import { useAuth } from '../../src/providers/AuthProvider';
import { getMyLikedIds, unlikeUser } from '../../src/services/likes';
import { swipeUser } from '../../src/services/swipes';
import { getUser } from '../../src/services/users';
import { isCompatible } from '../../src/utils/preferences';
import { UserProfile } from '../../src/types';

// Port of ProfileViewFragment (read-only view of someone else's profile).
export default function ProfileView() {
  const t = useTheme();
  const { user } = useAuth();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [me, setMe] = useState<UserProfile | null>(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getUser(uid)
      .then((p) => {
        setProfile(p);
        setState(p ? 'ready' : 'missing');
      })
      .catch(() => setState('missing'));
  }, [uid]);

  // My own profile (for the mode) and whether I already like this person.
  useEffect(() => {
    if (!user) return;
    getUser(user.uid).then(setMe).catch(() => undefined);
    getMyLikedIds(user.uid).then((ids) => setLiked(ids.includes(uid))).catch(() => undefined);
  }, [user, uid]);

  const friendMode = me?.friendFirst === true;
  // The button is for other people (not myself). Its icon follows the mode of the person being viewed:
  // heart for the default mode, thumbs-up for Friend first.
  const theirFriendMode = profile?.friendFirst === true;
  const canLike = !!user && !!me && !!profile && profile.uid !== user.uid;

  async function onToggleLike() {
    if (!user || !profile || busy) return;
    if (!liked) {
      if (me && !isCompatible(me, profile)) {
        // Different modes: only a warning, nothing is saved.
        Alert.alert(
          'Different mode',
          profile.friendFirst
            ? `${profile.username} is in Friend first mode, but you are not. Switch to Friend first mode to connect with them.`
            : `${profile.username} is not in Friend first mode, but you are. Turn off Friend first mode to connect with them.`,
        );
        return;
      }
      setBusy(true);
      try {
        const result = await swipeUser(user.uid, profile.uid, 'right', friendMode);
        setLiked(true);
        if (result.matchId) Alert.alert(friendMode ? "You're now friends!" : "You're connected!", `You and ${profile.username} can chat now.`);
      } catch (e) {
        console.warn('Like failed', e);
        Alert.alert("Couldn't like this person", 'Check your connection and try again.');
      } finally {
        setBusy(false);
      }
      return;
    }
    // Same as "Unlike" on the People I liked page: confirm, then remove only the like (it is not a pass).
    Alert.alert(`Unlike ${profile.username}?`, 'This will remove them from your liked list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlike',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await unlikeUser(user.uid, profile.uid);
            setLiked(false);
            Alert.alert(`Unliked ${profile.username}`);
          } catch (e) {
            console.warn('Unlike failed', e);
            Alert.alert('Something went wrong', 'Please try again.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  const major = MAJORS.find((m) => m.code === profile?.major)?.label;
  const rows: [string, string | undefined][] = [
    ['Age', profile?.age ? String(profile.age) : undefined],
    ['Gender', profile?.gender === 'M' ? 'Male' : profile?.gender === 'F' ? 'Female' : undefined],
    ['School year', profile?.schoolyear],
    ['Major', major],
  ];

  return (
    <Screen edges={HEADER_EDGES}>
      {state === 'loading' && <ActivityIndicator color={t.primary} style={{ marginTop: 48 }} />}
      {state === 'missing' && <Text style={{ color: t.text, marginTop: 24 }}>User not found.</Text>}
      {state === 'ready' && profile && (
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <View style={styles.photoWrap}>
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.photo} contentFit="cover" />
            ) : (
              <PersonPlaceholder style={styles.photo} iconSize={120} />
            )}
            {canLike && (
              <Pressable
                onPress={onToggleLike}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={liked ? 'Unlike' : 'Like'}
                style={[styles.likeBtn, { backgroundColor: t.surface, opacity: busy ? 0.6 : 1 }]}
              >
                <Ionicons
                  name={theirFriendMode ? (liked ? 'thumbs-up' : 'thumbs-up-outline') : liked ? 'heart' : 'heart-outline'}
                  size={28}
                  color={t.primary}
                />
              </Pressable>
            )}
          </View>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', marginTop: 16 }}>
            {profile.username}
            {profile.photoVerified ? '  ✓' : ''}
          </Text>
          {!!profile.bio && <Text style={{ color: t.textSecondary, textAlign: 'center', marginVertical: 8 }}>{profile.bio}</Text>}
          <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
            {rows.filter(([, v]) => !!v).map(([label, value]) => (
              <View key={label} style={[styles.row, { borderColor: t.outline }]}>
                <Text style={{ color: t.textSecondary }}>{label}</Text>
                <Text style={{ color: t.text, fontWeight: '600' }}>{value}</Text>
              </View>
            ))}
          </View>
          {user && (
            <View style={{ alignSelf: 'stretch' }}>
              <ConnectionGraph viewerId={user.uid} centerId={profile.uid} username={profile.username} />
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Same shape as the discovery card: a large, nearly square photo instead of a small circle.
  photoWrap: { width: '100%', maxWidth: 420, aspectRatio: 1, borderRadius: 20, overflow: 'visible' },
  photo: { width: '100%', height: '100%', borderRadius: 20 },
  likeBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
