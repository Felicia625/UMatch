import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PersonPlaceholder } from '../../src/components/Avatar';
import { FormModal } from '../../src/components/FormModal';
import { FriendModeSwitch } from '../../src/components/FriendModeSwitch';
import { GENDERS, MAJORS } from '../../src/constants/options';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { deleteAccount } from '../../src/services/account';
import { changePassword, friendlyAuthError, logout } from '../../src/services/auth';
import { getUser, updateUser } from '../../src/services/users';
import { UserProfile } from '../../src/types';
import { yearPreferenceLabel } from '../../src/utils/preferences';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Button colours taken from the Android app's profile screen.
const PINK = '#FF6EA8';
const PURPLE = '#9C27B0';
const ORANGE = '#FF5722';
const RED = '#E53935';

// Layout follows the Android ProfileFragment: photo, username and bio, the four action buttons, then the Public Profile,
// Private Details and Your Preferences cards, then Logout and Delete Account.
export default function Profile() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Reload whenever the tab is focused so edits show up straight away (ProfileFragment.onResume).
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      getUser(user.uid)
        .then((p) => active && setProfile(p))
        .catch(() => active && Alert.alert('Failed to load profile'));
      return () => {
        active = false;
      };
    }, [user]),
  );

  async function onChangePassword(v: Record<string, string>) {
    const { oldPw = '', newPw = '', confirmPw = '' } = v;
    if (newPw !== confirmPw) return Alert.alert("Passwords don't match");
    if (newPw.length < 6) return Alert.alert('Password must be at least 6 characters');
    try {
      await changePassword(oldPw, newPw);
      setPwOpen(false);
      Alert.alert('Password changed successfully');
    } catch (e) {
      const code = (e as { code?: string }).code;
      Alert.alert(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Old password is incorrect'
          : friendlyAuthError(e),
      );
    }
  }

  async function onDelete(v: Record<string, string>) {
    if (!v.password) return Alert.alert('Enter your password to confirm');
    try {
      await deleteAccount(v.password);
      // The auth state change takes the user back to onboarding.
    } catch (e) {
      const code = (e as { code?: string }).code;
      Alert.alert(
        'Could not delete account',
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Password is incorrect.'
          : friendlyAuthError(e),
      );
    }
  }

  // Saves straight away; Discover and the likes list pick up the new mode the next time they load.
  function toggleFriendFirst(value: boolean) {
    if (!user || !profile) return;
    setProfile({ ...profile, friendFirst: value });
    updateUser(user.uid, { friendFirst: value }).catch(() => {
      setProfile((p) => (p ? { ...p, friendFirst: !value } : p));
      Alert.alert("Couldn't change the mode", 'Check your connection and try again.');
    });
  }

  const gender = GENDERS.find((g) => g.code === profile?.gender)?.label;
  const major = MAJORS.find((m) => m.code === profile?.major)?.label;
  const prefGender = profile?.friendFirst ? 'Any (friends)' : GENDERS.find((g) => g.code === profile?.preference.gender)?.label;
  const prefYear = profile ? (profile.preference.yearPreferences === 'All' ? 'All' : yearPreferenceLabel(profile.preference.yearPreferences)) : undefined;
  const prefMajors = profile?.preference.majorPreferences.map((c) => MAJORS.find((m) => m.code === c)?.label ?? c);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.photoRing, { borderColor: t.primary }]}>
            {profile?.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.photo} contentFit="cover" />
            ) : (
              <PersonPlaceholder style={styles.photo} iconSize={64} />
            )}
          </View>
          <Text style={[styles.username, { color: t.text }]}>
            {profile?.username ?? '...'}
            {profile?.photoVerified ? '  ✓' : ''}
          </Text>
          <Text style={{ color: t.textSecondary, fontSize: 15, marginTop: 4, textAlign: 'center' }}>
            {profile ? profile.bio || 'No bio provided.' : ''}
          </Text>
        </View>

        <View style={styles.buttons}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <PillButton style={{ flex: 1 }} label="WHO LIKED YOU" icon="heart" color={PINK} onPress={() => router.push('/lists/liked-me')} />
            <PillButton style={{ flex: 1 }} label="MY LIKES" icon="heart" color={PURPLE} onPress={() => router.push('/lists/my-likes')} />
          </View>
          <PillButton label="WHO YOU PASSED" icon="close" color={ORANGE} onPress={() => router.push('/lists/passed')} />
          <PillButton label="EDIT PROFILE" icon="create-outline" color={t.primary} onPress={() => router.push('/profile/edit')} />
        </View>

        <Card title="Public Profile">
          <Row label="Age" value={profile?.age ? String(profile.age) : undefined} />
          <Row label="Gender" value={gender} />
          <Row label="School Year" value={profile?.schoolyear} />
          <Row label="Major" value={major} />
        </Card>

        <Card title="Private Details">
          <Row label="Full Name" value={profile?.name} />
          <Row label="Email" value={profile?.email} />
          <Row
            label="Password"
            value={
              <Pressable onPress={() => setPwOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Change password">
                <Text style={{ color: t.primary, fontSize: 15, fontWeight: '600' }}>Change</Text>
              </Pressable>
            }
          />
        </Card>

        <Card title="Your Preferences">
          <Row label="Preferred Gender" value={prefGender} />
          <Row label="Preferred Year" value={prefYear} />
          <Row label="Preferred Major" value={prefMajors?.length ? prefMajors.join(', ') : 'Not specified'} />
        </Card>

        <FriendModeSwitch value={profile?.friendFirst ?? false} disabled={!profile} onChange={toggleFriendFirst} />

        <View style={styles.buttons}>
          <PillButton
            label="LOGOUT"
            icon="log-out-outline"
            color="#E0E0E0"
            textColor={RED}
            onPress={() => logout().catch((e) => Alert.alert('Error', friendlyAuthError(e)))}
          />
          <PillButton label="DELETE ACCOUNT" icon="trash" color={RED} textColor={RED} outline onPress={() => setDeleteOpen(true)} />
        </View>
      </ScrollView>

      <FormModal
        visible={pwOpen}
        title="Change Password"
        submitLabel="Change"
        fields={[
          { key: 'oldPw', placeholder: 'Old password', secure: true },
          { key: 'newPw', placeholder: 'New password', secure: true },
          { key: 'confirmPw', placeholder: 'Confirm new password', secure: true },
        ]}
        onSubmit={onChangePassword}
        onClose={() => setPwOpen(false)}
      />
      <FormModal
        visible={deleteOpen}
        title="Delete Account"
        message="This permanently deletes your profile, matches and chats. It cannot be undone. Enter your password to confirm."
        submitLabel="Delete"
        destructive
        fields={[{ key: 'password', placeholder: 'Password', secure: true }]}
        onSubmit={onDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </View>
  );
}

function PillButton({
  label,
  icon,
  color,
  textColor = '#FFFFFF',
  outline,
  onPress,
  style,
}: {
  label: string;
  icon: IconName;
  color: string;
  textColor?: string;
  outline?: boolean;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.pill, { backgroundColor: outline ? 'transparent' : color, borderColor: color, borderWidth: outline ? 2 : 0 }, style]}
    >
      <Ionicons name={icon} size={20} color={textColor} />
      <Text style={[styles.pillText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.outline }]}>
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{label}</Text>
      {typeof value === 'string' || value === undefined ? (
        <Text style={{ color: t.text, fontSize: 15, flexShrink: 1, textAlign: 'right', marginLeft: 16 }}>{value || '-'}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  photoRing: { width: 108, height: 108, borderRadius: 54, borderWidth: 3, overflow: 'hidden', marginTop: 8 },
  photo: { width: '100%', height: '100%' },
  username: { fontSize: 22, fontWeight: '600', marginTop: 14 },
  buttons: { gap: 10, marginVertical: 20 },
  pill: { minHeight: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { fontSize: 13, fontWeight: '600', letterSpacing: 1, flexShrink: 1, textAlign: 'center' },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 20, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
});
