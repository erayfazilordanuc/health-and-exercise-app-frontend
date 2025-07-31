import {PermissionsAndroid} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const requestPermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    console.log('Notifcitaion permission granted');
    return true;
  } else {
    console.log('Notification permission denied');
    return false;
  }
};

export const getToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token: ', token);
    return token;
  } catch (error) {
    console.error('Failed to get FCM Token', error);
  }
};

export const useNotification = () => {
  useEffect(() => {
    requestPermission();
    getToken();
  });
};
