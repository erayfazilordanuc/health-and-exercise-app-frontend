// useNotificationNavigation.ts (senin dosyan)
import notifee, {EventType} from '@notifee/react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {useEffect, useRef} from 'react';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getUserByUsername} from '../api/user/userService';

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}
function parseIntSafe(v?: string): number | undefined {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export const useNotificationNavigation = () => {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const handledInitialRef = useRef(false);

  // 🔴 Ortak yönlendirme
  const handleNavByData = async (data?: Record<string, any>) => {
    if (!data) return;
    const screen = asString(data.screen);

    if (!screen) {
      navigation.navigate('App', {screen: 'Home'} as never);
      return;
    }

    if (screen === 'Chat') {
      const userString = await AsyncStorage.getItem('user').catch(() => null);
      if (!userString) return;
      const user: User = JSON.parse(userString);

      const senderUsername = asString(data.sender);
      const roomId = parseIntSafe(asString(data.roomId));
      if (!senderUsername || !roomId) return;

      const receiver = await getUserByUsername(senderUsername).catch(
        () => undefined,
      );
      if (!receiver) return;

      navigation.navigate('App', {
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
      } as never);
      return;
    }

    if (screen === 'Exercise') {
      navigation.navigate('App', {
        screen: 'Exercises',
        params: {screen: 'ExercisesUser'},
      } as never);
      return;
    }

    navigation.navigate('App', {screen: 'Home'} as never);
  };

  useEffect(() => {
    // 1) FCM: app arka planda → bildirime tıklanırsa
    const unsubOpen = messaging().onNotificationOpenedApp(async rm => {
      await handleNavByData(rm?.data);
    });

    // 2) FCM: app kapalıyken bildirime tıklayıp açılırsa
    messaging()
      .getInitialNotification()
      .then(async rm => {
        if (handledInitialRef.current) return;
        handledInitialRef.current = true;
        await handleNavByData(rm?.data);
      });

    // 3) Notifee: app ön planda iken gösterdiğin bildirime tıklanırsa
    const unsubNotifeeFg = notifee.onForegroundEvent(async ({type, detail}) => {
      if (type === EventType.PRESS) {
        await handleNavByData(detail.notification?.data as any);
      }
    });

    return () => {
      unsubOpen();
      unsubNotifeeFg();
    };
  }, [navigation]);
};
