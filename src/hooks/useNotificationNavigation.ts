import messaging from '@react-native-firebase/messaging';
import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getUserByUsername} from '../api/user/userService';

export const useNotificationNavigation = () => {
  const navigation = useNavigation<RootScreenNavigationProp>();

  useEffect(() => {
    // App background / kapalıyken bildirime tıklayınca
    const unsubscribeOpen = messaging().onNotificationOpenedApp(
      async remoteMessage => {
        console.log('Notification clicked:', remoteMessage.data);
        if (remoteMessage.data?.screen === 'Chat') {
          const userString = await AsyncStorage.getItem('user');
          if (userString) {
            const user: User = JSON.parse(userString);
            const receiverUsername = remoteMessage.data.sender.toString();
            const receiver = await getUserByUsername(receiverUsername);
            navigation.navigate('App', {
              screen: 'Groups',
              params: {
                screen: 'Chat',
                params: {
                  roomId: remoteMessage.data.roomId,
                  sender: user.username,
                  receiver: receiver,
                  fromNotification: true,
                },
              },
            });
          }
        }
      },
    );

    // App tamamen kapalıyken açılırsa
    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        if (remoteMessage) {
          if (remoteMessage.data?.screen === 'Chat') {
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
              const user: User = JSON.parse(userString);
              console.log(
                'App opened by notification:',
                remoteMessage.data,
                'receiver',
                user.username,
              );
              const receiverUsername = remoteMessage.data.sender.toString();
              const receiver = await getUserByUsername(receiverUsername);
              navigation.navigate('App', {
                screen: 'Groups',
                params: {
                  screen: 'Chat',
                  params: {
                    roomId: parseInt(remoteMessage.data.roomId.toString()),
                    sender: user.username,
                    receiver: receiver,
                    fromNotification: true,
                  },
                },
              });
            }
          }
        }
      });

    return unsubscribeOpen;
  }, []);
};
