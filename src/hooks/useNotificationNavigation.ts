import messaging from '@react-native-firebase/messaging';
import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useNotificationNavigation = () => {
  const navigation = useNavigation<RootScreenNavigationProp>();

  const getUser = async () => {
    const user = await AsyncStorage.getItem('user');
    if (user) return user;
  };

  useEffect(() => {
    // App background / kapalıyken bildirime tıklayınca
    const unsubscribeOpen = messaging().onNotificationOpenedApp(
      async remoteMessage => {
        console.log('Notification clicked:', remoteMessage.data);
        if (remoteMessage.data?.screen === 'Chat') {
          const userString = await AsyncStorage.getItem('user');
          if (userString) {
            const user: User = JSON.parse(userString);
            navigation.navigate('Groups', {
              screen: 'Chat',
              params: {
                roomId: remoteMessage.data.roomId,
                sender: remoteMessage.data.sender,
                receiver: user,
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
              navigation.navigate('Groups', {
                screen: 'Chat',
                params: {
                  roomId: remoteMessage.data.roomId,
                  sender: remoteMessage.data.sender,
                  receiver: user,
                },
              });
            }
          }
        }
      });

    return unsubscribeOpen;
  }, []);
};
