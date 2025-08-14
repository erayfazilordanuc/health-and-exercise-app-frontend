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
  Platform,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
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
  checkGoogleFitInstalled,
  checkHealthConnectInstalled,
  computeHealthScore,
  getAggregatedActiveCaloriesBurned,
  getAggregatedSteps,
  getAllSleepSessions,
  getHeartRate,
  getSymptoms,
  getTotalCaloriesBurned,
  getTotalSleepMinutes,
  initializeHealthConnect,
  saveSymptoms,
} from '../../api/health/healthConnectService';
import {RecordType} from 'react-native-health-connect';
import {Picker} from '@react-native-picker/picker';
import ProgressBar from '../../components/ProgressBar';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import {getUser} from '../../api/user/userService';
import GradientText from '../../components/GradientText';
import {HealthService} from '../../api/health/abstraction/healthService';
import {
  getSymptomsByDate,
  upsertSymptomsByDate,
} from '../../api/symptoms/symptomsService';
import {Float} from 'react-native/Libraries/Types/CodegenTypes';
import {Linking} from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import {useUser} from '../../contexts/UserContext';
import plugin from 'tailwindcss';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import CustomAlertSingleton, {
  CustomAlertSingletonHandle,
} from '../../components/CustomAlertSingleton';
// import DateTimePicker from '@react-native-community/datetimepicker';

const Profile = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  // const [user, setUser] = useState<User | null>(null);
  const {user} = useUser();
  const {colors, theme} = useTheme();

  const [networkInfo, setNetworkInfo] = useState();

  const [refreshing, setRefreshing] = useState(false);

  const [logs, setLogs] = useState('');

  const [healthScore, setHealthScore] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [steps, setSteps] = useState(0);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [activeCaloriesBurned, setActiveCaloriesBurned] = useState(0);
  const [totalSleepMinutes, setTotalSleepMinutes] = useState(0);
  const alertRef = useRef<CustomAlertSingletonHandle>(null);
  const [isGoogleFitInstalled, setIsGoogleFitInstalled] = useState(false);
  const [isHealthConnectInstalled, setIsHealthConnectInstalled] =
    useState(false);
  const [isHealthConnectReady, setIsHealthConnectReady] = useState(false);
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
  const [updateLoading, setUpdateLoading] = useState(false);

  const [time, setTime] = useState(() => {
    const initial = new Date();
    initial.setHours(8);
    initial.setMinutes(30);
    initial.setSeconds(0);
    return initial;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const user: User = await getUser();
  //     if (user) setUser(user);
  //   };

  //   fetchUser();
  // }, []);

  const combineAndSetSymptoms = async (
    symptoms: Symptoms,
    syncedSymptoms?: Symptoms,
  ) => {
    if (symptoms) {
      const merged: Symptoms = {...symptoms};
      if (merged.pulse) {
        if (heartRate !== merged.pulse) setHeartRate(merged.pulse);
      } else if (syncedSymptoms && syncedSymptoms.pulse) {
        setHeartRate(syncedSymptoms.pulse);
        merged.pulse = syncedSymptoms.pulse;
      }

      if (merged.steps) {
        if (steps !== merged.steps) setSteps(merged.steps);
      } else if (syncedSymptoms && syncedSymptoms.steps) {
        setSteps(syncedSymptoms.steps);
        merged.steps = syncedSymptoms.steps;
      }

      if (merged.totalCaloriesBurned) {
        if (totalCaloriesBurned !== merged.totalCaloriesBurned)
          setTotalCaloriesBurned(merged.totalCaloriesBurned);
      } else if (syncedSymptoms && syncedSymptoms.totalCaloriesBurned) {
        setTotalCaloriesBurned(syncedSymptoms.totalCaloriesBurned);
        merged.totalCaloriesBurned = syncedSymptoms.totalCaloriesBurned;
      }

      if (merged.activeCaloriesBurned) {
        if (activeCaloriesBurned !== merged.activeCaloriesBurned)
          setActiveCaloriesBurned(merged.activeCaloriesBurned);
      } else if (syncedSymptoms && syncedSymptoms.activeCaloriesBurned) {
        setActiveCaloriesBurned(syncedSymptoms.activeCaloriesBurned);
        merged.activeCaloriesBurned = syncedSymptoms.activeCaloriesBurned;
      }

      if (merged.sleepMinutes) {
        if (totalSleepMinutes !== merged.sleepMinutes)
          setTotalSleepMinutes(merged.sleepMinutes);
      } else if (syncedSymptoms && syncedSymptoms.sleepMinutes) {
        setTotalSleepMinutes(syncedSymptoms.sleepMinutes);
        merged.sleepMinutes = syncedSymptoms.sleepMinutes;
      }

      setSymptoms(merged);
      await saveSymptoms(merged);

      return merged;
    }
  };

  const fetchAndUpsertAll = async () => {
    setLoading(true);
    try {
      if (user && user.role === 'ROLE_USER') {
        const key = 'symptoms_' + new Date().toISOString().slice(0, 10);
        const localData = await AsyncStorage.getItem(key);
        if (localData) {
          const localSymptoms: Symptoms = JSON.parse(localData);
          console.log(localSymptoms);
          setSymptoms(localSymptoms);
        }

        const syncedSymptoms: Symptoms = await getSymptomsByDate(new Date());
        console.log('synced', syncedSymptoms);
        if (syncedSymptoms) {
          setHeartRate(syncedSymptoms.pulse ?? 0);
          setSteps(syncedSymptoms.steps ?? 0);
          setTotalCaloriesBurned(syncedSymptoms.totalCaloriesBurned ?? 0);
          setActiveCaloriesBurned(syncedSymptoms.activeCaloriesBurned ?? 0);
          setTotalSleepMinutes(syncedSymptoms.sleepMinutes ?? 0);
          saveSymptoms(syncedSymptoms);
        }

        // const healthConnectInstalled = await checkHealthConnectInstalled();
        // if (!healthConnectInstalled) return;
        // setIsHealthConnectInstalled(healthConnectInstalled);

        // // Bu gerekmeyebilir de
        // const googleFitInstalled = await checkGoogleFitInstalled();
        // if (!googleFitInstalled) return;
        // setIsGoogleFitInstalled(googleFitInstalled);

        // const isHealthConnectReady = await initializeHealthConnect();
        // if (!isHealthConnectReady) return;
        // setIsHealthConnectReady(isHealthConnectReady);

        // console.log('nası');
        // const healthConnectSymptoms = await getSymptoms();
        // setHealthConnectSymptoms(healthConnectSymptoms);
        // console.log(healthConnectSymptoms);
        // console.log('synced', syncedSymptoms);
        // const combinedSymptoms = await combineAndSetSymptoms(
        //   healthConnectSymptoms!,
        //   syncedSymptoms,
        // );
        // console.log('combined', combinedSymptoms);
        // if (combinedSymptoms) saveSymptoms(combinedSymptoms);
      }
    } finally {
      setLoading(false); // ✅ her durumda çalışır
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

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchAndUpsertAll();
  //   }, [user]),
  // );

  useEffect(() => {
    fetchAndUpsertAll();
  }, [, user]);

  const bulguLimits = new Map<
    React.Dispatch<React.SetStateAction<number>> | undefined,
    {min: number; max: number}
  >([
    [setHeartRate, {min: 30, max: 220}], // bpm aralığı
    [setSteps, {min: 0, max: 100000}], // adım sayısı
    [setActiveCaloriesBurned, {min: 0, max: 10000}], // kcal
    [setTotalSleepMinutes, {min: 0, max: 24 * 60}], // uyku (dakika)
  ]);

  const bulguMap = new Map<
    React.Dispatch<React.SetStateAction<number>> | undefined,
    {label: string; unit: string}
  >([
    [setHeartRate, {label: 'Nabız', unit: 'bpm'}],
    [setSteps, {label: 'Adım Sayısı', unit: 'adım'}],
    [setActiveCaloriesBurned, {label: 'Yakılan Kalori', unit: 'kcal'}],
    [setTotalSleepMinutes, {label: 'Uyku', unit: 'saat'}],
    [undefined, {label: 'Bulgu', unit: ''}], // fallback
  ]);

  const getBulguLabel = () => {
    const bulgu = bulguMap.get(addModalFunction?.setSymptom);
    return bulgu ? `${bulgu.label} (${bulgu.unit})` : 'Bulgu';
  };

  useEffect(() => {
    const s = computeHealthScore({
      heartRate: heartRate || undefined,
      steps: steps || undefined,
      activeCalories: activeCaloriesBurned || undefined,
      sleepMinutes: totalSleepMinutes || undefined,
    });
    setHealthScore(s);
  }, [heartRate, steps, activeCaloriesBurned, totalSleepMinutes]);

  const checkEssentialAppsStatus = async () => {
    const healthConnectInstalled = await checkHealthConnectInstalled();
    if (!healthConnectInstalled) return;

    setIsHealthConnectInstalled(true);

    const googleFitInstalled = await checkGoogleFitInstalled();
    if (!googleFitInstalled) return;

    setIsGoogleFitInstalled(true);
  };

  useFocusEffect(
    useCallback(() => {
      checkEssentialAppsStatus();
    }, [isHealthConnectInstalled, isGoogleFitInstalled]),
  );

  return (
    <>
      <LinearGradient
        colors={colors.gradient}
        start={{x: 0.1, y: 0}}
        end={{x: 0.9, y: 1}}
        className="absolute inset-0"
      />
      <View
        className="flex flex-row pt-14 pr-5"
        style={{
          backgroundColor: 'transparent', //colors.background.secondary,
          justifyContent: 'space-between',
          paddingTop: insets.top * 1.3,
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color:
              theme.name === 'Light' ? '#333333' : colors.background.primary,
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
            tintColor={
              theme.name === 'Light' ? '#333333' : colors.background.primary
            }
          />
        </TouchableOpacity>
      </View>
      <View
        className="h-full px-3 pt-3"
        style={{
          backgroundColor: 'transparent', // colors.background.secondary,
        }}>
        {/* TO DO Eğer admin ise bulgu kısmı olmasın */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 170,
            // paddingTop: insets.top / 2,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps
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
            className="flex flex-col"
            style={{
              borderRadius: 17,
              backgroundColor: colors.background.primary,
            }}>
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
                    <Image
                      source={icons.patient}
                      className="size-9 mr-2"
                      tintColor={colors.text.primary}
                    />
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
              <View className="flex flex-row items-center mt-3 mb-1">
                <Text
                  className="font-rubik-medium text-xl"
                  style={{color: colors.text.primary}}>
                  Kullanıcı Adı:{'  '}
                </Text>
                <Text
                  className="font-rubik text-xl"
                  style={{color: colors.text.primary}}>
                  {user?.username}
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
              {showDetail && (
                <>
                  <View className="flex flex-row items-center mt-1 mb-1">
                    <Text
                      className="font-rubik-medium text-lg"
                      style={{color: colors.text.primary}}>
                      Doğum Tarihi:{'  '}
                    </Text>
                    <Text
                      className="font-rubik text-lg"
                      style={{color: colors.text.primary}}>
                      {new Date(user?.birthDate!).toLocaleDateString('tr-TR', {
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
                      {user?.gender === 'male' ? 'Erkek' : 'Kadın'}
                    </Text>
                  </View>
                </>
              )}
              <View className="flex flex-row items-center justify-end">
                <TouchableOpacity
                  className="py-2 px-3"
                  style={{
                    borderRadius: 17,
                    backgroundColor: colors.primary[200],
                  }}
                  onPress={() => {
                    setShowDetail(!showDetail);
                  }}>
                  <Text
                    className="text-lg font-rubik"
                    style={{color: colors.background.primary}}>
                    {showDetail ? 'Detayları Gizle' : 'Detay'}
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
                className="flex flex-col py-2 px-5 mt-3"
                style={{
                  borderRadius: 17,
                  backgroundColor: colors.background.primary,
                }}>
                <View className="flex flex-row justify-between items-center pt-2 pb-2">
                  <Text
                    className="font-rubik"
                    style={{fontSize: 20, color: colors.text.primary}}>
                    Bulgular
                  </Text>
                  {/* {isHealthConnectInstalled &&
                  isGoogleFitInstalled &&
                  isHealthConnectReady ? (
                    <View
                      className="flex flex-row items-center"
                      style={{
                        borderRadius: 17,
                        backgroundColor: colors.background.primary,
                      }}>
                      <Text style={{color: '#16d750'}}>Bağlı</Text>
                      <Image
                        source={icons.health_sync}
                        className="ml-2 size-6"
                        tintColor={'#16d750'}
                      />
                    </View>
                  ) : loading ? (
                    <View
                      className="flex flex-row py-3 px-10 items-center"
                      style={{
                        borderRadius: 17,
                        backgroundColor: colors.background.secondary,
                      }}>
                      <ActivityIndicator
                        size="small"
                        color={colors.text.primary}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="flex flex-row py-3 pl-4 pr-3 items-center"
                      style={{
                        borderRadius: 17,
                        backgroundColor: colors.background.secondary,
                      }}
                      onPress={() => {
                        if (!isHealthConnectInstalled) {
                          setShowHCAlert(true);
                        } else if (!isHealthConnectReady) {
                          alertRef.current?.show({
                            message:
                              'Verilerinizi senkronize edebilmek için Health Connect uygulamasına gerekli izinleri vermeniz gerekiyor.',
                            // secondMessage: 'Bu işlem geri alınamaz.',
                            isPositive: true,
                            isInfo: true,
                            onYesText: 'İzinlere Git',
                            onCancelText: 'Vazgeç',
                            onYes: () => {
                              if (Platform.OS === 'ios') {
                                Linking.openURL('app-settings:');
                              } else {
                                Linking.openSettings();
                              }
                              alertRef.current?.hide();
                            },
                            onCancel: () => {
                              console.log('❌ İPTAL');
                            },
                          });
                        }
                      }}>
                      <Text style={{color: colors.text.primary}}>
                        Senkronize et
                      </Text>
                      <Image
                        source={icons.health_sync}
                        className="ml-2 size-6"
                        tintColor={colors.text.primary}
                      />
                    </TouchableOpacity>
                  )} */}
                </View>
                {loading ? (
                  <View className="flex flex-row justify-center items-center my-48">
                    <ActivityIndicator
                      size="large"
                      color={colors.primary[300]}
                    />
                  </View>
                ) : (
                  <>
                    {healthScore && (
                      <ProgressBar
                        value={healthScore}
                        label="Genel Sağlık"
                        iconSource={icons.better_health}
                        color="#41D16F"
                        updateDisabled={true}
                      />
                    )}
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
                    {/* <ProgressBar
                      // Düzenlenecek
                      value={96}
                      label="O2 Seviyesi"
                      iconSource={icons.o2sat}
                      color="#2CA4FF"
                      setAddModalFunction={setAddModalFunction}
                      setSymptom={setHeartRate}
                      onAdd={setIsAddModalVisible}
                      updateDisabled={
                        healthConnectSymptoms?.pulse &&
                        healthConnectSymptoms?.pulse > 0
                          ? true
                          : false
                      }
                      // updateDisabled={symptoms?.o2Level && healthConnectSymptoms?.o2Level > 0 ? true : false}
                    /> */}
                    {/* <ProgressBar
                  value={83}
                  label="Tansiyon"
                  iconSource={icons.blood_pressure}
                  color="#FF9900"
                /> */}
                    {/* FDEF22 */}
                    {totalCaloriesBurned > 0 ? (
                      <ProgressBar
                        value={totalCaloriesBurned}
                        label="Yakılan Kalori"
                        iconSource={icons.kcal}
                        color="#FF9900"
                        setAddModalFunction={setAddModalFunction}
                        setSymptom={setTotalCaloriesBurned}
                        onAdd={setIsAddModalVisible}
                        updateDisabled={
                          healthConnectSymptoms?.totalCaloriesBurned &&
                          healthConnectSymptoms?.totalCaloriesBurned > 0
                            ? true
                            : false
                        }
                      />
                    ) : (
                      activeCaloriesBurned > 0 && (
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
                      )
                    )}
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
                      value={totalSleepMinutes}
                      label="Uyku"
                      iconSource={icons.sleep}
                      color="#FDEF22"
                      setAddModalFunction={setAddModalFunction}
                      setSymptom={setTotalSleepMinutes}
                      onAdd={setShowTimePicker}
                      updateDisabled={
                        healthConnectSymptoms?.sleepMinutes &&
                        healthConnectSymptoms?.sleepMinutes > 0
                          ? true
                          : false
                      }
                    />
                  </>
                )}
                {/* Uyku da minimalist bir grafik ile gösterilsin */}
                {/* <TouchableOpacity
                  className="p-3 self-end"
                  style={{borderRadius: 17, backgroundColor: colors.background.secondary}}>
                  <Text
                    className="font-rubik text-lg"
                    style={{color: colors.text.primary}}>
                    yenile
                  </Text>
                </TouchableOpacity> */}
              </View>
            </>
          )}

          <Modal
            transparent={true}
            visible={isAddModalVisible}
            animationType="fade"
            onRequestClose={() => setIsAddModalVisible(false)}>
            <View className="flex-1 justify-center items-center bg-black/25">
              <View
                className="w-4/5 rounded-3xl p-5 py-6 items-center"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="text-lg font-bold mb-4 text-center"
                  style={{color: colors.text.primary}}>
                  {getBulguLabel()}
                </Text>
                <View
                  className="flex flex-row items-center justify-start z-50 mb-4"
                  style={{
                    borderRadius: 17,
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
                  {!updateLoading ? (
                    <>
                      <TouchableOpacity
                        onPress={async () => {
                          setUpdateLoading(true);
                          if (addModalValue) {
                            const limits = bulguLimits.get(
                              addModalFunction?.setSymptom,
                            );
                            if (addModalValue == null || isNaN(addModalValue)) {
                              ToastAndroid.show(
                                'Lütfen geçerli bir değer giriniz.',
                                ToastAndroid.SHORT,
                              );
                              setUpdateLoading(false);
                              return;
                            }

                            if (
                              limits &&
                              (addModalValue < limits.min ||
                                addModalValue > limits.max)
                            ) {
                              ToastAndroid.show(
                                `Değer ${limits.min} ile ${limits.max} arasında olmalıdır.`,
                                ToastAndroid.LONG,
                              );
                              setUpdateLoading(false);
                              return;
                            }

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
                              setTotalSleepMinutes
                            ) {
                              updatedSymptoms.sleepMinutes = addModalValue;
                            }

                            // Güncellenmiş veriyi kaydet
                            const savedSymptoms = await saveSymptoms(
                              updatedSymptoms,
                            );
                            if (savedSymptoms) setSymptoms(savedSymptoms);

                            // Modalı kapat
                            setIsAddModalVisible(false);
                            setAddModalValue(0);
                          } else {
                            ToastAndroid.show(
                              'Lütfen bir değer giriniz.',
                              ToastAndroid.SHORT,
                            );
                          }
                          setUpdateLoading(false);
                        }}
                        className="flex-1 p-2 rounded-2xl items-center mx-1"
                        style={{backgroundColor: '#0EC946'}}>
                        <Text className="font-rubik text-lg text-white">
                          Güncelle
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setIsAddModalVisible(false);
                          setAddModalValue(0);
                        }}
                        className="flex-1 p-2 rounded-2xl items-center mx-1"
                        style={{backgroundColor: colors.background.secondary}}>
                        <Text
                          className="font-rubik text-lg"
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
          <DatePicker
            modal
            open={showTimePicker}
            date={time}
            title="Uyku sürenizi seçiniz"
            mode="time" // ✅ sadece saat seçimi
            locale="tr" // ✅ Türkçe dil
            is24hourSource="device" // ✅ 24 saat formatı
            onConfirm={async selectedTime => {
              const totalMinutes =
                selectedTime.getHours() * 60 + selectedTime.getMinutes();
              console.log(totalMinutes);
              if (totalMinutes <= 0 || totalMinutes > 960) {
                ToastAndroid.show(
                  'Uyku süresi 0–16 saat arasında olmalıdır.',
                  ToastAndroid.LONG,
                );
                setShowTimePicker(false);
                return;
              }

              const updatedSymptoms: Symptoms = {
                ...symptoms,
              };
              updatedSymptoms.sleepMinutes = totalMinutes;
              setTotalSleepMinutes(totalMinutes);
              setTime(selectedTime);

              const savedSymptoms = await saveSymptoms(updatedSymptoms);
              if (savedSymptoms) setSymptoms(savedSymptoms);

              setShowTimePicker(false);
            }}
            onCancel={() => setShowTimePicker(false)}
            confirmText="Onayla" // ✅ buton Türkçe
            cancelText="İptal" // ✅ buton Türkçe
          />
        </ScrollView>
      </View>

      <CustomAlertSingleton ref={alertRef} />

      <Modal
        transparent={true}
        visible={showHCAlert}
        animationType="fade"
        onRequestClose={() => setIsAddModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/40">
          <View
            className="w-11/12 rounded-3xl p-5 py-5 items-center"
            style={{backgroundColor: colors.background.primary}}>
            <Text
              style={{marginTop: -5, fontSize: 18, lineHeight: 26}}
              className="text-center font-rubik">
              Telefonunuzdaki sağlık verilerini HopeMove uygulamasından takip
              etmek için{' '}
              <Text className="font-rubik-medium">Health Connect</Text> ve
              <Text className="font-rubik-medium"> Google Fit</Text>{' '}
              uygulamalarını indirmeniz gerekiyor.{'\n'}Şimdi Play Store’a
              gitmek istiyor musunuz?
            </Text>
            <View className="flex flex-col justify-between w-4/5 mt-3">
              <TouchableOpacity
                onPress={() => {
                  setShowHCAlert(false);
                }}
                className="py-3 px-3 rounded-2xl items-center mx-1"
                style={{backgroundColor: colors.background.secondary}}>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  Vazgeç
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 px-3 rounded-2xl items-center mx-1 my-2"
                style={{
                  backgroundColor: isHealthConnectInstalled
                    ? '#16d750'
                    : colors.primary[200],
                }}
                onPress={() => {
                  Linking.openURL(
                    'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata',
                  ).catch(err =>
                    console.warn('Failed to open Health Connect page:', err),
                  );
                  // setShowHCAlert(false);
                }}>
                <Text className="font-rubik text-lg text-white">
                  {isHealthConnectInstalled
                    ? 'Health Connect indirildi'
                    : `Health Connect'i indir`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 px-3 rounded-2xl items-center mx-1"
                style={{
                  backgroundColor: isGoogleFitInstalled
                    ? '#16d750'
                    : colors.primary[200],
                }}
                onPress={() => {
                  Linking.openURL(
                    'https://play.google.com/store/apps/details?id=com.google.android.apps.fitness',
                  ).catch(err =>
                    console.warn('Failed to open Health Connect page:', err),
                  );
                  // setShowHCAlert(false);
                }}>
                <Text className="font-rubik text-lg text-white">
                  {isGoogleFitInstalled
                    ? 'Google Fit indirildi'
                    : `Google Fit'i indir`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Profile;
