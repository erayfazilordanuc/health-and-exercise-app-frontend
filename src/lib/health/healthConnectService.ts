import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initialize,
  requestPermission,
  readRecords,
  ReadRecordsResult,
  RecordType,
  aggregateRecord,
} from 'react-native-health-connect';
import {createSymptoms} from '../../api/symptoms/symptomsService';
import NetInfo from '@react-native-community/netinfo';
import {Alert, Linking, Platform, ToastAndroid} from 'react-native';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';
import {ymdLocal} from '../../utils/dates';
import {isInstalled} from '../../native/AppInstallChecker';
import {has} from 'lodash';

// ---- App/HC presence helpers ----
export const checkSamsungHInstalled = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    const hasSH = await isInstalled('com.sec.android.app.shealth');
    return hasSH;
  } catch (err) {
    console.log('[GF] check failed', err);
    return false;
  }
};

export const checkHealthConnectInstalled = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    const hasHC = await isInstalled('com.google.android.apps.healthdata');
    return hasHC;
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

// ---- Date helpers ----
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const dayRange = (d: Date) => ({start: startOfDay(d), end: endOfDay(d)});

// Legacy “today” helpers (geri uyum)
const todayStart = () => startOfDay(new Date()).getTime();
const todayEnd = () => endOfDay(new Date()).getTime();

const keyPrefix = 'symptoms_';
const keyForDate = (d: Date) => `${keyPrefix}${ymdLocal(d)}`;
const todayKey = () => keyForDate(new Date());

// ---- HC init/permissions ----
let isInitialized = false;

const initializeService = async () => {
  if (isInitialized) return true;
  isInitialized = await initialize();
  return isInitialized;
};

const requestReadPermission = async (recordTypes: RecordType[]) => {
  if (!(await initializeService())) return false;
  const granted = await requestPermission(
    recordTypes.map(rt => ({accessType: 'read', recordType: rt})),
  );
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
  return granted.length === allRecordTypes.length;
};

const initHealth = async () => {
  const ok = await initializeHealthConnect();
  if (!ok) return;
};

// ---- Generic readers (date-aware) ----
export const readSampleData = async (
  recordType: RecordType,
  startTime: Date = startOfDay(new Date()),
  endTime: Date = endOfDay(new Date()),
) => {
  if (!(await initializeService())) return;
  const result = await readRecords(recordType, {
    timeRangeFilter: {
      operator: 'between',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
  });
  return result;
};

type AggregatableRecordType = Parameters<
  typeof aggregateRecord
>[0]['recordType'];
export const aggregatedSampleData = async (
  startTime: Date = startOfDay(new Date()),
  endTime: Date = endOfDay(new Date()),
  recordType: AggregatableRecordType = 'ActiveCaloriesBurned',
) => {
  if (!(await initializeService())) return;
  const result = await aggregateRecord({
    recordType,
    timeRangeFilter: {
      operator: 'between',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
  });
  return result;
};

// ---- Heart Rate helpers ----
type HRPoint = {time: string; bpm: number; origin?: string};

const readHeartRatePoints = async (start: Date, end: Date) => {
  if (!(await initializeService())) return [];
  const res = await readRecords('HeartRate', {
    timeRangeFilter: {
      operator: 'between',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  });

  const points: HRPoint[] = [];
  for (const r of (res as any).records ?? []) {
    if (Array.isArray(r.samples)) {
      for (const s of r.samples) {
        points.push({
          time: s.time ?? r.startTime,
          bpm: s.beatsPerMinute,
          origin: r.dataOrigin?.packageName,
        });
      }
    } else if (typeof r.beatsPerMinute === 'number') {
      points.push({
        time: r.time ?? r.startTime,
        bpm: r.beatsPerMinute,
        origin: r.dataOrigin?.packageName,
      });
    }
  }
  points.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
  return points;
};

export const getLatestHeartRate = async (
  daysBack = 7,
): Promise<number | -1> => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - daysBack);
  const points = await readHeartRatePoints(start, end);
  if (!points.length) return -1;
  return points[0].bpm;
};

export const getHeartRateForDate = async (date: Date): Promise<HRPoint[]> => {
  const {start, end} = dayRange(date);
  return readHeartRatePoints(start, end);
};

export const getDailyLatestHeartRateValue = async (
  date: Date,
): Promise<number | -1> => {
  const {start, end} = dayRange(date);
  const points = await readHeartRatePoints(start, end);
  if (!points.length) return -1;
  return points[0].bpm;
};

export const getDailyLatestHeartRatePoint = async (date: Date) => {
  const {start, end} = dayRange(date);
  const points = await readHeartRatePoints(start, end);
  return points[0] ?? null;
};

// ---- Steps / Calories (date-aware primitives) ----
const aggregateStepsForRange = async (start: Date, end: Date) => {
  const res: any = await aggregateRecord({
    recordType: 'Steps',
    timeRangeFilter: {
      operator: 'between',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  });
  return res?.COUNT_TOTAL ?? -1;
};

const sumStepsForRange = async (start: Date, end: Date) => {
  const r: any = await readRecords('Steps', {
    timeRangeFilter: {
      operator: 'between',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  });
  return (r?.records ?? []).reduce(
    (sum: number, it: any) => sum + (it.count ?? 0),
    0,
  );
};

const sumCaloriesForRange = async (
  recordType: Extract<
    RecordType,
    'TotalCaloriesBurned' | 'ActiveCaloriesBurned'
  >,
  start: Date,
  end: Date,
) => {
  const r: any = await readRecords(recordType, {
    timeRangeFilter: {
      operator: 'between',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  });
  const kcal = (r?.records ?? []).reduce(
    (sum: number, it: any) => sum + (it.energy?.inKilocalories ?? 0),
    0,
  );
  return recordType === 'ActiveCaloriesBurned' ? Math.floor(kcal) : kcal;
};

// Legacy helpers (bugün) – geri uyum için bırakıldı
export const getHeartRate = async () => {
  const result: any = await readSampleData('HeartRate');
  if (!result?.records?.length) return -1;
  const sorted = result.records.sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return sorted[0].value;
};

export const getSteps = async () => {
  const result: any = await readSampleData('Steps');
  if (!result?.records) return -1;
  return result.records.reduce(
    (sum: number, r: any) => sum + (r.count ?? 0),
    0,
  );
};

export const getAggregatedSteps = async () => {
  const res: any = await aggregateRecord({
    recordType: 'Steps',
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(todayStart()).toISOString(),
      endTime: new Date(todayEnd()).toISOString(),
    },
  });
  return res?.COUNT_TOTAL ?? -1;
};

export const getActiveCaloriesBurned = async () => {
  const result: any = await readSampleData('ActiveCaloriesBurned');
  if (!result?.records) return -1;
  const activeKcal = result.records.reduce(
    (sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0),
    0,
  );
  return Math.floor(activeKcal);
};

export const getAggregatedActiveCaloriesBurned = async () => {
  const result: any = await aggregateRecord({
    recordType: 'ActiveCaloriesBurned',
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(todayStart()).toISOString(),
      endTime: new Date(todayEnd()).toISOString(),
    },
  });
  return result?.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? -1;
};

export const getTotalCaloriesBurned = async () => {
  const result: any = await readSampleData('TotalCaloriesBurned');
  if (!result?.records) return -1;
  return result.records.reduce(
    (sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0),
    0,
  );
};

// ---- Sleep (today & date-aware) ----
export const getTotalSleepMinutes = async () => {
  const result: any = await readSampleData('SleepSession');
  if (!result?.records?.length) return -1;

  const totalMs = result.records.reduce((sum: number, r: any) => {
    if (!r.startDate || !r.endDate) return sum;
    const s = new Date(r.startDate).getTime();
    const e = new Date(r.endDate).getTime();
    return sum + (e - s);
  }, 0);

  return Math.round(totalMs / 60000);
};

export const getLastSleepSession = async () => {
  const result: any = await readSampleData('SleepSession');
  if (!result?.records?.length) return null;

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
  if (!result?.records?.length) return [];

  const sorted = result.records.sort(
    (a: any, b: any) =>
      new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );

  return sorted.map((session: any) => {
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
};

// ---- Promise timeout ----
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
      v => {
        clearTimeout(timer);
        resolve(v);
      },
      err => {
        console.log('Promise rejected:', err);
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

// ---- Save / Load symptoms ----
export const saveSymptoms = async (symptoms: Symptoms, date?: Date) => {
  const key = keyForDate(date ?? new Date());
  const payload: LocalSymptoms = {
    symptoms,
    isSynced: false,
  };

  const state = await NetInfo.fetch();
  const isConnected = state.isConnected;

  if (!isConnected) {
    await AsyncStorage.setItem(key, JSON.stringify(payload));
    return;
  }

  try {
    if (!symptoms) return;
    const response = await createSymptoms(symptoms);
    if (response?.status === 200) {
      payload.isSynced = true;
    }
    await AsyncStorage.setItem(key, JSON.stringify(payload));
    return response?.data as Symptoms;
  } catch (error) {
    console.log('save symptoms error', error);
    await AsyncStorage.setItem(key, JSON.stringify(payload)); // offline fallback
    return;
  }
};

// ---- Sleep summary for “today” (kept, used below) ----
export interface SleepSessionRaw {
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  dataOrigin?: {packageName?: string};
}

export interface TodaySleepSession {
  start: string;
  end: string;
  durationMinutesToday: number;
  origin?: string;
}

export interface TodaySleepSummary {
  totalMinutes: number;
  pretty: string;
  sessions: TodaySleepSession[];
}

const isValidDate = (d: Date) => !Number.isNaN(d.getTime());

const dayBounds = (ref: Date = new Date()) => {
  const start = startOfDay(ref);
  const end = endOfDay(ref);
  const qStart = new Date(start);
  qStart.setDate(qStart.getDate() - 1);
  qStart.setHours(18, 0, 0, 0);
  return {start, end, qStart};
};

const overlapMs = (a0: Date, a1: Date, b0: Date, b1: Date): number =>
  Math.max(
    0,
    Math.min(a1.getTime(), b1.getTime()) - Math.max(a0.getTime(), b0.getTime()),
  );

export const getTodaySleepSummary = async (opts?: {
  onlySamsung?: boolean;
}): Promise<TodaySleepSummary> => {
  if (!(await initializeService()))
    return {totalMinutes: 0, pretty: '0h 0m', sessions: []};

  const {start: dayStart, end: dayEnd, qStart} = dayBounds(new Date());
  const res = await readRecords('SleepSession', {
    timeRangeFilter: {
      operator: 'between',
      startTime: qStart.toISOString(),
      endTime: dayEnd.toISOString(),
    },
  });

  const raw: SleepSessionRaw[] = Array.isArray((res as any)?.records)
    ? (res as any).records!
    : [];

  const filtered = opts?.onlySamsung
    ? raw.filter(r =>
        r?.dataOrigin?.packageName?.toLowerCase?.().includes('samsung'),
      )
    : raw;

  const sessions = filtered
    .map(r => {
      const s = new Date(r.startTime ?? r.startDate ?? 0);
      const e = new Date(r.endTime ?? r.endDate ?? 0);
      return {start: s, end: e, origin: r.dataOrigin?.packageName};
    })
    .filter(se => isValidDate(se.start) && isValidDate(se.end))
    .map(se => {
      const ms = overlapMs(se.start, se.end, dayStart, dayEnd);
      return {...se, durationMsToday: ms};
    })
    .filter(se => (se.durationMsToday ?? 0) > 0)
    .sort((a, b) => b.end.getTime() - a.end.getTime());

  const totalMs = sessions.reduce(
    (sum, s) => sum + (s.durationMsToday ?? 0),
    0,
  );
  const totalMinutes = Math.round(totalMs / 60000);
  const pretty = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

  const outSessions: TodaySleepSession[] = sessions.map(s => ({
    start: s.start.toISOString(),
    end: s.end.toISOString(),
    durationMinutesToday: Math.round((s.durationMsToday ?? 0) / 60000),
    origin: s.origin,
  }));

  return {totalMinutes, pretty, sessions: outSessions};
};

// ---- Composite calculators (date-aware) ----

// getSymptoms(date?) → default today; backward compatible
export const getSymptoms = async (date?: Date) => {
  if (!(await initializeService())) return;

  const target = date ?? new Date();
  const {start, end} = dayRange(target);

  const heartRate = await withTimeout(
    getDailyLatestHeartRateValue(target),
    5000,
    -1,
  );

  let steps = await withTimeout(aggregateStepsForRange(start, end), 5000, -1);
  if (steps === -1) {
    steps = await withTimeout(sumStepsForRange(start, end), 5000, -1);
  }

  const totalCaloriesBurned = await withTimeout(
    sumCaloriesForRange('TotalCaloriesBurned', start, end),
    5000,
    -1,
  );

  const activeCaloriesBurned = await withTimeout(
    sumCaloriesForRange('ActiveCaloriesBurned', start, end),
    5000,
    -1,
  );

  const totalSleepMinutes = await withTimeout(
    (async () => {
      // tarihli versiyon (dün 18:00 → gün sonu)
      const dayStart = startOfDay(target);
      const dayEnd = endOfDay(target);
      const qStart = new Date(dayStart);
      qStart.setDate(qStart.getDate() - 1);
      qStart.setHours(18, 0, 0, 0);

      const res = await readRecords('SleepSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: qStart.toISOString(),
          endTime: dayEnd.toISOString(),
        },
      });

      const raw: SleepSessionRaw[] = Array.isArray((res as any)?.records)
        ? (res as any).records
        : [];

      const ms = raw
        .map(r => {
          const s = new Date(r.startTime ?? r.startDate ?? 0);
          const e = new Date(r.endTime ?? r.endDate ?? 0);
          return {s, e};
        })
        .filter(se => isValidDate(se.s) && isValidDate(se.e))
        .map(se => overlapMs(se.s, se.e, dayStart, dayEnd))
        .filter(x => x > 0)
        .reduce((a, b) => a + b, 0);

      return Math.round(ms / 60000);
    })(),
    5000,
    -1,
  );

  const out: Symptoms = {
    pulse: heartRate === -1 ? undefined : heartRate,
    steps: steps === -1 ? null : steps,
    totalCaloriesBurned:
      totalCaloriesBurned === -1 ? null : Math.round(totalCaloriesBurned),
    activeCaloriesBurned:
      activeCaloriesBurned === -1 ? null : activeCaloriesBurned,
    sleepMinutes: totalSleepMinutes === -1 ? null : totalSleepMinutes,
    createdAt: start, // gün başlangıcı
    updatedAt: new Date(), // şimdi
  };

  console.log('hc symptoms (date-aware)', ymdLocal(target), out);
  return out;
};

// Sadece isim konvansiyonu isteyen yerler için proxy (değiştirmeden kullanan kod kırılmasın)
export const getSymptomsByDate = async (date: Date) => {
  return getSymptoms(date);
};

// Aylık: her gün için {date, Symptoms}
export const getMontlySymptoms = async (ref: Date = new Date()) => {
  if (!(await initializeService())) return [];

  const y = ref.getFullYear();
  const m = ref.getMonth(); // 0-11
  const lastDay = new Date(y, m + 1, 0);
  const daysInMonth = lastDay.getDate();

  const out: Array<{date: string} & Symptoms> = [];

  // Not: istersen Promise.all + concurrency limit ile hızlandırılabilir.
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(y, m, d);
    const s = await getSymptoms(day).catch(() => undefined);

    out.push({
      date: ymdLocal(day),
      pulse: s?.pulse,
      steps: s?.steps ?? undefined,
      totalCaloriesBurned:
        typeof s?.totalCaloriesBurned === 'number'
          ? s!.totalCaloriesBurned
          : null,
      activeCaloriesBurned:
        typeof s?.activeCaloriesBurned === 'number'
          ? s!.activeCaloriesBurned
          : null,
      sleepMinutes:
        typeof s?.sleepMinutes === 'number' ? s!.sleepMinutes : null,
      createdAt: s?.createdAt ?? startOfDay(day),
      updatedAt: s?.updatedAt ?? new Date(),
    });
  }

  return out;
};

// ---- Health score (dokunulmadı) ----
const clampPct = (n: number) => Math.max(0, Math.min(100, n));
const linearScore = (v?: number, min = 0, max = 1) => {
  if (v == null || !Number.isFinite(v) || max === min) return NaN;
  return clampPct(((v - min) / (max - min)) * 100);
};
const triangularScore = (
  hardMin: number,
  idealMin: number,
  idealMax: number,
  hardMax: number,
  v?: number,
) => {
  if (!v || !Number.isFinite(v)) return NaN;
  if (v <= hardMin || v >= hardMax) return 0;
  if (v >= idealMin && v <= idealMax) return 100;
  if (v < idealMin)
    return clampPct(((v - hardMin) / (idealMin - hardMin)) * 100);
  return clampPct(((hardMax - v) / (hardMax - idealMax)) * 100);
};

export const computeHealthScore = (
  p: {
    heartRate?: number;
    steps?: number;
    totalCalories?: number;
    activeCalories?: number;
    sleepMinutes?: number;
  },
  opts?: {fallback?: number},
) => {
  const {heartRate, steps, totalCalories, activeCalories, sleepMinutes} = p;
  const caloriesValue = totalCalories ?? activeCalories;

  const hrScore = triangularScore(40, 55, 75, 110, heartRate);
  const stepScore = linearScore(steps, 0, 2500);
  const clScore = linearScore(caloriesValue, 0, 2750);
  const slpScore = triangularScore(240, 420, 540, 720, sleepMinutes);

  const weights = {hr: 0.25, steps: 0.3, cl: 0.15, slp: 0.3} as const;

  const parts: Array<[number, number]> = [];
  if (!Number.isNaN(hrScore)) parts.push([hrScore, weights.hr]);
  if (!Number.isNaN(stepScore)) parts.push([stepScore, weights.steps]);
  if (!Number.isNaN(clScore)) parts.push([clScore, weights.cl]);
  if (!Number.isNaN(slpScore)) parts.push([slpScore, weights.slp]);

  if (parts.length === 0) return opts?.fallback ?? 0;

  const totalW = parts.reduce((s, [, w]) => s + w, 0);
  const sum = parts.reduce((s, [sc, w]) => s + sc * w, 0);

  return Math.round(sum / totalW);
};
