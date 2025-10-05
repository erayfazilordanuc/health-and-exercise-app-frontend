import {NativeModules, Platform} from 'react-native';
const {AppInstallChecker} = NativeModules;

export const isInstalled = async (
  pkg: 'com.google.android.apps.healthdata' | 'com.sec.android.app.shealth',
) => {
  if (Platform.OS !== 'android') return false;
  return await AppInstallChecker.isInstalled(pkg);
};
