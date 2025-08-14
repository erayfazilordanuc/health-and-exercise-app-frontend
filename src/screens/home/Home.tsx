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
  NativeModules,
  Platform,
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
import NotificationSetting from 'react-native-open-notification';
import {
  checkHealthConnectInstalled,
  computeHealthScore,
  getSymptoms,
  initializeHealthConnect,
} from '../../api/health/healthConnectService';
import {getSymptomsByDate} from '../../api/symptoms/symptomsService';
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
  const [initialized, setInitialized] = useState(false);

  const [healthScore, setHealthScore] = useState(0);

  const [todayExerciseProgress, setTodayExerciseProgress] =
    useState<ExerciseProgressDTO | null>();
  const [weeklyExerciseProgress, setWeeklyEersiseProgress] = useState<
    ExerciseProgressDTO[]
  >([]);

  const scrollViewHeight = SCREEN_HEIGHT / 8;

  const initializeAppContents = async () => {
    if (!user) return;
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
        onYesText: 'İzin ver',
        onCancelText: 'Kapat',
        onYes: async () => {
          NotificationSetting.open();
        },
        onCancel: () => {},
      });
    }

    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;

    if (isConnected && user.role === 'ROLE_USER') {
      const dailyStatus = await AsyncStorage.getItem('dailyStatus');
      if (!dailyStatus && user.groupId) {
        const groupAdmin: User = await getGroupAdmin(user.groupId);
        setAdmin(groupAdmin);
        const response = await isDailyStatusExistForToday(
          user.username,
          groupAdmin.username,
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
    } else {
      setIsAdmin(true);
    }

    await fetchAndCalculateHealthScore();

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

  const calcPercent = (p?: ExerciseProgressDTO | null): number => {
    if (!p) return 0;
    const total = p.exerciseDTO.videos.reduce(
      (sum, v) => sum + (v.durationSeconds ?? 0),
      0,
    );
    return total === 0
      ? 0
      : Math.round((p.totalProgressDuration / total) * 100);
  };

  const fetchProgress = async () => {
    if (!user?.groupId) return;

    try {
      if (!admin) {
        const groupAdmin: User = await getGroupAdmin(user.groupId);
        setAdmin(groupAdmin);
      }

      const todayExerciseProgress: ExerciseProgressDTO =
        await getTodaysProgress();
      setTodayExerciseProgress(todayExerciseProgress);

      const weeklyExerciseProgress: ExerciseProgressDTO[] =
        await getWeeklyActiveDaysProgress();
      setWeeklyEersiseProgress(weeklyExerciseProgress);
    } catch (error) {
      ToastAndroid.show('Bir hata oluştu', ToastAndroid.SHORT);
      console.log(error);
    } finally {
      if (!initialized) setInitialized(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProgress();
    }, []),
  );

  useEffect(() => {
    initializeAppContents();
  }, []);

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
        }
      }
    } catch (error) {
      ToastAndroid.show('Bir hata oluştu', ToastAndroid.SHORT);
      console.log(error);
    } finally {
      setLoading(false);
      setIsModalVisible(false);
    }
  };

  const fetchLastMessage = async (user: User) => {
    if (!admin) return;

    try {
      const lastMessage: Message = await getLastMessageBySenderAndReceiver(
        admin.username,
        user.username,
      );

      if (
        lastMessage.message &&
        lastMessage.message.startsWith('dailyStatus')
      ) {
        const match = lastMessage.message.match(/dailyStatus(\d+)/);
        const score = parseInt(match![1], 10);

        lastMessage.message =
          '\n' +
          new Date().toLocaleDateString() +
          `\nBugün ruh halimi ${score}/9 olarak değerlendiriyorum.`;
      }
      setLastMessage(lastMessage);
    } catch (error) {
      ToastAndroid.show('Bir hata oluştu', ToastAndroid.SHORT);
      console.log(error);
    } finally {
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user) fetchLastMessage(user);
    }, [admin]),
  );

  const combineAndSetSymptoms = async (
    symptoms: Symptoms,
    syncedSymptoms?: Symptoms,
  ) => {
    if (symptoms) {
      const merged: Symptoms = {...symptoms};
      if (!merged.pulse && syncedSymptoms && syncedSymptoms.pulse) {
        merged.pulse = syncedSymptoms.pulse;
      }

      if (!merged.steps && syncedSymptoms && syncedSymptoms.steps) {
        merged.steps = syncedSymptoms.steps;
      }

      if (
        !merged.activeCaloriesBurned &&
        syncedSymptoms &&
        syncedSymptoms.activeCaloriesBurned
      ) {
        merged.activeCaloriesBurned = syncedSymptoms.activeCaloriesBurned;
      }

      if (!merged.sleepMinutes && syncedSymptoms && syncedSymptoms.sleepMinutes) {
        merged.sleepMinutes = syncedSymptoms.sleepMinutes;
      }

      return merged;
    }
  };

  const fetchAndCalculateHealthScore = async () => {
    setLoading(true);
    try {
      if (user && user.role === 'ROLE_USER') {
        const healthConnectInstalled = await checkHealthConnectInstalled();
        if (!healthConnectInstalled) return;

        const isHealthConnectReady = await initializeHealthConnect();
        if (!isHealthConnectReady) return;

        const healthConnectSymptoms = await getSymptoms();
        const syncedSymptoms = await getSymptomsByDate(new Date());
        const combinedSymptoms = await combineAndSetSymptoms(
          healthConnectSymptoms!,
          syncedSymptoms,
        );
        if (combinedSymptoms) {
          const s = computeHealthScore({
            heartRate: combinedSymptoms.pulse || undefined,
            steps: combinedSymptoms.steps || undefined,
            activeCalories: combinedSymptoms.activeCaloriesBurned || undefined,
            sleepMinutes: combinedSymptoms.sleepMinutes || undefined,
          });
          setHealthScore(s);
        }
      }
    } finally {
      setLoading(false); // ✅ her durumda çalışır
    }
  };

  return (
    <>
      <LinearGradient
        colors={colors.gradient} // istediğin renkler
        start={{x: 0.1, y: 0}}
        end={{x: 0.9, y: 1}}
        className="absolute inset-0"
      />
      <View
        style={{
          backgroundColor: 'transparent', //colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: insets.top * 1.3,
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color:
              theme.name === 'Light' ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          Ana Ekran
        </Text>
      </View>
      <View
        className="px-3 pt-3"
        style={{
          flex: 1,
          backgroundColor: 'transparent', //colors.background.secondary,
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
                <Text
                  className="font-rubik-semibold text-2xl text-center"
                  style={{color: colors.text.secondary}}>
                  Bugün kendinizi nasıl hissediyorsunuz?
                </Text>
                <Image
                  source={
                    theme.name === 'Light'
                      ? images.dailyStatus
                      : images.dailyStatusDark
                  }
                  style={{
                    width: '90%', // ekranın %90'ı
                    height: 125,
                    aspectRatio: 2.2, // oran koruma (örnek)
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
              {/* <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                className="flex-1 mt-1 mb-1 pb-2 rounded-2xl"> */}
              <View className="flex-1 flex flex-row items-stretch justify-between mt-1">
                <View
                  className="flex flex-col px-3 pr-4 py-3 " // mr-1
                  style={{
                    borderRadius: 20,
                    backgroundColor: colors.background.primary,
                  }}>
                  <Text
                    className="pl-2 font-rubik"
                    style={{fontSize: 18, color: colors.text.primary}}>
                    Sağlık Durumu
                  </Text>
                  <View className="mt-4 mb-2 flex justify-center items-center">
                    <AnimatedCircularProgress
                      size={80}
                      width={5}
                      rotation={0}
                      fill={healthScore}
                      tintColor={'#3EDA87'}
                      onAnimationComplete={() =>
                        console.log('onAnimationComplete')
                      }
                      backgroundColor={colors.background.secondary}>
                      {() => (
                        <Text
                          className="text-xl font-rubik"
                          style={{
                            color: colors.text.primary,
                          }}>
                          %{healthScore}
                        </Text>
                      )}
                    </AnimatedCircularProgress>
                  </View>
                </View>
                <View
                  className="flex-1 flex flex-col px-5 py-3 ml-3 "
                  style={{
                    borderRadius: 20,
                    backgroundColor: colors.background.primary,
                  }}>
                  {new Date().getDay() === 1 ||
                  new Date().getDay() === 3 ||
                  new Date().getDay() === 5 ? (
                    <>
                      <>
                        <Text
                          className="font-rubik text-xl mb-1"
                          style={{color: colors.text.primary, marginTop: 2}}>
                          Bugünün Egzersizi
                        </Text>

                        {initialized ? (
                          <View className="flex flex-row justify-between items-center mt-5 mb-2">
                            <TouchableOpacity
                              disabled={
                                todayExerciseProgress?.totalProgressDuration !==
                                  null &&
                                todayExerciseProgress?.totalProgressDuration ===
                                  calcPercent(todayExerciseProgress)
                              }
                              className="flex flex-row justify-center items-center rounded-2xl py-3 pl-2"
                              style={{
                                backgroundColor:
                                  todayExerciseProgress?.totalProgressDuration &&
                                  calcPercent(todayExerciseProgress) === 100
                                    ? '#55CC88'
                                    : todayExerciseProgress?.totalProgressDuration &&
                                      todayExerciseProgress.totalProgressDuration >
                                        0
                                    ? '#FFAA33'
                                    : colors.primary[175],
                              }}
                              onPress={() =>
                                navigation.navigate('Exercises', {
                                  screen: 'ExercisesUser',
                                })
                              }>
                              <Text className="text-xl font-rubik ml-1">
                                {todayExerciseProgress?.totalProgressDuration &&
                                calcPercent(todayExerciseProgress) === 100
                                  ? 'Tamamlandı'
                                  : todayExerciseProgress?.totalProgressDuration &&
                                    todayExerciseProgress.totalProgressDuration >
                                      0
                                  ? 'Egzersize git'
                                  : 'Egzersize git'}
                              </Text>
                              <Image
                                source={icons.gymnastic_1}
                                className="size-12"
                              />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <ActivityIndicator
                            className="self-center mt-10"
                            size="small"
                            color={colors.primary[300]}
                          />
                        )}
                      </>
                    </>
                  ) : (
                    <>
                      <Text
                        className="font-rubik text-center"
                        style={{fontSize: 15, color: colors.text.primary}}>
                        Bugün için planlanan egzersiziniz yok.
                      </Text>
                      <Text
                        className="font-rubik mt-5 text-center"
                        style={{fontSize: 17, color: colors.text.primary}}>
                        İyi dinlenmeler!
                      </Text>
                    </>
                  )}
                </View>
              </View>
              {user.groupId && (
                <View
                  className="flex flex-column justify-between px-5 pt-3 pb-4 my-3" // ml-2
                  style={{
                    borderRadius: 17,
                    backgroundColor: colors.background.primary,
                  }}>
                  <View className="flex flex-row justify-between">
                    {lastMessage &&
                      !lastMessage.message.startsWith('dailyStatus') && (
                        <Text
                          className="font-rubik mt-1"
                          style={{fontSize: 18, color: colors.primary[200]}}>
                          En Son Mesaj
                        </Text>
                      )}
                    <TouchableOpacity
                      className="py-2 px-3 bg-blue-500 flex items-center justify-center"
                      style={{borderRadius: 17}}
                      onPress={async () => {
                        if (admin && user) {
                          const response = await isRoomExistBySenderAndReceiver(
                            admin.username,
                            user.username,
                          );
                          if (response && response.status === 200) {
                            const roomId = response.data;
                            if (roomId !== 0) {
                              navigation.navigate('Groups', {
                                screen: 'Chat',
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
                                navigation.navigate('Groups', {
                                  screen: 'Chat',
                                  params: {
                                    roomId: nextRoomId,
                                    sender: user?.username,
                                    receiver: admin,
                                    fromNotification: true,
                                    navigatedInApp: true,
                                  },
                                });
                              }
                            }
                          }
                        }
                      }}>
                      <Text
                        className="font-rubik text-md text-center"
                        style={{color: colors.background.secondary}}>
                        Sohbete Git
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {lastMessage &&
                    !lastMessage.message.startsWith('dailyStatus') && (
                      <Text
                        className="font-rubik text-md mt-1"
                        style={{color: colors.text.primary}}>
                        {lastMessage.receiver === user?.username
                          ? user?.fullName + ' : ' + lastMessage.message
                          : 'Siz : ' + lastMessage.message}
                      </Text>
                    )}
                </View>
              )}
              {/* </ScrollView> */}
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
};

export default Home;
