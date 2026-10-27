import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { MAJORS, SCHOOL_YEARS } from '../constants/options';
import { useTheme } from '../constants/theme';
import { CandidateFilters } from '../services/swipes';
import { MajorCode } from '../types';
import { Button, OptionPicker } from './ui';

const ALL = 'all';

export function FilterModal({
  visible,
  value,
  onApply,
  onClose,
}: {
  visible: boolean;
  value: CandidateFilters;
  onApply: (filters: CandidateFilters) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const [major, setMajor] = useState(value.major ?? ALL);
  const [year, setYear] = useState(value.year ?? ALL);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: t.surface }]}>
          <Text style={[styles.title, { color: t.text }]}>Filter</Text>
          <Text style={{ color: t.textSecondary, marginBottom: 12 }}>These override your saved preferences until cleared.</Text>
          <OptionPicker
            label="Major"
            value={major}
            onChange={setMajor}
            options={[{ value: ALL, label: 'All majors' }, ...MAJORS.map((m) => ({ value: m.code, label: m.label }))]}
          />
          <OptionPicker
            label="School year"
            value={year}
            onChange={setYear}
            options={[{ value: ALL, label: 'All years' }, ...SCHOOL_YEARS.map((y) => ({ value: y, label: y }))]}
          />
          <Button
            title="Apply"
            onPress={() =>
              onApply({
                major: major === ALL ? undefined : (major as MajorCode),
                year: year === ALL ? undefined : year,
              })
            }
          />
          <Button
            title="Clear filters"
            variant="outline"
            onPress={() => {
              setMajor(ALL);
              setYear(ALL);
              onApply({});
            }}
          />
          <Button title="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 16, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
});
