import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/theme';
import { Preferences } from '../types';
import { PreferenceFields } from './PreferenceFields';
import { Button } from './ui';

/** The Discover filter IS the "I'm looking for" setting: it opens with the saved preferences and Apply saves them. */
export function FilterModal({
  visible,
  value,
  onApply,
  onClose,
}: {
  visible: boolean;
  value: Preferences;
  onApply: (preferences: Preferences) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: t.surface }]}>
          <Text style={[styles.title, { color: t.text }]}>I'm looking for</Text>
          <Text style={{ color: t.textSecondary, marginBottom: 12 }}>
            Same settings as Edit Profile. They are saved when you apply.
          </Text>
          <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
            <PreferenceFields value={draft} onChange={setDraft} />
          </ScrollView>
          <Button title="Apply" onPress={() => onApply(draft)} />
          <Button
            title="Reset batch and majors"
            variant="outline"
            onPress={() => setDraft((d) => ({ ...d, yearPreferences: 'All', majorPreferences: [] }))}
          />
          <Button title="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 16, padding: 20, maxHeight: '90%' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
});
