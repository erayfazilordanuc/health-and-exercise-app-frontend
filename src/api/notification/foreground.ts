// src/notifications/foreground.ts
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

let unsub: (() => void) | null = null;

export function setupForegroundFCM() {
  if (unsub) return unsub; // idempotent

  unsub = messaging().onMessage(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      // data her zaman string-string olmalı; emin olalım:
      const data = (remoteMessage.data ?? {}) as Record<string, unknown>;

      const title =
        asString(data.title) ??
        asString(remoteMessage.notification?.title) ??
        'Bildirim';

      const body =
        asString(data.body) ??
        asString(remoteMessage.notification?.body) ??
        'Yeni mesajın var';

      await notifee.displayNotification({
        title, // <-- artık string | undefined
        body, // <-- artık string | undefined
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, asString(v) ?? String(v)]),
        ), // Notifee data: Record<string, string> olmalı
        android: {
          channelId: 'default',
          pressAction: {id: 'default'},
          smallIcon: 'ic_stat_name',
        },
      });
    },
  );

  return unsub;
}
