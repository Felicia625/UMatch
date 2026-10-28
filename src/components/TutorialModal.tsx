import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/theme';
import { Button } from './ui';

// Steps from MainActivity.showTutorial()
const STEPS: [string, string][] = [
  ['Welcome to UMN Dating App!', 'Swipe right to like, left to pass on potential matches.'],
  ['Find Your Matches', 'Check your matches and start conversations in the Matches tab.'],
  ['Your Profile', 'Edit your profile, view likes, and manage settings from the Profile tab.'],
  ['Need Help?', 'Tap the help button at the top of Home or Profile anytime for the guide.'],
];

export function TutorialModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!visible) setStep(0);
  }, [visible]);

  const last = step === STEPS.length - 1;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: t.surface }]}>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }}>{STEPS[step][0]}</Text>
          <Text style={{ color: t.textSecondary, marginVertical: 12, lineHeight: 21 }}>{STEPS[step][1]}</Text>
          <Text style={{ color: t.textSecondary, fontSize: 12, marginBottom: 8 }}>
            {step + 1} of {STEPS.length}
          </Text>
          <Button title={last ? 'Got it!' : 'Next'} onPress={() => (last ? onClose() : setStep(step + 1))} />
          {!last && <Button title="Skip" variant="ghost" onPress={onClose} />}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 16, padding: 20 },
});
