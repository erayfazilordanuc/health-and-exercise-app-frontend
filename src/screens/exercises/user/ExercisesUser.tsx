import {
  View,
  Text,
  TextInput,
  Image,
  BackHandler,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ToastAndroid,
  ActivityIndicator,
  ImageBackground,
  Touchable,
} from 'react-native';
import React, {
  act,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../themes/ThemeProvider';
import icons from '../../../constants/icons';
import {
  useNavigation,
  useFocusEffect,
  useIsFocused,
} from '@react-navigation/native';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {Calendar, WeekCalendar} from 'react-native-calendars';
import dayjs from 'dayjs';
import {
  getTodaysProgress,
  getWeeklyActiveDaysProgress,
  progressExerciseVideo,
} from '../../../api/exercise/progressService';
import CustomWeeklyProgressCalendar from '../../../components/CustomWeeklyProgressCalendar';
import {
  calcPercent,
  getExerciseById,
  getTodayExerciseByPosition,
} from '../../../api/exercise/exerciseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUser} from '../../../contexts/UserContext';
import {jsonGetAll} from '@react-native-firebase/app';
import {BlurView} from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import {ExercisePosition} from '../../../types/enums';
import {
  useTodaysProgressOfflineFirst,
  useWeeklyActiveDaysProgressOfflineAware,
} from '../../../hooks/progressQueries';
import {isEqual} from 'lodash';
import {Theme, themes} from '../../../themes/themes';
import {
  useExerciseSchedule,
  useUpsertExerciseSchedule,
} from '../../../hooks/exerciseQueries';
import {useGroupById} from '../../../hooks/groupQueries';
import {Dumbbell, Armchair} from 'lucide-react-native';
import {isTodayExerciseDay} from '../../../utils/dates';
import {getDbUser} from '../../../api/user/userService';
import {useTranslation} from 'react-i18next';

const {height, width} = Dimensions.get('window');

const ExercisesUser = () => {
  const {t} = useTranslation(['exercise', 'common']);
  const {colors, theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const scrollViewHeight = height / 8;
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [todayInitialized, setTodayInitialized] = useState(false);
  const {user, setUser} = useUser();
  // const {
  //   data: group,
  //   isLoading,
  //   error,
  // } = useGroupById(user?.groupId!, {
  //   enabled: !!user?.groupId,
  // });
  const groupId: number = Number.isFinite(user?.groupId as number)
    ? (user?.groupId as number)
    : -1;

  const {
    data: group,
    isLoading,
    error,
    refetch,
  } = useGroupById(groupId, {enabled: Number.isFinite(groupId) && groupId > 0});
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  console.log(
    user && user.groupId && group && group.exerciseEnabled,
    user,
    user?.groupId,
    group,
    group?.exerciseEnabled,
  );
  const {data: activeDays, isLoading: isScheduleLoading} =
    useExerciseSchedule();
  const [updatedActiveDays, setUpdatedActiveDays] = useState(activeDays);
  const [backupActiveDays, setBackupActiveDays] = useState(activeDays);

  useEffect(() => {
    if (activeDays && activeDays.length) {
      setUpdatedActiveDays(activeDays);
      setBackupActiveDays(activeDays);
    }
  }, [activeDays]);

  useEffect(() => {
    if (user?.groupId && !activeDays) {
      setShowScheduleModal(true);
    }
  }, [user, activeDays]);

  const upsertMutation = useUpsertExerciseSchedule();

  const [todayExerciseProgress, setTodayExerciseProgress] =
    useState<ExerciseProgressDTO | null>(null);
  const [weeklyExerciseProgress, setWeeklyExersiseProgress] = useState<
    ExerciseProgressDTO[]
  >([]);
  const [todayPercent, setTodayPercent] = useState(
    calcPercent(todayExerciseProgress) ?? 0,
  );

  useEffect(() => {
    if (todayExerciseProgress)
      setTodayPercent(calcPercent(todayExerciseProgress));
  }, [todayExerciseProgress]);

  const triedOnThisFocusRef = useRef(false);

  // getUser: user'a bağımlı OLMASIN; setUser/navigation yeterli
  const getUser = useCallback(async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected || !user) {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUser(user);
      }
    }

    const dbUser = await getDbUser();
    if (!dbUser) return;

    // sadece değişiklik varsa güncelle
    if (
      !user ||
      user.id !== dbUser.id ||
      user.groupId !== dbUser.groupId ||
      user.role !== dbUser.role
    ) {
      setUser(dbUser); // doğrudan obje ver
    }

    await AsyncStorage.setItem('user', JSON.stringify(dbUser));
  }, [setUser, navigation, user]); // burada user kalabilir; istersen ref'le de okuyabilirsin

  useFocusEffect(
    useCallback(() => {
      // her focus'ta sıfır başla
      triedOnThisFocusRef.current = false;

      if (!triedOnThisFocusRef.current) {
        triedOnThisFocusRef.current = true;

        // Koşullar uygunsa sadece 1 kez çalıştır
        if (user && user.role === 'ROLE_USER' && !user.groupId) {
          getUser();
        }
      }

      // blur olduğunda reset; böylece sonraki focus'ta yine 1 kez çalışır
      return () => {
        triedOnThisFocusRef.current = false;
      };
    }, [getUser, user?.id, user?.role, user?.groupId]),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) Localden oku
        const cached = await AsyncStorage.getItem('user');
        if (mounted && cached) setUser(JSON.parse(cached));

        // 2) Online ise DB’den tazele
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          const dbUser = await getDbUser().catch(() => null);
          if (mounted && dbUser) {
            setUser(dbUser);
            await AsyncStorage.setItem('user', JSON.stringify(dbUser));
          }
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      if (updatedActiveDays && isTodayExerciseDay(updatedActiveDays)) {
        const todayExerciseProgressRes: ExerciseProgressDTO =
          await getTodaysProgress();
        // if (!isEqual(todayExerciseProgressRes, todayExerciseProgress))
        setTodayExerciseProgress(todayExerciseProgressRes);
      }
      if (!todayInitialized) setTodayInitialized(true);

      const weeklyExerciseProgressRes: ExerciseProgressDTO[] =
        await getWeeklyActiveDaysProgress();

      // if (!isEqual(weeklyExerciseProgressRes, weeklyExerciseProgress))
      setWeeklyExersiseProgress(weeklyExerciseProgressRes);
      if (!initialized) setInitialized(true);
    } catch (error) {
      console.log(error);
      ToastAndroid.show(t('exercise:toasts.progressFetch'), ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused && user?.role === 'ROLE_USER' && user?.groupId) {
      fetchProgress();
    }
  }, [isFocused, updatedActiveDays, user?.groupId, user?.role]);

  const onStartExercise = async (position: ExercisePosition) => {
    // const todayExercise: ExerciseDTO = await getTodayExerciseByPosition(
    //   position,
    // );
    const todayExerciseStanding: ExerciseDTO = {
      id: 47,
      name: 'Ayakta Egzersiz',
      description: 'Ayakta günlük egzersiz',
      point: 47,
      adminId: 18,
      createdAt: new Date('2025-07-30T17:04:32.557+03:00'),
      updatedAt: new Date('2025-08-13T11:05:28.058+03:00'),
      videos: [
        {
          id: 34,
          exerciseId: 47,
          name: 'Isınma',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/47_1000025365.mp4',
          durationSeconds: 486,
          createdAt: new Date('2025-08-13T11:52:09.406+03:00'),
        },
        {
          id: 35,
          exerciseId: 47,
          name: 'Aerobik',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/47_1000025366.mp4',
          durationSeconds: 431,
          createdAt: new Date('2025-08-13T12:42:16.648+03:00'),
        },
        {
          id: 41,
          exerciseId: 47,
          name: 'Güçlendirme',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/47_1000025367.mp4',
          durationSeconds: 378,
          createdAt: new Date('2025-08-25T07:27:17.960+03:00'),
        },
        {
          id: 42,
          exerciseId: 47,
          name: 'Koordinasyon',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/47_1000025370.mp4',
          durationSeconds: 353,
          createdAt: new Date('2025-08-25T07:31:12.591+03:00'),
        },
        {
          id: 43,
          exerciseId: 47,
          name: 'Soğuma',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/47_1000025368.mp4',
          durationSeconds: 362,
          createdAt: new Date('2025-08-25T07:33:18.919+03:00'),
        },
      ],
    };
    const todayExerciseSeated = {
      id: 48,
      name: 'Oturarak Egzersiz',
      description: 'Oturarak günlük egzersiz',
      point: 1,
      adminId: 18,
      createdAt: new Date('2025-07-30T17:21:23.303+03:00'),
      updatedAt: new Date('2025-07-30T17:21:23.303+03:00'),
      videos: [
        {
          id: 36,
          exerciseId: 48,
          name: 'Isınma',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/48_1000025360.mp4',
          durationSeconds: 359,
          createdAt: new Date('2025-08-25T07:12:17.964+03:00'),
        },
        {
          id: 37,
          exerciseId: 48,
          name: 'Aerobik',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/48_1000025361.mp4',
          durationSeconds: 428,
          createdAt: new Date('2025-08-25T07:15:35.027+03:00'),
        },
        {
          id: 38,
          exerciseId: 48,
          name: 'Güçlendirme',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/48_1000025364.mp4',
          durationSeconds: 218,
          createdAt: new Date('2025-08-25T07:17:44.315+03:00'),
        },
        {
          id: 39,
          exerciseId: 48,
          name: 'Koordinasyon',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/48_1000025362.mp4',
          durationSeconds: 277,
          createdAt: new Date('2025-08-25T07:19:11.674+03:00'),
        },
        {
          id: 40,
          exerciseId: 48,
          name: 'Soğuma',
          videoUrl:
            'https://exercise-health-application.s3.eu-central-1.amazonaws.com/videos/48_1000025363.mp4',
          durationSeconds: 354,
          createdAt: new Date('2025-08-25T07:22:07.205+03:00'),
        },
      ],
    };

    const todayExercise =
      position === ExercisePosition.STANDING
        ? todayExerciseStanding
        : todayExerciseSeated;

    let todayExerciseProgressNavPayload: ExerciseProgressDTO = {
      userId: user!.id!,
      exerciseDTO: todayExercise,
      videoProgress: [],
      totalProgressDuration: 0,
    };

    if (todayExercise) {
      navigation.navigate('ExerciseDetail', {
        progress: todayExerciseProgressNavPayload,
        totalDurationSec: todayExercise.videos.reduce(
          (sum, v) => sum + (v.durationSeconds ?? 0),
          0,
        ),
        fromMain: true,
      });
      setShowModal(false);
    }
  };

  const onContinueExercise = async () => {
    if (
      todayExerciseProgress?.totalProgressDuration &&
      todayExerciseProgress?.totalProgressDuration > 0 &&
      todayExerciseProgress?.exerciseDTO
    ) {
      navigation.navigate('ExerciseDetail', {
        progress: todayExerciseProgress,
        totalDurationSec:
          todayExerciseProgress.exerciseDTO &&
          todayExerciseProgress.exerciseDTO.videos &&
          todayExerciseProgress.exerciseDTO.videos.reduce(
            (sum, v) => sum + (v.durationSeconds ?? 0),
            0,
          ),
        fromMain: true,
      });
      setShowModal(false);
    }
  };

  // const makeTabBarStyle = (theme: Theme, width: number) => ({
  //   // marginHorizontal: width / 24,
  //   // position: 'absolute',
  //   // bottom: 15,
  //   // left: 15,
  //   // right: 15,
  //   // height: 56,
  //   // borderRadius: 40,
  //   // borderWidth: 1,
  //   // borderTopWidth: 0.9,
  //   // borderColor:
  //   //   theme.colors.isLight ? 'rgba(0,0,0,0.09)' : 'rgba(150,150,150,0.09)',
  //   // backgroundColor:
  //   //   theme.colors.isLight ? 'rgba(255,255,255,0.95)' : 'rgba(25,25,25,0.95)',
  //   // elevation: 0,
  //   // display: 'flex',
  //   minHeight: 56 + Math.max(insets.bottom, 0),
  //   height: undefined,
  //   paddingTop: 6,
  //   paddingBottom: Math.max(insets.bottom, 8),

  //   // mevcut görünümü koru
  //   marginHorizontal: width / 24,
  //   position: 'absolute',
  //   bottom: 15,
  //   left: 15,
  //   right: 15,
  //   borderRadius: 40,
  //   borderWidth: 1,
  //   borderTopWidth: 0.9,
  //   borderColor:
  //     theme.colors.isLight ? 'rgba(0,0,0,0.09)' : 'rgba(150,150,150,0.09)',
  //   backgroundColor:
  //     theme.colors.isLight ? 'rgba(255,255,255,0.95)' : 'rgba(25,25,25,0.95)',
  //   elevation: 0,
  // });

  const WEEK = [
    {num: 1, label: t('exercise:scheduleModal.weekShort.mon')},
    {num: 2, label: t('exercise:scheduleModal.weekShort.tue')},
    {num: 3, label: t('exercise:scheduleModal.weekShort.wed')},
    {num: 4, label: t('exercise:scheduleModal.weekShort.thu')},
    {num: 5, label: t('exercise:scheduleModal.weekShort.fri')},
    {num: 6, label: t('exercise:scheduleModal.weekShort.sat')},
    {num: 7, label: t('exercise:scheduleModal.weekShort.sun')},
  ];

  const ACTIVE_COLOR = '#0091ff';
  const BORDER = '#e6e8ec';
  const TEXT = '#111827';

  const toggleDay = (num: number) => {
    setUpdatedActiveDays(prev => {
      const base = prev ?? [];
      return base.includes(num)
        ? base.filter(x => x !== num)
        : [...base, num].sort((a, b) => a - b);
    });
  };

  // useEffect(() => {
  //   if (!isFocused) return;
  //   const parent = navigation.getParent(); // veya getParent('exercise:RootTabs') eğer id verdiyseniz
  //   parent?.setOptions({
  //     tabBarStyle: makeTabBarStyle(theme, width),
  //   });
  // }, [isFocused, theme.name, width, navigation]);

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
      return () => backHandler.remove();
    }, []),
  );

  const isScheduleModalVisible = () => {
    if (!initialized) return false;
    if (user && !user.groupId) return false;
    if (!activeDays && !isScheduleLoading) return true;
    if (activeDays && activeDays.length < 3) return true;
    return showScheduleModal;
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={colors.gradient}
        locations={[0.15, 0.25, 0.7, 1]}
        start={{x: 0.1, y: 0}}
        end={{x: 0.8, y: 1}}
        className="absolute top-0 left-0 right-0 bottom-0"
      />
      <View
        style={{
          backgroundColor: 'transparent', // colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: insets.top * 1.3,
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: theme.colors.isLight ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          {user && user.role === 'ROLE_USER'
            ? t('exercise:headers.mainUser')
            : t('exercise:headers.mainAdmin')}
        </Text>
      </View>
      {user && user.groupId && group && group.exerciseEnabled ? (
        <View
          className="h-full pb-32 px-3 mt-3"
          style={{
            backgroundColor: 'transparent', // colors.background.secondary,
          }}>
          <View
            className="px-5 pt-2 mb-3"
            style={{
              borderRadius: 17,
              backgroundColor: colors.background.primary,
            }}>
            {/* TO DO scheduleden gelmeli */}
            {updatedActiveDays && isTodayExerciseDay(updatedActiveDays) ? (
              <>
                <>
                  <Text
                    className="font-rubik text-center"
                    style={{fontSize: 17, color: colors.text.primary}}>
                    {t('exercise:today.title')}
                  </Text>

                  {todayInitialized ? (
                    <View className="flex flex-row justify-center items-center mt-3 mb-3">
                      {!(
                        todayExerciseProgress &&
                        todayExerciseProgress.totalProgressDuration
                      ) ? (
                        <TouchableOpacity
                          className="flex flex-row justify-center items-center py-3 pl-3"
                          style={{
                            borderRadius: 17,
                            backgroundColor: colors.primary[200],
                          }}
                          onPress={() => {
                            setShowModal(true);
                          }}>
                          <Text
                            className="text-xl font-rubik"
                            style={{
                              color: colors.background.primary,
                            }}>
                            {t('exercise:today.start')}
                          </Text>
                          <Image
                            source={icons.gymnastic_1}
                            className="size-16"
                            tintColor={colors.background.primary}
                          />
                        </TouchableOpacity>
                      ) : todayExerciseProgress.exerciseDTO &&
                        todayExerciseProgress.exerciseDTO.videos &&
                        calcPercent(todayExerciseProgress) === 100 ? (
                        <TouchableOpacity
                          className="flex flex-row justify-center items-center ml-1 py-3 pl-3"
                          style={{
                            borderRadius: 17,
                            backgroundColor: '#3BC476',
                          }}
                          onPress={onContinueExercise}>
                          <Text
                            className="text-xl font-rubik"
                            style={{
                              color: colors.background.third,
                            }}>
                            {t('exercise:today.completed')}
                          </Text>
                          <Image
                            source={icons.gymnastic_1}
                            className="size-16"
                            tintColor={colors.background.third}
                          />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          className="flex flex-row justify-center items-center ml-1 py-3 pl-3 px-1"
                          style={{
                            borderRadius: 17,
                            backgroundColor: colors.isLight
                              ? '#FAA020'
                              : '#FF9800',
                          }}
                          onPress={onContinueExercise}>
                          <Text
                            className="text-xl font-rubik mx-2"
                            style={{
                              color: colors.isLight ? '#FFECD1' : '#473E31',
                            }}>
                            {t('exercise:today.continue')}
                          </Text>
                          <Image
                            source={icons.gymnastic_1}
                            className="size-16"
                            tintColor={colors.isLight ? '#FFECD1' : '#473E31'}
                          />
                          {/* '#FFAA33' */}
                        </TouchableOpacity>
                      )}
                      {todayExerciseProgress &&
                        todayExerciseProgress.totalProgressDuration &&
                        todayExerciseProgress.totalProgressDuration > 0 && (
                          <View className="flex justify-center items-center ml-10">
                            <AnimatedCircularProgress
                              size={100}
                              width={6}
                              rotation={0}
                              lineCap="round"
                              fill={todayPercent}
                              tintColor={colors.primary[300]}
                              onAnimationComplete={() =>
                                console.log('onAnimationComplete')
                              }
                              backgroundColor={colors.background.secondary}>
                              {() => (
                                <Text
                                  className="font-rubik"
                                  style={{
                                    fontSize: 22,
                                    color: colors.text.primary,
                                  }}>
                                  {t('common:locale') === 'tr-TR'
                                    ? `%${todayPercent}`
                                    : `${todayPercent}%`}
                                </Text>
                              )}
                            </AnimatedCircularProgress>
                          </View>
                        )}
                    </View>
                  ) : (
                    <View
                      className="flex flex-row justify-center items-center pt-10 pb-12"
                      style={{backgroundColor: 'transparent'}}>
                      <ActivityIndicator
                        size="small"
                        color={colors.primary[300]}
                      />
                    </View>
                  )}
                </>
              </>
            ) : (
              <>
                <Text
                  className="font-rubik text-center"
                  style={{fontSize: 16, color: colors.text.primary}}>
                  {t('exercise:today.noPlan')}
                </Text>
                <Text
                  className="font-rubik mt-1 mb-2 text-center"
                  style={{fontSize: 18, color: colors.text.primary}}>
                  {t('exercise:today.restWell')}
                </Text>
              </>
            )}
          </View>

          <View
            className="flex flex-col px-3 py-3 mb-3"
            style={{
              borderRadius: 17,
              backgroundColor: colors.background.primary,
            }}>
            <View className="flex flex-row items-center justify-between">
              <Text
                className="font-rubik mb-2 ml-2"
                style={{fontSize: 19, color: colors.text.primary}}>
                {t('exercise:calendar.title')}
              </Text>
              <Text
                className="font-rubik mb-1 mr-1 rounded-xl"
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 9,
                  fontSize: 14,
                  color: colors.text.primary,
                  backgroundColor: colors.background.secondary,
                }}>
                {new Date().toLocaleDateString(t('common:locale'), {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {weeklyExerciseProgress && (
              <CustomWeeklyProgressCalendar
                todayPercent={calcPercent(todayExerciseProgress)}
                weeklyPercents={weeklyExerciseProgress.map(calcPercent)}
                activeDays={updatedActiveDays ?? []}
              />
            )}
            <View className="flex flex-row items-center justify-between mt-3">
              <View className="flex flex-row items-center justify-between ml-2">
                <View className="flex-col items-start space-x-2 mr-3">
                  <View className="flex flex-row items-center space-x-2">
                    <View
                      className="p-2 rounded-full"
                      style={{backgroundColor: '#14E077'}}
                    />
                    <Text
                      className="text-xs font-rubik ml-1"
                      style={{color: colors.text.primary}}>
                      {t('exercise:calendar.legend.completed')}
                    </Text>
                  </View>
                  <View className="flex-row items-center space-x-2 mt-2">
                    <View
                      className="p-2 rounded-full"
                      style={{backgroundColor: '#fd5353'}}
                    />
                    <Text
                      className="text-xs font-rubik ml-1"
                      style={{color: colors.text.primary}}>
                      {t('exercise:calendar.legend.notCompleted')}
                    </Text>
                  </View>
                </View>
                <View className="flex-col items-start space-x-2">
                  <View className="flex-row items-center space-x-2">
                    <View
                      className="p-2 rounded-full"
                      style={{
                        backgroundColor: '#4f9cff' /*'#4f9cff' */,
                      }}
                    />
                    <Text
                      className="text-xs font-rubik ml-1"
                      style={{color: colors.text.primary}}>
                      {t('exercise:calendar.legend.scheduled')}
                    </Text>
                  </View>
                  <View className="flex-row items-center space-x-2 mt-2">
                    <View
                      className="p-2 rounded-full"
                      style={{backgroundColor: '#B9E2FE'}}
                    />
                    <Text
                      className="text-xs font-rubik ml-1"
                      style={{color: colors.text.primary}}>
                      {t('exercise:calendar.legend.today')}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                className="self-end py-2 px-3 mb-1"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 12,
                }}
                onPress={() => setShowScheduleModal(true)}>
                <Text
                  className="text-sm font-rubik"
                  style={{color: colors.text.secondary}}>
                  {t('exercise:calendar.selectDaysButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View
          className="rounded-2xl px-1 pt-2 mx-4 mt-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-center"
            style={{fontSize: 18, color: colors.text.primary}}>
            {t('exercise:featureDisabled.title')}
          </Text>
          <Text
            className="font-rubik mt-1 mb-2 text-center"
            style={{fontSize: 14, color: colors.text.primary}}>
            {t('exercise:featureDisabled.subtitle')}
          </Text>
        </View>
      )}
      {isScheduleModalVisible() && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20, // ✅ kenarlarda margin
          }}>
          <View
            style={{
              maxWidth: (width * 9) / 10, // ✅ tabletlerde taşmayı önler
              borderRadius: 17,
              backgroundColor: colors.background.primary,
              paddingHorizontal: 20,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              className="font-rubik-semibold text-2xl mb-3 text-center"
              style={{color: colors.text.primary}}>
              {t('exercise:scheduleModal.title')}
            </Text>
            {!isScheduleLoading && !activeDays && (
              <>
                <Text
                  className="font-rubik-semibold text-lg mb-2 text-center"
                  style={{
                    color: colors.isLight ? colors.text.third : '#C9C9C9',
                  }}>
                  {t('exercise:scheduleModal.subtitleMin')}
                </Text>
                <Text
                  className="font-rubik text-md mb-3 text-center"
                  style={{
                    color: colors.isLight ? colors.text.third : '#C9C9C9',
                  }}>
                  {t('exercise:scheduleModal.subtitleHint')}
                </Text>
              </>
            )}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                backgroundColor: colors.background.secondary,
                paddingVertical: 10,
                paddingHorizontal: 7,
                borderRadius: 15,
              }}>
              {WEEK.map(day => {
                const isActive =
                  updatedActiveDays && updatedActiveDays.includes(day.num);
                return (
                  <TouchableOpacity
                    key={day.num}
                    onPress={() => toggleDay(day.num)}
                    // android_ripple={{color: '#e0f0ff', borderless: false}}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isActive ? ACTIVE_COLOR : '#fff',
                      borderWidth: 1,
                      borderColor: isActive ? ACTIVE_COLOR : BORDER,
                      marginHorizontal: 4,
                    }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isActive ? '#fff' : TEXT,
                      }}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* <Text style={{marginTop: 10, fontSize: 12, color: '#6b7280'}}>
              Seçili:{' '}
              {updatedActiveDays && updatedActiveDays.length ? updatedActiveDays.join(', ') : 'Yok'}
            </Text> */}
            <View className="flex flex-row items-center justify-center">
              <TouchableOpacity
                className="py-2 px-4 mt-4 border mr-2"
                style={{
                  borderRadius: 13,
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.primary[125],
                }}
                onPress={async () => {
                  if (!activeDays && !isScheduleLoading) {
                    ToastAndroid.show(
                      t('exercise:toasts.pickScheduleFirst'),
                      ToastAndroid.SHORT,
                    );
                    return;
                  }
                  setUpdatedActiveDays(backupActiveDays);
                  setShowScheduleModal(false);
                }}>
                <Text
                  className="font-rubik text-md text-center"
                  style={{color: colors.text.secondary}}>
                  {t('exercise:scheduleModal.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-2 px-4 mt-4 border ml-2"
                style={{
                  borderRadius: 13,
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.primary[125],
                }}
                onPress={async () => {
                  if (updatedActiveDays && updatedActiveDays.length < 3)
                    ToastAndroid.show(
                      t('exercise:toasts.minThreeDays'),
                      ToastAndroid.SHORT,
                    );
                  else {
                    if (updatedActiveDays) {
                      const net = await NetInfo.fetch();
                      const isOnline = !!net.isConnected;
                      if (isOnline) {
                        upsertMutation.mutate(updatedActiveDays);
                        setBackupActiveDays(updatedActiveDays);
                        setShowScheduleModal(false);
                        return;
                      } else
                        ToastAndroid.show(
                          t('exercise:toasts.networkError'),
                          ToastAndroid.SHORT,
                        );
                    } else
                      ToastAndroid.show(
                        t('exercise:toasts.tryAgainLater'),
                        ToastAndroid.SHORT,
                      );
                    setUpdatedActiveDays(backupActiveDays);
                  }
                }}>
                <Text
                  className="font-rubik text-md text-center"
                  style={{color: colors.text.secondary}}>
                  {t('exercise:scheduleModal.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {showModal && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20, // ✅ kenarlarda margin
          }}>
          <View
            className="bg-white rounded-2xl p-6 items-center"
            style={{backgroundColor: colors.background.primary}}>
            <Text
              className="text-xl font-rubik-medium mb-3"
              style={{color: colors.text.primary}}>
              {t('exercise:typeModal.title')}
            </Text>
            <Text
              className={`font-rubik text-center ${
                theme.colors.isLight ? 'text-gray-500' : 'text-gray-400'
              } mb-6`}>
              {t('exercise:typeModal.description')}
            </Text>

            <View className="flex-row justify-between w-full">
              {/* Ayakta */}
              <TouchableOpacity
                onPress={() => onStartExercise(ExercisePosition.STANDING)}
                className="flex-1 rounded-2xl p-5 mx-2 items-center"
                style={{backgroundColor: colors.background.third}}>
                {/*bg-blue-100 */}
                <Dumbbell size={40} color={colors.primary[200]} />
                {/*color="#3B82F6"*/}
                <Text
                  className="mt-3 font-rubik-semibold text-lg"
                  style={{color: colors.primary[200]}}>
                  {/*text-blue-600 */}
                  {t('exercise:typeModal.standing')}
                </Text>
              </TouchableOpacity>

              {/* Oturarak */}
              <TouchableOpacity
                onPress={() => onStartExercise(ExercisePosition.SEATED)}
                className="flex-1 rounded-2xl p-5 mx-2 items-center"
                style={{backgroundColor: colors.background.third}}>
                {/*bg-blue-100 */}
                <Armchair size={40} color={colors.primary[200]} />
                {/*color="#3B82F6"*/}
                <Text
                  className="mt-3 font-rubik-semibold text-lg"
                  style={{color: colors.primary[200]}}>
                  {/*text-blue-600 */}
                  {t('exercise:typeModal.seated')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Geri Dön */}
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="mt-6 px-5 rounded-xl"
              style={{
                paddingVertical: 10,
                backgroundColor: theme.colors.isLight ? '#EDEDED' : '#303030',
              }}>
              <Text
                className={`${
                  theme.colors.isLight ? 'text-gray-600' : 'text-gray-400'
                } font-rubik`}>
                {t('exercise:typeModal.back')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ExercisesUser;
