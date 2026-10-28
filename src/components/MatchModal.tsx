import { Image } from 'expo-image';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/theme';
import { PersonPlaceholder } from './Avatar';
import { UserProfile } from '../types';
import { Button } from './ui';

export function MatchModal({
  user,
  onChat,
  onClose,
}: {
  user: UserProfile | null;
  onChat: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  return (
    <Modal visible={!!user} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: t.surface }]}>
          <Text style={[styles.title, { color: t.primary }]}>It's a match!</Text>
          <Text style={{ color: t.textSecondary, marginBottom: 16 }}>You and {user?.name} liked each other.</Text>
          {user?.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.photo} contentFit="cover" />
          ) : (
            <PersonPlaceholder style={styles.photo} iconSize={88} />
          )}
          <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
            <Button title="Start chatting" onPress={onChat} />
            <Button title="Keep swiping" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 20, padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  photo: { width: 160, height: 160, borderRadius: 80 },
});
