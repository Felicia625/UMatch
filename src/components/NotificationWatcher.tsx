import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { isSignedIn, useAuth } from '../providers/AuthProvider';
import { canChat, partnerOf, subscribeToMatchEvents } from '../services/matches';
import {
  ensurePermission,
  getActiveChat,
  getNotificationsEnabled,
  notifyLocal,
  prepareNotifications,
} from '../services/notifications';
import { getUser } from '../services/users';
import { UserProfile } from '../types';

const truncate = (s: string, n = 120) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Local notifications for new messages and new matches. It listens to my matches in Firestore and posts a notification
 * on this phone, so it only works while the app is running (open, or recently sent to the background). Notifications
 * after the app has been closed need push notifications from a server.
 */
export function NotificationWatcher() {
  const { user } = useAuth();
  const router = useRouter();
  const uid = user && isSignedIn(user) ? user.uid : undefined;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const partners = new Map<string, UserProfile | null>();

    (async () => {
      await prepareNotifications();
      if (await getNotificationsEnabled()) await ensurePermission();
    })().catch((e) => console.warn('Notification setup failed', e));

    const unsubscribe = subscribeToMatchEvents(
      uid,
      async (event) => {
        try {
          if (cancelled || !(await getNotificationsEnabled())) return;
          // Don't notify about a conversation that is on screen.
          if (AppState.currentState === 'active' && event.match.id === getActiveChat()) return;

          const pid = partnerOf(event.match, uid);
          if (!pid) return;
          const gate = await canChat(uid, pid); // still matched, nobody blocked
          if (!gate.ok) return;

          if (!partners.has(pid)) partners.set(pid, await getUser(pid));
          const partner = partners.get(pid);
          if (!partner) return;

          if (event.kind === 'message') {
            await notifyLocal({ title: partner.username, body: truncate(event.text), matchId: event.match.id });
          } else if (partner.friendFirst) {
            await notifyLocal({
              title: "You're now friends!",
              body: `You and ${partner.username} are now friends. Say hi!`,
              matchId: event.match.id,
            });
          } else {
            await notifyLocal({
              title: "It's a match!",
              body: `You and ${partner.username} liked each other. Say hi!`,
              matchId: event.match.id,
            });
          }
        } catch (e) {
          console.warn('Could not show notification', e);
        }
      },
      (e) => console.warn('Notification listener failed', e),
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid]);

  // Tapping a notification opens that chat.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const matchId = response.notification.request.content.data?.matchId;
      if (typeof matchId === 'string') router.push(`/chat/${matchId}`);
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
