// // src/services/NotificationService.ts
// import notifee, {
//   AndroidImportance,
//   TimestampTrigger,
//   TriggerType,
//   RepeatFrequency,
// } from '@notifee/react-native';
// import {Platform} from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// /* ─────────────────────────────────────────────────────────
//    Sabitler
// ───────────────────────────────────────────────────────── */
// const CHANNEL_ID = 'exercise-reminder';
// const REMINDER_FLAG = 'EXERCISE_REMINDER_SET';
// const TEST_REMINDER_FLAG = 'EXERCISE_REMINDER_TEST_SET';
// const NOTIF_ID = 'exercise-reminder-id';
// const TEST_NOTIF_ID = 'exercise-reminder-test-id';

// /* ─────────────────────────────────────────────────────────
//    Ortak yardımcı – haftalık tetik (Pzt / Çar / Cum)
// ───────────────────────────────────────────────────────── */
// function nextTrigger(dayIndices: number[]): number {
//   const now = new Date();
//   const target = new Date();
//   target.setHours(12, 0, 0, 0); // 12:00

//   while (!dayIndices.includes(target.getDay())) {
//     target.setDate(target.getDate() + 1); // ileri kay
//   }
//   if (target <= now) target.setDate(target.getDate() + 7);
//   return target.getTime();
// }

// /* ─────────────────────────────────────────────────────────
//    PROD hatırlatma (haftada üç kez – PÇC 12:00)
// ───────────────────────────────────────────────────────── */
// export async function registerExerciseReminder() {
//   if (await AsyncStorage.getItem(REMINDER_FLAG)) return; // Zaten kurulu

//   await ensureChannelAndPermission();

//   await notifee.createTriggerNotification(
//     {
//       id: NOTIF_ID,
//       title: 'Egzersiz zamanı!',
//       body: 'Bugünkü antrenmanını kaçırma 💪',
//       android: {
//         channelId: CHANNEL_ID,
//         pressAction: {id: 'default'}, // ← şart
//         smallIcon: 'ic_notification', // ikon ayarını da ekledik (bkz §3)
//       },
//       data: {screen: 'Exercise'},
//     },
//     {
//       type: TriggerType.TIMESTAMP,
//       timestamp: nextTrigger([1, 3, 5]), // Pzt‑Çar‑Cum
//       repeatFrequency: RepeatFrequency.WEEKLY,
//     } as TimestampTrigger,
//   );

//   await AsyncStorage.setItem(REMINDER_FLAG, '1');
// }

// /* ─────────────────────────────────────────────────────────
//    TEST hatırlatma – şimdiden 1 dk sonra, her hafta aynı dakika
// ───────────────────────────────────────────────────────── */
// export async function registerTestReminder() {
//   if (await AsyncStorage.getItem(TEST_REMINDER_FLAG)) return; // Zaten kurulu

//   await ensureChannelAndPermission();

//   // 1 dakika sonrası
//   const FIVE_SECONDS_LATER = Date.now() + 5 * 1000;

//   await notifee.createTriggerNotification(
//     {
//       id: TEST_NOTIF_ID,
//       title: '⏰ Test Bildirimi',
//       body: 'Bu bir deneme hatırlatmasıdır.',
//       android: {
//         channelId: CHANNEL_ID,
//         pressAction: {id: 'default'}, // ← şart
//         smallIcon: 'ic_notification', // ikon ayarını da ekledik (bkz §3)
//       },
//       data: {screen: 'Exercise'},
//     },
//     {
//       type: TriggerType.TIMESTAMP,
//       timestamp: FIVE_SECONDS_LATER,
//       repeatFrequency: RepeatFrequency.WEEKLY, // her hafta aynı dakika
//     } as TimestampTrigger,
//   );

//   await AsyncStorage.setItem(TEST_REMINDER_FLAG, '1');
// }

// /* ─────────────────────────────────────────────────────────
//    Ortak yardımcı – izin + kanal
// ───────────────────────────────────────────────────────── */
// async function ensureChannelAndPermission() {
//   await notifee.requestPermission(); // iOS izni
//   if (Platform.OS === 'android') {
//     await notifee.createChannel({
//       id: CHANNEL_ID,
//       name: 'Exercise Reminder',
//       importance: AndroidImportance.HIGH,
//     });
//   }
// }

// /* ─────────────────────────────────────────────────────────
//    Kontrol / iptal fonksiyonları
// ───────────────────────────────────────────────────────── */
// export async function isExerciseReminderScheduled(): Promise<boolean> {
//   if (!(await AsyncStorage.getItem(REMINDER_FLAG))) return false;
//   const ids = await notifee.getTriggerNotificationIds();
//   return ids.includes(NOTIF_ID);
// }

// export async function isTestReminderScheduled(): Promise<boolean> {
//   if (!(await AsyncStorage.getItem(TEST_REMINDER_FLAG))) return false;
//   const ids = await notifee.getTriggerNotificationIds();
//   return ids.includes(TEST_NOTIF_ID);
// }

// export async function cancelExerciseReminder() {
//   await notifee.cancelTriggerNotification(NOTIF_ID);
//   await AsyncStorage.removeItem(REMINDER_FLAG);
// }

// export async function cancelTestReminder() {
//   await notifee.cancelTriggerNotification(TEST_NOTIF_ID);
//   await AsyncStorage.removeItem(TEST_REMINDER_FLAG);
// }
