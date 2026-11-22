import { Alert, AlertButton, Platform } from 'react-native';

/**
 * React Native Web ships an Alert.alert that does nothing, so on the web build every message and every confirmation
 * ("Unlike?", "Block?", "Delete message?") silently disappeared and the action it guarded never ran. This replaces it
 * with the browser's own alert / confirm. Phones keep the native Alert.
 */
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const list = buttons ?? [];
    if (list.length <= 1) {
      window.alert(text);
      list[0]?.onPress?.();
      return;
    }
    const cancel = list.find((b) => b.style === 'cancel');
    const confirm = [...list].reverse().find((b) => b.style !== 'cancel');
    if (window.confirm(text)) confirm?.onPress?.();
    else cancel?.onPress?.();
  };
}
