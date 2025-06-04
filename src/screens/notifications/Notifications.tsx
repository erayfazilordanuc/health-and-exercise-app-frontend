import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  BackHandler,
} from 'react-native';
import React, {useCallback, useEffect} from 'react';
import {useTheme} from '../../../src/themes/ThemeProvider';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import notifee from '@notifee/react-native';
import icons from '../../../src/constants/icons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const Notifications = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        navigation.navigate('Home');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove(); // Ekrandan çıkınca event listener'ı kaldır
    }, []),
  );

  async function showNotification() {
    // Request permissions (required for iOS)
    await notifee.requestPermission();

    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    // Display a notification
    await notifee.displayNotification({
      title: 'Takipten Bildirim',
      body: 'Çok fena bildirim içeriği',
      android: {
        channelId,
        importance: 4,
        smallIcon: 'ic_launcher',
        color: colors.primary[300], // optional, defaults to 'ic_launcher'.
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: 'default',
        },
      },
    });
  }

  return (
    <View>
      <View
        className="pt-14"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Bildirimler
        </Text>
      </View>
      <TouchableOpacity
        className="h-full pb-32 px-5 pt-3"
        style={{
          backgroundColor: colors.background.secondary,
          // paddingTop: insets.top / 2,
        }}
        onPress={() => showNotification()}>
        <View className="flex flex-row justify-center items-center">
          <View
            className="text-xl font-rubik py-3 px-5 rounded-2xl"
            style={{
              backgroundColor: colors.background.primary,
            }}>
            <MaskedView
              maskElement={
                <Text
                  className="text-xl font-rubik"
                  style={{
                    backgroundColor: 'transparent',
                  }}>
                  Bildirim gönder
                </Text>
              }>
              <LinearGradient
                colors={[colors.primary[300], '#40E0D0']} // mavi → turkuaz
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text
                  className="text-xl font-rubik"
                  style={{
                    opacity: 0,
                  }}>
                  Bildirim gönder
                </Text>
              </LinearGradient>
            </MaskedView>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Notifications;
