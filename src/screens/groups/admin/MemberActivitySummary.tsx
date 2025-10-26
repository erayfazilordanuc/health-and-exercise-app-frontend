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
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
  useAdminDoneStepGoalsUntil,
  useAdminGetStepGoalForRange,
  useAdminSymptomsByUserIdAndDate,
  useAdminSymptomsSummaryByDateRange,
  useAdminWeeklyStepGoal,
  useAdminWeeklySteps,
} from '../../../hooks/symptomsQueries';
import {useWeeklyActiveDaysProgressByUserId} from '../../../hooks/progressQueries';
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

const MemberActivitySummary = () => {
  type MemberRouteProp = RouteProp<
    GroupsStackParamList,
    'MemberActivitySummary'
  >;
  const {params} = useRoute<MemberRouteProp>();
  const {memberId} = params;
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

  const {
    data: activeDays,
    isLoading: isScheduleLoading,
    error: scheduleError,
  } = useExerciseScheduleAdmin(memberId, {enabled: !!memberId});
  console.log(activeDays);

  const today = new Date(new Date().setHours(12, 0, 0, 0));
  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - 84);
    return d;
  }, []);

  const [progressDate, setProgressDate] = useState(today);

  const day = (d: Date) => d.toISOString().slice(0, 10);

  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    d.setDate(d.getDate() - daysToSubtract);
    d.setHours(0, 0, 0, 0);

    return d;
  };

  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const fromDay = React.useMemo(() => day(weekStart), [weekStart]);

  const toDay = React.useMemo(() => day(weekEnd), [weekEnd]);
  console.log(today.toString(), toDay.toString(), fromDay.toString());

  const {data: weeklySteps} = useAdminWeeklySteps(memberId, {
    enabled: !!memberId,
  });
  // const {data: weeklyGoal} = useAdminWeeklyStepGoal(memberId, {
  //   enabled: !!memberId,
  // });
  // const {data: doneGoals} = useAdminDoneStepGoals(memberId, {
  //   enabled: !!memberId,
  // });

  const {data: weeklyGoal} = useAdminGetStepGoalForRange(
    memberId,
    weekStart,
    weekEnd,
    {
      enabled: !!memberId,
    },
  );

  const {data: doneGoals} = useAdminDoneStepGoals(memberId, {
    enabled: !!memberId,
  });

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

  const {
    data: sessions,
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useUserSessions(memberId, fromDay, toDay, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const goToPreviousWeek = () => {
    setWeekStart(currentStart => {
      const newStart = new Date(currentStart);
      newStart.setDate(newStart.getDate() - 7);
      const d = new Date(progressDate);
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - 7);
      setProgressDate(d);
      return newStart;
    });
  };

  const goToNextWeek = () => {
    setWeekStart(currentStart => {
      const newStart = new Date(currentStart);
      newStart.setDate(newStart.getDate() + 7); // 7 gün ileri git
      setProgressDate(new Date(progressDate.getDate() + 7));
      const d = new Date(progressDate);
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() + 7);
      if (d > today) d.setTime(today.getTime());
      setProgressDate(d);
      return newStart;
    });
  };

  const {
    data: symptoms, // WeeklySymptomsSummary
    isLoading: isSymptomsLoading,
    isError: isSymptomsError,
    error: symptomsError,
    refetch: refetchSymptoms,
    isFetching,
  } = useAdminSymptomsSummaryByDateRange(memberId, weekStart, weekEnd);

  const isCurrentWeek =
    weekStart.getTime() >= getStartOfWeek(getToday()).getTime();

  const [isAllInitialized, setIsAllInitialized] = useState(false);

  // useEffect(() => {
  //   scrollToSymptoms();
  // }, [symptoms]);

  const {
    data: weeklyExerciseProgress = [],
    isLoading: isProgressLoading,
    isError: isProgressError,
    error: progressError,
    refetch: refetchProgress,
  } = useWeeklyActiveDaysProgressByUserId(memberId, progressDate, {
    staleTime: 60_000,
  });

  useEffect(() => {
    setAllLoading(isSessionsLoading || isSymptomsLoading || isProgressLoading);
    if (!isAllInitialized)
      setIsAllInitialized(
        !isSessionsLoading && !isSymptomsLoading && !isProgressLoading,
      );
  }, [isSessionsLoading, isSymptomsLoading, isProgressLoading]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([refetchSymptoms(), refetchProgress()]);
      console.log(weeklyExerciseProgress);
      await qc.invalidateQueries({
        queryKey: scheduleQueryKey(memberId),
        exact: true,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);

  function getWeeklyStats(sessions: SessionDTO[]) {
    const sessionCount = sessions.length;

    const totalMinutes =
      sessions.reduce((acc, s) => acc + s.activeMs, 0) / 60000;

    return {
      sessionCount,
      totalMinutes: Math.round(totalMinutes),
    };
  }

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

  const completedCount = () => {
    if (!doneGoals) return 0;

    const base = doneGoals.length;

    if (
      weeklySteps != null &&
      weeklyGoal &&
      weeklySteps > weeklyGoal.goal &&
      !weeklyGoal.isDone
    ) {
      return base + 1;
    }

    return base;
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
          className="p-3 rounded-2xl my-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-center text-base"
            style={{color: colors.text.secondary}}>
            {t('summary.dateRange')}:{' '}
            {weekStart.toLocaleDateString(c('locale'), {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            -{' '}
            {weekEnd.toLocaleDateString(c('locale'), {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <View className="flex-row justify-between items-center mt-4 mb-1 px-2">
            <TouchableOpacity
              onPress={goToPreviousWeek}
              className="py-2 px-4 rounded-xl shadow"
              style={{backgroundColor: colors.primary[300]}}>
              <Text className="text-white font-rubik text-base">
                &lt; {t('summary.previousWeek')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToNextWeek}
              disabled={isCurrentWeek}
              className="py-2 px-4 rounded-xl shadow disabled:bg-gray-400 disabled:opacity-70"
              style={{backgroundColor: colors.primary[300]}}>
              <Text className="text-white font-rubik text-base">
                {t('summary.nextWeek')} &gt;
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {
          // isAllInitialized ? (
          <>
            {group?.exerciseEnabled && weeklyExerciseProgress && activeDays && (
              <View
                className="flex flex-col px-3 py-3 mb-3"
                style={{
                  borderRadius: 17,
                  backgroundColor: colors.background.primary,
                }}>
                <View className="flex flex-row items-center justify-between mb-2">
                  <Text
                    className="font-rubik ml-2"
                    style={{fontSize: 17, color: colors.text.primary}}>
                    {t('sections.calendar')}
                  </Text>
                </View>
                <CustomWeeklyProgressCalendar
                  weeklyPercents={weeklyExerciseProgress.map(calcPercent)}
                  activeDays={activeDays}
                  weekDate={progressDate}
                />
                <View className="flex flex-row items-center justify-between">
                  <View className="flex flex-row items-center justify-start ml-2 mt-3 my-1">
                    <View className="flex-col items-start space-x-2 mr-3">
                      <View className="flex flex-row items-center space-x-2">
                        <View
                          className="p-2 rounded-full"
                          style={{backgroundColor: '#14E077'}}
                        />
                        <Text
                          className="text-xs font-rubik ml-1"
                          style={{color: colors.text.primary}}>
                          {t('calendar.legend.done')}
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
                          {t('calendar.legend.notDone')}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-col items-start space-x-2">
                      <View className="flex-row items-center space-x-2">
                        <View
                          className="p-2 rounded-full"
                          style={{
                            backgroundColor: '#4f9cff',
                          }}
                        />
                        <Text
                          className="text-xs font-rubik ml-1"
                          style={{color: colors.text.primary}}>
                          {t('calendar.legend.todo')}
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
                          {t('calendar.legend.today')}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {member?.groupId &&
                    [3, 6, 22, 27, 8].includes(member?.groupId) && (
                      <TouchableOpacity
                        className="px-3 py-2 rounded-xl mt-2"
                        style={{backgroundColor: colors.background.third}}
                        onPress={() => {
                          navigation.navigate('ExerciseProgress', {
                            member: member,
                            weeklyProgress: weeklyExerciseProgress,
                          });
                        }}>
                        <Text
                          className="text-lg font-rubik"
                          style={{color: colors.primary[200]}}>
                          {t('buttons.details')}
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            )}

            <View
              onLayout={e => setSymptomsSectionY(e.nativeEvent.layout.y)}
              className="flex flex-col pb-1 pt-2 px-5 mb-3"
              style={{
                borderRadius: 17,
                backgroundColor: colors.background.primary,
              }}>
              {symptoms ? (
                <>
                  <Text
                    className="font-rubik pt-2"
                    style={{fontSize: 18, color: colors.text.primary}}>
                    {t('symptoms.sum')}
                  </Text>
                  <ProgressBar
                    value={symptoms?.avgPulse}
                    label={t('symptoms.avgPulse')}
                    iconSource={icons.pulse}
                    color="#FF3F3F"
                  />
                  {/* max min pulse is necessary */}
                  {symptoms?.totalCaloriesBurned &&
                  symptoms?.totalCaloriesBurned > 0 ? (
                    <ProgressBar
                      value={symptoms?.totalCaloriesBurned}
                      label={t('symptoms.calories')}
                      iconSource={icons.kcal}
                      color="#FF9900"
                    />
                  ) : (
                    symptoms?.activeCaloriesBurned &&
                    symptoms?.activeCaloriesBurned > 0 && (
                      <ProgressBar
                        value={symptoms?.activeCaloriesBurned}
                        label={t('symptoms.calories')}
                        iconSource={icons.kcal}
                        color="#FF9900"
                      />
                    )
                  )}
                  <ProgressBar
                    value={symptoms?.steps}
                    label={t('symptoms.steps')}
                    iconSource={icons.man_walking}
                    color="#2CA4FF"
                  />
                  <ProgressBar
                    value={
                      symptoms?.sleepMinutes
                        ? symptoms?.sleepMinutes
                        : undefined
                    }
                    age={calculateAge() ?? undefined}
                    label={t('symptoms.sleep')}
                    iconSource={icons.sleep}
                    color="#FDEF22"
                  />
                </>
              ) : isSymptomsLoading ? (
                <View
                  className="flex flex-row items-center justify-center w-full"
                  style={{paddingBottom: 3, paddingTop: 1}}>
                  <ActivityIndicator
                    className="self-center"
                    size="large"
                    color={colors.primary[200]}
                  />
                </View>
              ) : (
                <Text
                  className="font-rubik py-2"
                  style={{fontSize: 16, color: colors.text.primary}}>
                  {t('symptoms.empty')}
                </Text>
              )}
            </View>

            <View
              className="flex-col rounded-2xl px-4 py-3 mb-3"
              style={{backgroundColor: colors.background.primary}}>
              <Text
                className="font-rubik text-xl ml-1 mb-3"
                style={{color: colors.text.primary}}>
                {t('sections.weeklyStepGoal')}
              </Text>
              {weeklyGoal ? (
                <View
                  className="flex-col rounded-2xl pl-3 pr-7 py-2 mb-2 self-start"
                  style={{backgroundColor: colors.background.secondary}}>
                  {weeklySteps && weeklySteps > weeklyGoal.goal && (
                    <View className="flex-row items-center justify-start mb-2">
                      <Text
                        className="font-rubik text-lg ml-2"
                        style={{color: '#16d750'}}>
                        {t('steps.completed')}
                      </Text>
                      <Image
                        source={icons.check}
                        className="size-5 ml-2"
                        tintColor={'#16d750'}
                      />
                    </View>
                  )}
                  <Text
                    className="font-rubik text-lg ml-2 mb-2"
                    style={{color: colors.text.primary}}>
                    {t('steps.goal', {goal: weeklyGoal.goal})}
                  </Text>
                  <Text
                    className="font-rubik text-lg ml-2"
                    style={{color: colors.text.primary}}>
                    {t('steps.progress', {steps: symptoms?.steps || 0})}{' '}
                    {/* weeklySteps */}
                  </Text>
                </View>
              ) : (
                <View
                  className="flex-col rounded-2xl p-3 mb-2 self-start"
                  style={{backgroundColor: colors.background.secondary}}>
                  <Text
                    className="font-rubik text-lg ml-3 mr-3"
                    style={{color: colors.text.primary}}>
                    {t('steps.noGoal')}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center justify-start self-start my-1">
                <Text
                  className="font-rubik text-lg ml-3 mr-1"
                  style={{color: colors.text.primary}}>
                  {t('steps.badges')}{' '}
                </Text>
                <Image source={icons.badge1_colorful} className="size-7" />
                <Text
                  className="font-rubik text-lg ml-1"
                  style={{color: colors.text.primary}}>
                  {doneGoals && doneGoals.length
                    ? weeklySteps &&
                      weeklyGoal &&
                      weeklySteps > weeklyGoal.goal &&
                      !weeklyGoal.isDone
                      ? doneGoals?.length + 1
                      : doneGoals?.length
                    : 0}
                </Text>
              </View>
            </View>

            {
              <View
                className="flex flex-col pb-2 pt-1 px-5"
                style={{
                  borderRadius: 17,
                  backgroundColor: colors.background.primary,
                }}>
                {sessions && sessions.length > 0 ? (
                  <View className="pb-1">
                    <Text
                      className="font-rubik pt-2"
                      style={{fontSize: 18, color: colors.text.primary}}>
                      {t('sections.weeklySessions')}
                    </Text>
                    <Text
                      className="font-rubik pt-2"
                      style={{fontSize: 15, color: colors.text.primary}}>
                      {t('sessions.count', {
                        count: getWeeklyStats(sessions).sessionCount,
                      })}
                    </Text>
                    <Text
                      className="font-rubik pt-2"
                      style={{fontSize: 15, color: colors.text.primary}}>
                      {t('sessions.total', {
                        duration: formatMinutes(
                          getWeeklyStats(sessions).totalMinutes,
                        ),
                      })}
                    </Text>
                  </View>
                ) : (
                  <Text
                    className="font-rubik pt-2"
                    style={{fontSize: 18, color: colors.text.primary}}>
                    {t('sessions.empty')}
                  </Text>
                )}
              </View>
            }
          </>
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

export default MemberActivitySummary;
