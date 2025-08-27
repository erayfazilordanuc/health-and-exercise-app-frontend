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
import React, {
  act,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  checkSamsungHInstalled,
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
} from '../../lib/health/healthConnectService';
import {RecordType} from 'react-native-health-connect';
import {Picker} from '@react-native-picker/picker';
import ProgressBar from '../../components/ProgressBar';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import {getUser} from '../../api/user/userService';
import GradientText from '../../components/GradientText';
import {
  getLocal,
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
import {
  SYMPTOM_KEYS,
  useSaveSymptomsToday,
  useSymptomsByDate,
} from '../../hooks/symptomsQueries';
import NetInfo from '@react-native-community/netinfo';
import {useQueryClient} from '@tanstack/react-query';
import WeeklyStrip from '../../components/WeeklyStrip';
import {isSameDay} from 'date-fns';
import {atLocalMidnight, ymdLocal} from '../../utils/dates';

const Profile = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  // const [user, setUser] = useState<User | null>(null);
  const {user} = useUser();
  const {colors, theme} = useTheme();
  const qc = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const [logs, setLogs] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [healthScore, setHealthScore] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [steps, setSteps] = useState(0);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [activeCaloriesBurned, setActiveCaloriesBurned] = useState(0);
  const [totalSleepMinutes, setTotalSleepMinutes] = useState(0);
  const alertRef = useRef<CustomAlertSingletonHandle>(null);
  const [isSamsungHInstalled, setIsSamsungHInstalled] = useState(false);
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const saveSymptomsToday = useSaveSymptomsToday();

  const today = atLocalMidnight(new Date());
  const [symptomsDate, setSymptomsDate] = useState(today);
  const symptomsQ = useSymptomsByDate(symptomsDate, {
    enabled: !!user && user.role === 'ROLE_USER',
  });

  const isTodayLocal = (d: Date) => isSameDay(new Date(), d);

  const [symptoms, setSymptoms] = useState<Symptoms>();

  const [healthConnectSymptoms, setHealthConnectSymptoms] =
    useState<Symptoms>();

  const [loading, setLoading] = useState(true);
  const [hcStateLoading, setHcStateLoading] = useState(true);
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

  const combineSymptoms = (
    symptoms?: Symptoms | null,
    syncedSymptoms?: Symptoms | null,
    date?: Date,
  ) => {
    console.log('syncedds', symptoms, syncedSymptoms);
    if (symptoms) {
      const merged: Symptoms = {...symptoms};
      if (merged.pulse) {
        if (heartRate !== merged.pulse) setHeartRate(merged.pulse);
      } else if (syncedSymptoms && syncedSymptoms.pulse) {
        setHeartRate(syncedSymptoms.pulse);
        merged.pulse = syncedSymptoms.pulse;
      } else if (date && !isTodayLocal(date)) {
        setHeartRate(0);
      }

      if (merged.steps) {
        if (steps !== merged.steps) setSteps(merged.steps);
      } else if (syncedSymptoms && syncedSymptoms.steps) {
        setSteps(syncedSymptoms.steps);
        merged.steps = syncedSymptoms.steps;
      } else if (date && !isTodayLocal(date)) {
        setSteps(0);
      }

      if (merged.totalCaloriesBurned) {
        if (totalCaloriesBurned !== merged.totalCaloriesBurned)
          setTotalCaloriesBurned(merged.totalCaloriesBurned);
      } else if (syncedSymptoms && syncedSymptoms.totalCaloriesBurned) {
        setTotalCaloriesBurned(syncedSymptoms.totalCaloriesBurned);
        merged.totalCaloriesBurned = syncedSymptoms.totalCaloriesBurned;
      } else if (date && !isTodayLocal(date)) {
        setTotalCaloriesBurned(0);
      }

      if (merged.activeCaloriesBurned) {
        if (activeCaloriesBurned !== merged.activeCaloriesBurned)
          setActiveCaloriesBurned(merged.activeCaloriesBurned);
      } else if (syncedSymptoms && syncedSymptoms.activeCaloriesBurned) {
        setActiveCaloriesBurned(syncedSymptoms.activeCaloriesBurned);
        merged.activeCaloriesBurned = syncedSymptoms.activeCaloriesBurned;
      } else if (date && !isTodayLocal(date)) {
        setActiveCaloriesBurned(0);
      }

      if (merged.sleepMinutes) {
        if (totalSleepMinutes !== merged.sleepMinutes)
          setTotalSleepMinutes(merged.sleepMinutes);
      } else if (syncedSymptoms && syncedSymptoms.sleepMinutes) {
        setTotalSleepMinutes(syncedSymptoms.sleepMinutes);
        merged.sleepMinutes = syncedSymptoms.sleepMinutes;
      } else if (date && !isTodayLocal(date)) {
        setTotalSleepMinutes(0);
      }

      return merged;
    } else if (!syncedSymptoms) {
      console.log('burada');
      setHeartRate(0);
      setSteps(0);
      setTotalCaloriesBurned(0);
      setActiveCaloriesBurned(0);
      setTotalSleepMinutes(0);
      setSymptoms(undefined);
      return null;
    }
  };

  const syncSymptoms = async () => {
    setLoading(true);
    try {
      if (isHealthConnectInstalled && isHealthConnectReady) {
        const hc = await getSymptoms();
        console.log('hc', hc);
        setHealthConnectSymptoms(hc);

        console.log('geldi be', symptomsQ.data);
        const combined = combineSymptoms(hc!, symptomsQ.data);
        if (combined) setSymptoms(combined);
        console.log('combined', combined);
        if (combined && symptomsQ.data)
          await saveSymptomsToday.mutateAsync(combined);
      } else {
        const combined = combineSymptoms(symptomsQ.data);
        if (combined) {
          setSymptoms(combined);
          await saveSymptomsToday.mutateAsync(combined);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const initOnceRef = useRef(false);
  const syncInFlightRef = useRef(false);
  const initializeSymptoms = async () => {
    // 1) beklenmeyen durumlara erken çık
    if (initOnceRef.current) return;

    if (!user || user.role !== 'ROLE_USER') return;

    if (!(symptomsDate && isTodayLocal(symptomsDate))) return;

    // ✅ Sağlık uygulamaları check tamamlanmadan hiç başlama
    if (hcStateLoading) return;

    initOnceRef.current = true;
    try {
      if (syncInFlightRef.current) return;
      console.log(
        initOnceRef.current,
        user,
        symptomsDate,
        hcStateLoading,
        syncInFlightRef.current,
      );
      syncInFlightRef.current = true;
      await syncSymptoms();
      console.log(
        initOnceRef.current,
        user,
        symptomsDate,
        hcStateLoading,
        syncInFlightRef.current,
      );
    } finally {
      syncInFlightRef.current = false;
    }
  };

  useEffect(() => {
    // query bittiğinde ve bugün seçiliyken, init henüz yapılmadıysa bir kez dene
    if (
      !initOnceRef.current &&
      !symptomsQ.isFetching &&
      isTodayLocal(symptomsDate)
    ) {
      initializeSymptoms();
    }
  }, [user, symptomsQ.data, symptomsDate, hcStateLoading]);

  // useEffect(() => {
  //   initializeSymptoms();
  //   // kullanıcı veya gün değişirse yeniden izin ver
  //   // (ör. farklı güne geçince tekrar sync isteyebilirsin)
  //   // reset:
  //   return () => {};
  // }, [user?.id, symptomsQ.data, hcStateLoading]);

  // const initializeSymptoms = async () => {
  //   if (user?.role !== 'ROLE_USER') return;
  //   if (symptomsDate && isTodayLocal(symptomsDate) && !initialized) {
  //     console.log('bundand');
  //     setInitialized(true);
  //     await syncSymptoms();
  //   }
  // };

  // useEffect(() => {
  //   initializeSymptoms();
  // }, [user, symptomsQ.data, hcStateLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await checkEssentialAppsStatus();
      await symptomsQ.refetch();
      if (isHealthConnectInstalled && isHealthConnectReady) {
        const hc = await getSymptoms();
        if (hc && symptoms) {
          const combined = combineSymptoms(hc, symptomsQ.data);
          if (combined) setSymptoms(combined);
        }
      } else {
        const combined = combineSymptoms(symptomsQ.data);
        if (combined) setSymptoms(combined);
      }

      // await syncSymptoms();
    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
    }
  };

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

  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);

  const checkEssentialAppsStatus = async () => {
    setHcStateLoading(true);
    try {
      const healthConnectInstalled = await checkHealthConnectInstalled();
      setIsHealthConnectInstalled(healthConnectInstalled);

      const samsungHInstalled = await checkSamsungHInstalled();
      setIsSamsungHInstalled(samsungHInstalled);

      const healthConnectReady = await initializeHealthConnect();
      setIsHealthConnectReady(healthConnectReady);

      console.log(
        'durumlar',
        healthConnectInstalled,
        samsungHInstalled,
        healthConnectReady,
      );
    } catch (error) {
      console.log(error);
    } finally {
      setHcStateLoading(false);
    }
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     checkEssentialAppsStatus();
  //   }, [isHealthConnectInstalled, isSamsungHInstalled]),
  // );

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'ROLE_USER') checkEssentialAppsStatus();
    }, [user]),
  );

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
                onRefresh();
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
                    borderRadius: 13,
                    backgroundColor: colors.primary[200],
                  }}
                  onPress={() => {
                    setShowDetail(!showDetail);
                  }}>
                  <Text className="text-md font-rubik" style={{color: 'white'}}>
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
                className="flex flex-col pt-2 pb-2 px-5 mt-3"
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

                  {isHealthConnectInstalled &&
                  isSamsungHInstalled &&
                  isHealthConnectReady ? (
                    <View
                      className="flex flex-row items-center"
                      style={{
                        borderRadius: 17,
                        backgroundColor: colors.background.primary,
                      }}>
                      <Text style={{color: '#16d750'}}>Senkronize</Text>
                      <Image
                        source={icons.health_sync}
                        className="ml-2 size-6"
                        tintColor={'#16d750'}
                      />
                    </View>
                  ) : hcStateLoading ? (
                    <View
                      className="flex flex-row py-1 px-6 items-center"
                      style={{
                        borderRadius: 17,
                      }}>
                      <ActivityIndicator
                        size="small"
                        color={colors.text.secondary}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="flex flex-row py-3 pl-4 pr-3 items-center"
                      style={{
                        borderRadius: 17,
                        backgroundColor: colors.background.secondary,
                      }}
                      disabled={hcStateLoading}
                      onPress={() => {
                        if (!isHealthConnectInstalled || !isSamsungHInstalled) {
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
                  )}
                </View>
                {/* {loading ? (
                  <View
                    className="flex flex-row justify-center items-center"
                    style={{marginVertical: 75}}>
                    <ActivityIndicator
                      size="large"
                      color={colors.primary[300]}
                    />
                  </View>
                ) : (
                  <> */}
                {/* {healthScore && (
                      <ProgressBar
                        value={healthScore}
                        label="Genel Sağlık"
                        iconSource={icons.better_health}
                        color="#41D16F"
                        updateDisabled={true}
                      />
                    )} */}
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
                    (healthConnectSymptoms?.pulse &&
                      healthConnectSymptoms?.pulse > 0) ||
                    !isTodayLocal(symptomsDate)
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
                      (healthConnectSymptoms?.totalCaloriesBurned &&
                        healthConnectSymptoms?.totalCaloriesBurned > 0) ||
                      !isTodayLocal(symptomsDate)
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
                        (healthConnectSymptoms?.activeCaloriesBurned &&
                          healthConnectSymptoms?.activeCaloriesBurned > 0) ||
                        !isTodayLocal(symptomsDate)
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
                  color="#2CA4FF"
                  setAddModalFunction={setAddModalFunction}
                  setSymptom={setSteps}
                  onAdd={setIsAddModalVisible}
                  updateDisabled={
                    (healthConnectSymptoms?.steps &&
                      healthConnectSymptoms?.steps > 0) ||
                    !isTodayLocal(symptomsDate)
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
                    (healthConnectSymptoms?.sleepMinutes &&
                      healthConnectSymptoms?.sleepMinutes > 0) ||
                    !isTodayLocal(symptomsDate)
                      ? true
                      : false
                  }
                />

                <WeeklyStrip
                  selectedDate={symptomsDate}
                  onSelect={async picked => {
                    const d = new Date(picked); // clone

                    // 2) Yerel gün anahtarını tek yerden üret
                    const dayKey = ymdLocal(d);
                    setSymptomsDate(atLocalMidnight(d));
                    // const fresh = await qc.fetchQuery<
                    //   Symptoms | null, // TQueryFnData
                    //   Error, // TError
                    //   Symptoms | null, // TData
                    //   ReturnType<typeof SYMPTOM_KEYS.byDate> // TQueryKey
                    // >({
                    //   queryKey: SYMPTOM_KEYS.byDate(dateStr),
                    //   queryFn: async (): Promise<Symptoms | null> => {
                    //     // getLocal & getSymptomsByDate mümkünse string alsın (YYYY-MM-DD)
                    //     const local = await getLocal(d);
                    //     if (local) return local;

                    //     const remote = await getSymptomsByDate(d);
                    //     return remote ?? null;
                    //   },
                    // });
                    let fresh: Symptoms | null = null;

                    const local = await getLocal(dayKey); // <-- string key
                    if (local) fresh = local;

                    if (!fresh) {
                      const remote = await getSymptomsByDate(dayKey); // <-- string key
                      fresh = remote ?? null;
                    }
                    console.log('is', isTodayLocal(d), dayKey);
                    if (isTodayLocal(d)) {
                      if (isHealthConnectInstalled && isHealthConnectReady) {
                        const hc = await getSymptoms();
                        setHealthConnectSymptoms(hc);
                        const combined = combineSymptoms(hc, fresh);
                        if (!combined) return;
                        setSymptoms(combined);
                        if (JSON.stringify(fresh) === JSON.stringify(combined))
                          return;
                        await saveSymptomsToday.mutateAsync(combined);
                      } else {
                        const combined = combineSymptoms(fresh);
                        if (combined) {
                          setSymptoms(combined);
                          if (
                            JSON.stringify(fresh) === JSON.stringify(combined)
                          )
                            return;
                          await saveSymptomsToday.mutateAsync(combined);
                        }
                      }
                    } else {
                      const combined = combineSymptoms(
                        fresh,
                        null,
                        atLocalMidnight(d),
                      );
                      if (combined) setSymptoms(combined);
                    }

                    setShowDatePicker(false);
                  }}
                  minDate={monthAgo}
                  maxDate={new Date()}
                  startOnMonday
                  colors={colors}
                />

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
                    onConfirm={async d => {
                      setSymptomsDate(d);
                      const dateStr = d.toISOString().slice(0, 10);
                      const fresh = await qc.fetchQuery<
                        Symptoms | null, // TQueryFnData
                        Error, // TError
                        Symptoms | null, // TData
                        ReturnType<typeof SYMPTOM_KEYS.byDate> // TQueryKey
                      >({
                        queryKey: SYMPTOM_KEYS.byDate(dateStr),
                        queryFn: async (): Promise<Symptoms | null> => {
                          // getLocal & getSymptomsByDate mümkünse string alsın (YYYY-MM-DD)
                          const local = await getLocal(d);
                          if (local) return local;

                          const remote = await getSymptomsByDate(d);
                          return remote ?? null;
                        },
                      });
                      console.log('fresh', fresh);
                      console.log('isTodayLocal', isTodayLocal(d));
                      if (isTodayLocal(d)) {
                        const hc = await getSymptoms();
                        setHealthConnectSymptoms(hc);
                        const combined = await combineSymptoms(hc!, fresh);
                        if (combined && fresh)
                          await saveSymptomsToday.mutateAsync(combined);
                      } else {
                        await combineSymptoms(fresh);
                      }

                      setShowDatePicker(false);
                    }}
                    onCancel={() => setShowDatePicker(false)}
                  />
                )} */}
                {/* </>
                )} */}
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
                          if (addModalValue) {
                            setUpdateLoading(true);
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
                              setTotalCaloriesBurned
                            ) {
                              updatedSymptoms.totalCaloriesBurned =
                                addModalValue;
                            } else if (
                              addModalFunction?.setSymptom ===
                              setTotalSleepMinutes
                            ) {
                              updatedSymptoms.sleepMinutes = addModalValue;
                            }

                            // Güncellenmiş veriyi kaydet
                            const savedSymptoms =
                              await saveSymptomsToday.mutateAsync(
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

              const savedSymptoms = await saveSymptomsToday.mutateAsync(
                updatedSymptoms,
              );
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
            className="w-11/12 rounded-3xl p-5 pt-6 pb-4 items-center"
            style={{backgroundColor: colors.background.primary}}>
            <Text
              style={{
                marginTop: -5,
                fontSize: 18,
                lineHeight: 26,
                color: colors.text.primary,
              }}
              className="text-center font-rubik">
              Telefonunuzdaki sağlık verilerini HopeMove uygulamasından takip
              etmek için{' '}
              <Text className="font-rubik-medium">Health Connect</Text> ve
              <Text className="font-rubik-medium"> Samsung Health</Text>{' '}
              uygulamalarını indirmeniz gerekiyor.{'\n'}Şimdi Play Store’a
              gitmek istiyor musunuz?
            </Text>
            <View className="flex flex-col justify-between w-4/5 mt-3">
              <TouchableOpacity
                className="py-3 px-3 rounded-2xl items-center mx-1"
                disabled={isHealthConnectInstalled}
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
                <View className="flex flex-row items-center justify-center">
                  <Text className="font-rubik text-lg text-white">
                    {isHealthConnectInstalled
                      ? 'Health Connect indirildi'
                      : `Health Connect'i indir`}
                  </Text>
                  {isHealthConnectInstalled && (
                    <Image
                      source={icons.check}
                      className="size-5 ml-3"
                      tintColor={colors.text.primary}
                    />
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 px-3 rounded-2xl items-center mx-1 my-2"
                disabled={isSamsungHInstalled}
                style={{
                  backgroundColor: isSamsungHInstalled
                    ? '#16d750'
                    : colors.primary[200],
                }}
                onPress={() => {
                  Linking.openURL(
                    'https://play.google.com/store/apps/details?id=com.sec.android.app.shealth',
                  ).catch(err =>
                    console.warn('Failed to open Health Connect page:', err),
                  );
                  // setShowHCAlert(false);
                }}>
                <View className="flex flex-row items-center justify-center">
                  <Text className="font-rubik text-lg text-white">
                    {isSamsungHInstalled
                      ? 'Samsung Health indirildi'
                      : `Samsung Health'i indir`}
                  </Text>
                  {isSamsungHInstalled && (
                    <Image
                      source={icons.check}
                      className="size-5 ml-3"
                      tintColor={colors.text.primary}
                    />
                  )}
                </View>
              </TouchableOpacity>
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
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Profile;
