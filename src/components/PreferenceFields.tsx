import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAJORS, YEAR_PREFERENCES } from '../constants/options';
import { useTheme } from '../constants/theme';
import { MajorCode, Preferences } from '../types';
import { OptionPicker } from './ui';

/**
 * The "I'm looking for" fields: batch and majors (the gender is fixed to the opposite gender). Used by both Edit Profile and the Discover filter, so the
 * two always show and change the same saved preferences.
 */
export function PreferenceFields({ value, onChange }: { value: Preferences; onChange: (p: Preferences) => void }) {
  const t = useTheme();
  const remaining = MAJORS.filter((m) => !value.majorPreferences.includes(m.code)).map((m) => ({
    value: m.code as string,
    label: m.label as string,
  }));

  return (
    <>
      <OptionPicker
        label="Batch"
        value={value.yearPreferences}
        onChange={(v) => onChange({ ...value, yearPreferences: v })}
        options={YEAR_PREFERENCES}
      />
      <View style={styles.chips}>
        {value.majorPreferences.map((code) => (
          <Pressable
            key={code}
            onPress={() => onChange({ ...value, majorPreferences: value.majorPreferences.filter((c) => c !== code) })}
            style={[styles.chip, { backgroundColor: t.lightPink, borderColor: t.primary }]}
            accessibilityLabel={`Remove ${code}`}
          >
            <Text style={{ color: t.primary }}>
              {MAJORS.find((m) => m.code === code)?.label ?? code} ✕
            </Text>
          </Pressable>
        ))}
      </View>
      {remaining.length > 0 && (
        <OptionPicker
          label="+ Add a major preference"
          value=""
          onChange={(v) => onChange({ ...value, majorPreferences: [...value.majorPreferences, v as MajorCode] })}
          options={remaining}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
});
