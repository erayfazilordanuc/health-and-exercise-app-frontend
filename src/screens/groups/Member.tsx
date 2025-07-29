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
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
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

const Member = () => {
  type MemberRouteProp = RouteProp<GroupsStackParamList, 'Member'>;
  const {params} = useRoute<MemberRouteProp>();
  const {memberId, fromNotification} = params;
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {user: admin} = useUser();
  const [member, setMember] = useState<User | null>();
  const [symptoms, setSymptoms] = useState<Symptoms | null>();
  const [refreshing, setRefreshing] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>();
  const [isExerciseModalVisible, setIsExerciseModalVisible] = useState(false);

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

  const checkAndSetSymptoms = (newSymptoms: Symptoms) => {
    let isUpdated = false;
    if (symptoms) {
      if (newSymptoms.pulse && symptoms.pulse! !== newSymptoms.pulse) {
        isUpdated = true;
      }
      if (newSymptoms.steps && symptoms.steps !== newSymptoms.steps) {
        isUpdated = true;
      }
      if (
        newSymptoms.activeCaloriesBurned &&
        symptoms.activeCaloriesBurned !== newSymptoms.activeCaloriesBurned
      ) {
        isUpdated = true;
      }
      if (
        newSymptoms.sleepHours &&
        symptoms.sleepHours !== newSymptoms.sleepHours
      ) {
        isUpdated = true;
      }
      if (newSymptoms.sleepSessions) isUpdated = true;
    } else {
      isUpdated = true;
    }

    if (isUpdated) setSymptoms(newSymptoms);
  };

  const fetchSymptoms = async () => {
    const response = await adminGetSymptomsByUserIdAndDate(
      memberId,
      new Date(),
    );
    if (response.status === 200) {
      const symptoms: Symptoms = response.data;
      checkAndSetSymptoms(symptoms);
    }
  };

  const fetchLastMessage = async (member: User) => {
    if (!admin) return;

    const lastMessage: Message = await getLastMessageBySenderAndReceiver(
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

  useFocusEffect(
    useCallback(() => {
      fetchSymptoms();
      if (member) fetchLastMessage(member);
    }, []),
  );

  useEffect(() => {
    let isActive = true;

    const loadAll = async () => {
      try {
        const member = await getUserById(memberId);
        if (!isActive) return;
        setMember(member);

        await fetchLastMessage(member as User);
      } catch (e) {
        console.error('Group screen load error', e);
      }
    };

    loadAll();

    return () => {
      isActive = false;
    };
  }, [memberId]);

  return (
    <ScrollView
      style={{paddingTop: insets.top * 1.3}}
      className="flex-1 px-3"
      contentContainerClassName="pb-32"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchSymptoms();
            setRefreshing(false);
          }}
          progressBackgroundColor={colors.background.secondary}
          colors={[colors.primary[300]]} // Android (array!)
          tintColor={colors.primary[300]}
        />
      }>
      <View
        className="pb-3"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <Text
          className="pl-4 font-rubik-semibold pr-7"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Hasta:{'  '}
          <Text style={{color: colors.primary[200]}}>
            {member && member.fullName ? member.fullName : ''}
          </Text>
        </Text>
      </View>
      <View
        className="flex flex-column justify-start rounded-2xl pl-5 p-3 mb-3" // border
        style={{
          backgroundColor: colors.background.primary,
          borderColor: colors.primary[300],
        }}>
        <Text
          className="font-rubik-medium"
          style={{fontSize: 20, color: colors.text.primary}}>
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
        className="flex flex-column justify-start rounded-2xl pl-5 p-3 mb-3"
        style={{
          backgroundColor: colors.background.primary,
        }}>
        <View className="flex flex-row justify-between">
          {lastMessage && !lastMessage.message.startsWith('dailyStatus') && (
            <Text
              className="font-rubik text-2xl mt-1"
              style={{color: colors.primary[200]}}>
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
              className="font-rubik text-lg"
              style={{color: colors.background.secondary}}>
              Sohbet
            </Text>
          </TouchableOpacity>
        </View>
        {lastMessage && !lastMessage.message.startsWith('dailyStatus') && (
          <Text
            className="font-rubik text-lg"
            style={{color: colors.text.primary}}>
            {lastMessage.receiver === admin?.username
              ? member?.fullName + ' : ' + lastMessage.message
              : 'Siz : ' + lastMessage.message}
          </Text>
        )}
      </View>
      <View
        className="flex flex-column justify-center rounded-2xl pl-5 p-3 mb-3"
        style={{
          backgroundColor: colors.background.primary,
        }}>
        <View className="flex flex-row items-center justify-between">
          <Text
            className="font-rubik text-2xl"
            style={{color: colors.text.primary}}>
            Başarımlar ve İlerleme
          </Text>
          <TouchableOpacity
            className="py-2 px-10 bg-blue-500 rounded-2xl flex items-center justify-center"
            onPress={() => {
              navigation.navigate('Progress', {member: member});
            }}>
            {/* <Text
              className="font-rubik text-lg"
              style={{color: colors.background.secondary}}>
              Detay
            </Text> */}
            <Image
              source={icons.arrow}
              className="size-4"
              tintColor={colors.background.secondary}
            />
          </TouchableOpacity>
        </View>
        {/* <Text
          className="font-rubik text-lg mt-3"
          style={{color: colors.text.primary}}>
          Hastanın tamamladığı ve devam eden egzersizlerini inceleyin.
        </Text> */}
      </View>
      <View
        className="flex flex-col pb-2 pt-1 px-5 rounded-2xl"
        style={{backgroundColor: colors.background.primary}}>
        <Text
          className="font-rubik text-2xl pt-2 pb-3"
          style={{color: colors.text.primary}}>
          Bulgular
        </Text>
        <ProgressBar
          value={93}
          label="Genel sağlık"
          iconSource={icons.better_health}
          color="#41D16F"></ProgressBar>
        {/*heartRate != 0 && Burada eğer veri yoksa görünmeyebilir */}
        <ProgressBar
          value={symptoms?.pulse}
          label="Nabız"
          iconSource={icons.pulse}
          color="#FF3F3F"></ProgressBar>
        <ProgressBar
          value={96}
          label="O2 Seviyesi"
          iconSource={icons.o2sat}
          color="#2CA4FF"></ProgressBar>
        {/* <ProgressBar
            value={83}
            label="Tansiyon"
            iconSource={icons.blood_pressure}
            color="#FF9900"></ProgressBar> FDEF22*/}
        <ProgressBar
          value={
            symptoms?.activeCaloriesBurned
              ? symptoms?.activeCaloriesBurned
              : undefined
          }
          label="Yakılan Kalori"
          iconSource={icons.kcal}
          color="#FF9900"></ProgressBar>
        <ProgressBar
          value={symptoms?.steps}
          label="Adım"
          iconSource={icons.man_walking}
          color="#FDEF22"></ProgressBar>
        <ProgressBar
          value={symptoms?.sleepHours ? symptoms?.sleepHours : undefined}
          label="Uyku"
          iconSource={icons.sleep}
          color="#FDEF22"></ProgressBar>
        {symptoms &&
          symptoms.sleepSessions &&
          symptoms.sleepSessions.length > 0 &&
          symptoms.sleepSessions[0] !== '' && (
            <>
              <Text
                className="font-rubik text-xl pt-4"
                style={{color: colors.text.primary}}>
                Uyku Devreleri
              </Text>
              {symptoms.sleepSessions.map((session, index) => (
                <View key={index} className="mt-3">
                  <Text
                    className="font-rubik text-lg"
                    style={{color: colors.text.primary}}>
                    💤 Başlangıç: {session}
                  </Text>
                </View>
              ))}
            </>
          )}
        {/* Uyku da minimalist bir grafik ile gösterilsin */}
      </View>
    </ScrollView>
  );
};

export default Member;
