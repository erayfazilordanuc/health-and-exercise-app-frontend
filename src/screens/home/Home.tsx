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
  ImageBackground,
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
  checkGoogleFitInstalled,
  checkHealthConnectInstalled,
  computeHealthScore,
  getSymptoms,
  initializeHealthConnect,
} from '../../lib/health/healthConnectService';
import {getSymptomsByDate} from '../../api/symptoms/symptomsService';
import {BlurView} from '@react-native-community/blur';
import {
  useTodaysProgressOfflineFirst,
  useWeeklyActiveDaysProgressOfflineAware,
} from '../../hooks/progressQueries';
import {useIsFocused} from '@react-navigation/native';
import {getRoomIdByUsers, MSG_KEYS} from '../../hooks/messageQueries';
import {useQueryClient} from '@tanstack/react-query';
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
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const {user} = useUser();
  const [admin, setAdmin] = useState<User>();
  const alertRef = useRef<CustomAlertSingletonHandle>(null);
  const [lastMessage, setLastMessage] = useState<Message | null>();

  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // const todayExerciseProgressQ = useTodaysProgressOfflineFirst({
  //   enabled: !isAdmin,
  // });
  // const todayExerciseProgress = todayExerciseProgressQ.data?.today;

  const [todayExerciseProgress, setTodayExerciseProgress] =
    useState<ExerciseProgressDTO | null>();

  const fetchProgress = async () => {
    if (!user?.groupId) return;

    try {
      if (!admin) {
        const groupAdmin: User = await getGroupAdmin(user.groupId);
        setAdmin(groupAdmin);
      }
    } catch (error) {
      ToastAndroid.show('Bir hata oluştu', ToastAndroid.SHORT);
      console.log(error);
    }
    try {
      const todayExerciseProgress: ExerciseProgressDTO =
        await getTodaysProgress();
      setTodayExerciseProgress(todayExerciseProgress);
    } catch (error) {
      ToastAndroid.show('Bir hata oluştu', ToastAndroid.SHORT);
      console.log(error);
    }
    if (!initialized) setInitialized(true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProgress();
    }, []),
  );

  const fetchLastMessage = async () => {
    if (!user || !admin) return;
    const lastMessageResponse = await getLastMessageBySenderAndReceiver(
      admin.username,
      user.username,
    );
    if (lastMessageResponse && lastMessageResponse.message) {
      setLastMessage(lastMessageResponse);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'ROLE_USER') fetchLastMessage();
    }, [user, admin]),
  );

  const initializeAppContents = async () => {
    if (!user) return;
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
  };

  const calcPercent = (p?: ExerciseProgressDTO | null): number => {
    if (!p || !p.exerciseDTO || !p.exerciseDTO.videos) return 0;
    const total = p.exerciseDTO.videos.reduce(
      (sum, v) => sum + (v.durationSeconds ?? 0),
      0,
    );
    return total === 0
      ? 0
      : Math.round((p.totalProgressDuration / total) * 100);
  };

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

        const roomId = await qc.ensureQueryData({
          queryKey: MSG_KEYS.roomIdByUsers(user.username, admin.username),
          queryFn: async () => {
            const resp = await isRoomExistBySenderAndReceiver(
              user.username,
              admin.username,
            );
            const data = resp?.data ?? resp;
            const id =
              typeof data === 'number'
                ? data
                : typeof data?.roomId === 'number'
                ? data.roomId
                : undefined;

            if (typeof id !== 'number') {
              throw new Error('Geçersiz roomId cevabı');
              return 0;
            }
            return id;
          },
        });

        const finalRoomId =
          roomId !== 0 ? roomId : (await getNextRoomId()).data;

        const message = 'dailyStatus' + sliderValue;
        const newMessage: Message = {
          message,
          sender: user.username,
          receiver: admin.username,
          roomId: finalRoomId,
          createdAt: new Date(),
        };

        const saveResponse = await saveMessage(newMessage);

        const newLastMessage: LocalMessage = {
          message: newMessage as Message,
          savedAt: new Date(),
        };
        AsyncStorage.setItem(
          `lastMessage_${user.username}_${admin.username}`,
          JSON.stringify(newLastMessage),
        );

        const match = message.match(/dailyStatus(\d+)/);
        const score = parseInt(match![1], 10);

        const notiResponse = await sendNotification(
          admin.username,
          `${
            message ? new Date().toLocaleDateString() + '\n' : ''
          }Bugün ruh halimi ${score}/9 olarak değerlendiriyorum.`,
        );

        if (saveResponse.status === 200) {
          AsyncStorage.setItem('dailyStatus', JSON.stringify(newMessage));
          setLastMessage(newLastMessage.message);
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

      if (
        !merged.sleepMinutes &&
        syncedSymptoms &&
        syncedSymptoms.sleepMinutes
      ) {
        merged.sleepMinutes = syncedSymptoms.sleepMinutes;
      }

      return merged;
    }
  };

  const healthConnectReady = async () => {
    const healthConnectInstalled = await checkHealthConnectInstalled();
    if (!healthConnectInstalled) return false;

    const googleFitInstalled = await checkGoogleFitInstalled();
    if (!googleFitInstalled) return false;

    const isHealthConnectReady = await initializeHealthConnect();
    if (!isHealthConnectReady) return false;

    return true;
  };

  // const fetchAndCalculateHealthScore = async () => {
  //   const syncedSymptoms = await getSymptomsByDate(new Date());

  //   const isHCReady = await healthConnectReady();
  //   if (isHCReady) {
  //     const healthConnectSymptoms = await getSymptoms();
  //     const combinedSymptoms = await combineAndSetSymptoms(
  //       healthConnectSymptoms!,
  //       syncedSymptoms,
  //     );
  //     if (combinedSymptoms) {
  //       setHealthScore(prev =>
  //         computeHealthScore({
  //           heartRate: combinedSymptoms.pulse,
  //           steps: combinedSymptoms.steps,
  //           totalCalories: combinedSymptoms.totalCaloriesBurned ?? undefined,
  //           activeCalories: combinedSymptoms.activeCaloriesBurned ?? undefined,
  //           sleepMinutes: combinedSymptoms.sleepMinutes ?? undefined,
  //         }),
  //       );
  //       console.log('combineeeeeeeeeed score', combinedSymptoms);
  //     }
  //   } else {
  //     if (syncedSymptoms) {
  //       setHealthScore(prev =>
  //         computeHealthScore({
  //           heartRate: syncedSymptoms.pulse,
  //           steps: syncedSymptoms.steps,
  //           totalCalories: syncedSymptoms.totalCaloriesBurned ?? undefined,
  //           activeCalories: syncedSymptoms.activeCaloriesBurned ?? undefined,
  //           sleepMinutes: syncedSymptoms.sleepMinutes ?? undefined,
  //         }),
  //       );
  //     }
  //   }
  // };

  return (
    <>
      <LinearGradient
        colors={colors.gradient}
        locations={[0.15, 0.25, 0.7, 1]}
        start={{x: 0.1, y: 0}}
        end={{x: 0.8, y: 1}}
        className="absolute top-0 left-0 right-0 bottom-0"
      />
      {/* <LinearGradient
        colors={[
          '#CC5A27', // sıcak başlangıçFF4E00
          '#D44C32', // ara turuncu-kırmızı
          '#D72638', // kırmızı vurgu
          '#7A2626', // koyu bordo
          '#2A2424', // koyu gri-kahve
          '#141414', // siyaha yaklaşım
          '#000000',
        ]}
        locations={[0, 0.12, 0.25, 0.5, 0.72, 0.9, 1]}
        start={{x: 0.05, y: 0}}
        end={{x: 0.9, y: 1}}
        className="absolute inset-0"
      /> */}
      {/* <ImageBackground
        source={require('../../assets/images/blur_view_2.png')}
        resizeMode="cover"
        className="absolute inset-0"
      />
      <BlurView
        blurType="dark"
        blurAmount={50}
        reducedTransparencyFallbackColor="black"
        pointerEvents="none"
        style={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0}}
      /> */}
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

          {user && user.role === 'ROLE_USER' && user.groupId && (
            <>
              {/* <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                className="flex-1 mt-1 mb-1 pb-2 rounded-2xl"> */}
              <View className="flex-1 flex flex-row items-stretch justify-between mt-1">
                <View
                  className="flex-1 flex flex-col px-5 py-3"
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
                          className="text-center font-rubik text-xl"
                          style={{color: colors.text.primary}}>
                          Bugünün Egzersizi
                        </Text>

                        {initialized ? (
                          <View className="flex flex-row justify-center items-center mt-4 mb-1">
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
                            {todayExerciseProgress &&
                              todayExerciseProgress.totalProgressDuration &&
                              todayExerciseProgress.totalProgressDuration >
                                0 && (
                                <View className="flex justify-center items-center ml-8">
                                  <AnimatedCircularProgress
                                    size={80}
                                    width={5}
                                    rotation={0}
                                    lineCap="round"
                                    fill={
                                      calcPercent(todayExerciseProgress) ?? 0
                                    }
                                    tintColor={colors.primary[300]}
                                    onAnimationComplete={() =>
                                      console.log('onAnimationComplete')
                                    }
                                    backgroundColor={
                                      colors.background.secondary
                                    }>
                                    {() => (
                                      <Text
                                        className="text-xl font-rubik"
                                        style={{
                                          color: colors.text.primary,
                                        }}>
                                        %
                                        {calcPercent(todayExerciseProgress) ??
                                          0}
                                      </Text>
                                    )}
                                  </AnimatedCircularProgress>
                                </View>
                              )}
                          </View>
                        ) : (
                          <ActivityIndicator
                            className="self-center my-9"
                            size="large"
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
                    {lastMessage && (
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
                          const roomId = await qc.ensureQueryData({
                            queryKey: MSG_KEYS.roomIdByUsers(
                              user.username,
                              admin.username,
                            ),
                            queryFn: () =>
                              getRoomIdByUsers(user.username, admin.username),
                          });

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
                            const nextRoomId =
                              roomId !== 0
                                ? roomId
                                : (await getNextRoomId()).data;
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
                      }}>
                      <Text
                        className="font-rubik text-md text-center"
                        style={{
                          color: colors.background.secondary,
                          marginTop: 1,
                        }}>
                        Sohbete Git
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {lastMessage && (
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
