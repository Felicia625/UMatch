import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/theme';
import { Button, PasswordField, TextField } from './ui';

export interface FormField {
  key: string;
  placeholder: string;
  secure?: boolean;
}

/** Small replacement for the AlertDialog + custom view dialogs (change password, delete account). */
export function FormModal({
  visible,
  title,
  message,
  fields,
  submitLabel,
  destructive,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  message?: string;
  fields: FormField[];
  submitLabel: string;
  destructive?: boolean;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
  onClose: () => void;
}) {
  const t = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) setValues({});
  }, [visible]);

  async function submit() {
    setBusy(true);
    try {
      await onSubmit(values);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: t.surface }]}>
          <Text style={[styles.title, { color: t.text }]}>{title}</Text>
          {!!message && <Text style={{ color: t.textSecondary, marginBottom: 12 }}>{message}</Text>}
          {fields.map((f) => {
            const Field = f.secure ? PasswordField : TextField; // password fields get the show/hide eye button
            return (
              <Field
                key={f.key}
                placeholder={f.placeholder}
                autoCapitalize="none"
                value={values[f.key] ?? ''}
                onChangeText={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
              />
            );
          })}
          <Button title={submitLabel} variant={destructive ? 'danger' : 'primary'} loading={busy} onPress={submit} />
          <Button title="Cancel" variant="ghost" onPress={onClose} disabled={busy} />
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
