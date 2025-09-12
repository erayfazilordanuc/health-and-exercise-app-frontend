// navigation/NotificationHandler.tsx
import {useEffect, useRef} from 'react';
import notifee, {Event, EventType} from '@notifee/react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {navSafe} from './NavigationService';
import {getUserByUsername} from '../api/user/userService';

// --- helpers ---
const asString = (v: unknown) => (typeof v === 'string' ? v : undefined);
const parseIntSafe = (v?: string) => {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
};

async function handleNavByData(source: string, data?: Record<string, any>) {
  console.log(`[NotificationHandler] handleNavByData from=${source}`, data);
  if (!data) return;

  const screen = asString(data.screen);
  if (!screen) {
    console.log('[NotificationHandler] screen missing → go Home');
    navSafe('App', {screen: 'Home'});
    return;
  }

  if (screen === 'Chat') {
    try {
      const userString = await AsyncStorage.getItem('user').catch(() => null);
      if (!userString) {
        console.log('[NotificationHandler] no local user → abort Chat nav');
        return;
      }
      const user: any = JSON.parse(userString);

      const senderUsername = asString(data.sender);
      const roomId = parseIntSafe(asString(data.roomId));
      if (!senderUsername || !roomId) {
        console.log(
          '[NotificationHandler] missing sender/roomId → abort Chat nav',
        );
        return;
      }

      const receiver = await getUserByUsername(senderUsername).catch(
        () => undefined,
      );
      if (!receiver) {
        console.log(
          '[NotificationHandler] receiver not found → abort Chat nav',
        );
        return;
      }

      console.log('[NotificationHandler] navigating → App > Groups > Chat', {
        roomId,
        sender: user.username,
        receiver: receiver?.username ?? receiver?.id ?? 'receiver',
      });

      navSafe('App', {
        screen: 'Groups',
        params: {
          screen: 'Chat',
          params: {
            roomId,
            sender: user.username,
            receiver,
            fromNotification: true,
          },
        },
      });
      return;
    } catch (err) {
      console.log('[NotificationHandler] Chat nav error:', err);
      return;
    }
  }

  if (screen === 'Exercise') {
    console.log(
      '[NotificationHandler] navigating → App > Exercises > ExercisesUser',
    );
    navSafe('App', {screen: 'Exercises', params: {screen: 'ExercisesUser'}});
    return;
  }

  console.log('[NotificationHandler] fallback → Home');
  navSafe('App', {screen: 'Home'});
}

// --- component ---
export default function NotificationHandler() {
  const handledInitialRef = useRef(false);

  useEffect(() => {
    console.log('[NotificationHandler] mount');

    // 1) App arka plandayken bildirime tıklayıp öne getirildiğinde
    const onOpened = (rm: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('[NotificationHandler] onNotificationOpenedApp', rm?.data);
      handleNavByData('onNotificationOpenedApp', rm?.data).catch(() => {});
    };
    const unsubOpen = messaging().onNotificationOpenedApp(onOpened);

    // 2) App kapalıyken bildirime tıklayıp ilk kez açıldığında
    messaging()
      .getInitialNotification()
      .then(rm => {
        if (handledInitialRef.current) return;
        handledInitialRef.current = true;
        if (rm) {
          console.log('[NotificationHandler] getInitialNotification', rm?.data);
          return handleNavByData('getInitialNotification', rm?.data);
        } else {
          console.log('[NotificationHandler] getInitialNotification: null');
        }
      })
      .catch(err =>
        console.log('[NotificationHandler] getInitialNotification error', err),
      );

    // 3) App ön plandayken (kendi notifee ile gösterdiğin) bildirime tıklanınca
    const onFg = (evt: Event) => {
      if (evt.type === EventType.PRESS) {
        const data = evt.detail.notification?.data as
          | Record<string, any>
          | undefined;
        console.log(
          '[NotificationHandler] notifee.onForegroundEvent PRESS',
          data,
        );
        handleNavByData('notifee.onForegroundEvent', data).catch(() => {});
      } else {
        // dilersen diğer eventleri de loglayabilirsin
        // console.log('[NotificationHandler] notifee.onForegroundEvent other', evt.type);
      }
    };
    const unsubNotifeeFg = notifee.onForegroundEvent(onFg);

    return () => {
      console.log('[NotificationHandler] unmount');
      unsubOpen();
      unsubNotifeeFg();
    };
  }, []);

  return null;
}
