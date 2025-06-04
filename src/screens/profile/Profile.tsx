import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  PermissionsAndroid,
  TextInput,
  RefreshControl,
  InteractionManager,
  BackHandler,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import icons from '../../constants/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Avatar} from 'react-native-elements';
import CustomAvatar from '../../components/CustomAvatar';
import {useTheme} from '../../themes/ThemeProvider';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {PERMISSIONS, requestMultiple} from 'react-native-permissions';
import LanPortScanner, {LSScanConfig} from 'react-native-lan-port-scanner';
import {
  getAggreagtedActiveCaloriesBurned,
  getAggreagtedSteps,
  getAllSleepSessions,
  getHeartRate,
  getTotalCaloriesBurned,
  getTotalSleepHours,
} from '../../health/healthConnectService';
import {RecordType} from 'react-native-health-connect';
import {Picker} from '@react-native-picker/picker';
import ProgressBar from '../../components/ProgressBar';
import HeartRateSimpleChart from './chart';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const Profile = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const {colors} = useTheme();

  const [networkInfo, setNetworkInfo] = useState();

  const [refreshing, setRefreshing] = useState(false);

  const [logs, setLogs] = useState('');

  const [recordType, setRecordType] = useState<RecordType>('Steps');
  const [heartRate, setHeartRate] = useState(0);
  const [steps, setSteps] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [activeCalories, setActiveCalories] = useState(0);
  const [totalSleepHours, setTotalSleepHours] = useState(0);
  const [sleepSessions, setSleepSessions] = useState<
    {start: string; end: string; durationHours: number}[]
  >([]);

  // TO DO There should be a favorite color to use it on username

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      const user: User = JSON.parse(userData!);
      setUser(user);
    };

    fetchUser();
  }, []);

  const fetchAll = async () => {
    try {
      const [hr, as, tc, aac, sh, ss] = await Promise.all([
        getHeartRate(),
        // getSteps(),
        getAggreagtedSteps(),
        getTotalCaloriesBurned(),
        // getActiveCaloriesBurned(),
        getAggreagtedActiveCaloriesBurned(),
        getTotalSleepHours(),
        getAllSleepSessions(),
        // getMockSleepSessions(),
      ]);
      setHeartRate(hr);
      setSteps(as);
      setTotalCalories(tc);
      setActiveCalories(Math.floor(aac));
      setTotalSleepHours(sh);
      setSleepSessions(ss.reverse());
    } catch (e) {
      console.warn('HealthConnect fetch error', e);
    }
  };

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

      return () => backHandler.remove(); // Ekrandan çıkınca event listener'ı kaldır
    }, []),
  );

  // useFocusEffect(
  //   useCallback(() => {
  //     setRefreshing(true);
  //     const timeout = setTimeout(() => {
  //       fetchAll().finally(() => setRefreshing(false));
  //     }, 300); // 300ms bekletmek UI'yı rahatlatır
  //     return () => clearTimeout(timeout);
  //   }, []),
  // );

  useFocusEffect(
    // useCallback(() => {
    //   const task = InteractionManager.runAfterInteractions(() => {
    //     fetchAll();
    //   });
    //   return () => task.cancel();
    // }, []),
    useCallback(() => {
      fetchAll();
    }, []),
  );

  // useEffect(() => {
  //   const task = InteractionManager.runAfterInteractions(() => {
  //     const unsubscribe = navigation.addListener('focus', () => {
  //       fetchAll();
  //     });

  //     return unsubscribe;
  //   });
  //   return () => task.cancel();
  // }, [navigation]);

  // useEffect(() => {
  //   fetchAll();
  // }, []);

  return (
    <>
      <View
        className="flex flex-row pt-14 pr-5"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'space-between',
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Profil
        </Text>
        <TouchableOpacity
          className="mr-1"
          onPress={() => {
            navigation.navigate('Settings');
          }}>
          <Image
            source={icons.settings}
            className="size-9"
            tintColor={colors.text.primary}
          />
        </TouchableOpacity>
      </View>
      <View
        className="h-full px-3 pt-3"
        style={{
          backgroundColor: colors.background.secondary,
        }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 250,
            // paddingTop: insets.top / 2,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAll();
                setRefreshing(false);
              }}
              progressBackgroundColor={colors.background.secondary}
              colors={[colors.primary[300]]} // Android (array!)
              tintColor={colors.primary[300]}
            />
          }>
          <View
            className="flex flex-col rounded-2xl"
            style={{backgroundColor: colors.background.primary}}>
            <View className="flex flex-col justify-center pl-5 pr-4 py-3">
              <View className="flex flex-row justify-between">
                <MaskedView
                  maskElement={
                    <Text
                      className="font-rubik-medium text-2xl"
                      style={{
                        backgroundColor: 'transparent',
                      }}>
                      {user?.username}
                    </Text>
                  }>
                  <LinearGradient
                    colors={[colors.primary[300], '#40E0D0']} // mavi → turkuaz
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    <Text
                      className="font-rubik-medium text-2xl"
                      style={{
                        opacity: 0, // metni sadece maskeye çevirdik
                      }}>
                      {user?.username}
                    </Text>
                  </LinearGradient>
                </MaskedView>
                <View className="flex flex-row">
                  <Image
                    source={icons.badge1_colorful_bordered}
                    className="size-8 mr-2"
                  />
                  <Image
                    source={icons.badge1_colorful}
                    className="size-8 mr-2"
                  />
                  <Image
                    source={icons.badge1}
                    tintColor={colors.text.primary} // Eğer renkli değilse tintColor verilsin
                    className="size-8"
                  />
                </View>
              </View>
              {/* <Text className="text-xl font-rubik">Bilgiler: {user?.username}</Text>
          <Text className="text-xl font-rubik">İsim Soyisim</Text> */}
              <Text
                className="text-xl font-rubik pt-3"
                style={{color: colors.text.primary}}>
                Yaş: {user?.id}
              </Text>
            </View>
            {/* Buraya dğer bilgiler, rozetler falan filan */}
          </View>
          {/* Grafik minimalistik olsun yanında ortalama değer olsun, sağ üstte de son okunan değer varsa yazsın */}
          {/* <HeartRateSimpleChart/> */}
          <View
            className="flex flex-col py-2 px-5 rounded-2xl mt-3"
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
              value={heartRate}
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
              value={activeCalories}
              label="Yakılan Kalori"
              iconSource={icons.kcal}
              color="#FF9900"></ProgressBar>
            <ProgressBar
              value={steps}
              label="Adım"
              iconSource={icons.man_walking}
              color="#FDEF22"></ProgressBar>
            <ProgressBar
              value={totalSleepHours}
              label="Uyku"
              iconSource={icons.sleep}
              color="#FDEF22"></ProgressBar>
            {sleepSessions.length > 0 && (
              <Text
                className="font-rubik text-xl pt-4"
                style={{color: colors.text.primary}}>
                Uyku Devreleri
              </Text>
            )}
            {sleepSessions.map((session, index) => (
              <View key={index} className="mt-3">
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  💤 Başlangıç:{' '}
                  {new Date(session.start).toLocaleString('tr-TR')}
                </Text>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  🌅 Bitiş: {new Date(session.end).toLocaleString('tr-TR')}
                </Text>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  ⏱ Süre: {session.durationHours} saat
                </Text>
              </View>
            ))}
            {/* Uyku da minimalist bir grafik ile gösterilsin */}
          </View>
          <View className="flex flex-row items-center justify-between mt-3">
            <TouchableOpacity
              className="flex flex-row justify-center items-center px-5 py-3 rounded-2xl"
              style={{backgroundColor: colors.background.primary}}>
              <MaskedView
                maskElement={
                  <Text
                    className="text-xl font-rubik"
                    style={{
                      backgroundColor: 'transparent',
                    }}>
                    Bulgu Ekle
                  </Text>
                }>
                <LinearGradient
                  colors={['#0EC946', 'white']} // mavi → turkuaz
                  start={{x: 0, y: 0}}
                  end={{x: 2, y: 2}}>
                  <Text
                    className="text-xl font-rubik"
                    style={{
                      opacity: 0,
                    }}>
                    Bulgu Ekle
                  </Text>
                </LinearGradient>
              </MaskedView>
              <Image
                source={icons.plus_sign_green}
                tintColor="#78f39e"
                className="ml-3 size-6"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default Profile;
