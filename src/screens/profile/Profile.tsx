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
  FlatList,
  Dimensions,
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
import {
  getDbUser,
  getUser,
  updateUserMeasurements,
  useUpdateAvatar,
} from '../../api/user/userService';
import GradientText from '../../components/GradientText';
import {
  getLocal,
  getLatestSymptomsByDate,
  syncMonthlySymptoms,
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
  useCompleteStepGoal,
  useCreateStepGoal,
  useDoneStepGoals,
  useSaveSymptomsToday,
  useSymptomsByDate,
  useWeeklyStepGoal,
  useWeeklySteps,
} from '../../hooks/symptomsQueries';
import NetInfo, {refresh} from '@react-native-community/netinfo';
import {useQueryClient} from '@tanstack/react-query';
import WeeklyStrip from '../../components/WeeklyStrip';
import {isSameDay} from 'date-fns';
import {atLocalMidnight, isTodayLocal, ymdLocal} from '../../utils/dates';
import {extractAxiosMessage} from '../../api/axios/axios';
import {AVATARS, type AvatarKey} from '../../constants/avatars';
import {useTranslation} from 'react-i18next';

const Profile = () => {
  const rootNavigation = useNavigation<RootScreenNavigationProp>();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const {t} = useTranslation('profile');
  const {t: c} = useTranslation('common');
  const insets = useSafeAreaInsets();
  // const [user, setUser] = useState<User | null>(null);
  const {user, setUser} = useUser();
  const [uHeight, setHeight] = useState(user?.height);
  const [uWeight, setWeight] = useState(user?.weight);
  const {colors, theme} = useTheme();
  const qc = useQueryClient();
  const {height} = Dimensions.get('screen');
  const [refreshing, setRefreshing] = useState(false);

  const [avatar, setAvatar] = useState(user?.avatar ?? 'non');
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
  const {updateAvatar} = useUpdateAvatar();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showHCAlert, setShowHCAlert] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSleepTimeModal, setShowSleepTimeModal] = useState(false);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepMinutes, setSleepMinutes] = useState('');

  const {data: weekly, isLoading: wLoading} = useWeeklyStepGoal({
    enabled: user?.role === 'ROLE_USER',
  });
  const [weeklyGoal, setWeeklyGoal] = useState(weekly);
  useEffect(() => {
    setWeeklyGoal(weekly);
  }, [weekly, user]);

  const {data: dones, isLoading: dLoading} = useDoneStepGoals();
  const createMut = useCreateStepGoal();
  const completeMut = useCompleteStepGoal();
  const [newStepGoalValue, setNewStepGoalValue] = useState('');
  const [goaling, setGoaling] = useState(false);
  const {
    data: weeklySteps = 0,
    isLoading,
    refetch: refetchSteps,
  } = useWeeklySteps();

  const saveSymptomsToday = useSaveSymptomsToday();

  const today = atLocalMidnight(new Date());
  const [symptomsDate, setSymptomsDate] = useState(today);
  const symptomsQ = useSymptomsByDate(symptomsDate, {
    enabled: !!user && user.role === 'ROLE_USER',
  });

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
      } else {
        // if (date && !isTodayLocal(date))
        setHeartRate(0);
      }

      if (merged.steps) {
        if (steps !== merged.steps) setSteps(merged.steps);
      } else if (syncedSymptoms && syncedSymptoms.steps) {
        setSteps(syncedSymptoms.steps);
        merged.steps = syncedSymptoms.steps;
      } else {
        setSteps(0);
      }

      if (merged.totalCaloriesBurned) {
        if (totalCaloriesBurned !== merged.totalCaloriesBurned)
          setTotalCaloriesBurned(merged.totalCaloriesBurned);
      } else if (syncedSymptoms && syncedSymptoms.totalCaloriesBurned) {
        setTotalCaloriesBurned(syncedSymptoms.totalCaloriesBurned);
        merged.totalCaloriesBurned = syncedSymptoms.totalCaloriesBurned;
      } else {
        setTotalCaloriesBurned(0);
      }

      if (merged.activeCaloriesBurned) {
        if (activeCaloriesBurned !== merged.activeCaloriesBurned)
          setActiveCaloriesBurned(merged.activeCaloriesBurned);
      } else if (syncedSymptoms && syncedSymptoms.activeCaloriesBurned) {
        setActiveCaloriesBurned(syncedSymptoms.activeCaloriesBurned);
        merged.activeCaloriesBurned = syncedSymptoms.activeCaloriesBurned;
      } else {
        setActiveCaloriesBurned(0);
      }

      if (merged.sleepMinutes) {
        if (totalSleepMinutes !== merged.sleepMinutes)
          setTotalSleepMinutes(merged.sleepMinutes);
      } else if (syncedSymptoms && syncedSymptoms.sleepMinutes) {
        setTotalSleepMinutes(syncedSymptoms.sleepMinutes);
        merged.sleepMinutes = syncedSymptoms.sleepMinutes;
      } else {
        // if (date && !isTodayLocal(date))
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
      console.log('eeeee');
      if (isHealthConnectInstalled && isHealthConnectReady) {
        const hc = await getSymptoms();
        console.log('hc', hc);
        setHealthConnectSymptoms(hc);

        console.log('geldi be', symptomsQ.data);
        const combined = combineSymptoms(hc!, symptomsQ.data);
        if (combined) setSymptoms(combined);
        console.log('combined', combined);
        if (combined) await saveSymptomsToday.mutateAsync(combined);
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
    if (initOnceRef.current) return;

    if (!user || user.role !== 'ROLE_USER') return;

    if (!(symptomsDate && isTodayLocal(symptomsDate))) return;

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

      // Monthly syncronizing symptoms
      // const {synced, skipped, monthly, errors} = await syncMonthlySymptoms();
      // console.log('synced', synced);
      // console.log('skipped', skipped);
      // console.log('monthly', monthly);
      // console.log('errors', errors);

      // const {
      //   synced: synced2,
      //   skipped: skipped2,
      //   monthly: monthly2,
      //   errors: errors2,
      // } = await syncMonthlySymptoms(
      //   new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      // );
      // console.log('synced2', synced2);
      // console.log('skipped2', skipped2);
      // console.log('monthly2', monthly2);
      // console.log('errors2', errors2);
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

  useEffect(() => {
    initializeSymptoms();
    // kullanıcı veya gün değişirse yeniden izin ver
    // (ör. farklı güne geçince tekrar sync isteyebilirsin)
    // reset:
    return () => {};
  }, [user?.id, symptomsQ.data, hcStateLoading]);

  // const initializeSymptoms = async () => {
  //   if (user?.role !== 'ROLE_USER') return;
  //   if (symptomsDate && isTodayLocal(symptomsDate) && !initialized) {
  //     console.log('bundand');
  //     setInitialized(true);
  //     await syncSymptoms();
  //   }
  // };

  useEffect(() => {
    initializeSymptoms();
  }, [user, symptomsQ.data, hcStateLoading]);

  const refreshSymptoms = async () => {
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
  };
  const onRefresh = async () => {
    setRefreshing(true);
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      ToastAndroid.show(t('toasts.noInternetRefresh'), ToastAndroid.LONG);
      return;
    }
    try {
      const dbUser = await getDbUser();
      if (dbUser) setUser(dbUser);
      if (user?.role === 'ROLE_ADMIN') return;
      await checkEssentialAppsStatus();
      await refetchSteps();
      await refreshSymptoms();
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
    [setHeartRate, {label: t('labels.heartRate'), unit: 'bpm'}],
    [setSteps, {label: t('labels.stepCount'), unit: t('labels.steps')}],
    [
      setActiveCaloriesBurned,
      {label: t('labels.caloriesBurned'), unit: 'kcal'},
    ],
    [
      setTotalSleepMinutes,
      {label: t('labels.sleep'), unit: t('labels.sleepUnits')},
    ],
    [undefined, {label: t('addValueModal.titleFallback'), unit: ''}],
  ]);

  const getBulguLabel = () => {
    const bulgu = bulguMap.get(addModalFunction?.setSymptom);
    return bulgu
      ? `${bulgu.label} (${bulgu.unit})`
      : t('addValueModal.titleFallback');
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

  const checkGoalAchieved = async () => {
    if (weeklySteps && weeklyGoal) {
      if (!weeklyGoal.isDone) {
        if (weeklySteps > weeklyGoal.goal) {
          const result = await completeMut.mutateAsync(weeklyGoal.id);
          if (result)
            setWeeklyGoal(prev => (prev ? {...prev, isDone: true} : prev));
        }
      }
    }
  };

  useEffect(() => {
    checkGoalAchieved();
  }, [weeklySteps, weeklyGoal]);

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

  const isLongName = () => {
    return user?.fullName.length && user?.fullName.length > 15;
  };

  const getFullName = () => {
    if (!user) return '';

    if (!isLongName()) return user.fullName;

    let fullName = '';

    const parts = user.fullName.split(' ');

    for (let i = 0; i < parts.length - 1; i++) {
      fullName += parts[i] + ' ';
    }

    fullName += '\n' + parts[parts.length - 1];

    console.log(fullName);

    return fullName;
  };

  const calculateBmi = () => {
    if (uHeight && uWeight) {
      const hm = uHeight / 100;
      const bmi = uWeight / (hm * hm);
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

  const updateMeasurements = async () => {
    const dto: UpdateMeasurementsDTO = {
      height: uHeight,
      weight: uWeight,
    };
    const response = await updateUserMeasurements(dto);
    if (response.status >= 200 && response.status <= 300) {
      setUser(response.data);
      return true;
    } else {
      ToastAndroid.show(t('toasts.saveUnsuccessful'), ToastAndroid.SHORT);
    }
    return false;
  };

  return (
    <>
      <LinearGradient
        colors={colors.gradient}
        locations={[0.15, 0.25, 0.7, 1]}
        start={{x: 0.1, y: 0}}
        end={{x: 0.8, y: 1}}
        className="absolute top-0 left-0 right-0 bottom-0"
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
            color: theme.colors.isLight ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          {t('title')}{' '}
          {user?.role === 'ROLE_ADMIN' ? t('header.roleSuffixNurse') : ''}
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
              theme.colors.isLight ? '#333333' : colors.background.primary
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
            // paddingBottom: height / 4.5,
            paddingBottom: insets.bottom + height / 4.5,
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
              <View className="flex flex-row justify-between my-1">
                <View className="flex-row items-center justify-start">
                  <TouchableOpacity
                    onPress={() => {
                      setShowAvatarModal(true);
                    }}>
                    <Image
                      source={AVATARS[avatar as AvatarKey]}
                      className="size-16"
                    />
                    <Image
                      source={icons.edit}
                      className="absolute bottom-0 right-0 size-5"
                    />
                  </TouchableOpacity>
                  <GradientText
                    style={{
                      marginTop: isLongName() ? 10 : 0,
                    }}
                    className="font-rubik-medium text-2xl ml-5"
                    start={{x: 0, y: 0}}
                    end={{x: 0.7, y: 0}}
                    colors={[colors.primary[300], colors.secondary[300]]}>
                    {getFullName()}
                  </GradientText>
                </View>
                <View className="flex flex-row items-center justify-end">
                  <TouchableOpacity
                    className="py-3 px-3"
                    style={{
                      borderRadius: 13,
                      backgroundColor: colors.background.third,
                    }}
                    onPress={() => {
                      setShowDetail(!showDetail);
                    }}>
                    <Image
                      source={showDetail ? icons.arrowUp : icons.arrowDown}
                      className="size-4"
                      tintColor={colors.primary[200]}
                    />
                    {/* <Text
                      className="text-md font-rubik"
                      style={{color: colors.primary[200]}}>
                      {showDetail ? 'Detayları Gizle' : '>'}
                    </Text> */}
                  </TouchableOpacity>
                </View>
              </View>
              {showDetail && (
                <>
                  <View className="flex flex-row items-center mt-3 mb-1">
                    <Text
                      className="font-rubik-medium text-lg"
                      style={{color: colors.text.primary}}>
                      {t('labels.username')}:{'  '}
                    </Text>
                    <Text
                      className="font-rubik text-lg"
                      style={{color: colors.text.primary}}>
                      {user?.username}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center my-1">
                    <Text
                      className="font-rubik-medium text-lg"
                      style={{color: colors.text.primary}}>
                      {t('labels.email')}
                      {':  '}
                    </Text>
                    <Text
                      className="font-rubik text-lg"
                      style={{color: colors.text.primary}}>
                      {user?.email}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center my-1">
                    <Text
                      className="font-rubik-medium text-lg"
                      style={{color: colors.text.primary}}>
                      {t('labels.age')}:{'  '}
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
                      {t('labels.birthDate')}:{'  '}
                    </Text>
                    <Text
                      className="font-rubik text-lg"
                      style={{color: colors.text.primary}}>
                      {new Date(user?.birthDate!).toLocaleDateString(
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
                      {t('labels.gender')}:{'  '}
                    </Text>
                    <Text
                      className="font-rubik text-lg"
                      style={{color: colors.text.primary}}>
                      {user?.gender === 'male'
                        ? t('labels.male')
                        : t('labels.female')}
                    </Text>
                  </View>

                  {user?.role === 'ROLE_USER' && (
                    <>
                      <View className="flex flex-row items-between my-1">
                        <View className="flex flex-row items-center">
                          <Text
                            className="font-rubik-medium text-lg"
                            style={{color: colors.text.primary}}>
                            {t('labels.height')}:{'  '}
                          </Text>
                          <Text
                            className="font-rubik text-lg"
                            style={{color: colors.text.primary}}>
                            {user?.height ? user?.height + ' cm' : ''}
                          </Text>
                        </View>
                      </View>
                      <View className="flex flex-row items-between my-1">
                        <View className="flex flex-row items-center">
                          <Text
                            className="font-rubik-medium text-lg"
                            style={{color: colors.text.primary}}>
                            {t('labels.weight')}:{'  '}
                          </Text>
                          <Text
                            className="font-rubik text-lg"
                            style={{color: colors.text.primary}}>
                            {user?.weight ? user?.weight + ' cm' : ''}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                  {/* <View className="flex flex-row items-center my-1">
                    <Text
                      className="font-rubik-medium text-md"
                      style={{color: colors.text.primary}}>
                      {t('labels.bmi')}:{'  '}
                    </Text>
                    <Text
                      className="font-rubik text-md"
                      style={{color: colors.text.primary}}>
                      {calculateBmi()}
                    </Text>
                  </View> */}
                  <View className="flex flex-row items-center justify-between my-1">
                    {user?.role === 'ROLE_USER' && (
                      <TouchableOpacity
                        className="self-end px-3 py-2 mb-1 mt-2 rounded-2xl flex-row items-center jusfiyf-center"
                        style={{backgroundColor: colors.background.secondary}}
                        onPress={() => {
                          setShowMeasurementsModal(true);
                        }}>
                        <Image
                          source={icons.measurements}
                          className="size-5 mb-1"
                          tintColor={colors.text.primary}
                        />
                        <Text
                          className="font-rubik-medium text-md ml-2 mr-1"
                          style={{color: colors.text.primary}}>
                          {t('labels.editMeasurements')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      className="self-end px-3 py-2 mb-1 mt-2 rounded-2xl flex-row items-center jusfiyf-center"
                      style={{backgroundColor: colors.background.secondary}}
                      onPress={() => {
                        navigation.navigate('Settings', {screen: 'Account'});
                      }}>
                      <Image
                        source={icons.editAccount}
                        className="size-5 mb-1"
                        tintColor={colors.text.primary}
                      />
                      <Text
                        className="font-rubik-medium text-md ml-2 mr-1"
                        style={{color: colors.text.primary}}>
                        {t('labels.edit')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
            {/* Buraya dğer bilgiler, rozetler falan filan */}
          </View>
          {/* Grafik minimalistik olsun yanında ortalama değer olsun, sağ üstte de son okunan değer varsa yazsın */}
          {/* <HeartRateSimpleChart/> */}
          {user && user.role === 'ROLE_USER' && (
            <>
              <View
                className="flex-col rounded-2xl px-4 py-3 mt-3"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="font-rubik text-xl ml-1 mb-3"
                  style={{color: colors.text.primary}}>
                  {t('weeklyGoal.title')}
                </Text>
                {weeklyGoal ? (
                  <View
                    className="flex-col rounded-2xl pl-5 pr-7 py-2 mb-2 self-start"
                    style={{backgroundColor: colors.background.secondary}}>
                    {weeklyGoal.isDone && (
                      <View className="flex-row items-center justify-start mb-2">
                        <Text
                          className="font-rubik text-lg ml-2"
                          style={{color: '#16d750'}}>
                          {t('weeklyGoal.completed')}
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
                      {t('weeklyGoal.goal', {value: weekly?.goal ?? ''})}
                    </Text>
                    <Text
                      className="font-rubik text-lg ml-2"
                      style={{color: colors.text.primary}}>
                      {t('weeklyGoal.progress', {value: weeklySteps ?? ''})}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="py-2 px-2 pr-3 rounded-2xl self-start mt-1 mb-3"
                    style={{backgroundColor: colors.background.third}}
                    onPress={() => {
                      setGoaling(true);
                    }}
                    disabled={goaling}>
                    <View className="flex-col items-center">
                      <Text
                        className="font-rubik text-lg ml-1 mr-1"
                        style={{color: colors.primary[200]}}>
                        {t('weeklyGoal.addGoalCta')}
                        {!goaling && <Text>{'  '}+</Text>}
                      </Text>
                      {goaling && (
                        <>
                          <TextInput
                            className="rounded-2xl mt-2 mb-3 px-3"
                            style={{
                              backgroundColor: colors.background.primary,
                              color: colors.text.primary,
                            }}
                            value={newStepGoalValue}
                            onChangeText={value => setNewStepGoalValue(value)}
                            placeholder={t('weeklyGoal.inputPlaceholder')}
                            placeholderTextColor={colors.text.third}
                            selectionColor={colors.primary[300]}
                            keyboardType="numeric"
                          />
                          <View className="flex-row items-center">
                            <TouchableOpacity
                              className="py-2 px-3 rounded-2xl mb-1 mr-1"
                              style={{backgroundColor: 'gray'}}
                              onPress={() => {
                                setGoaling(false);
                                setNewStepGoalValue('');
                              }}>
                              <Text style={{color: 'white'}}>
                                {t('weeklyGoal.cancel')}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="py-2 px-3 rounded-2xl mb-1 ml-1"
                              style={{backgroundColor: '#16d750'}}
                              onPress={async () => {
                                if (newStepGoalValue) {
                                  if (parseInt(newStepGoalValue) > 100000) {
                                    ToastAndroid.show(
                                      t('toasts.invalidValue'),
                                      ToastAndroid.SHORT,
                                    );
                                    return;
                                  }

                                  const net = await NetInfo.fetch();
                                  if (!net.isConnected) {
                                    ToastAndroid.show(
                                      t('toasts.networkError'),
                                      ToastAndroid.SHORT,
                                    );
                                    return;
                                  }
                                  try {
                                    const stepGoal =
                                      await createMut.mutateAsync(
                                        parseInt(newStepGoalValue),
                                      );
                                    if (stepGoal) {
                                      setGoaling(false);
                                      setWeeklyGoal(stepGoal);
                                    } else {
                                      ToastAndroid.show(
                                        t('toasts.genericError'),
                                        ToastAndroid.SHORT,
                                      );
                                    }
                                  } catch (error) {
                                    console.log(
                                      'create step goal error',
                                      error,
                                    );
                                    const msg = extractAxiosMessage(error);
                                    // Örn: "Önceki haftadaki ilerlemenize göre bu kadar düşük bir hedef giremezsiniz"
                                    ToastAndroid.show(
                                      msg && msg === 'Bad Request'
                                        ? t('toasts.tooLowForHistory')
                                        : t('toasts.genericError'),
                                      ToastAndroid.LONG,
                                    );
                                  }
                                } else
                                  ToastAndroid.show(
                                    t('toasts.enterAValue'),
                                    ToastAndroid.SHORT,
                                  );
                              }}>
                              <Text style={{color: 'white'}}>
                                {t('weeklyGoal.save')}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                <View className="flex-row items-center justify-start self-start my-1">
                  <Text
                    className="font-rubik text-lg ml-3 mr-1"
                    style={{color: colors.text.primary}}>
                    {t('weeklyGoal.badgesTitle')}{' '}
                  </Text>
                  <Image source={icons.badge1_colorful} className="size-7" />
                  <Text
                    className="font-rubik text-lg ml-1"
                    style={{color: colors.text.primary}}>
                    {dones?.length ?? 0}
                  </Text>
                </View>
              </View>
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
                    {t('findings.title')}
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
                      <Text style={{color: '#16d750'}}>
                        {t('findings.synced')}
                      </Text>
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
                            message: t('labels.syncDataPermissionInfo'),
                            // secondMessage: 'Bu işlem geri alınamaz.',
                            isPositive: true,
                            isInfo: true,
                            onYesText: t('hcAlert.yes'),
                            onCancelText: t('hcAlert.cancel'),
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
                        {t('findings.syncCta')}
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
                  label={t('labels.heartRate')}
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
                    label={t('labels.caloriesBurned')}
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
                      label={t('labels.caloriesBurned')}
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
                  label={t('labels.steps')}
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
                  label={t('labels.sleep')}
                  iconSource={icons.sleep}
                  color="#FDEF22"
                  setAddModalFunction={setAddModalFunction}
                  setSymptom={setTotalSleepMinutes}
                  // onAdd={setIsAddModalVisible}
                  // onAdd={setShowTimePicker}
                  onAdd={setShowSleepTimeModal}
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
                    //     // getLocal & getLatestSymptomsByDate mümkünse string alsın (YYYY-MM-DD)
                    //     const local = await getLocal(d);
                    //     if (local) return local;

                    //     const remote = await getLatestSymptomsByDate(d);
                    //     return remote ?? null;
                    //   },
                    // });
                    let fresh: Symptoms | null = null;

                    const local = await getLocal(dayKey); // <-- string key
                    if (local) fresh = local;

                    if (!fresh) {
                      const remote = await getLatestSymptomsByDate(dayKey); // <-- string key
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
                      if (!fresh) {
                        const net = await NetInfo.fetch();
                        const isOnline = !!net.isConnected;
                        if (!isOnline)
                          ToastAndroid.show(
                            t('toasts.dataLoadError'),
                            ToastAndroid.SHORT,
                          );
                      }
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
                          // getLocal & getLatestSymptomsByDate mümkünse string alsın (YYYY-MM-DD)
                          const local = await getLocal(d);
                          if (local) return local;

                          const remote = await getLatestSymptomsByDate(d);
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
                    placeholder={t('addValueModal.valuePlaceholder')}
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
                            const net = await NetInfo.fetch();
                            if (!net.isConnected) {
                              ToastAndroid.show(
                                t('toasts.networkError'),
                                ToastAndroid.SHORT,
                              );
                              return;
                            }
                            setUpdateLoading(true);
                            const limits = bulguLimits.get(
                              addModalFunction?.setSymptom,
                            );
                            if (addModalValue == null || isNaN(addModalValue)) {
                              ToastAndroid.show(
                                t('toasts.invalidValue'),
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
                                t('toasts.valueRange', {
                                  min: limits.min,
                                  max: limits.max,
                                }),
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
                              t('toasts.enterAValue'),
                              ToastAndroid.SHORT,
                            );
                          }
                          setUpdateLoading(false);
                        }}
                        className="flex-1 p-2 rounded-2xl items-center mx-1"
                        style={{backgroundColor: '#0EC946'}}>
                        <Text className="font-rubik text-lg text-white">
                          {t('addValueModal.update')}
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
                          {t('addValueModal.cancel')}
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

          <Modal
            transparent={true}
            visible={showSleepTimeModal}
            animationType="fade"
            onRequestClose={() => setShowSleepTimeModal(false)}>
            <View className="flex-1 justify-center items-center bg-black/25">
              <View
                className="w-4/5 rounded-3xl p-5 py-6 items-center"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="text-lg font-bold mb-4 text-center"
                  style={{color: colors.text.primary}}>
                  {t('sleepModal.title')}
                </Text>
                <View className="flex-row items-center justify-center w-full px-4 mb-4">
                  {/* Saat Input */}
                  <TextInput
                    placeholder={t('sleepModal.hours')} // Çeviri anahtarını güncelleyin
                    placeholderTextColor={'gray'}
                    selectionColor={'#7AADFF'}
                    keyboardType="number-pad" // decimal-pad yerine number-pad daha uygun
                    value={sleepHours} // State'i kullan
                    onChangeText={text =>
                      setSleepHours(text.replace(/[^0-9]/g, ''))
                    } // State'i güncelle
                    maxLength={2} // Maksimum 2 rakam
                    // `flex-1` kaldırıldı, `w-2/5` ve `text-center` eklendi
                    className="font-rubik text-lg rounded-2xl px-4 py-3 text-center w-2/5"
                    style={{
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                    }}
                  />

                  {/* Ayırıcı */}
                  <Text
                    style={{color: colors.text.primary, fontSize: 18}}
                    className="font-rubik-medium mx-3">
                    :
                  </Text>

                  {/* Dakika Input */}
                  <TextInput
                    placeholder={t('sleepModal.minutes')} // Çeviri anahtarını güncelleyin
                    placeholderTextColor={'gray'}
                    selectionColor={'#7AADFF'}
                    keyboardType="number-pad" // decimal-pad yerine number-pad daha uygun
                    value={sleepMinutes} // State'i kullan
                    onChangeText={text =>
                      setSleepMinutes(text.replace(/[^0-9]/g, ''))
                    } // State'i güncelle
                    maxLength={2} // Maksimum 2 rakam
                    className="font-rubik text-lg rounded-2xl px-4 py-3 text-center w-2/5"
                    style={{
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                    }}
                  />
                </View>
                <View className="flex-row justify-between w-full">
                  {!updateLoading ? (
                    <>
                      <TouchableOpacity
                        onPress={async () => {
                          if (parseInt(sleepMinutes) > 60) {
                            ToastAndroid.show(
                              t('toasts.maxMinutes'),
                              ToastAndroid.SHORT,
                            );
                            return;
                          }

                          if (parseInt(sleepHours) > 24) {
                            ToastAndroid.show(
                              t('toasts.maxHours'),
                              ToastAndroid.SHORT,
                            );
                            return;
                          }

                          if (
                            sleepHours.length < 1 &&
                            sleepMinutes.length < 1
                          ) {
                            ToastAndroid.show(
                              t('toasts.enterAValue'),
                              ToastAndroid.SHORT,
                            );
                            return;
                          }

                          setUpdateLoading(true);
                          let hours =
                            sleepHours.length === 0 ? 0 : parseInt(sleepHours);
                          let minutes =
                            sleepMinutes.length === 0
                              ? 0
                              : parseInt(sleepMinutes);
                          let totalSleep = hours * 60 + minutes;

                          const updatedSymptoms: Symptoms = {
                            ...symptoms,
                          };

                          updatedSymptoms.sleepMinutes = totalSleep;

                          const savedSymptoms =
                            await saveSymptomsToday.mutateAsync(
                              updatedSymptoms,
                            );

                          if (savedSymptoms) {
                            setSymptoms(savedSymptoms);
                            setTotalSleepMinutes(totalSleep);
                          }

                          setUpdateLoading(false);
                          setShowSleepTimeModal(false);
                          setSleepHours('');
                          setSleepMinutes('');
                        }}
                        className="flex-1 p-2 rounded-2xl items-center mx-1"
                        style={{backgroundColor: '#0EC946'}}>
                        <Text className="font-rubik text-lg text-white">
                          {t('addValueModal.update')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setShowSleepTimeModal(false);
                          setSleepHours('');
                          setSleepMinutes('');
                        }}
                        className="flex-1 p-2 rounded-2xl items-center mx-1"
                        style={{backgroundColor: colors.background.secondary}}>
                        <Text
                          className="font-rubik text-lg"
                          style={{color: colors.text.primary}}>
                          {t('addValueModal.cancel')}
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

          {/* <DatePicker
            modal
            open={showTimePicker}
            date={time}
            title={t('datePicker.title')}
            mode="time"
            locale={c('locale')}
            is24hourSource="locale"
            onConfirm={async selectedTime => {
              const totalMinutes =
                selectedTime.getHours() * 60 + selectedTime.getMinutes();
              console.log(totalMinutes);
              if (totalMinutes <= 0 || totalMinutes > 960) {
                ToastAndroid.show(
                  t('toasts.sleepOutOfRange'),
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
            confirmText={t('datePicker.confirm')}
            cancelText={t('datePicker.cancel')}
          /> */}
        </ScrollView>
      </View>

      <CustomAlertSingleton ref={alertRef} />

      <Modal
        transparent={true}
        visible={showMeasurementsModal}
        animationType="fade"
        onRequestClose={() => setShowMeasurementsModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/40">
          <View
            className="w-11/12 rounded-3xl p-5 pt-6 pb-4 items-center"
            style={{backgroundColor: colors.background.primary}}>
            <Text
              style={{
                marginTop: -5,
                fontSize: 20,
                lineHeight: 26,
                color: colors.text.primary,
              }}
              className="text-center font-rubik-medium">
              {t('labels.measurements')}
            </Text>
            <View
              className="flex-row items-center justify-center mt-4 rounded-2xl"
              style={{backgroundColor: colors.background.primary}}>
              <Text
                className="font-rubik text-xl pr-3"
                style={{color: colors.text.primary}}>
                {t('labels.height')}:
              </Text>
              <View
                className="flex-row items-center justify-between rounded-2xl pl-3"
                style={{
                  backgroundColor: colors.background.secondary,
                }}>
                <TextInput
                  value={uHeight?.toString()}
                  placeholder={t('labels.heightPlaceholder')}
                  placeholderTextColor="gray"
                  onChangeText={text => {
                    if (text === '') {
                      setHeight(undefined);
                    } else {
                      const num = parseInt(text);
                      if (!isNaN(num)) {
                        setHeight(num);
                      }
                    }
                  }}
                  selectionColor={'#7AADFF'}
                  className="font-rubik text-xl rounded-2xl pr-4"
                  style={{
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View
              className="flex-row items-center justify-center mt-2 rounded-2xl"
              style={{backgroundColor: colors.background.primary}}>
              <Text
                className="font-rubik text-xl pr-3"
                style={{color: colors.text.primary}}>
                {t('labels.weight')}:
              </Text>
              <View
                className="flex flex-row justify-between mb-1 rounded-2xl pl-3"
                style={{
                  backgroundColor: colors.background.secondary,
                }}>
                <TextInput
                  value={uWeight?.toString()}
                  placeholder={t('labels.weightPlaceholder')}
                  placeholderTextColor="gray"
                  onChangeText={text => {
                    if (text === '') {
                      setWeight(undefined);
                    } else {
                      const num = parseInt(text);
                      if (!isNaN(num)) {
                        setWeight(num);
                      }
                    }
                  }}
                  selectionColor={'#7AADFF'}
                  className="font-rubik text-xl rounded-2xl pr-4"
                  style={{
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View className="flex-row items-center justify-center">
              <TouchableOpacity
                onPress={() => {
                  setShowMeasurementsModal(false);
                  setHeight(undefined);
                  setWeight(undefined);
                }}
                className="py-2 px-3 rounded-2xl items-center mx-2 mt-6"
                style={{backgroundColor: colors.background.secondary}}>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  {t('avatarModal.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const updated = await updateMeasurements();
                  if (updated) {
                    setShowMeasurementsModal(false);
                    ToastAndroid.show(
                      t('toasts.saveSuccessful'),
                      ToastAndroid.SHORT,
                    );
                  }
                }}
                className="py-2 px-3 rounded-2xl items-center mx-2 mt-6"
                style={{backgroundColor: '#16d750'}}>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.background.secondary}}>
                  {t('avatarModal.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={showAvatarModal}
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/40">
          <View
            className="w-11/12 rounded-3xl p-5 pt-6 pb-4 items-center"
            style={{backgroundColor: colors.background.primary}}>
            <Text
              style={{
                marginTop: -5,
                fontSize: 20,
                lineHeight: 26,
                color: colors.text.primary,
              }}
              className="text-center font-rubik-medium">
              {t('avatarModal.title')}
            </Text>
            <View className="flex-row items-center justify-center mt-4">
              <Text
                style={{
                  fontSize: 18,
                  lineHeight: 26,
                  color: colors.text.primary,
                }}
                className="text-center font-rubik">
                {t('avatarModal.selected')}
              </Text>
              <Image
                source={AVATARS[avatar as AvatarKey]}
                className="ml-3 size-12"
              />
            </View>

            <FlatList
              data={Object.keys(AVATARS) as AvatarKey[]}
              numColumns={3} // 4 sütunluk grid
              keyExtractor={item => item}
              contentContainerStyle={{
                paddingBottom: 0,
              }}
              style={{
                marginTop: 20,
                maxHeight: height / 2.5, // ✅ maksimum yükseklik
              }}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => setAvatar(item)}
                  style={{margin: 8}}>
                  <Image
                    source={AVATARS[item]}
                    className="size-20 rounded-full"
                    style={{
                      borderWidth: avatar === item ? 3 : 0,
                      borderColor: avatar === item ? '#16d750' : 'transparent',
                    }}
                  />
                </TouchableOpacity>
              )}
            />

            <View className="flex-row items-center justify-center mt-3">
              <TouchableOpacity
                onPress={() => {
                  setShowAvatarModal(false);
                }}
                className="py-2 px-3 rounded-2xl items-center mx-2 mt-6"
                style={{backgroundColor: colors.background.secondary}}>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  {t('avatarModal.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setShowAvatarModal(false);
                  await updateAvatar(avatar);
                }}
                className="py-2 px-3 rounded-2xl items-center mx-2 mt-6"
                style={{backgroundColor: '#16d750'}}>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.background.secondary}}>
                  {t('avatarModal.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={showHCAlert}
        animationType="fade"
        onRequestClose={() => setShowHCAlert(false)}>
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
              {t('hcAlert.message')
                .split(/(\*\*.*?\*\*)/g)
                .map((part, i) =>
                  part.startsWith('**') ? (
                    <Text key={i} style={{fontWeight: 'bold'}}>
                      {part.replace(/\*\*/g, '')}
                    </Text>
                  ) : (
                    part
                  ),
                )}
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
                      ? t('hcAlert.downloadedHC')
                      : t('hcAlert.downloadHC')}
                  </Text>
                  {isHealthConnectInstalled && (
                    <Image
                      source={icons.check}
                      className="size-5 ml-2"
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
                      ? t('hcAlert.downloadedSH')
                      : t('hcAlert.downloadSH')}
                  </Text>
                  {isSamsungHInstalled && (
                    <Image
                      source={icons.check}
                      className="size-5 ml-2"
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
                  {t('hcAlert.cancel')}
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
