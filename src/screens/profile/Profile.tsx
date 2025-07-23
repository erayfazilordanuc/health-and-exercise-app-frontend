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
  ActivityIndicator,
  Modal,
  ToastAndroid,
  Alert,
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
  getAggregatedActiveCaloriesBurned,
  getAggregatedSteps,
  getAllSleepSessions,
  getHeartRate,
  getSymptoms,
  getTotalCaloriesBurned,
  getTotalSleepHours,
  initializeHealthConnect,
  saveAndGetSymptoms,
} from '../../api/health/healthConnectService';
import {RecordType} from 'react-native-health-connect';
import {Picker} from '@react-native-picker/picker';
import ProgressBar from '../../components/ProgressBar';
import HeartRateSimpleChart from './chart';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import {getUser} from '../../api/user/userService';
import GradientText from '../../components/GradientText';
import {HealthService} from '../../api/health/abstraction/healthService';
import {upsertSymptomsByDate} from '../../api/symptoms/symptomsService';
import {Float} from 'react-native/Libraries/Types/CodegenTypes';
import {Linking} from 'react-native';
import CustomAlert from '../../components/CustomAlert';

const Profile = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const {colors} = useTheme();

  const [networkInfo, setNetworkInfo] = useState();

  const [refreshing, setRefreshing] = useState(false);

  const [logs, setLogs] = useState('');

  const [heartRate, setHeartRate] = useState(0);
  const [steps, setSteps] = useState(0);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [activeCaloriesBurned, setActiveCaloriesBurned] = useState(0);
  const [totalSleepHours, setTotalSleepHours] = useState(0);
  const [sleepSessions, setSleepSessions] = useState<String[]>([]);

  const [isHealthConnectAvailable, setIsHealthConnectAvailable] =
    useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addModalFunction, setAddModalFunction] = useState<{
    setSymptom?: React.Dispatch<React.SetStateAction<number>>;
  }>({});
  const [addModalValue, setAddModalValue] = useState<Float>();
  const [showDetail, setShowDetail] = useState(false);
  const [showHCAlert, setShowHCAlert] = useState(false);

  const [symptoms, setSymptoms] = useState<Symptoms>();

  const [healthConnectSymptoms, setHealthConnectSymptoms] =
    useState<Symptoms>();

  const [loading, setLoading] = useState(false);

  const today = new Date();

  // TO DO There should be a favorite color pair to use it on username

  const calculateAge = () => {
    if (user && user.birthDate) {
      const birthDate = new Date(user.birthDate);
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

  useEffect(() => {
    const fetchUser = async () => {
      const user: User = await getUser();
      if (user) setUser(user);
    };

    fetchUser();
  }, []);

  const checkAndSetSymptomsLegacy = (symptoms: Symptoms) => {
    if (symptoms) {
      if (symptoms.pulse && heartRate !== symptoms.pulse) {
        setHeartRate(symptoms.pulse);
      }
      if (symptoms.steps && steps !== symptoms.steps) {
        setSteps(symptoms.steps);
      }
      if (
        symptoms.activeCaloriesBurned &&
        activeCaloriesBurned !== symptoms.activeCaloriesBurned
      ) {
        setActiveCaloriesBurned(symptoms.activeCaloriesBurned);
      }
      if (symptoms.sleepHours && totalSleepHours !== symptoms.sleepHours) {
        setTotalSleepHours(symptoms.sleepHours);
      }
      if (symptoms.sleepSessions)
        setSleepSessions(symptoms.sleepSessions.reverse());
    }
  };

  const fetchAndUpsertAll = async () => {
    if (user && user.role === 'ROLE_USER') {
      // Fetching from cache first in order to prevent flickering
      const key = 'symptoms_' + new Date().toISOString().slice(0, 10);
      const localData = await AsyncStorage.getItem(key);
      if (localData) {
        const localSymptoms: Symptoms = JSON.parse(localData);
        checkAndSetSymptomsLegacy(localSymptoms);
      }

      const isHealthConnectReady = await initializeHealthConnect();
      if (!isHealthConnectReady) {
        console.log('Health connect permissions not fully granted.');
        return;
      }

      setIsHealthConnectAvailable(true);
      console.log('All health permissions granted. Ready to collect data.');

      const symptoms = await saveAndGetSymptoms();

      if (symptoms) {
        checkAndSetSymptomsLegacy(symptoms);
        setSymptoms(symptoms);
      }

      const healthConnectSymptoms = await getSymptoms();

      if (healthConnectSymptoms) {
        setHealthConnectSymptoms(healthConnectSymptoms);
      }
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

      return () => backHandler.remove();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      fetchAndUpsertAll();
    }, [user]),
  );

  const bulguMap = new Map<
    React.Dispatch<React.SetStateAction<number>> | undefined,
    string
  >([
    [setHeartRate, 'Nabız'],
    [setSteps, 'Adım Sayısı'],
    [setActiveCaloriesBurned, 'Yakılan Kalori'],
    [setTotalSleepHours, 'Uyku'],
    [undefined, 'Bulgu'], // fallback
  ]);
  const getBulguLabel = () =>
    bulguMap.get(addModalFunction?.setSymptom) ?? 'Bulgu';

  return (
    <>
      <View
        className="flex flex-row pt-14 pr-5"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'space-between',
          paddingTop: insets.top * 1.3,
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Profil {user?.role === 'ROLE_ADMIN' ? ' (Hemşire)' : ''}
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
        {/* TO DO Eğer admin ise bulgu kısmı olmasın */}
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
                fetchAndUpsertAll();
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
                <GradientText
                  className="font-rubik-medium text-2xl"
                  start={{x: 0, y: 0}}
                  end={{x: 0.7, y: 0}}
                  colors={[colors.primary[300], '#40E0D0']}>
                  {user?.fullName}
                </GradientText>
                {user && user.role === 'ROLE_USER' ? (
                  <View className="flex flex-row">
                    <Image source={icons.patient} className="size-9 mr-2" />
                    {/* <Image
                      source={icons.badge1_colorful_bordered}
                      className="size-8 mr-2"
                    /> */}
                    {/* <Image
                      source={icons.badge1_colorful}
                      className="size-8 mr-2"
                    />
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
                      className="size-9 mr-2"
                      tintColor={colors.text.primary}
                    />
                  </View>
                )}
              </View>
              <Text
                className="text-xl font-rubik pt-3"
                style={{color: colors.text.primary}}>
                Kullanıcı Adı: {user?.username}
              </Text>
              <Text
                className="text-xl font-rubik pt-3"
                style={{color: colors.text.primary}}>
                Yaş: {calculateAge()}
              </Text>
              {showDetail && (
                <Text
                  className="text-xl font-rubik pt-3"
                  style={{color: colors.text.primary}}>
                  Doğum Tarihi:{' '}
                  {new Date(user?.birthDate!).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              )}
              {showDetail && (
                <Text
                  className="text-xl font-rubik pt-3"
                  style={{color: colors.text.primary}}>
                  Cinsiyet: {user?.gender === 'male' ? 'Erkek' : 'Kadın'}
                </Text>
              )}
              <View className="flex flex-row items-center justify-end">
                <TouchableOpacity
                  className="py-3 px-3"
                  style={{
                    backgroundColor: colors.primary[200],
                    borderRadius: 18,
                  }}
                  onPress={() => {
                    setShowDetail(!showDetail);
                  }}>
                  <Text style={{color: colors.background.primary}}>
                    {showDetail ? 'Detayları Gizle' : 'Detayları Göster'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Buraya dğer bilgiler, rozetler falan filan */}
          </View>
          {/* Grafik minimalistik olsun yanında ortalama değer olsun, sağ üstte de son okunan değer varsa yazsın */}
          {/* <HeartRateSimpleChart/> */}
          {user && user.role === 'ROLE_USER' && (
            <>
              <View
                className="flex flex-col py-2 px-5 rounded-2xl mt-3"
                style={{backgroundColor: colors.background.primary}}>
                <View className="flex flex-row justify-between items-center pt-2 pb-3">
                  <Text
                    className="font-rubik text-2xl"
                    style={{color: colors.text.primary}}>
                    Bulgular
                  </Text>
                  {isHealthConnectAvailable ? (
                    <View
                      className="flex flex-row rounded-2xl items-center"
                      style={{backgroundColor: colors.background.primary}}>
                      <Text style={{color: '#16d750'}}>Bağlı</Text>
                      <Image
                        source={icons.wearable}
                        className="ml-2 size-7"
                        tintColor={'#16d750'}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="flex flex-row py-3 pl-4 pr-3 rounded-2xl items-center"
                      style={{backgroundColor: colors.background.secondary}}
                      onPress={() => {
                        setShowHCAlert(true);
                      }}>
                      <Text style={{color: colors.text.primary}}>
                        Saat ile bağla
                      </Text>
                      <Image
                        source={icons.wearable}
                        className="ml-2 size-7"
                        tintColor={colors.text.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <ProgressBar
                  value={93}
                  label="Genel Sağlık"
                  iconSource={icons.better_health}
                  color="#41D16F"
                  updateDisabled={true}
                />
                {/*heartRate != 0 && Burada eğer veri yoksa görünmeyebilir */}
                <ProgressBar
                  value={heartRate}
                  label="Nabız"
                  iconSource={icons.pulse}
                  color="#FF3F3F"
                  setAddModalFunction={setAddModalFunction}
                  setSymptom={setHeartRate}
                  onAdd={setIsAddModalVisible}
                  updateDisabled={
                    healthConnectSymptoms?.pulse &&
                    healthConnectSymptoms?.pulse > 0
                      ? true
                      : false
                  }
                />
                <ProgressBar
                  // Düzenlenecek
                  value={96}
                  label="O2 Seviyesi"
                  iconSource={icons.o2sat}
                  color="#2CA4FF"
                  // updateDisabled={symptoms?.o2Level && healthConnectSymptoms?.o2Level > 0 ? true : false}
                />
                {/* <ProgressBar
                  value={83}
                  label="Tansiyon"
                  iconSource={icons.blood_pressure}
                  color="#FF9900"
                /> */}
                {/* FDEF22 */}
                <ProgressBar
                  value={activeCaloriesBurned}
                  label="Yakılan Kalori"
                  iconSource={icons.kcal}
                  color="#FF9900"
                  setAddModalFunction={setAddModalFunction}
                  setSymptom={setActiveCaloriesBurned}
                  onAdd={setIsAddModalVisible}
                  updateDisabled={
                    healthConnectSymptoms?.activeCaloriesBurned &&
                    healthConnectSymptoms?.activeCaloriesBurned > 0
                      ? true
                      : false
                  }
                />
                <ProgressBar
                  value={steps}
                  label="Adım"
                  iconSource={icons.man_walking}
                  color="#FDEF22"
                  setAddModalFunction={setAddModalFunction}
                  setSymptom={setSteps}
                  onAdd={setIsAddModalVisible}
                  updateDisabled={
                    healthConnectSymptoms?.steps &&
                    healthConnectSymptoms?.steps > 0
                      ? true
                      : false
                  }
                />
                <ProgressBar
                  value={totalSleepHours}
                  label="Uyku"
                  iconSource={icons.sleep}
                  color="#FDEF22"
                  setAddModalFunction={setAddModalFunction}
                  setSymptom={setTotalSleepHours}
                  onAdd={setIsAddModalVisible}
                  updateDisabled={
                    healthConnectSymptoms?.sleepHours &&
                    healthConnectSymptoms?.sleepHours > 0
                      ? true
                      : false
                  }
                />
                {sleepSessions.length > 0 && sleepSessions[0] !== '' && (
                  <>
                    <Text
                      className="font-rubik text-xl pt-4"
                      style={{color: colors.text.primary}}>
                      Uyku Devreleri
                    </Text>

                    {sleepSessions.map((session, index) => (
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
            </>
          )}

          <CustomAlert
            message={
              'Devam etmek için Health Connect uygulamasını indirmeniz gerekiyor. Şimdi Play Store’a gitmek istiyor musunuz?'
            }
            isPositive={true}
            visible={showHCAlert}
            onYes={() => {
              Linking.openURL(
                'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata',
              ).catch(err =>
                console.warn('Failed to open Health Connect page:', err),
              );
              setShowHCAlert(false);
            }}
            onYesText={`Play Store'a Git`}
            onCancel={() => {
              setShowHCAlert(false);
            }}
            onCancelText="Vazgeç"
          />

          <Modal
            transparent={true}
            visible={isAddModalVisible}
            animationType="fade"
            onRequestClose={() => setIsAddModalVisible(false)}>
            <View className="flex-1 justify-center items-center bg-black/50">
              <View
                className="w-4/5 rounded-xl p-5 py-6 items-center"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="text-lg font-bold mb-4 text-center"
                  style={{color: colors.text.primary}}>
                  {getBulguLabel()}
                </Text>
                <View
                  className="flex flex-row items-center justify-start z-50 rounded-2xl mb-4"
                  style={{
                    backgroundColor: colors.background.secondary,
                  }}>
                  <TextInput
                    placeholderTextColor={'gray'}
                    selectionColor={'#7AADFF'}
                    keyboardType="decimal-pad"
                    value={
                      addModalValue
                        ? addModalValue?.toString()
                        : addModalValue === 0
                        ? ''
                        : ''
                    }
                    onChangeText={(value: string) => {
                      const onlyNumbers = value.replace(/[^0-9.,]/g, '');
                      const normalized = onlyNumbers.replace(',', '.');
                      const numericValue = parseFloat(normalized) || 0;
                      setAddModalValue(numericValue);
                    }}
                    placeholder="Bulgu değeri"
                    className="text-lg font-rubik ml-5 flex-1"
                    style={{color: colors.text.primary}}
                  />
                </View>
                <View className="flex-row justify-between w-full">
                  {!loading ? (
                    <>
                      <TouchableOpacity
                        onPress={async () => {
                          setLoading(true);
                          if (addModalValue) {
                            addModalFunction?.setSymptom?.(addModalValue);

                            // Güncellenmiş symptoms objesi
                            const updatedSymptoms: Symptoms = {
                              ...symptoms,
                            };

                            // Dinamik olarak hangisini güncellemek istiyorsan ona koy
                            if (addModalFunction?.setSymptom === setHeartRate) {
                              updatedSymptoms.pulse = addModalValue;
                            } else if (
                              addModalFunction?.setSymptom === setSteps
                            ) {
                              updatedSymptoms.steps = addModalValue;
                            } else if (
                              addModalFunction?.setSymptom ===
                              setActiveCaloriesBurned
                            ) {
                              updatedSymptoms.activeCaloriesBurned =
                                addModalValue;
                            } else if (
                              addModalFunction?.setSymptom ===
                              setTotalSleepHours
                            ) {
                              updatedSymptoms.sleepHours = addModalValue;
                            }

                            // Güncellenmiş veriyi kaydet
                            await saveAndGetSymptoms(updatedSymptoms);

                            // Modalı kapat
                            setIsAddModalVisible(false);
                          } else {
                            ToastAndroid.show(
                              'Lütfen bir değer giriniz.',
                              ToastAndroid.SHORT,
                            );
                          }
                          setLoading(false);
                        }}
                        className="flex-1 p-2 rounded-xl items-center mx-1"
                        style={{backgroundColor: '#0EC946'}}>
                        <Text className="text-base font-bold text-white">
                          Güncelle
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setIsAddModalVisible(false)}
                        className="flex-1 p-2 rounded-xl items-center mx-1"
                        style={{backgroundColor: colors.background.secondary}}>
                        <Text
                          className="text-base font-bold"
                          style={{color: colors.text.primary}}>
                          İptal
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View className="flex flex-row items-center justify-center w-full">
                      <ActivityIndicator
                        className="mt-2 self-center"
                        size="large"
                        color="#16d750" // {colors.primary[300] ?? colors.primary}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>
    </>
  );
};

export default Profile;
