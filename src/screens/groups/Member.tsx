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
import {useTheme} from '../../themes/ThemeProvider';
import {getUser, getUserById} from '../../api/user/userService';
import {
  getGroupAdmin,
  getGroupById,
  getGroupSize,
} from '../../api/group/groupService';
import {setGestureState} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import icons from '../../constants/icons';
import ProgressBar from '../../components/ProgressBar';
import {
  getLastMessageBySenderAndReceiver,
  getNextRoomId,
  isRoomExistBySenderAndReceiver,
} from '../../api/message/messageService';
import {useUser} from '../../contexts/UserContext';
import CustomWeeklyProgressCalendar from '../../components/CustomWeeklyProgressCalendar';
import {
  getTodaysProgressByUserId,
  getWeeklyActiveDaysProgressByUserId,
} from '../../api/exercise/progressService';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {isAuthRequiredError} from '../../api/errors/errors';
import {
  useAdminDoneStepGoals,
  useAdminSymptomsByUserIdAndDate,
  useAdminWeeklyStepGoal,
  useAdminWeeklySteps,
} from '../../hooks/symptomsQueries';
import {useWeeklyActiveDaysProgressByUserId} from '../../hooks/progressQueries';
import {useUserById} from '../../hooks/userQueries';
import {getRoomIdByUsers, MSG_KEYS} from '../../hooks/messageQueries';
import {useQueryClient} from '@tanstack/react-query';
import DatePicker from 'react-native-date-picker';
import NetInfo from '@react-native-community/netinfo';
import {useUserSessions} from '../../hooks/sessionQueries';
import {subDays} from 'date-fns';
import {SessionList} from '../../components/SessionList';
import WeeklyStrip from '../../components/WeeklyStrip';
import {
  scheduleQueryKey,
  useExerciseSchedule,
  useExerciseScheduleAdmin,
} from '../../hooks/exerciseQueries';
import {parseTheme} from '../../themes/themes';
import ColorCircle from '../../components/ColorCircle';
import {calcPercent} from '../../api/exercise/exerciseService';
import {useGroupById} from '../../hooks/groupQueries';
import {AvatarKey, AVATARS} from '../../constants/avatars';

const Member = () => {
  type MemberRouteProp = RouteProp<GroupsStackParamList, 'Member'>;
  const {params} = useRoute<MemberRouteProp>();
  const {memberId, fromNotification} = params;
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const {colors, theme} = useTheme();
  const insets = useSafeAreaInsets();
  const [allLoading, setAllLoading] = useState(true);
  const {user: admin} = useUser();
  const {data: member, isLoading, error} = useUserById(memberId);
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

  const {data: weeklySteps} = useAdminWeeklySteps(memberId, {
    enabled: !!memberId,
  });
  const {data: weeklyGoal} = useAdminWeeklyStepGoal(memberId, {
    enabled: !!memberId,
  });
  const {data: doneGoals} = useAdminDoneStepGoals(memberId, {
    enabled: !!memberId,
  });

  const scrollRef = useRef<ScrollView>(null);
  const [symptomsSectionY, setSymptomsSectionY] = useState(0);

  // isSymptomsLoading'in önce true olup sonra false'a düştüğünü tespit etmek için:
  const prevSymptomsLoadingRef = useRef(false);

  function scrollToSymptoms() {
    // layout güncellenmiş olsun diye frame sonunda kaydır
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, symptomsSectionY - 12),
        animated: true,
      });
    });
  }

  const [showDatePicker, setShowDatePicker] = useState(false);
  const today = new Date(new Date().setHours(12, 0, 0, 0));
  const [symptomsDate, setSymptomsDate] = useState(today);
  const day = (d: Date) => d.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // EKRANDA:
  const toDay = React.useMemo(() => day(new Date()), []); // örn: '2025-08-24'
  const fromDay = React.useMemo(() => day(subDays(new Date(), 7)), []);

  console.log(today.toString(), toDay.toString(), fromDay.toString());

  // const {fromISO, toISO} = useMemo(() => {
  //   const to = new Date(); // şimdi
  //   const from = new Date(to);
  //   from.setDate(to.getDate() - 7); // 7 gün önce

  //   // Güne yuvarla -> key stabil olsun
  //   const day = (d: Date) => d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  //   return {fromISO: day(from), toISO: day(to)};
  // }, [symptomsDate]);

  const {
    data: sessions,
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useUserSessions(memberId, fromDay, toDay, {
    staleTime: 5 * 60 * 1000, // 5 dk taze kalsın
    refetchOnWindowFocus: false, // odağa gelince zorla refetch etme
  });

  const {
    data: symptoms,
    isLoading: isSymptomsLoading,
    isError: isSymptomsError,
    error: symptomsError,
    refetch: refetchSymptoms,
    isFetching,
  } = useAdminSymptomsByUserIdAndDate(memberId, symptomsDate);

  const [isAllInitialized, setIsAllInitialized] = useState(false);

  useEffect(() => {
    scrollToSymptoms();
  }, [symptoms]);

  const {
    data: weeklyExerciseProgress = [],
    isLoading: isProgressLoading,
    isError: isProgressError,
    error: progressError,
    refetch: refetchProgress,
  } = useWeeklyActiveDaysProgressByUserId(memberId, {
    staleTime: 60_000,
  });

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

    console.log('içerde');
    const lastMessage = await getLastMessageBySenderAndReceiver(
      admin.username,
      member.username,
    );

    if (lastMessage && lastMessage.message) {
      if (lastMessage.message.startsWith('dailyStatus')) {
        const match = lastMessage.message.match(/dailyStatus(\d+)/);
        const score = parseInt(match![1], 10);

        lastMessage.message =
          '\n' +
          new Date().toLocaleDateString() +
          `\nBugün ruh halimi ${score}/9 olarak değerlendiriyorum.`;
      }
      setLastMessage(lastMessage);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('dışarda');
      fetchLastMessage();
    }, [member, admin]), // memberId, TO DO test et
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
      console.log(weeklyExerciseProgress);
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

        navigation.navigate('Group');
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

  function getWeeklyStats(sessions: SessionDTO[]) {
    const sessionCount = sessions.length;

    const totalMinutes =
      sessions.reduce((acc, s) => acc + s.activeMs, 0) / 60000;

    return {
      sessionCount,
      totalMinutes: Math.round(totalMinutes), // yuvarlanmış
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

  return (
    <View style={{paddingTop: insets.top * 1.3}} className="flex-1 px-3">
      <LinearGradient
        colors={colors.gradient}
        start={{x: 0.1, y: 0}}
        end={{x: 0.9, y: 1}}
        className="absolute inset-0"
      />

      <View
        className="pb-3"
        style={{
          backgroundColor: 'transparent', // colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <Text
          className="pl-4 font-rubik-semibold pr-7"
          style={{
            color: theme.colors.isLight ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          Hasta:{'  '}
          <Text
            style={{
              color: theme.colors.isLight
                ? colors.primary[200]
                : colors.primary[300],
            }}>
            {member && member.fullName ? member.fullName : ''}
          </Text>
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerClassName="pb-28"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressBackgroundColor={colors.background.secondary}
            colors={[colors.primary[300]]} // Android (array!)
            tintColor={colors.primary[300]}
          />
        }>
        <View
          className="flex flex-column justify-start pl-5 p-3 mb-3" // border
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
            borderColor: colors.primary[300],
          }}>
          <View className="flex-row items-center justify-between">
            <Text
              className="font-rubik-medium"
              style={{fontSize: 18, color: colors.text.primary}}>
              Hasta Bilgileri
            </Text>
            <Image
              source={AVATARS[member?.avatar as AvatarKey]}
              className="mr-1 size-12"
            />
          </View>
          {/* <View className="flex flex-row items-center mt-1 mb-1">
            <Text
              className="font-rubik-medium text-lg"
              style={{color: colors.text.primary}}>
              Avatar:{'  '}
            </Text>
            <Image
              source={
                member?.avatar
                  ? AVATARS[member?.avatar as AvatarKey]
                  : AVATARS.non
              }
              className="size-10 ml-1 mr-1"
            />
          </View> */}
          <View className="flex flex-row items-center mt-1 mb-1">
            <Text
              className="font-rubik-medium text-lg"
              style={{color: colors.text.primary}}>
              Adı Soyadı:{'  '}
            </Text>
            <Text
              className="font-rubik text-lg"
              style={{color: colors.text.primary}}>
              {member?.fullName}
            </Text>
          </View>
          <View className="flex flex-row items-center mt-1 mb-1">
            <Text
              className="font-rubik-medium text-lg"
              style={{color: colors.text.primary}}>
              Kullanıcı Adı:{'  '}
            </Text>
            <Text
              className="font-rubik text-lg"
              style={{color: colors.text.primary}}>
              {member?.username}
            </Text>
          </View>
          <View className="flex flex-row items-center mt-1 mb-1">
            <Text
              className="font-rubik-medium text-lg"
              style={{color: colors.text.primary}}>
              Yaş:{'  '}
            </Text>
            <Text
              className="font-rubik text-lg"
              style={{color: colors.text.primary}}>
              {calculateAge()}
            </Text>
          </View>
          <View className="flex flex-row items-center mt-1 mb-1">
            <Text
              className="font-rubik-medium text-lg"
              style={{color: colors.text.primary}}>
              Doğum Tarihi:{'  '}
            </Text>
            <Text
              className="font-rubik text-lg"
              style={{color: colors.text.primary}}>
              {new Date(member?.birthDate!).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View className="flex flex-row items-center mt-1 mb-1">
            <Text
              className="font-rubik-medium text-lg"
              style={{color: colors.text.primary}}>
              Cinsiyet:{'  '}
            </Text>
            <Text
              className="font-rubik text-lg"
              style={{color: colors.text.primary}}>
              {member?.gender === 'male' ? 'Erkek' : 'Kadın'}
            </Text>
          </View>
          {getMembersTheme() && (
            <View className="flex flex-row items-center mt-1 mb-1">
              <Text
                className="font-rubik-medium text-lg"
                style={{color: colors.text.primary}}>
                Kullandığı Tema:{'  '}
              </Text>
              <Text
                className="font-rubik text-lg"
                style={{color: colors.text.primary}}>
                {getMembersTheme()?.light.name.startsWith('blue')
                  ? 'Mavi-Turkuaz '
                  : getMembersTheme()?.light.name.startsWith('purple')
                  ? 'Mor-Pembe '
                  : getMembersTheme()?.light.name.startsWith('green')
                  ? 'Yeşil-Sarı '
                  : getMembersTheme()?.light.name.startsWith('red')
                  ? 'Kırmızı-Turuncu '
                  : ''}
              </Text>
              <ColorCircle
                color1={getMembersTheme()?.light.colors.primary[300]!}
                color2={getMembersTheme()?.light.colors.secondary[300]!}
                padding={14}
              />
            </View>
          )}
        </View>

        <View
          className="flex flex-column justify-start pl-5 p-3 pb-4 mb-3"
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
          }}>
          <View className="flex flex-row justify-between">
            {lastMessage && !lastMessage.message.startsWith('dailyStatus') && (
              <Text
                className="font-rubik mt-1"
                style={{fontSize: 18, color: colors.primary[200]}}>
                En Son Mesaj
              </Text>
            )}
            <TouchableOpacity
              className="py-2 px-3 bg-blue-500 rounded-2xl flex items-center justify-center"
              style={{backgroundColor: colors.background.third}}
              onPress={async () => {
                if (!admin || !member) return;

                // const response = await isRoomExistBySenderAndReceiver(
                //   admin.username,
                //   member.username,
                // );
                // if (response && response.status === 200) {
                //   const roomId = response;
                //   if (roomId !== 0) {
                //     navigation.navigate('Chat', {
                //       roomId: roomId,
                //       sender: admin.username,
                //       receiver: member,
                //       fromNotification: false,
                //     });
                //   } else {
                //     const nextRoomResponse = await getNextRoomId();
                //     if (nextRoomResponse.status === 200) {
                //       const nextRoomId = nextRoomResponse.data;
                //       navigation.navigate('Chat', {
                //         roomId: nextRoomId,
                //         sender: admin.username,
                //         receiver: member,
                //         fromNotification: false,
                //       });
                //     }
                //   }
                // }
                // 1) roomId'yi cache'den al; yoksa fetch et ve cache'e yaz
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

                  // ➤ Cache'i anında düzelt
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
                Sohbet
              </Text>
            </TouchableOpacity>
          </View>
          {lastMessage && !lastMessage.message.startsWith('dailyStatus') && (
            <Text
              className="font-rubik text-md mt-1"
              style={{color: colors.text.primary}}>
              {lastMessage.receiver === admin?.username
                ? member?.fullName + ' : ' + lastMessage.message
                : 'Siz : ' + lastMessage.message}
            </Text>
          )}
        </View>

        {/* {isProgressLoading || isSymptomsLoading ? (
            <View className="flex flex-row items-center justify-center w-full">
              <ActivityIndicator
                className="mt-7 self-center"
                size="large"
                color={colors.text.secondary} // {colors.primary[300] ?? colors.primary}
              />
            </View>
          ) :  */}
        {isAllInitialized ? (
          !accessAuthorized ? (
            <View
              className="p-3 rounded-2xl"
              style={{backgroundColor: colors.background.primary}}>
              <Text
                className="ml-2 text-lg font-rubik"
                style={{color: colors.text.primary}}>
                Veriler görüntülenemiyor.
              </Text>
              <Text
                className="ml-2 text-md font-rubik mt-1"
                style={{color: colors.text.primary}}>
                Kullanıcının verilerine erişebilmek için gerekli onaylar
                bulunmamaktadır.
              </Text>
              {/* <Text className="ml-2 text-md font-rubik mt-1">
                Veri paylaşımı için gerekli onaylar verilmemiş.
              </Text> */}
            </View>
          ) : (
            <>
              {group?.exerciseEnabled &&
                weeklyExerciseProgress &&
                activeDays && (
                  <View
                    className="flex flex-col px-3 py-3 mb-3"
                    style={{
                      borderRadius: 17,
                      backgroundColor: colors.background.primary,
                    }}>
                    <View className="flex flex-row items-center justify-between">
                      <Text
                        className="font-rubik mb-2 ml-2"
                        style={{fontSize: 18, color: colors.text.primary}}>
                        Egzersiz Takvimi
                      </Text>
                      <Text
                        className="font-rubik mb-3 rounded-xl"
                        style={{
                          paddingVertical: 5,
                          paddingHorizontal: 9,
                          fontSize: 14,
                          color: colors.text.primary,
                          backgroundColor: colors.background.secondary,
                        }}>
                        {new Date().toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <CustomWeeklyProgressCalendar
                      weeklyPercents={weeklyExerciseProgress.map(calcPercent)}
                      activeDays={activeDays}
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
                              Tamamlandı
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
                              Tamamlanmadı
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
                              Yapılacak
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
                              Bugün
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
                              Detaylar
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
                {/* <ProgressBar
              value={93}
              label="Genel sağlık"
              iconSource={icons.better_health}
              color="#41D16F"
            /> */}
                {/*heartRate != 0 && Burada eğer veri yoksa görünmeyebilir */}
                {/* <ProgressBar
              value={96}
              label="O2 Seviyesi"
              iconSource={icons.o2sat}
              color="#2CA4FF"
            /> */}
                {/* <ProgressBar
              value={83}
              label="Tansiyon"
              iconSource={icons.blood_pressure}
              color="#FF9900"/> FDEF22*/}
                {symptoms ? (
                  <>
                    <Text
                      className="font-rubik pt-2"
                      style={{fontSize: 18, color: colors.text.primary}}>
                      Bulgular
                    </Text>
                    <ProgressBar
                      value={symptoms?.pulse}
                      label="Nabız"
                      iconSource={icons.pulse}
                      color="#FF3F3F"
                    />
                    {symptoms?.totalCaloriesBurned &&
                    symptoms?.totalCaloriesBurned > 0 ? (
                      <ProgressBar
                        value={symptoms?.totalCaloriesBurned}
                        label="Yakılan Kalori"
                        iconSource={icons.kcal}
                        color="#FF9900"
                      />
                    ) : (
                      symptoms?.activeCaloriesBurned &&
                      symptoms?.activeCaloriesBurned > 0 && (
                        <ProgressBar
                          value={symptoms?.activeCaloriesBurned}
                          label="Yakılan Kalori"
                          iconSource={icons.kcal}
                          color="#FF9900"
                        />
                      )
                    )}
                    <ProgressBar
                      value={symptoms?.steps}
                      label="Adım"
                      iconSource={icons.man_walking}
                      color="#2CA4FF" //FDEF22
                    />
                    <ProgressBar
                      value={
                        symptoms?.sleepMinutes
                          ? symptoms?.sleepMinutes
                          : undefined
                      }
                      label="Uyku"
                      iconSource={icons.sleep}
                      color="#FDEF22"
                    />
                  </>
                ) : isSymptomsLoading ? (
                  <View className="flex flex-row items-center justify-center w-full py-20">
                    <ActivityIndicator
                      className="mt-2 self-center"
                      size="large"
                      color={colors.primary[200]} // {colors.primary[300] ?? colors.primary}
                    />
                  </View>
                ) : (
                  <Text
                    className="font-rubik py-2"
                    style={{fontSize: 18, color: colors.text.primary}}>
                    Bulgu Kaydı Bulunamadı
                  </Text>
                )}

                <View className="mt-1">
                  <WeeklyStrip
                    selectedDate={symptomsDate}
                    onSelect={d => {
                      d.setHours(12, 0, 0, 0);
                      setSymptomsDate(d);
                    }}
                    minDate={monthAgo}
                    maxDate={new Date()}
                    startOnMonday
                    colors={colors}
                  />
                </View>
                {/* <TouchableOpacity
                    onPress={async () => {
                      const net = await NetInfo.fetch();
                      const isOnline = !!net.isConnected;
                      if (isOnline) setShowDatePicker(true);
                      else
                        ToastAndroid.show(
                          'Bağlantı yok. İşlem gerçekleştirilemiyor.',
                          ToastAndroid.SHORT,
                        );
                    }}
                    className="px-3 py-2 rounded-xl self-end mt-1 mb-2"
                    style={{backgroundColor: colors.primary[200]}}>
                    <Text className="text-white font-rubik text-sm">
                      {symptomsDate.toLocaleDateString('tr-TR')}{' '}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DatePicker
                      modal
                      locale="tr"
                      mode="date"
                      title="Tarih Seçin"
                      confirmText="Tamam"
                      cancelText="İptal"
                      open={showDatePicker}
                      date={symptomsDate}
                      minimumDate={monthAgo}
                      maximumDate={new Date()}
                      onConfirm={d => {
                        setSymptomsDate(d);
                        setShowDatePicker(false);
                      }}
                      onCancel={() => setShowDatePicker(false)}
                    />
                  )} */}
              </View>

              <View
                className="flex-col rounded-2xl px-4 py-3 mb-3"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="font-rubik text-xl ml-1 mb-3"
                  style={{color: colors.text.primary}}>
                  Haftalık Adım Hedefi
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
                          Tamamlandı
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
                      Hedef: {' ' + weeklyGoal.goal} adım
                    </Text>
                    <Text
                      className="font-rubik text-lg ml-2"
                      style={{color: colors.text.primary}}>
                      İlerleme: {' ' + weeklySteps} adım
                    </Text>
                  </View>
                ) : (
                  <View
                    className="flex-col rounded-2xl p-3 mb-2 self-start"
                    style={{backgroundColor: colors.background.secondary}}>
                    <Text
                      className="font-rubik text-lg ml-3 mr-3"
                      style={{color: colors.text.primary}}>
                      Hedef mevcut değil
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-start self-start my-1">
                  <Text
                    className="font-rubik text-lg ml-3 mr-1"
                    style={{color: colors.text.primary}}>
                    Hedef Başarım Rozetleri:{' '}
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
                        Haftalık Oturum Bilgileri
                      </Text>
                      <Text
                        className="font-rubik pt-2"
                        style={{fontSize: 15, color: colors.text.primary}}>
                        Uygulamaya giriş sayısı:{' '}
                        {getWeeklyStats(sessions).sessionCount}
                      </Text>
                      <Text
                        className="font-rubik pt-2"
                        style={{fontSize: 15, color: colors.text.primary}}>
                        {'Toplam kullanım süresi'}:{' '}
                        {formatMinutes(getWeeklyStats(sessions).totalMinutes)}
                      </Text>
                      {/* <SessionList sessions={sessions} /> */}
                    </View>
                  ) : (
                    <Text
                      className="font-rubik pt-2"
                      style={{fontSize: 18, color: colors.text.primary}}>
                      Oturum Kaydı Bulunamadı
                    </Text>
                  )}
                </View>
              }
            </>
          )
        ) : (
          <View
            className="flex flex-row justify-center items-center pt-6"
            style={{backgroundColor: 'transparent'}}>
            <ActivityIndicator size="large" color={colors.primary[300]} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Member;
