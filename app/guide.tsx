import { StyleSheet, Text, View } from 'react-native';
import { HEADER_EDGES, Screen } from '../src/components/ui';
import { useTheme } from '../src/constants/theme';

// Text from res/layout/fragment_guide.xml. The last card no longer promises "Report inappropriate behavior":
// the app has no report feature yet.
const ITEMS = [
  ['💕', 'Swipe to Match', "Swipe right to like, left to pass. When both users like each other, it's a match!"],
  ['💬', 'Chat Features', 'Long press messages to reply, edit, pin, or delete. Use pinned messages for important info.'],
  ['👤', 'Profile Management', 'Edit your profile, set preferences, and manage your likes from the Profile tab.'],
  ['🔒', 'Safety & Privacy', 'Block users if needed. Only UMN students can see your profile.'],
];

export default function Guide() {
  const t = useTheme();
  return (
    <Screen edges={HEADER_EDGES}>
      {ITEMS.map(([emoji, heading, body]) => (
        <View key={heading} style={[styles.card, { backgroundColor: t.surface, borderColor: t.outline }]}>
          <Text style={{ fontSize: 32 }}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{heading}</Text>
            <Text style={{ color: t.textSecondary, marginTop: 4, lineHeight: 20 }}>{body}</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
});
