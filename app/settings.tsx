import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { HEADER_EDGES, Screen } from '../src/components/ui';
import { useTheme, useThemeSettings } from '../src/constants/theme';
import { ensurePermission, getNotificationsEnabled, setNotificationsEnabled } from '../src/services/notifications';
import { getAiStartersEnabled, setAiStartersEnabled } from '../src/services/starters';

// Port of SettingsFragment: dark mode switch (remembered) and a link to the Terms.
export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const { darkMode, setDarkMode } = useThemeSettings();
  const [notifications, setNotifications] = useState(true);
  const [aiStarters, setAiStarters] = useState(true);

  useEffect(() => {
    getNotificationsEnabled().then(setNotifications);
    getAiStartersEnabled().then(setAiStarters);
  }, []);

  async function onToggleNotifications(value: boolean) {
    if (value && !(await ensurePermission())) {
      Alert.alert('Notifications are blocked', 'Allow notifications for this app in your phone settings.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    setNotifications(value);
    await setNotificationsEnabled(value);
  }

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

      <View style={[styles.row, { backgroundColor: t.surface, borderColor: t.outline, marginTop: 12 }]}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: t.text, fontSize: 16 }}>Notifications</Text>
          <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 2 }}>New messages and matches while the app is running</Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={onToggleNotifications}
          trackColor={{ true: t.primary, false: t.outline }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.row, { backgroundColor: t.surface, borderColor: t.outline, marginTop: 12 }]}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: t.text, fontSize: 16 }}>AI conversation starters</Text>
          <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 2 }}>
            Sends part of your match's bio, major and batch (no names or emails) to an AI service to write ideas. Off = built-in ideas only.
          </Text>
        </View>
        <Switch
          value={aiStarters}
          onValueChange={(v) => {
            setAiStarters(v);
            setAiStartersEnabled(v);
          }}
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
