import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDialog } from '../../src/components/AppDialog';
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
  const { dialog, ask, notify } = useDialog();
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

  // Only people in the same mode can like each other: both Friend first (any gender), or both not and of the opposite
  // gender. Otherwise there is no like button; a badge shows the other person's mode so it is clear why.
  const sameMode = !!me && !!profile && isCompatible(me, profile);
  const myFriend = me?.friendFirst === true;
  const canLike = !!user && !!profile && profile.uid !== user.uid && sameMode;
  const isSelf = !!user && profile?.uid === user.uid;

  async function onToggleLike() {
    if (!user || !profile || busy) return;
    if (liked) unlikeWithConfirm();
    else await doLike(myFriend);
  }

  async function doLike(friend: boolean) {
    if (!user || !profile) return;
    setBusy(true);
    try {
      const result = await swipeUser(user.uid, profile.uid, 'right', friend);
      setLiked(true);
      if (result.matchId) notify(friend ? "You're now friends!" : "You're connected!", `You and ${profile.username} can chat now.`, 'checkmark-circle-outline');
    } catch (e) {
      console.warn('Like failed', e);
      notify("Couldn't like this person", 'Check your connection and try again.', 'alert-circle-outline');
    } finally {
      setBusy(false);
    }
  }

  function unlikeWithConfirm() {
    if (!user || !profile) return;
    // Same as "Unlike" on the People I liked page: confirm, then remove only the like (it is not a pass).
    ask({
      title: `Unlike ${profile.username}?`,
      message: 'This will remove them from your liked list.',
      icon: 'heart-dislike-outline',
      confirmLabel: 'Unlike',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await unlikeUser(user.uid, profile.uid);
          setLiked(false);
          notify(`Unliked ${profile.username}`, undefined, 'checkmark-circle-outline');
        } catch (e) {
          console.warn('Unlike failed', e);
          notify('Something went wrong', 'Please try again.', 'alert-circle-outline');
        } finally {
          setBusy(false);
        }
      },
    });
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
          {!isSelf && !!me && !sameMode && (
            <View style={[styles.modeNote, { backgroundColor: t.surfaceVariant, borderColor: t.primary }]}>
              <Ionicons name="information-circle" size={22} color={t.primary} />
              <Text style={{ flexShrink: 1, color: t.text, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
                {profile.friendFirst
                  ? `${profile.username} is in Friend first mode, so you can only like them when you are in Friend first mode too.`
                  : me.friendFirst
                    ? `${profile.username} is in Dating mode, so you can only like them when you turn Friend first mode off.`
                    : `${profile.username} is in Dating mode, but you can only like people of the opposite gender in this mode.`}
              </Text>
            </View>
          )}
          <View style={styles.photoWrap}>
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.photo} contentFit="cover" />
            ) : (
              <PersonPlaceholder style={styles.photo} iconSize={120} />
            )}
            {!isSelf && (
              <View style={[styles.modeBadge, { backgroundColor: t.surface }]}>
                <Ionicons name={profile.friendFirst ? 'thumbs-up' : 'heart'} size={14} color={t.primary} />
                <Text style={{ color: t.text, fontSize: 12, fontWeight: '600' }}>{profile.friendFirst ? 'Friend first mode' : 'Dating mode'}</Text>
              </View>
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
                  name={myFriend ? (liked ? 'thumbs-up' : 'thumbs-up-outline') : liked ? 'heart' : 'heart-outline'}
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
          {!!profile.bio && <Text style={{ color: t.text, textAlign: 'center', marginTop: 8, fontSize: 15, lineHeight: 22 }}>{profile.bio}</Text>}
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
      {dialog}
    </Screen>
  );
}

const styles = StyleSheet.create({
  modeNote: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', maxWidth: '100%', marginBottom: 16, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderLeftWidth: 4 },
  // Same shape as the discovery card: a large, nearly square photo instead of a small circle.
  photoWrap: { width: '100%', maxWidth: 420, aspectRatio: 1, borderRadius: 20, overflow: 'visible' },
  photo: { width: '100%', height: '100%', borderRadius: 20 },
  modeBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
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
