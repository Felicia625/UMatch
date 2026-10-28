import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { HEADER_EDGES, Screen } from '../../src/components/ui';
import { MAJORS } from '../../src/constants/options';
import { PersonPlaceholder } from '../../src/components/Avatar';
import { useTheme } from '../../src/constants/theme';
import { getUser } from '../../src/services/users';
import { UserProfile } from '../../src/types';

// Port of ProfileViewFragment (read-only view of someone else's profile).
export default function ProfileView() {
  const t = useTheme();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    getUser(uid)
      .then((p) => {
        setProfile(p);
        setState(p ? 'ready' : 'missing');
      })
      .catch(() => setState('missing'));
  }, [uid]);

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
          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.photo} contentFit="cover" />
          ) : (
            <PersonPlaceholder style={styles.photo} iconSize={120} />
          )}
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
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: 220, height: 220, borderRadius: 110 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
