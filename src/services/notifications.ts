import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ENABLED_KEY = 'notifications_enabled';

// Show a banner even while the app is open (the chat screen of the same conversation is excluded in the watcher).
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }) as Notifications.NotificationBehavior,
});

/** The Settings switch. On by default. */
export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export const setNotificationsEnabled = (value: boolean) => AsyncStorage.setItem(ENABLED_KEY, String(value)).catch(() => {});

/**
 * Android likes to have a channel. Creating it must never stop the rest of the setup (asking for permission): some
 * environments, for example Expo Go on certain SDK versions, cannot create channels, and Android then uses its default.
 */
export async function prepareNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Messages and matches',
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch (e) {
    console.warn('Could not create the notification channel, using the default one', e);
  }
}

/** Asks for permission if it has not been decided yet (Android 13+ shows a system prompt). True when allowed. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function notifyLocal(opts: { title: string; body: string; matchId: string }): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: opts.title, body: opts.body, data: { matchId: opts.matchId } },
    trigger: null, // right now
  });
}

// The chat screen that is open right now, so its own messages don't also pop up as notifications.
let activeChatId: string | null = null;
export const setActiveChat = (matchId: string | null) => {
  activeChatId = matchId;
};
export const getActiveChat = () => activeChatId;
