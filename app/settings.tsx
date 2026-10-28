import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { HEADER_EDGES, Screen } from '../src/components/ui';
import { useTheme, useThemeSettings } from '../src/constants/theme';

// Port of SettingsFragment: dark mode switch (remembered) and a link to the Terms.
export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const { darkMode, setDarkMode } = useThemeSettings();

  return (
    <Screen edges={HEADER_EDGES}>
      <View style={[styles.row, { backgroundColor: t.surface, borderColor: t.outline }]}>
        <Text style={{ color: t.text, fontSize: 16 }}>Dark Mode</Text>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ true: t.primary, false: t.outline }}
          thumbColor="#FFFFFF"
        />
      </View>

      <Text style={[styles.section, { color: t.primary }]}>Legal</Text>
      <Pressable
        onPress={() => router.push('/terms')}
        accessibilityRole="button"
        style={[styles.row, { backgroundColor: t.surface, borderColor: t.outline }]}
      >
        <Text style={{ color: t.text, fontSize: 16 }}>Terms and Conditions</Text>
        <Text style={{ color: t.textSecondary, fontSize: 20 }}>›</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontWeight: '700', marginTop: 24, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
});
