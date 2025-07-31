import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Image,
  BackHandler,
  ToastAndroid,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../src/themes/ThemeProvider';
import icons from '../../../src/constants/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import {getUser} from '../../api/user/userService';
import GradientText from '../../components/GradientText';
import {
  getLastMessageBySenderAndReceiver,
  getNextRoomId,
  isDailyStatusExistForToday,
  isRoomExistBySenderAndReceiver,
  saveMessage,
} from '../../api/message/messageService';
import {getToken, requestPermission} from './../../hooks/useNotification';
import {Platform} from 'react-native';
import {
  saveFCMToken,
  sendNotification,
} from '../../api/notification/notificationService';
import NetInfo from '@react-native-community/netinfo';
import {useNotificationNavigation} from '../../hooks/useNotificationNavigation';
import images from '../../constants/images';
import Slider from '@react-native-community/slider';
import {useUser} from '../../contexts/UserContext';
import {getGroupAdmin} from '../../api/group/groupService';
import CustomWeeklyProgressCalendar from '../../components/CustomWeeklyProgressCalendar';
import {
  getTodaysProgress,
  getWeeklyActiveDaysProgress,
} from '../../api/exercise/progressService';
import CustomAlertSingleton, {
  CustomAlertSingletonHandle,
} from '../../components/CustomAlertSingleton';
// import {
//   isExerciseReminderScheduled,
//   registerExerciseReminder,
// } from '../../api/notification/localNotificationService';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

const Home = () => {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const exercisesNavigation = useNavigation<ExercisesScreenNavigationProp>();
  let exitCount = 0; // TO DO sayaç lazım
  const {theme, colors} = useTheme();
  const insets = useSafeAreaInsets();
  // const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const {user} = useUser();
  const [admin, setAdmin] = useState<User>();
  const [lastMessage, setLastMessage] = useState<Message | null>();
  const alertRef = useRef<CustomAlertSingletonHandle>(null);

  const [loading, setLoading] = useState(false);

  const healthProgressPercent = 93;

  const [todaysExerciseProgress, setTodaysExerciseProgress] =
    useState<ExerciseProgressDTO | null>();
  const [weeklyExerciseProgress, setWeeklyEersiseProgress] = useState<
    ExerciseProgressDTO[]
  >([]);

  const scrollViewHeight = SCREEN_HEIGHT / 8;

  const initializeAppContents = async () => {
    if (!user) return;

    let isAdminTemp = false;
    if (user.role === 'ROLE_ADMIN') {
      isAdminTemp = true;
      setIsAdmin(true);
    }

    // For notifications
    const notificationPermissionsGranted = await requestPermission();
    if (!notificationPermissionsGranted) {
      alertRef.current?.show({
        message: 'Bildirimlere izin vermediniz.',
        secondMessage:
          user.role === 'ROLE_USER'
            ? 'Egzersiz hatırlatmaları ve mesaj bildirimleri almak için bildirim izinlerini etkinleştirmeniz gerekmektedir.'
            : 'Mesaj bildirimleri almak için bildirim izinlerini etkinleştirmeniz gerekmektedir.',
        isPositive: true,
        onYesText: 'Etkinleştir',
        onCancelText: 'Kapat',
        onYes: async () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        },
        onCancel: () => {},
      });
    }

    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;

    if (isConnected && !isAdminTemp) {
      const dailyStatus = await AsyncStorage.getItem('dailyStatus');
      if (!dailyStatus && user.groupId) {
        const response = await isDailyStatusExistForToday(
          user.username,
          admin!.username,
        );
        if (!response.data) setIsModalVisible(true);
      } else {
        if (dailyStatus) {
          const dailyStatusObject: Message = JSON.parse(dailyStatus);
          if (
            new Date(dailyStatusObject.createdAt!).toDateString() !==
            new Date(Date.now()).toDateString()
          ) {
            await AsyncStorage.removeItem('dailyStatus');
            setIsModalVisible(true);
          }
        }
      }
    }

    if (!notificationPermissionsGranted) return;

    const localFcmTokenString = await AsyncStorage.getItem('fcmToken');
    console.log('localFcmTokenString', localFcmTokenString);

    let localFcmToken: FCMToken = {userId: null, token: null, platform: null};
    if (localFcmTokenString) localFcmToken = JSON.parse(localFcmTokenString);
    console.log('localFcmToken', localFcmToken);
    if (!localFcmToken || !localFcmToken.token) {
      const fcmToken = await getToken();
      console.log('fcmToken', fcmToken);
      const fcmTokenPayload: FCMToken = {
        userId: user.id!,
        token: fcmToken!,
        platform: Platform.OS,
      };

      if (isConnected) {
        const fcmTokenResposne = await saveFCMToken(fcmTokenPayload);
        if (fcmTokenResposne.status === 200) {
          await AsyncStorage.setItem(
            'fcmToken',
            JSON.stringify(fcmTokenPayload),
          );
        }
      }
    }

    // if (user && user.role === 'ROLE_USER') {
    //   const scheduled = await isExerciseReminderScheduled();
    //   if (scheduled) return;

    //   await registerExerciseReminder();
    // }
  };

  const fetchProgress = async () => {
    if (!user?.groupId) return;

    if (!admin) {
      const groupAdmin: User = await getGroupAdmin(user.groupId);
      setAdmin(groupAdmin);
    }

    const todaysExerciseProgress: ExerciseProgressDTO =
      await getTodaysProgress();
    setTodaysExerciseProgress(todaysExerciseProgress);

    const weeklyExerciseProgress: ExerciseProgressDTO[] =
      await getWeeklyActiveDaysProgress();
    setWeeklyEersiseProgress(weeklyExerciseProgress);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProgress();
    }, []),
  );

  useEffect(() => {
    initializeAppContents();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (exitCount > 0) {
          exitCount = 0;
          BackHandler.exitApp();
        } else {
          ToastAndroid.show('Çıkmak için tekrar ediniz', ToastAndroid.SHORT);
          exitCount++;
        }
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  const onSaveDailyStatus = async () => {
    setLoading(true);
    try {
      console.log(sliderValue);

      if (user && user.groupId) {
        const admin: User = await getGroupAdmin(user.groupId);

        const roomResponse = await isRoomExistBySenderAndReceiver(
          user.username,
          admin.username,
        );

        if (roomResponse && roomResponse.status === 200) {
          let roomId = roomResponse.data;
          if (roomId === 0) {
            const nextRoomResponse = await getNextRoomId();
            if (nextRoomResponse.status === 200) {
              roomId = nextRoomResponse.data;
            }
          }
          const message = 'dailyStatus' + sliderValue;
          const newMessage: Message = {
            message,
            sender: user.username,
            receiver: admin.username,
            roomId: roomId,
            createdAt: new Date(),
          };

          const saveResponse = await saveMessage(newMessage);

          const match = message.match(/dailyStatus(\d+)/);
          const score = parseInt(match![1], 10);

          const notiResponse = await sendNotification(
            admin.username,
            `${
              message ? new Date().toLocaleDateString() + '\n' : ''
            }Bugün ruh halimi ${score}/9 olarak değerlendiriyorum.`,
          );

          if (saveResponse.status === 200)
            AsyncStorage.setItem('dailyStatus', JSON.stringify(newMessage));

          setLoading(false);
          setIsModalVisible(false);
        }
      }
    } catch (error) {
      setLoading(false);
      setIsModalVisible(false);
      ToastAndroid.show('Bir hata oluştu', ToastAndroid.SHORT);
      console.log(error);
    }
    setLoading(false);
    setIsModalVisible(false);
  };

  const fetchLastMessage = async (user: User) => {
    if (!admin) return;

    const lastMessage: Message = await getLastMessageBySenderAndReceiver(
      admin.username,
      user.username,
    );

    if (lastMessage.message.startsWith('dailyStatus')) {
      const match = lastMessage.message.match(/dailyStatus(\d+)/);
      const score = parseInt(match![1], 10);

      lastMessage.message =
        '\n' +
        new Date().toLocaleDateString() +
        `\nBugün ruh halimi ${score}/9 olarak değerlendiriyorum.`;
    }
    setLastMessage(lastMessage);
  };

  useFocusEffect(
    useCallback(() => {
      if (user) fetchLastMessage(user);
    }, [admin]),
  );

  return (
    <>
      <View
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: insets.top * 1.3,
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Ana Ekran
        </Text>
      </View>
      <View
        className="px-3 pt-3"
        style={{
          flex: 1,
          backgroundColor: colors.background.secondary,
        }}>
        <ScrollView
          style={
            {
              // paddingTop: insets.top / 2,
            }
          }
          showsVerticalScrollIndicator={false}>
          <View
            className="flex flex-row justify-between px-3 py-3 rounded-2xl mb-2"
            style={{backgroundColor: colors.background.primary}}>
            {/* <Text
              className="pl-2 text-2xl font-rubik-medium"
              style={{
                color: colors.primary[300],
              }}>
              {user?.username}
            </Text> */}
            <GradientText
              className="pl-2 text-2xl font-rubik-medium text-center mb-1"
              start={{x: 0, y: 0}}
              end={{x: 0.7, y: 0}}
              colors={[colors.primary[300], '#40E0D0']}>
              {user?.fullName}
            </GradientText>
            {!isAdmin ? (
              <View className="flex flex-row">
                <Image
                  source={icons.patient}
                  className="size-9 mr-3"
                  tintColor={colors.text.primary}
                />
                {/* <Image source={icons.badge1_colorful} className="size-8 mr-2" />
                <Image
                  source={icons.badge1}
                  tintColor={colors.text.primary} // Eğer renkli değilse tintColor verilsin
                  className="size-8"
                /> */}
              </View>
            ) : (
              <View className="flex flex-row">
                <Image
                  source={icons.nurse}
                  className="size-9 mr-3"
                  tintColor={colors.text.primary}
                />
              </View>
            )}
          </View>

          <Modal
            transparent={true}
            visible={isModalVisible}
            animationType="fade"
            onRequestClose={() => {}}>
            <View className="flex-1 justify-center items-center bg-black/50">
              <View
                className="w-4/5 py-5 rounded-xl items-center"
                style={{backgroundColor: colors.background.primary}}>
                <Image
                  source={
                    theme.name === 'Light'
                      ? images.dailyStatus
                      : images.dailyStatusDark
                  }
                  style={{
                    width: '90%', // ekranın %90'ı
                    height: undefined,
                    aspectRatio: 1.5, // oran koruma (örnek)
                  }}
                  resizeMode="contain"
                />
                <Slider
                  style={{width: '75%', height: 20}}
                  minimumValue={1}
                  maximumValue={9}
                  step={1}
                  value={sliderValue}
                  onValueChange={value => setSliderValue(value)}
                  minimumTrackTintColor="#0EC946"
                  maximumTrackTintColor="#0EC946"
                  thumbTintColor="#0EC946"
                />
                {!loading ? (
                  <TouchableOpacity
                    className="py-2 px-3 rounded-2xl mt-5"
                    style={{backgroundColor: '#16d750'}}
                    onPress={onSaveDailyStatus}>
                    <Text
                      className="text-lg font-rubik"
                      style={{color: colors.background.secondary}}>
                      Kaydet
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <ActivityIndicator
                    className="mt-3 mb-2"
                    size="large"
                    color="#16d750"
                  />
                )}
              </View>
            </View>
          </Modal>

          <CustomAlertSingleton ref={alertRef} />

          {user && user.role === 'ROLE_USER' && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                className="flex-1 mt-1 mb-1 pb-2 rounded-2xl">
                <View
                  className="flex flex-col px-3 pr-4 py-3 rounded-3xl mr-1"
                  style={{
                    backgroundColor: colors.background.primary,
                  }}>
                  <Text
                    className="pl-2 text-2xl font-rubik"
                    style={{
                      color: colors.text.primary,
                    }}>
                    Sağlık Durumu
                  </Text>
                  <View className="mt-4 mb-2 flex justify-center items-center">
                    <AnimatedCircularProgress
                      size={100}
                      width={8}
                      fill={healthProgressPercent}
                      tintColor={'#3EDA87'}
                      onAnimationComplete={() =>
                        console.log('onAnimationComplete')
                      }
                      backgroundColor={colors.background.secondary}>
                      {() => (
                        <Text
                          className="text-2xl font-rubik"
                          style={{
                            color: colors.text.primary,
                          }}>
                          %{healthProgressPercent}
                        </Text>
                      )}
                    </AnimatedCircularProgress>
                  </View>
                </View>
                {user.groupId && (
                  <View
                    className="flex flex-column justify-between rounded-3xl px-5 py-3 ml-2"
                    style={{
                      backgroundColor: colors.background.primary,
                    }}>
                    <View className="flex flex-col justify-between flex-1">
                      {lastMessage &&
                        !lastMessage.message.startsWith('dailyStatus') && (
                          <View className="flex flex-col items-start justify-center max-w-64">
                            <Text
                              className="font-rubik text-2xl"
                              style={{color: colors.primary[200]}}>
                              En Son Mesaj
                            </Text>
                            <Text
                              className="font-rubik text-lg mt-1"
                              style={{color: colors.text.primary}}>
                              {lastMessage.receiver === user?.username
                                ? user?.fullName + ' : ' + lastMessage.message
                                : 'Siz : ' + lastMessage.message}
                            </Text>
                          </View>
                        )}
                      <TouchableOpacity
                        className="px-3 py-2 mt-2 bg-blue-500 flex self-start items-start justify-center"
                        style={{borderRadius: 17}}
                        onPress={async () => {
                          if (admin && user) {
                            const response =
                              await isRoomExistBySenderAndReceiver(
                                admin.username,
                                user.username,
                              );
                            if (response && response.status === 200) {
                              const roomId = response.data;
                              if (roomId !== 0) {
                                navigation.navigate('Groups', {
                                  screen: 'Chat', // 👈 string
                                  params: {
                                    roomId,
                                    sender: user?.username,
                                    receiver: admin,
                                    fromNotification: true,
                                    navigatedInApp: true,
                                  },
                                });
                              } else {
                                const nextRoomResponse = await getNextRoomId();
                                if (nextRoomResponse.status === 200) {
                                  const nextRoomId = nextRoomResponse.data;
                                  navigation.navigate('Chat', {
                                    roomId: nextRoomId,
                                    sender: user.username,
                                    receiver: admin,
                                    fromNotification: true,
                                    navigatedInApp: true,
                                  });
                                }
                              }
                            }
                          }
                        }}>
                        <Text
                          className="font-rubik text-lg"
                          style={{color: colors.background.secondary}}>
                          Sohbete git
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
              <View
                className="px-5 py-3 rounded-2xl mb-3"
                style={{backgroundColor: colors.background.primary}}>
                {new Date().getDay() === 1 ||
                new Date().getDay() === 3 ||
                new Date().getDay() === 5 ||
                new Date().getDay() === 6 ? (
                  <>
                    <>
                      <Text
                        className="font-rubik text-2xl mb-1"
                        style={{color: colors.text.primary}}>
                        Bugünün Egzersizi
                      </Text>

                      <View className="flex flex-row justify-between items-center mt-4 mb-2">
                        <TouchableOpacity
                          disabled={
                            todaysExerciseProgress?.progressRatio !== null &&
                            todaysExerciseProgress?.progressRatio === 100
                          }
                          className="flex flex-row justify-center items-center rounded-2xl ml-1 py-3 pl-3"
                          style={{
                            backgroundColor:
                              todaysExerciseProgress?.progressRatio &&
                              todaysExerciseProgress.progressRatio === 100
                                ? '#55CC88'
                                : todaysExerciseProgress?.progressRatio &&
                                  todaysExerciseProgress.progressRatio > 0
                                ? '#FFAA33'
                                : colors.primary[175],
                          }}
                          onPress={() =>
                            navigation.navigate('Exercises', {
                              screen: 'ExercisesUser',
                            })
                          }>
                          <Text className="text-xl font-rubik ml-1">
                            {todaysExerciseProgress?.progressRatio &&
                            todaysExerciseProgress.progressRatio === 100
                              ? 'Tamamlandı'
                              : todaysExerciseProgress?.progressRatio &&
                                todaysExerciseProgress.progressRatio > 0
                              ? 'Egzersize git'
                              : 'Egzersize git'}
                          </Text>
                          <Image
                            source={icons.gymnastic_1}
                            className="size-20"
                          />
                        </TouchableOpacity>
                        {todaysExerciseProgress?.progressRatio &&
                          todaysExerciseProgress.progressRatio > 0 && (
                            <View className="flex justify-center items-center mr-5">
                              <AnimatedCircularProgress
                                size={100}
                                width={8}
                                fill={
                                  todaysExerciseProgress?.progressRatio &&
                                  todaysExerciseProgress.progressRatio
                                }
                                tintColor={colors.primary[300]}
                                onAnimationComplete={() =>
                                  console.log('onAnimationComplete')
                                }
                                backgroundColor={colors.background.secondary}>
                                {() => (
                                  <Text
                                    className="text-2xl font-rubik"
                                    style={{
                                      color: colors.text.primary,
                                    }}>
                                    %
                                    {todaysExerciseProgress?.progressRatio &&
                                      todaysExerciseProgress.progressRatio}
                                  </Text>
                                )}
                              </AnimatedCircularProgress>
                            </View>
                          )}
                      </View>
                    </>
                  </>
                ) : (
                  <Text
                    className="font-rubik text-xl mb-1"
                    style={{color: colors.text.primary}}>
                    Bugün için planlanan egzersiziniz yok. İyi dinlenmeler!
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
};

export default Home;
