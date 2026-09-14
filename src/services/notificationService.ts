export type AppNotification = { title: string; body: string; data?: Record<string, string> };

type NotificationListener = (notification: AppNotification) => void;
const listeners = new Set<NotificationListener>();

export const notificationService = {
    subscribe: (listener: NotificationListener) => { listeners.add(listener); return () => listeners.delete(listener); },
    publish: (notification: AppNotification) => listeners.forEach(listener => listener(notification)),
};
