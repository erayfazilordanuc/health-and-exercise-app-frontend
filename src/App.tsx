import * as React from 'react';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import '../global.css';
import AppNavigator from './navigation/AppNavigator';
import {ThemeProvider, useTheme} from './themes/ThemeProvider';
import Toast, {BaseToastProps, ErrorToast} from 'react-native-toast-message';
import {UserProvider} from './contexts/UserContext';
import {ReactQueryProvider} from './lib/react-query/provider';
import {focusManager} from '@tanstack/react-query';
import {AppState, StatusBar} from 'react-native';

import {useEffect, useState} from 'react';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {PermissionsAndroid, Platform} from 'react-native';
import NotificationHandler from './navigation/NotificationHandler';
import {initI18n} from './i18n';

function GlobalStatusBar() {
  // ThemeProvider içindeyken çalışır
  const {theme} = useTheme();
  const bar = theme.colors.isLight ? 'dark-content' : 'light-content';
  return (
    <StatusBar
      // translucent // içerik status bar altına girsin
      backgroundColor="transparent"
      barStyle={bar}
      animated
    />
  );
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export default function App() {
  focusManager.setEventListener(handleFocus => {
    const sub = AppState.addEventListener('change', state => {
      handleFocus(state === 'active');
    });
    return () => sub.remove();
  });

  useEffect(() => {
    // 1) Android 13+ izin (gerekli)
    (async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS',
        );
      }
      // 2) Kanal (heads-up için HIGH)
      await notifee.createChannel({
        id: 'default',
        name: 'Genel',
        importance: AndroidImportance.HIGH,
      });
    })();

    // 3) Uygulama ÖN PLANDA iken gelen FCM’i yakala ve yerel bildirim göster
    // const unsub = messaging().onMessage(async rm => {
    //   const d = rm.data ?? {};
    //   const title =
    //     asString(d.title) ?? asString(rm.notification?.title) ?? 'Bildirim';
    //   const body =
    //     asString(d.body) ??
    //     asString(rm.notification?.body) ??
    //     'Yeni mesajın var';

    //   await notifee.displayNotification({
    //     title,
    //     body,
    //     data: Object.fromEntries(
    //       Object.entries(d).map(([k, v]) => [k, String(v)]),
    //     ),
    //     android: {
    //       channelId: 'default',
    //       smallIcon: 'ic_notification',
    //       pressAction: {id: 'default'},
    //     },
    //     ios: {
    //       foregroundPresentationOptions: {
    //         alert: true,
    //         sound: true,
    //         badge: true,
    //       },
    //     },
    //   });
    // });

    const hasTitleOrBody = (rm: FirebaseMessagingTypes.RemoteMessage) => {
      const d = rm.data ?? {};
      const t =
        (typeof d.title === 'string' && d.title.trim()) ||
        rm.notification?.title;
      const b =
        (typeof d.body === 'string' && d.body.trim()) || rm.notification?.body;
      return Boolean(t || b);
    };

    const unsub = messaging().onMessage(async rm => {
      // 1) Görsel içerik yoksa hiç bildirim gösterme (örn. sadece yönlendirme datası)
      if (!hasTitleOrBody(rm)) {
        // İstersen burada sadece state güncelle / badge arttır vs.
        return;
      }

      const d = rm.data ?? {};
      const title =
        (typeof d.title === 'string' && d.title) ||
        rm.notification?.title ||
        undefined;
      const body =
        (typeof d.body === 'string' && d.body) ||
        rm.notification?.body ||
        undefined;

      // Ek güvenlik: yine de yoksa hiç gösterme
      if (!title && !body) return;

      await notifee.displayNotification({
        title,
        body,
        data: Object.fromEntries(
          Object.entries(d).map(([k, v]) => [k, String(v)]),
        ),
        android: {
          channelId: 'default',
          smallIcon: 'ic_notification',
          pressAction: {id: 'default'},
        },
        ios: {
          foregroundPresentationOptions: {
            alert: true,
            sound: true,
            badge: true,
          },
        },
      });
    });

    return () => unsub();
  }, []);

  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) return null;

  return (
    <ThemeProvider>
      <GlobalStatusBar />
      <UserProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ReactQueryProvider>
            <AppNavigator />
            <NotificationHandler />
          </ReactQueryProvider>
        </SafeAreaProvider>
        <Toast />
      </UserProvider>
    </ThemeProvider>
  );
}
