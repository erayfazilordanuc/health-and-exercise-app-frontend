import {
  View,
  Text,
  BackHandler,
  Touchable,
  TouchableOpacity,
  FlatList,
  Pressable,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import React, {
  act,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useTheme} from '../../../themes/ThemeProvider';
import {getUser, getUserById} from '../../../api/user/userService';
import {
  getGroupAdmin,
  getGroupById,
  getGroupSize,
} from '../../../api/group/groupService';
import {setGestureState} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import icons from '../../../constants/icons';
import ProgressBar from '../../../components/ProgressBar';
import {
  getLastMessageBySenderAndReceiver,
  getNextRoomId,
  isRoomExistBySenderAndReceiver,
} from '../../../api/message/messageService';
import {useUser} from '../../../contexts/UserContext';
import CustomWeeklyProgressCalendar from '../../../components/CustomWeeklyProgressCalendar';
import {getWeeklyActiveDaysProgressByUserId} from '../../../api/exercise/progressService';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {isAuthRequiredError} from '../../../api/errors/errors';
import {
  useAdminDoneStepGoals,
  useAdminSymptomsByUserIdAndDate,
  useAdminWeeklyStepGoal,
  useAdminWeeklySteps,
} from '../../../hooks/symptomsQueries';
import {
  useExerciseProgressByUserIdAndDate,
  useWeeklyActiveDaysProgressByUserId,
} from '../../../hooks/progressQueries';
import {useUserById} from '../../../hooks/userQueries';
import {getRoomIdByUsers, MSG_KEYS} from '../../../hooks/messageQueries';
import {useQueryClient} from '@tanstack/react-query';
import DatePicker from 'react-native-date-picker';
import NetInfo from '@react-native-community/netinfo';
import {useUserSessions} from '../../../hooks/sessionQueries';
import {subDays} from 'date-fns';
import {SessionList} from '../../../components/SessionList';
import WeeklyStrip from '../../../components/WeeklyStrip';
import {
  scheduleQueryKey,
  useExerciseSchedule,
  useExerciseScheduleAdmin,
} from '../../../hooks/exerciseQueries';
import {parseTheme} from '../../../themes/themes';
import ColorCircle from '../../../components/ColorCircle';
import {calcPercent} from '../../../api/exercise/exerciseService';
import {useGroupById} from '../../../hooks/groupQueries';
import {AvatarKey, AVATARS} from '../../../constants/avatars';
import {useTranslation} from 'react-i18next'; // ⬅️ eklendi
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {color} from 'react-native-elements/dist/helpers';
import {isTodayLocal} from '../../../utils/dates';

const Member = () => {
  type MemberRouteProp = RouteProp<GroupsStackParamList, 'Member'>;
  const {params} = useRoute<MemberRouteProp>();
  const {memberId, fromNotification} = params;
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const {colors, theme} = useTheme();
  const {t} = useTranslation('member');
  const {t: c} = useTranslation('common');
  const insets = useSafeAreaInsets();
  const [allLoading, setAllLoading] = useState(true);
  const {user: admin} = useUser();
  const {data: member, isLoading, error} = useUserById(memberId);
  const [showDetail, setShowDetail] = useState(false);
  const {
    data: group,
    isLoading: isGroupLoading,
    error: groupError,
    refetch,
  } = useGroupById(member?.groupId, {
    enabled:
      !!member?.groupId &&
      Number.isFinite(member?.groupId) &&
      member.groupId > 0,
  });
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>();
  const [accessAuthorized, setAccessAuthorized] = useState(true);

  const {
    data: activeDays,
    isLoading: isScheduleLoading,
    error: scheduleError,
  } = useExerciseScheduleAdmin(memberId, {enabled: !!memberId});
  console.log(activeDays);

  const tabBarHeight = useBottomTabBarHeight();
  const scrollRef = useRef<ScrollView>(null);
  const [symptomsSectionY, setSymptomsSectionY] = useState(0);

  const prevSymptomsLoadingRef = useRef(false);

  function scrollToSymptoms() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, symptomsSectionY - 12),
        animated: true,
      });
    });
  }

  const today = new Date(new Date().setHours(12, 0, 0, 0));
  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - 84);
    return d;
  }, []);
  const [selectedDate, setSelectedDate] = useState(today);

  const day = (d: Date) => d.toISOString().slice(0, 10);

  const toDay = React.useMemo(() => day(new Date()), []);
  const fromDay = React.useMemo(() => day(subDays(new Date(), 7)), []);

  console.log(today.toString(), toDay.toString(), fromDay.toString());

  const {
    data: sessions,
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useUserSessions(memberId, fromDay, toDay, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: symptoms,
    isLoading: isSymptomsLoading,
    isError: isSymptomsError,
    error: symptomsError,
    refetch: refetchSymptoms,
    isFetching,
  } = useAdminSymptomsByUserIdAndDate(memberId, selectedDate);

  const [isAllInitialized, setIsAllInitialized] = useState(false);

  const {
    data: progress,
    isLoading: isProgressLoading,
    isError: isProgressError,
    error: progressError,
    refetch: refetchProgress,
  } = useExerciseProgressByUserIdAndDate(memberId, selectedDate);

  useEffect(() => {
    setAllLoading(isSessionsLoading || isSymptomsLoading || isProgressLoading);
    if (!isAllInitialized)
      setIsAllInitialized(
        !isSessionsLoading && !isSymptomsLoading && !isProgressLoading,
      );
  }, [isSessionsLoading, isSymptomsLoading, isProgressLoading]);

  useEffect(() => {
    if (isSymptomsError && isAuthRequiredError(symptomsError)) {
      setAccessAuthorized(false);
    }
  }, [isSymptomsError, symptomsError]);
  useEffect(() => {
    if (isProgressError && isAuthRequiredError(progressError)) {
      setAccessAuthorized(false);
    }
  }, [isProgressError, progressError]);

  const fetchLastMessage = async () => {
    if (!member || !admin) return;

    const lastMessage = await getLastMessageBySenderAndReceiver(
      admin.username,
      member.username,
    );

    if (lastMessage && lastMessage.message) {
      if (lastMessage.message.startsWith('dailyStatus')) {
        const match = lastMessage.message.match(/dailyStatus(\d+)/);
        const score = parseInt(match![1], 10);

        lastMessage.message = t('dailyStatusText', {
          date: new Date().toLocaleDateString(),
          score,
        });
      }
      setLastMessage(lastMessage);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('dışarda');
      fetchLastMessage();
    }, [member, admin]),
  );

  const calculateAge = () => {
    if (member && member.birthDate) {
      const birthDate = new Date(member.birthDate);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();

      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      return age;
    }
    return null;
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchLastMessage();
      await Promise.all([refetchSymptoms(), refetchProgress()]);
      await qc.invalidateQueries({
        queryKey: scheduleQueryKey(memberId),
        exact: true,
      });
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (!fromNotification && navigation.canGoBack()) {
          return false;
        }

        navigation.navigate('Group', {fromNotification});
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);

  function formatMinutes(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours} sa ${minutes} dk`;
    }
    return `${minutes} dk`;
  }

  const getMembersTheme = () => {
    if (member?.theme) {
      const {themeObj} = parseTheme(member?.theme);
      console.log('theme object', themeObj);
      return themeObj;
    }
  };

  const calculateBmi = () => {
    if (member && member.height && member.weight) {
      const hm = member.height / 100;
      const bmi = member.weight / (hm * hm);
      let result = bmi.toFixed(2).toString() + ' ';
      if (bmi < 18.5) {
        result += t('bmiLevel.underweight');
      } else if (bmi < 24.9) {
        result += t('bmiLevel.normal');
      } else if (bmi < 29.9) {
        result += t('bmiLevel.overweight');
      } else {
        // if (bmi < 34.9)
        result += t('bmiLevel.obese');
      }

      return result;
    }
    return '';
  };

  const getDay = () => {
    return selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
  };

  const isActiveDay = () => {
    console.log('aahahhahad', activeDays, selectedDate.getDay());
    return activeDays?.includes(getDay());
  };

  const isToday = () => {
    return isTodayLocal(selectedDate);
  };

  return (
    <View style={{paddingTop: insets.top * 1.3}} className="flex-1 px-3">
      <LinearGradient
        colors={colors.gradient}
        locations={[0.15, 0.25, 0.7, 1]}
        start={{x: 0.1, y: 0}}
        end={{x: 0.8, y: 1}}
        className="absolute top-0 left-0 right-0 bottom-0"
      />

      <View
        className="pb-3"
        style={{
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <Text
          className="pl-4 font-rubik-semibold pr-7"
          style={{
            color: theme.colors.isLight ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          {t('header.title')}
          {'  '}
          <Text
            style={{
              color: theme.colors.isLight ? colors.primary[200] : '#2F2F30',
            }}>
            {member && member.fullName ? member.fullName : ''}
          </Text>
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingBottom: 96 + tabBarHeight / 2,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressBackgroundColor={colors.background.secondary}
            colors={[colors.primary[300]]}
            tintColor={colors.primary[300]}
          />
        }>
        <View
          className="flex flex-column justify-start pl-5 pb-2 px-3 mb-3"
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
            borderColor: colors.primary[300],
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
            }}>
            {!showDetail ? (
              <View className="flex flex-row items-center justify-start mt-1">
                <TouchableOpacity
                  className="mb-1 px-3"
                  style={{
                    paddingVertical: 8,
                    borderRadius: 13,
                    backgroundColor: colors.background.third,
                  }}
                  onPress={() => {
                    setShowDetail(!showDetail);
                  }}>
                  <Text
                    className="font-rubik text-md"
                    style={{color: colors.primary[200]}}>
                    {showDetail
                      ? t('fields.hideDetail')
                      : t('fields.showDetail')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-col items-start justify-end pt-1">
                {admin?.username === 'ordanuc' && (
                  <View className="flex-row items-center mb-1">
                    <Text
                      className="font-rubik-medium text-lg"
                      style={{color: colors.text.primary}}>
                      {t('fields.id')}
                      {'  '}
                    </Text>
                    <Text
                      className="font-rubik text-lg"
                      style={{color: colors.text.primary}}>
                      {member?.id}
                    </Text>
                  </View>
                )}
                <View className="flex-row items-center">
                  <Text
                    className="font-rubik-medium text-lg"
                    style={{color: colors.text.primary}}>
                    {t('fields.fullName')}
                    {'  '}
                  </Text>
                  <Text
                    className="font-rubik text-lg"
                    style={{color: colors.text.primary}}>
                    {member?.fullName}
                  </Text>
                </View>
                <View className="flex-row items-center my-1">
                  <Text
                    className="font-rubik-medium text-lg"
                    style={{color: colors.text.primary}}>
                    {t('fields.username')}
                    {'  '}
                  </Text>
                  <Text
                    className="font-rubik text-lg"
                    style={{color: colors.text.primary}}>
                    {member?.username}
                  </Text>
                </View>
              </View>
            )}
            <Image
              source={AVATARS[member?.avatar as AvatarKey]}
              className="mr-1 size-14"
            />
          </View>
          {showDetail && (
            <>
              <View className="flex flex-row items-center mb-1">
                <Text
                  className="font-rubik-medium text-lg"
                  style={{color: colors.text.primary}}>
                  {t('fields.email')}
                  {'  '}
                </Text>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  {member?.email}
                </Text>
              </View>
              <View className="flex flex-row items-center my-1">
                <Text
                  className="font-rubik-medium text-lg"
                  style={{color: colors.text.primary}}>
                  {t('fields.age')}
                  {'  '}
                </Text>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  {calculateAge()}
                </Text>
              </View>
              <View className="flex flex-row items-center my-1">
                <Text
                  className="font-rubik-medium text-lg"
                  style={{color: colors.text.primary}}>
                  {t('fields.birthDate')}
                  {'  '}
                </Text>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  {new Date(member?.birthDate!).toLocaleDateString(
                    c('locale'),
                    {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    },
                  )}
                </Text>
              </View>
              <View className="flex flex-row items-center my-1">
                <Text
                  className="font-rubik-medium text-lg"
                  style={{color: colors.text.primary}}>
                  {t('fields.gender')}
                  {'  '}
                </Text>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  {member?.gender === 'male'
                    ? t('fields.genderOptions.male')
                    : t('fields.genderOptions.female')}
                </Text>
              </View>
              <View className="flex flex-row items-center my-1">
                <Text
                  className="font-rubik-medium text-lg"
                  style={{color: colors.text.primary}}>
                  {t('fields.height')}
                  {':  '}
                </Text>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  {member?.height} cm
                </Text>
              </View>
              <View className="flex flex-row items-center my-1">
                <Text
                  className="font-rubik-medium text-lg"
                  style={{color: colors.text.primary}}>
                  {t('fields.weight')}
                  {':  '}
                </Text>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  {member?.weight} kg
                </Text>
              </View>
              <View className="flex flex-row items-center my-1">
                <Text
                  className="font-rubik-medium text-md"
                  style={{color: colors.text.primary}}>
                  {t('fields.bmi')}:{'  '}
                </Text>
                <Text
                  className="font-rubik text-md"
                  style={{color: colors.text.primary}}>
                  {calculateBmi()}
                </Text>
              </View>
              {getMembersTheme() && (
                <View className="flex flex-row items-center mt-1 mb-3">
                  <Text
                    className="font-rubik-medium text-md"
                    style={{color: colors.text.primary}}>
                    {t('fields.themeUsed')}
                    {'  '}
                  </Text>
                  <Text
                    className="font-rubik text-md"
                    style={{color: colors.text.primary}}>
                    {getMembersTheme()?.light.name.startsWith('blue')
                      ? t('fields.themeMap.blue') + ' '
                      : getMembersTheme()?.light.name.startsWith('purple')
                      ? t('fields.themeMap.purple') + ' '
                      : getMembersTheme()?.light.name.startsWith('green')
                      ? t('fields.themeMap.green') + ' '
                      : getMembersTheme()?.light.name.startsWith('red')
                      ? t('fields.themeMap.red') + ' '
                      : ''}
                  </Text>
                  <ColorCircle
                    color1={getMembersTheme()?.light.colors.primary[300]!}
                    color2={getMembersTheme()?.light.colors.secondary[300]!}
                    padding={12}
                  />
                </View>
              )}
            </>
          )}
          {showDetail && (
            <View className="flex flex-row items-center justify-start">
              <TouchableOpacity
                className="mb-1 py-2 px-4"
                style={{
                  borderRadius: 13,
                  backgroundColor: colors.background.third,
                }}
                onPress={() => {
                  setShowDetail(!showDetail);
                }}>
                <Text
                  className="font-rubik text-md"
                  style={{color: colors.primary[200]}}>
                  {showDetail ? t('fields.hideDetail') : t('fields.showDetail')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View
          className="flex flex-column justify-start pl-5 p-3 pb-3 mb-3"
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
          }}>
          <View className="flex flex-row justify-between">
            {lastMessage && !lastMessage.message.startsWith('dailyStatus') && (
              <Text
                className="font-rubik mt-1"
                style={{fontSize: 18, color: colors.primary[200]}}>
                {t('sections.lastMessage')}
              </Text>
            )}
            <TouchableOpacity
              className="py-2 px-3 bg-blue-500 rounded-2xl flex items-center justify-center mr-1"
              style={{backgroundColor: colors.background.third}}
              onPress={async () => {
                if (!admin || !member) return;

                let roomId = await qc.ensureQueryData({
                  queryKey: MSG_KEYS.roomIdByUsers(
                    admin.username,
                    member.username,
                  ),
                  queryFn: () =>
                    getRoomIdByUsers(admin.username, member.username),
                });

                let finalRoomId = roomId;

                if (roomId === 0) {
                  const {data: newId} = await getNextRoomId();
                  finalRoomId = newId;

                  qc.setQueryData(
                    MSG_KEYS.roomIdByUsers(admin.username, member.username),
                    newId,
                  );
                }

                navigation.navigate('Chat', {
                  roomId: finalRoomId,
                  sender: admin.username,
                  receiver: member,
                  fromNotification: false,
                });
              }}>
              <Text
                className="font-rubik text-md"
                style={{color: colors.primary[200]}}>
                {t('buttons.chat')}
              </Text>
            </TouchableOpacity>
          </View>
          {lastMessage && !lastMessage.message.startsWith('dailyStatus') && (
            <Text
              className="font-rubik text-md mt-1"
              style={{color: colors.text.primary}}>
              {lastMessage.receiver === admin?.username
                ? member?.fullName + ' : ' + lastMessage.message
                : `${t('fields.you')} : ${lastMessage.message}`}
            </Text>
          )}
        </View>

        {
          // isAllInitialized ? (
          !accessAuthorized ? (
            <View
              className="p-3 rounded-2xl"
              style={{backgroundColor: colors.background.primary}}>
              <Text
                className="ml-2 text-lg font-rubik"
                style={{color: colors.text.primary}}>
                {t('access.blockedTitle')}
              </Text>
              <Text
                className="ml-2 text-md font-rubik mt-1"
                style={{color: colors.text.primary}}>
                {t('access.blockedDetail')}
              </Text>
            </View>
          ) : (
            <>
              <View
                onLayout={e => setSymptomsSectionY(e.nativeEvent.layout.y)}
                className="flex flex-col pb-1 pt-2 px-3 mb-3"
                style={{
                  borderRadius: 17,
                  backgroundColor: colors.background.primary,
                }}>
                <View className="mb-1">
                  <WeeklyStrip
                    selectedDate={selectedDate}
                    onSelect={d => {
                      d.setHours(12, 0, 0, 0);
                      setSelectedDate(d);
                      if (showDetail) scrollToSymptoms();
                    }}
                    minDate={monthAgo}
                    maxDate={new Date()}
                    startOnMonday
                    colors={colors}
                  />
                </View>
                {group?.exerciseEnabled && (
                  <View
                    className="flex-row items-center justify-between mt-1 mb-3 pl-3 pr-2 rounded-2xl"
                    style={{
                      backgroundColor: colors.background.secondary,
                      paddingVertical: 8,
                    }}>
                    <Text
                      className="font-rubik ml-1"
                      style={{fontSize: 17, color: colors.text.primary}}>
                      {t('sections.exerciseProgress')}
                    </Text>
                    {isProgressLoading ? (
                      <ActivityIndicator
                        className="self-center mr-10"
                        size={20}
                        color={colors.primary[200]}
                      />
                    ) : isActiveDay() ? (
                      <View
                        className="flex flex-row justify-center items-center px-3 py-2"
                        style={{
                          borderRadius: 17,
                          backgroundColor: isProgressLoading
                            ? colors.text.secondary
                            : calcPercent(progress) === 100
                            ? '#3BC476'
                            : isToday()
                            ? colors.primary[200]
                            : '#fd5353',
                        }}>
                        <Text
                          className="text-md font-rubik"
                          style={{
                            color: colors.background.third,
                          }}>
                          {/* {calcPercent(progress) === 100 ? (
                            t('calendar.legend.done')
                          ) : (
                            <>
                              {c('locale') === 'tr-TR' && '%'}
                              {calcPercent(progress)}
                              {c('locale') !== 'tr-TR' && '%'}
                            </>
                          )} */}
                          {c('locale') === 'tr-TR' && '%'}
                          {calcPercent(progress)}
                          {c('locale') !== 'tr-TR' && '%'}{' '}
                          {calcPercent(progress) === 100
                            ? t('calendar.legend.done')
                            : t('calendar.legend.hasDone')}
                        </Text>

                        {/* <Image
                          source={icons.gymnastic_1}
                          className="size-10 ml-2"
                          tintColor={colors.background.third}
                        /> */}
                      </View>
                    ) : (
                      <Text
                        className="font-rubik mr-1"
                        style={{
                          fontSize: 11.3,
                          color: colors.text.primary,
                        }}>
                        {t('calendar.inactiveDay')}
                      </Text>
                    )}
                  </View>
                )}

                <View
                  className="rounded-2xl py-1 px-4 mb-2"
                  style={{backgroundColor: colors.background.secondary}}>
                  {symptoms ? (
                    <View>
                      <Text
                        className="font-rubik pt-2"
                        style={{fontSize: 17, color: colors.text.primary}}>
                        {t('sections.symptoms')}
                      </Text>
                      <ProgressBar
                        value={symptoms?.pulse}
                        label={t('symptoms.pulse')}
                        iconSource={icons.pulse}
                        color="#FF3F3F"
                        bgDense={true}
                      />
                      {symptoms?.totalCaloriesBurned &&
                      symptoms?.totalCaloriesBurned > 0 ? (
                        <ProgressBar
                          value={symptoms?.totalCaloriesBurned}
                          label={t('symptoms.calories')}
                          iconSource={icons.kcal}
                          color="#FF9900"
                          bgDense={true}
                        />
                      ) : (
                        symptoms?.activeCaloriesBurned &&
                        symptoms?.activeCaloriesBurned > 0 && (
                          <ProgressBar
                            value={symptoms?.activeCaloriesBurned}
                            label={t('symptoms.calories')}
                            iconSource={icons.kcal}
                            color="#FF9900"
                            bgDense={true}
                          />
                        )
                      )}
                      <ProgressBar
                        value={symptoms?.steps}
                        label={t('symptoms.steps')}
                        iconSource={icons.man_walking}
                        color="#2CA4FF"
                        bgDense={true}
                      />
                      <ProgressBar
                        value={
                          symptoms?.sleepMinutes
                            ? symptoms?.sleepMinutes
                            : undefined
                        }
                        label={t('symptoms.sleep')}
                        iconSource={icons.sleep}
                        color="#FDEF22"
                        bgDense={true}
                      />
                    </View>
                  ) : isSymptomsLoading ? (
                    <View className="flex flex-row items-center justify-center w-full py-1">
                      <ActivityIndicator
                        className="self-center"
                        size={28}
                        color={colors.primary[200]}
                      />
                    </View>
                  ) : (
                    <Text
                      className="font-rubik py-1"
                      style={{fontSize: 16, color: colors.text.primary}}>
                      {t('symptoms.empty')}
                    </Text>
                  )}
                </View>
              </View>

              {accessAuthorized && (
                <TouchableOpacity
                  className="px-4 rounded-2xl self-end"
                  style={{
                    backgroundColor: theme.colors.isLight
                      ? colors.background.primary
                      : colors.background.secondary,
                    paddingVertical: 8,
                  }}
                  onPress={() =>
                    navigation.navigate('MemberActivitySummary', {memberId})
                  }>
                  <Text
                    className="text-lg font-rubik"
                    style={{color: colors.primary[200]}}>
                    {t('sections.weeklySummary')}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )
          // ) : (
          //   <View
          //     className="flex flex-row justify-center items-center pt-6"
          //     style={{backgroundColor: 'transparent'}}>
          //     <ActivityIndicator size="large" color={colors.primary[300]} />
          //   </View>
          // )
        }
      </ScrollView>
    </View>
  );
};

export default Member;
