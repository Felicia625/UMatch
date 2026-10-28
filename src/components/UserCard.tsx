import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { MAJORS } from '../constants/options';
import { FILL } from '../constants/layout';
import { useTheme } from '../constants/theme';
import { PersonPlaceholder } from './Avatar';
import { UserProfile } from '../types';

export function UserCard({ user }: { user: UserProfile }) {
  const t = useTheme();
  const major = MAJORS.find((m) => m.code === user.major)?.label;
  const subtitle = [major, user.schoolyear ? `Batch ${user.schoolyear}` : ''].filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, { backgroundColor: t.card }]}>
      {user.photoUrl ? (
        <Image source={{ uri: user.photoUrl }} style={FILL} contentFit="cover" transition={150} />
      ) : (
        <PersonPlaceholder style={FILL} iconSize={140} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user.name}
          {user.age ? `, ${user.age}` : ''}
          {user.photoVerified ? '  ✓' : ''}
        </Text>
        {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
        {!!user.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.45)' },
  name: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  sub: { color: '#FFFFFFDD', fontSize: 15, marginTop: 2 },
  bio: { color: '#FFFFFFCC', fontSize: 14, marginTop: 6 },
});
