import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormModal } from '../../src/components/FormModal';
import { Button } from '../../src/components/ui';
import { GENDERS, MAJORS } from '../../src/constants/options';
import { PersonPlaceholder } from '../../src/components/Avatar';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { deleteAccount } from '../../src/services/account';
import { changePassword, friendlyAuthError, logout } from '../../src/services/auth';
import { getUser } from '../../src/services/users';
import { UserProfile } from '../../src/types';
import { yearPreferenceLabel } from '../../src/utils/preferences';

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

  const gender = GENDERS.find((g) => g.code === profile?.gender)?.label;
  const major = MAJORS.find((m) => m.code === profile?.major)?.label;
  const prefGender = GENDERS.find((g) => g.code === profile?.preference.gender)?.label;
  const prefMajors = profile?.preference.majorPreferences.map((c) => MAJORS.find((m) => m.code === c)?.label ?? c);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center' }}>
          {profile?.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.photo} contentFit="cover" />
          ) : (
            <PersonPlaceholder style={styles.photo} iconSize={76} />
          )}
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', marginTop: 12 }}>
            {profile?.name ?? '...'}
            {profile?.photoVerified ? '  ✓' : ''}
          </Text>
          <Text style={{ color: t.textSecondary }}>{profile ? `@${profile.username}` : user?.email}</Text>
          <Text style={{ color: t.text, marginTop: 8, textAlign: 'center' }}>{profile?.bio || 'No bio provided.'}</Text>
        </View>

        <Section title="About me">
          <Row label="Email" value={profile?.email} />
          <Row label="Age" value={profile?.age ? String(profile.age) : undefined} />
          <Row label="Gender" value={gender} />
          <Row label="School year" value={profile?.schoolyear} />
          <Row label="Major" value={major} />
        </Section>

        <Section title="I'm looking for">
          <Row label="Gender" value={prefGender} />
          <Row label="Batch" value={profile ? yearPreferenceLabel(profile.preference.yearPreferences) : undefined} />
          <Row label="Majors" value={prefMajors?.length ? prefMajors.join(', ') : 'Not specified'} />
        </Section>

        <Button title="Edit Profile" onPress={() => router.push('/profile/edit')} />
        <Button title="Who liked me" variant="outline" onPress={() => router.push('/lists/liked-me')} />
        <Button title="People I liked" variant="outline" onPress={() => router.push('/lists/my-likes')} />
        <Button title="People I passed" variant="outline" onPress={() => router.push('/lists/passed')} />
        <View style={{ height: 16 }} />
        <Button title="Change Password" variant="ghost" onPress={() => setPwOpen(true)} />
        <Button title="Log out" variant="ghost" onPress={() => logout().catch((e) => Alert.alert('Error', friendlyAuthError(e)))} />
        <Button title="Delete Account" variant="danger" onPress={() => setDeleteOpen(true)} />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={{ color: t.primary, fontWeight: '700', marginBottom: 4 }}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderColor: t.outline }]}>
      <Text style={{ color: t.textSecondary }}>{label}</Text>
      <Text style={{ color: t.text, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 16 }}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  photo: { width: 140, height: 140, borderRadius: 70 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
