import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initialize,
  requestPermission,
  readRecords,
  ReadRecordsResult,
  RecordType,
  aggregateRecord,
} from 'react-native-health-connect';
import {upsertSymptomsByDate} from '../symptoms/symptomsService';
import NetInfo from '@react-native-community/netinfo';
import {Alert, Linking, Platform, ToastAndroid} from 'react-native';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';
import {getInstalledApps} from 'react-native-get-app-list';

// export const isHealthConnectInstalled = async (): Promise<boolean> => {
//   if (Platform.OS !== 'android') return false;

//   try {
//     // Android Package Name → Health Connect
//     const packageName = 'com.google.android.apps.healthdata';
//     const canOpen = await Linking.canOpenURL(`package:${packageName}`);
//     return canOpen;
//   } catch (err) {
//     console.log('[HC] Package check failed', err);
//     return false;
//   }
// };

export const isHealthConnectInstalled = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    const apps = await getInstalledApps();
    console.log(apps);
    const isInstalled = apps.some(
      app => app.packageName === 'com.google.android.apps.healthdata',
    );
    console.log(isInstalled);
    return isInstalled;
  } catch (err) {
    console.log('[HC] check failed', err);
    return false;
  }
};

export const checkHealthConnectAvailable = async (): Promise<boolean> => {
  try {
    await initialize();
    return true;
  } catch (err) {
    console.log('Health Connect init error:', err);
    return false;
  }
};

// TO DO Burada aggregated olmayan fonksiyonların dizi dönmesi lazım

const todayStart = () => new Date().setHours(0, 0, 0, 0);
const todayEnd = () => new Date().setHours(23, 59, 59, 999);
const keyPrefix = 'symptoms_';
const todayStr = () => new Date().toISOString().slice(0, 10);
const todayKey = () => keyPrefix + todayStr();

let isInitialized = false;

const initializeService = async () => {
  if (isInitialized) return true;
  isInitialized = await initialize();
  console.log('[HC] initialized →', isInitialized);
  return isInitialized;
};

const requestReadPermission = async (recordTypes: RecordType[]) => {
  if (!(await initializeService())) return false;
  const granted = await requestPermission(
    recordTypes.map(rt => ({accessType: 'read', recordType: rt})),
  );
  console.log('[HC] granted →', granted);
  return granted.length === recordTypes.length;
};

export const initializeHealthConnect = async () => {
  const allRecordTypes: RecordType[] = [
    'HeartRate',
    'Steps',
    'ActiveCaloriesBurned',
    'TotalCaloriesBurned',
    'SleepSession',
    'StepsCadence',
  ];

  if (!(await initializeService())) return false;

  const granted = await requestPermission(
    allRecordTypes.map(rt => ({accessType: 'read', recordType: rt})),
  );

  console.log('[HC] Permissions granted:', granted);

  return granted.length === allRecordTypes.length;
};

const initHealth = async () => {
  const isHealthConnectReady = await initializeHealthConnect();
  if (!isHealthConnectReady) {
    console.log('Health connect permissions not fully granted.');
    return;
  }
  console.log('All health permissions granted. Ready to collect data.');
};

export const readSampleData = async (
  recordType: RecordType,
  // If there is no date given, todays begin and end date are selected
  startTime: Date = new Date(todayStart()),
  endTime: Date = new Date(todayEnd()),
) => {
  // initialize the client
  if (!(await initializeService())) return;

  const result = await readRecords(recordType, {
    timeRangeFilter: {
      operator: 'between',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
  });

  console.log('Result ' + recordType, result);

  return result;
};

export const aggregatedSampleData = async (
  // recordType: RecordType,
  startTime: Date = new Date(todayStart()),
  endTime: Date = new Date(todayEnd()),
) => {
  let recordType: RecordType = 'ActiveCaloriesBurned';
  // initialize the client
  if (!(await initializeService())) return;

  const currentDate = new Date();

  const result = await aggregateRecord({
    recordType,
    timeRangeFilter: {
      operator: 'between',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
  });

  console.log('Aggregated Result ' + recordType, result);

  return result;
};

export const getHeartRate = async () => {
  const result: any = await readSampleData('HeartRate');

  if (!result.records || result.records.length === 0) return -1;

  const sorted = result.records.sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return sorted[0].value;
};

export const getSteps = async () => {
  const result: any = await readSampleData('Steps');

  if (!result.records) return -1;

  const count = result.records.reduce(
    (sum: number, r: any) => sum + (r.count ?? 0),
    0,
  );

  return count;
};

export const getAggregatedSteps = async () => {
  const recordType: RecordType = 'Steps';
  const result: any = await aggregateRecord({
    recordType,
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(todayStart()).toISOString(),
      endTime: new Date(todayEnd()).toISOString(),
    },
  });

  if (!result.COUNT_TOTAL) return -1;

  console.log('Aggregated result ' + recordType, result);

  const steps = result.COUNT_TOTAL;

  return steps;
};

export const getActiveCaloriesBurned = async () => {
  const result: any = await readSampleData('ActiveCaloriesBurned');
  // TO DO buranın dizi dönmesi lazım çünkü aggreagated fonksiyonu ayrı

  if (!result.records) return -1;

  const activeKcal = result.records.reduce(
    (sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0),
    0,
  );

  return Math.floor(activeKcal);
};

export const getAggregatedActiveCaloriesBurned = async () => {
  const recordType: RecordType = 'ActiveCaloriesBurned';
  const result: any = await aggregateRecord({
    recordType,
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      endTime: new Date(todayEnd()).toISOString(),
    },
  });

  console.log('Aggregated result ' + recordType, result);

  const kcal = result.ACTIVE_CALORIES_TOTAL.inKilocalories;

  return kcal;
};

export const getTotalCaloriesBurned = async () => {
  const result: any = await readSampleData('TotalCaloriesBurned');

  if (!result.records) return -1;

  const totalKcal = result.records.reduce(
    (sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0),
    0,
  );

  return totalKcal;
};

export const getTotalSleepMinutes = async () => {
  const result: any = await readSampleData('SleepSession');

  if (!result.records || result.records.length === 0) return -1;

  const totalMs = result.records.reduce((sum: number, r: any) => {
    if (!r.startDate || !r.endDate) return sum;

    const start = new Date(r.startDate).getTime();
    const end = new Date(r.endDate).getTime();

    return sum + (end - start);
  }, 0);

  // ✅ toplam dakikaya çevir
  const totalMinutes = totalMs / (1000 * 60);

  return Math.round(totalMinutes); // tam sayı olarak
};

export const getLastSleepSession = async () => {
  const result: any = await readSampleData('SleepSession');

  if (!result?.records || result.records.length === 0) return null;

  const sorted = result.records.sort(
    (a: any, b: any) =>
      new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );

  const last = sorted[0];
  const durationMs =
    new Date(last.endDate).getTime() - new Date(last.startDate).getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  return {
    start: last.startDate,
    end: last.endDate,
    durationHours: parseFloat(durationHours.toFixed(2)),
  };
};

export const getAllSleepSessions = async () => {
  const result: any = await readSampleData('SleepSession');

  if (!result.records || result.records.length === 0) return [];

  const sorted = result.records.sort(
    (a: any, b: any) =>
      new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );

  const sessions = sorted.map((session: any) => {
    const durationMs =
      new Date(session.endDate).getTime() -
      new Date(session.startDate).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    return {
      start: session.startDate,
      end: session.endDate,
      durationHours: parseFloat(durationHours.toFixed(2)),
    };
  });

  return sessions;
};

export const saveData = async (key: string, symptoms: Symptoms) => {
  const response = await upsertSymptomsByDate(new Date(), symptoms);
  let isSynced = false;
  if (response.status === 200) {
    isSynced = true;
  }
  const localSymptoms: LocalSymptoms = {
    symptoms: symptoms,
    isSynced: isSynced,
  };
  await AsyncStorage.setItem(key, JSON.stringify(localSymptoms));
};

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      console.log(`Timeout: returning fallback after ${ms} ms`);
      resolve(fallback);
    }, ms);

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        console.log('Promise rejected:', err);
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export const saveSymptoms = async (symptoms: Symptoms) => {
  const key = todayKey();

  console.log();
  const state = await NetInfo.fetch();
  const isConnected = state.isConnected;
  if (!isConnected) {
    Toast.show({
      type: 'error',
      text1: 'İnternet bağlantısı yok',
      text2: 'Verileriniz senkronize edilemiyor', //'\nVerilerinizi senkronize etmek için lütfen internete bağlanın.'
      position: 'top',
      visibilityTime: 5500,
      text1Style: {fontSize: 18},
      text2Style: {fontSize: 16},
    });
    return;
  }

  let symptomsObjectToSave: LocalSymptoms = {
    symptoms: symptoms,
    isSynced: false,
  };

  // if (!(await initializeService())) {
  //   if (symptoms) {
  //     await AsyncStorage.setItem(key, JSON.stringify(symptomsObjectToSave));
  //     try {
  //       const response = await upsertSymptomsByDate(new Date(), symptoms);
  //       if (response.status === 200) {
  //         symptomsObjectToSave.isSynced = true;
  //       }
  //       await AsyncStorage.setItem(key, JSON.stringify(symptomsObjectToSave));
  //     } catch (error) {
  //       return;
  //     }
  //   }
  // }

  try {
    const response = await upsertSymptomsByDate(new Date(), symptoms);
    if (response.status === 200) {
      symptomsObjectToSave.isSynced = true;
    }

    await AsyncStorage.setItem(key, JSON.stringify(symptomsObjectToSave));

    return response.data as Symptoms;
  } catch (error) {
    return;
  }
};

// export const getSymptoms = async () => {
//   const key = todayKey();

//   if (!(await initializeService())) {
//     if (symptoms) {
//       const localSymptomsObjectToSave: LocalSymptoms = {
//         symptoms: symptoms,
//         isSynced: false,
//       };
//       await AsyncStorage.setItem(
//         key,
//         JSON.stringify(localSymptomsObjectToSave),
//       );
//       try {
//         const response = await upsertSymptomsByDate(new Date(), symptoms);
//         if (response.status === 200) {
//           localSymptomsObjectToSave.isSynced = true;
//         }
//         await AsyncStorage.setItem(
//           key,
//           JSON.stringify(localSymptomsObjectToSave),
//         );
//       } catch (error) {
//         return;
//       }
//     }
//   }

//   const heartRate = await withTimeout(getHeartRate(), 5000, -1);
//   let aggregatedSteps = await withTimeout(getAggregatedSteps(), 5000, -1);
//   if (aggregatedSteps === -1) {
//     aggregatedSteps = await withTimeout(getSteps(), 5000, -1);
//   }
//   const activeCaloriesBurned = await withTimeout(
//     getActiveCaloriesBurned(),
//     5000,
//     -1,
//   );
//   const totalSleepMinutes = await withTimeout(getTotalSleepMinutes(), 5000, -1);
//   const sleepSessions = await withTimeout(getAllSleepSessions(), 5000, ['']);

//   const allKeys = await AsyncStorage.getAllKeys();
//   if (allKeys) {
//     const outdated = allKeys.filter(k => k.startsWith(keyPrefix) && k !== key);
//     if (outdated.length) await AsyncStorage.multiRemove(outdated);
//   }

//   const localData = await AsyncStorage.getItem(key);
//   let localSymptoms: Symptoms = {};
//   if (localData) {
//     const localSymptomsObject: LocalSymptoms = JSON.parse(localData);
//     localSymptoms = localSymptomsObject.symptoms;
//   }
//   localSymptoms.pulse =
//     heartRate === -1
//       ? symptoms?.pulse
//         ? symptoms.pulse
//         : localSymptoms.pulse
//       : heartRate;

//   localSymptoms.steps =
//     aggregatedSteps === -1
//       ? symptoms?.steps
//         ? symptoms.steps
//         : localSymptoms.steps
//       : aggregatedSteps;

//   localSymptoms.activeCaloriesBurned =
//     activeCaloriesBurned === -1
//       ? symptoms?.activeCaloriesBurned
//         ? symptoms.activeCaloriesBurned
//         : localSymptoms.activeCaloriesBurned
//       : activeCaloriesBurned;

//   localSymptoms.sleepHours =
//     totalSleepMinutes === -1
//       ? symptoms?.sleepHours
//         ? symptoms.sleepHours
//         : localSymptoms.sleepHours
//       : totalSleepMinutes;

//   localSymptoms.sleepSessions =
//     sleepSessions.length === 0
//       ? symptoms?.sleepSessions
//         ? symptoms.sleepSessions
//         : localSymptoms.sleepSessions
//       : sleepSessions;

//   const localSymptomsObjectToSave: LocalSymptoms = {
//     symptoms: localSymptoms,
//     isSynced: false,
//   };
//   await AsyncStorage.setItem(key, JSON.stringify(localSymptomsObjectToSave));

//   const state = await NetInfo.fetch();
//   const isConnected = state.isConnected;
//   if (!isConnected) {
//     Toast.show({
//       type: 'error',
//       text1: 'İnternet bağlantısı yok',
//       text2: 'Verileriniz senkronize edilemiyor', //'\nVerilerinizi senkronize etmek için lütfen internete bağlanın.'
//       position: 'top',
//       visibilityTime: 5500,
//       text1Style: {fontSize: 18},
//       text2Style: {fontSize: 16},
//     });
//     return;
//   }

//   return localSymptoms;
// };

export const getSymptoms = async () => {
  if (await initializeService()) {
    console.log('getHeartRate start');
    const heartRate = await withTimeout(getHeartRate(), 5000, -1);
    console.log('getHeartRate done', heartRate);

    console.log('getAggregatedSteps start');
    let aggregatedSteps = await withTimeout(getAggregatedSteps(), 5000, -1);
    console.log('getAggregatedSteps done', aggregatedSteps);

    if (aggregatedSteps === -1) {
      console.log('getSteps start');
      aggregatedSteps = await withTimeout(getSteps(), 5000, -1);
      console.log('getSteps done', aggregatedSteps);
    }

    console.log('getActiveCaloriesBurned start');
    const activeCaloriesBurned = await withTimeout(
      getActiveCaloriesBurned(),
      5000,
      -1,
    );
    console.log('getActiveCaloriesBurned done', activeCaloriesBurned);

    console.log('getTotalSleepMinutes start');
    const totalSleepMinutes = await withTimeout(
      getTotalSleepMinutes(),
      5000,
      -1,
    );
    console.log('getTotalSleepMinutes done', totalSleepMinutes);

    console.log('getAllSleepSessions start');
    const sleepSessions = await withTimeout(getAllSleepSessions(), 5000, ['']);
    console.log('getAllSleepSessions done', sleepSessions);

    const healthConnectSymptoms: Symptoms = {
      pulse: heartRate === -1 ? null : heartRate,
      steps: aggregatedSteps === -1 ? null : aggregatedSteps,
      activeCaloriesBurned:
        activeCaloriesBurned === -1 ? null : activeCaloriesBurned,
      sleepHours: totalSleepMinutes === -1 ? null : totalSleepMinutes,
      sleepSessions: sleepSessions.length > 0 ? sleepSessions : [],
    };

    return healthConnectSymptoms;
  }
};
