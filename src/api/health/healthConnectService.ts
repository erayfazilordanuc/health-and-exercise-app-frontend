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

export const readSampleData = async (
  recordType: RecordType,
  // If there is no date given, todays begin and end date are selected
  startTime: Date = new Date(todayStart()),
  endTime: Date = new Date(todayEnd()),
) => {
  // initialize the client
  if (!(await initializeService())) return;

  // request permissions
  if (!(await requestReadPermission([recordType]))) return;

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

  // request permissions
  if (!(await requestReadPermission([recordType]))) return;

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

  if (!result?.records || result.records.length === 0) return 0;

  const sorted = result.records.sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return sorted[0].value;
};

export const getSteps = async () => {
  const result: any = await readSampleData('Steps');

  if (!result?.records) return 0;

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

  console.log('Aggregated result ' + recordType, result);

  const steps = result.COUNT_TOTAL;

  return steps;
};

export const getActiveCaloriesBurned = async () => {
  const result: any = await readSampleData('ActiveCaloriesBurned');
  // TO DO buranın dizi dönmesi lazım çünkü aggreagated fonksiyonu ayrı

  if (!result?.records) return 0;

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

  if (!result?.records) return 0;

  const totalKcal = result.records.reduce(
    (sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0),
    0,
  );

  return totalKcal;
};

export const getTotalSleepHours = async () => {
  const result: any = await readSampleData('SleepSession');

  if (!result?.records || result.records.length === 0) return 0;

  const totalMs = result.records.reduce((sum: number, r: any) => {
    if (!r.startDate || !r.endDate) return sum;

    const start = new Date(r.startDate).getTime();
    const end = new Date(r.endDate).getTime();

    return sum + (end - start);
  }, 0);

  const totalHours = totalMs / (1000 * 60 * 60);

  return parseFloat(totalHours.toFixed(2));
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

  if (!result?.records || result.records.length === 0) return [];

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

const saveData = async (key: string, symptoms: Symptoms) => {
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

export const getSymptoms = async () => {
  const heartRate = await getHeartRate();
  const aggregatedSteps = await getAggregatedSteps();
  const activeCaloriesBurned = await getActiveCaloriesBurned();
  const totalSleepHours = await getTotalSleepHours();
  const sleepSessions = await getAllSleepSessions();

  const symptoms = {
    pulse: heartRate,
    steps: aggregatedSteps,
    activeCaloriesBurned: activeCaloriesBurned,
    sleepHours: totalSleepHours,
    sleepSessions: sleepSessions,
  } as Symptoms;
  console.log('symptoms', symptoms);

  const key = todayKey();
  console.log('key', key);

  const allKeys = await AsyncStorage.getAllKeys();
  if (allKeys) {
    const outdated = allKeys.filter(k => k.startsWith(keyPrefix) && k !== key);
    if (outdated.length) await AsyncStorage.multiRemove(outdated);
  }

  const localData = await AsyncStorage.getItem(key);
  console.log('localData', localData);
  if (localData) {
    const localSymptoms: LocalSymptoms = JSON.parse(localData);
    if (
      JSON.stringify(symptoms) !== JSON.stringify(localSymptoms.symptoms) ||
      !localSymptoms.isSynced
    ) {
      saveData(key, symptoms);
    }
  } else {
    saveData(key, symptoms);
  }

  return symptoms;
};
