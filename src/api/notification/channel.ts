import notifee, {AndroidImportance} from '@notifee/react-native';

export async function ensureDefaultChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Genel',
    importance: AndroidImportance.HIGH,
  });
}
