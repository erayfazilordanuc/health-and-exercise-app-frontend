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
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import {isKvkkRequiredError} from '../../api/errors/errors';
import {useAdminSymptomsByUserIdAndDate} from '../../hooks/symptomsQueries';

const Member = () => {
  type MemberRouteProp = RouteProp<GroupsStackParamList, 'Member'>;
  const {params} = useRoute<MemberRouteProp>();
  const {memberId, fromNotification} = params;
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const {colors, theme} = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const {user: admin} = useUser();
  const [member, setMember] = useState<User | null>();
  // const [symptoms, setSymptoms] = useState<Symptoms | null>();
  const {
    data: symptoms,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAdminSymptomsByUserIdAndDate(memberId, new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>();
  const [kvkkApproved, setKvkkApproved] = useState(true);
  const [weeklyExerciseProgress, setWeeklyExersiseProgress] = useState<
    ExerciseProgressDTO[]
  >([]);

  const fetchLastMessage = async (member: User) => {
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

  // const fetchSymptoms = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await adminGetSymptomsByUserIdAndDate(
  //       memberId,
  //       new Date(),
  //     );
  //     if (response.status === 200) {
  //       const symptoms: Symptoms = response.data;
  //       checkAndSetSymptoms(symptoms);
  //     }
  //   } catch (error) {
  //     if (isKvkkRequiredError(error)) setKvkkApproved(false);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const weeklyExerciseProgress: ExerciseProgressDTO[] =
        await getWeeklyActiveDaysProgressByUserId(memberId);
      setWeeklyExersiseProgress(weeklyExerciseProgress);
    } catch (error) {
      if (isKvkkRequiredError(error)) setKvkkApproved(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberAndSet = async () => {
    try {
      const member = await getUserById(memberId);
      if (member) {
        setMember(member);
        fetchLastMessage(member as User);
      }
    } catch (e) {
      console.error('Group screen load error', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (member) fetchLastMessage(member);
    }, [member]),
  );

  useEffect(() => {
    fetchProgress();
    // fetchSymptoms();
    fetchMemberAndSet();
  }, [memberId]);

  // const checkAndSetSymptoms = (newSymptoms: Symptoms) => {
  //   let isUpdated = false;
  //   if (symptoms) {
  //     if (newSymptoms.pulse && symptoms.pulse! !== newSymptoms.pulse) {
  //       isUpdated = true;
  //     }
  //     if (newSymptoms.steps && symptoms.steps !== newSymptoms.steps) {
  //       isUpdated = true;
  //     }
  //     if (
  //       newSymptoms.activeCaloriesBurned &&
  //       symptoms.activeCaloriesBurned !== newSymptoms.activeCaloriesBurned
  //     ) {
  //       isUpdated = true;
  //     }
  //     if (
  //       newSymptoms.sleepMinutes &&
  //       symptoms.sleepMinutes !== newSymptoms.sleepMinutes
  //     ) {
  //       isUpdated = true;
  //     }
  //   } else {
  //     isUpdated = true;
  //   }

  //   if (isUpdated) setSymptoms(newSymptoms);
  // };

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
        contentContainerClassName="pb-24"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchLastMessage(member!);
              refetch();
              // await fetchSymptoms();
              await fetchProgress();
              setRefreshing(false);
            }}
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
                if (admin && member) {
                  const response = await isRoomExistBySenderAndReceiver(
                    admin.username,
                    member.username,
                  );
                  if (response && response.status === 200) {
                    const roomId = response.data;
                    if (roomId !== 0) {
                      navigation.navigate('Chat', {
                        roomId: roomId,
                        sender: admin?.username,
                        receiver: member,
                        fromNotification: false,
                      });
                    } else {
                      const nextRoomResponse = await getNextRoomId();
                      if (nextRoomResponse.status === 200) {
                        const nextRoomId = nextRoomResponse.data;
                        navigation.navigate('Chat', {
                          roomId: nextRoomId,
                          sender: admin.username,
                          receiver: member,
                          fromNotification: false,
                        });
                      }
                    }
                  }
                }
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

        {loading ? (
          <View className="flex flex-row items-center justify-center w-full">
            <ActivityIndicator
              className="mt-7 self-center"
              size="large"
              color={colors.text.secondary} // {colors.primary[300] ?? colors.primary}
            />
          </View>
        ) : !kvkkApproved ? (
          <View
            className="p-3 rounded-2xl"
            style={{backgroundColor: colors.background.primary}}>
            <Text className="ml-2 text-lg font-rubik">
              Hastanın sağlık verileri görüntülenemiyor.
            </Text>
            <Text className="ml-2 text-md font-rubik mt-1">
              Sağlık verileri paylaşımı için gerekli onaylar verilmemiş.
            </Text>
          </View>
        ) : (
          <>
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
              {weeklyExerciseProgress && (
                <CustomWeeklyProgressCalendar
                  weeklyProgressPercents={weeklyExerciseProgress.map(
                    calcPercent,
                  )}
                />
              )}
            </View>

            <View
              className="flex flex-col pb-2 pt-1 px-5"
              style={{
                borderRadius: 17,
                backgroundColor: colors.background.primary,
              }}>
              <Text
                className="font-rubik pt-2"
                style={{fontSize: 18, color: colors.text.primary}}>
                Bulgular
              </Text>
              {/* <ProgressBar
            value={93}
            label="Genel sağlık"
            iconSource={icons.better_health}
            color="#41D16F"
          /> */}
              {/*heartRate != 0 && Burada eğer veri yoksa görünmeyebilir */}
              <ProgressBar
                value={symptoms?.pulse}
                label="Nabız"
                iconSource={icons.pulse}
                color="#FF3F3F"
              />
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
                  symptoms?.sleepMinutes ? symptoms?.sleepMinutes : undefined
                }
                label="Uyku"
                iconSource={icons.sleep}
                color="#FDEF22"
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Member;
