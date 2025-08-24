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
  adminGetSymptomsByUserId,
  adminGetSymptomsByUserIdAndDate,
} from '../../api/symptoms/symptomsService';
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
import {useAdminSymptomsByUserIdAndDate} from '../../hooks/symptomsQueries';
import {useWeeklyActiveDaysProgressByUserId} from '../../hooks/progressQueries';
import {useUserById} from '../../hooks/userQueries';
import {getRoomIdByUsers, MSG_KEYS} from '../../hooks/messageQueries';
import {useQueryClient} from '@tanstack/react-query';
import DatePicker from 'react-native-date-picker';
import NetInfo from '@react-native-community/netinfo';
import {useUserSessions} from '../../hooks/sessionQueries';
import {subDays} from 'date-fns';
import {SessionList} from '../../components/SessionList';

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
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>();
  const [accessAuthorized, setAccessAuthorized] = useState(true);

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
  const today = new Date();
  const [symptomsDate, setSymptomsDate] = useState(today);
  const day = (d: Date) => d.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // EKRANDA:
  const toDay = React.useMemo(() => day(new Date()), []); // örn: '2025-08-24'
  const fromDay = React.useMemo(() => day(subDays(new Date(), 7)), []);

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
    if (!member) return;

    const lastMessage = await getLastMessageBySenderAndReceiver(
      admin!.username,
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
      fetchLastMessage();
    }, [memberId, member]),
  );

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
            color:
              theme.name === 'Light' ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          Hasta:{'  '}
          <Text
            style={{
              color: theme.name === 'Light' ? colors.primary[200] : '#0077FF',
            }}>
            {member && member.fullName ? member.fullName : ''}
          </Text>
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerClassName="pb-24"
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
          <Text
            className="font-rubik-medium"
            style={{fontSize: 18, color: colors.text.primary}}>
            Hasta Bilgileri
          </Text>
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
              className="py-2 px-3 mb-1 bg-blue-500 rounded-2xl flex items-center justify-center"
              onPress={async () => {
                if (!admin || !member) return;

                // 1) roomId'yi cache'den al; yoksa fetch et ve cache'e yaz
                const roomId = await qc.ensureQueryData({
                  queryKey: MSG_KEYS.roomIdByUsers(
                    admin.username,
                    member.username,
                  ),
                  queryFn: () =>
                    getRoomIdByUsers(admin.username, member.username),
                });

                // 2) roomId 0 ise yeni oda id'si çek
                const finalRoomId =
                  roomId !== 0 ? roomId : (await getNextRoomId()).data; // getNextRoomId -> Promise<{data:number}>

                navigation.navigate('Chat', {
                  roomId: finalRoomId,
                  sender: admin.username,
                  receiver: member,
                  fromNotification: false,
                });
              }}>
              <Text
                className="font-rubik text-md"
                style={{color: colors.background.secondary}}>
                Sohbet
              </Text>
            </TouchableOpacity>
          </View>
          {lastMessage && !lastMessage.message.startsWith('dailyStatus') && (
            <Text
              className="font-rubik text-md"
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
        {!allLoading ? (
          !accessAuthorized ? (
            <View
              className="p-3 rounded-2xl"
              style={{backgroundColor: colors.background.primary}}>
              <Text className="ml-2 text-lg font-rubik">
                Veriler görüntülenemiyor.
              </Text>
              <Text className="ml-2 text-md font-rubik mt-1">
                Kullanıcının verilerine erişebilmek için gerekli onaylar
                bulunmamaktadır.
              </Text>
              {/* <Text className="ml-2 text-md font-rubik mt-1">
                Veri paylaşımı için gerekli onaylar verilmemiş.
              </Text> */}
            </View>
          ) : (
            <>
              {!isProgressLoading && weeklyExerciseProgress && (
                <View
                  className="flex flex-col px-3 py-3 mb-3 pb-4"
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
                      className="font-rubik mb-3 rounded-2xl py-2 px-3"
                      style={{
                        fontSize: 16,
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
                  />
                </View>
              )}
              {!isSymptomsLoading && (
                <View
                  onLayout={e => setSymptomsSectionY(e.nativeEvent.layout.y)}
                  className="flex flex-col pb-2 pt-1 px-5 mb-3"
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
                  ) : (
                    <Text
                      className="font-rubik pt-2"
                      style={{fontSize: 18, color: colors.text.primary}}>
                      Bulgu Kaydı Bulunamadı
                    </Text>
                  )}
                  <TouchableOpacity
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
                  )}
                </View>
              )}
              {!isSessionsLoading && (
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
              )}
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
