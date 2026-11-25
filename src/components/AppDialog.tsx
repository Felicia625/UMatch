import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useCallback, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/theme';
import { Button } from './ui';

export type DialogOptions = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  confirmLabel?: string; // the main button; default "OK"
  cancelLabel?: string; // when set, a second button is shown (a question); leave out for a plain notice
  destructive?: boolean; // red main button, for actions that remove something
  onConfirm?: () => void;
};

/**
 * The app's own replacement for Alert.alert: a rounded card on a dimmed background, in the same style as the other
 * dialogs (Discard changes, It's a match). Use it through useDialog().
 */
function AppDialog({ visible, options, onClose }: { visible: boolean; options: DialogOptions | null; onClose: (confirmed: boolean) => void }) {
  const t = useTheme();
  const o = options;
  const destructive = !!o?.destructive;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: t.surface }]}>
          {o?.icon && (
            <View style={[styles.iconWrap, { backgroundColor: destructive ? 'rgba(211,47,47,0.12)' : t.surfaceVariant }]}>
              <Ionicons name={o.icon} size={30} color={destructive ? t.danger : t.primary} />
            </View>
          )}
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>{o?.title}</Text>
          {!!o?.message && (
            <Text style={{ color: t.textSecondary, marginTop: 8, lineHeight: 21, textAlign: 'center' }}>{o.message}</Text>
          )}
          <View style={styles.buttons}>
            <Button title={o?.confirmLabel ?? 'OK'} variant={destructive ? 'danger' : 'primary'} onPress={() => onClose(true)} />
            {!!o?.cancelLabel && <Button title={o.cancelLabel} variant="ghost" onPress={() => onClose(false)} />}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** `dialog` goes once into the screen's JSX; `ask` shows a question, `notify` shows a one-button message. */
export function useDialog(): {
  dialog: ReactNode;
  ask: (o: DialogOptions) => void;
  notify: (title: string, message?: string, icon?: keyof typeof Ionicons.glyphMap) => void;
} {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const current = useRef<DialogOptions | null>(null);

  const show = useCallback((o: DialogOptions) => {
    current.current = o;
    setOptions(o);
    setVisible(true);
  }, []);

  const close = useCallback((confirmed: boolean) => {
    setVisible(false); // the text stays while the card fades out
    const o = current.current;
    if (confirmed) o?.onConfirm?.();
  }, []);

  return {
    dialog: <AppDialog visible={visible} options={options} onClose={close} />,
    ask: show,
    notify: (title, message, icon) => show({ title, message, icon }),
  };
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignSelf: 'center', alignItems: 'center' },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  buttons: { alignSelf: 'stretch', marginTop: 16 },
});
