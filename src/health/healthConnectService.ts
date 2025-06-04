import {
  initialize,
  requestPermission,
  readRecords,
  ReadRecordsResult,
  RecordType,
  aggregateRecord,
} from 'react-native-health-connect';

// TO DO Burada aggregated olmayan fonksiyonların dizi dönmesi lazım

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

export const getAggreagtedSteps = async () => {
  const recordType: RecordType = 'Steps';
  const result: any = await aggregateRecord({
    recordType,
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
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

export const getAggreagtedActiveCaloriesBurned = async () => {
  const recordType: RecordType = 'ActiveCaloriesBurned';
  const result: any = await aggregateRecord({
    recordType,
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
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

export const readSampleData = async (
  recordType: RecordType,
  // If there is no date given, todays begin and end date are selected
  startTime: Date = new Date(new Date().setHours(0, 0, 0, 0)),
  endTime: Date = new Date(new Date().setHours(23, 59, 59, 999)),
) => {
  // initialize the client
  const isInitialized = await initialize();
  console.log('Init:', isInitialized);
  if (!isInitialized) return;

  // request permissions
  const grantedPermissions = await requestPermission([
    {accessType: 'read', recordType: recordType},
  ]);
  console.log('Granted:', grantedPermissions);
  // check if granted
  if (grantedPermissions.length <= 0) return;

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
  startTime: Date = new Date(new Date().setHours(0, 0, 0, 0)),
  endTime: Date = new Date(new Date().setHours(23, 59, 59, 999)),
) => {
  let recordType: RecordType = 'ActiveCaloriesBurned';
  // initialize the client
  const isInitialized = await initialize();
  console.log('Init:', isInitialized);
  if (!isInitialized) return;

  // request permissions
  const grantedPermissions = await requestPermission([
    {accessType: 'read', recordType: recordType},
  ]);
  console.log('Granted:', grantedPermissions);
  // check if granted
  if (grantedPermissions.length <= 0) return;

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
