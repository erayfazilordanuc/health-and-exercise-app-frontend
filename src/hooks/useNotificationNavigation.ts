import messaging from '@react-native-firebase/messaging';
import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';

export const useNotificationNavigation = () => {
  const navigation = useNavigation<GroupsScreenNavigationProp>();

  useEffect(() => {
    // App background / kapalıyken bildirime tıklayınca
    const unsubscribeOpen = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('Bildirime tıkladı:', remoteMessage.data);
        if (remoteMessage.data?.screen === 'Chat') {
          navigation.navigate('Chat', {
            roomId: remoteMessage.data.roomId,
            sender: remoteMessage.data.sender,
          });
        }
      },
    );

    // App tamamen kapalıyken açılırsa
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Uygulama bildirime basarak açıldı:', remoteMessage.data);
          if (remoteMessage.data?.screen === 'Chat') {
            navigation.navigate('Chat', {
              roomId: remoteMessage.data.roomId,
              sender: remoteMessage.data.sender,
            });
          }
        }
      });

    return unsubscribeOpen;
  }, []);
};
