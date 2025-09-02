import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initialize,
  requestPermission,
  readRecords,
  ReadRecordsResult,
  RecordType,
  aggregateRecord,
} from 'react-native-health-connect';
import {
  createSymptoms,
} from '../../api/symptoms/symptomsService';
import NetInfo from '@react-native-community/netinfo';
import {Alert, Linking, Platform, ToastAndroid} from 'react-native';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';
import {getInstalledApps} from 'react-native-get-app-list';
import {ymdLocal} from '../../utils/dates';

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

export const checkSamsungHInstalled = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    const apps = await getInstalledApps();
    const isInstalled = apps.some(
      app => app.packageName === 'com.sec.android.app.shealth',
    );
    return isInstalled;
  } catch (err) {
    console.log('[GF] check failed', err);
    return false;
  }
};

export const checkHealthConnectInstalled = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    const apps = await getInstalledApps();
    const isInstalled = apps.some(
      app => app.packageName === 'com.google.android.apps.healthdata',
    );
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
const todayStr = () => ymdLocal(new Date());
const todayKey = () => keyPrefix + todayStr();

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
  const isHealthConnectReady = await initializeHealthConnect();
  if (!isHealthConnectReady) {
    return;
  }
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

  return result;
};

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

  const points: {time: string; bpm: number; origin?: string}[] = [];

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

  // burada kendi sıralamanı yap
  points.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );

  return points;
};

// En güncel nabız (son N gün içinde)
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

// Belirli bir günün (örn. dün) tüm nabız noktaları
export const getHeartRateForDate = async (date: Date): Promise<HRPoint[]> => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return readHeartRatePoints(start, end);
};

export const getDailyLatestHeartRateValue = async (
  date: Date,
): Promise<number | -1> => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const points = await readHeartRatePoints(start, end); // yeni→eski sıralı
  if (!points.length) return -1;
  return points[0].bpm;
};

// Zaman bilgisini de istiyorsan:
export const getDailyLatestHeartRatePoint = async (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const points = await readHeartRatePoints(start, end);
  return points[0] ?? null; // { time, bpm, origin }
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
  console.log('consoleee', todayEnd(), todayStart());
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
  console.log('eeeee');
  const key = todayKey();

  let symptomsObjectToSave: LocalSymptoms = {
    symptoms: symptoms,
    isSynced: false,
  };

  console.log('the key', key);
  console.log('saved local', symptomsObjectToSave);

  const state = await NetInfo.fetch();
  const isConnected = state.isConnected;
  if (!isConnected) {
    // Toast.show({
    //   type: 'error',
    //   text1: 'İnternet bağlantısı yok',
    //   text2: 'Verileriniz senkronize edilemiyor', //'\nVerilerinizi senkronize etmek için lütfen internete bağlanın.'
    //   position: 'top',
    //   visibilityTime: 5500,
    //   text1Style: {fontSize: 18},
    //   text2Style: {fontSize: 16},
    // });

    await AsyncStorage.setItem(key, JSON.stringify(symptomsObjectToSave));
    return;
  }

  try {
    if (!symptoms) return;

    // const response = await upsertSymptomsByDate(new Date(), symptoms);
    const response = await createSymptoms(symptoms);
    if (response.status === 200) {
      symptomsObjectToSave.isSynced = true;
    }

    await AsyncStorage.setItem(key, JSON.stringify(symptomsObjectToSave));

    return response.data as Symptoms;
  } catch (error) {
    console.log('save symptoms error', error);
    return;
  }
};

export const getSymptoms = async () => {
  if (await initializeService()) {
    // const heartRate = await withTimeout(getHeartRate(), 5000, -1);
    const heartRate = await withTimeout(
      getDailyLatestHeartRateValue(new Date()),
      5000,
      -1,
    );

    let aggregatedSteps = await withTimeout(getAggregatedSteps(), 5000, -1);

    if (aggregatedSteps === -1) {
      aggregatedSteps = await withTimeout(getSteps(), 5000, -1);
    }

    const totalCaloriesBurned = await withTimeout(
      getTotalCaloriesBurned(),
      5000,
      -1,
    );

    const activeCaloriesBurned = await withTimeout(
      getActiveCaloriesBurned(),
      5000,
      -1,
    );

    // const totalSleepMinutes = await withTimeout(
    //   getTotalSleepMinutes(),
    //   5000,
    //   -1,
    // );

    const totalSleepMinutes = await withTimeout(
      getTodaySleepSummary().then(r => r.totalMinutes),
      5000,
      -1,
    );

    const healthConnectSymptoms: Symptoms = {
      pulse: heartRate === -1 ? undefined : heartRate,
      steps: aggregatedSteps === -1 ? null : aggregatedSteps,
      totalCaloriesBurned:
        totalCaloriesBurned === -1 ? null : Math.round(totalCaloriesBurned),
      activeCaloriesBurned:
        activeCaloriesBurned === -1 ? null : activeCaloriesBurned,
      sleepMinutes: totalSleepMinutes === -1 ? null : totalSleepMinutes,
    };

    console.log('hc symptoms', healthConnectSymptoms);

    return healthConnectSymptoms;
  }
};
// “Bugün” için toplam uyku
// ---- Types ----
export interface SleepSessionRaw {
  startTime?: string; // ISO
  endTime?: string; // ISO
  startDate?: string; // bazı SDK sürümleri
  endDate?: string; // bazı SDK sürümleri
  dataOrigin?: {packageName?: string};
}

export interface TodaySleepSession {
  start: string; // ISO
  end: string; // ISO
  durationMinutesToday: number; // sadece bugüne düşen kısım
  origin?: string;
}

export interface TodaySleepSummary {
  totalMinutes: number;
  pretty: string; // "8h 59m"
  sessions: TodaySleepSession[];
}

const isValidDate = (d: Date) => !Number.isNaN(d.getTime());

// Gün sınırı (00:00–23:59) + sorgu aralığını genişlet (dün 18:00 → bugün 23:59)
const dayBounds = (ref: Date = new Date()) => {
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);
  const end = new Date(ref);
  end.setHours(23, 59, 59, 999);
  const qStart = new Date(start);
  qStart.setDate(qStart.getDate() - 1);
  qStart.setHours(18, 0, 0, 0);
  return {start, end, qStart};
};

// iki aralığın kesişimini (ms) al
const overlapMs = (a0: Date, a1: Date, b0: Date, b1: Date): number =>
  Math.max(
    0,
    Math.min(a1.getTime(), b1.getTime()) - Math.max(a0.getTime(), b0.getTime()),
  );

// “Bugün” için toplam uyku (SleepSession)
export const getTodaySleepSummary = async (opts?: {
  onlySamsung?: boolean;
}): Promise<TodaySleepSummary> => {
  if (!(await initializeService())) {
    return {totalMinutes: 0, pretty: '0h 0m', sessions: []};
  }

  const {start: dayStart, end: dayEnd, qStart} = dayBounds(new Date());

  const res = await readRecords('SleepSession', {
    timeRangeFilter: {
      operator: 'between',
      startTime: qStart.toISOString(),
      endTime: dayEnd.toISOString(),
    },
  });

  const raw: SleepSessionRaw[] = Array.isArray(res?.records)
    ? res.records!
    : [];

  const filtered = opts?.onlySamsung
    ? raw.filter(r =>
        r?.dataOrigin?.packageName?.toLowerCase?.().includes('samsung'),
      )
    : raw;

  // normalize
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

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

const linearScore = (v?: number, min = 0, max = 1) => {
  if (v == null || !Number.isFinite(v) || max === min) return NaN; // yoksa: NaN -> hesaba dahil edilmez
  return clampPct(((v - min) / (max - min)) * 100);
};

const triangularScore = (
  hardMin: number,
  idealMin: number,
  idealMax: number,
  hardMax: number,
  v?: number,
) => {
  if (!v || !Number.isFinite(v)) return NaN; // yoksa: NaN -> hesaba dahil edilmez
  if (v <= hardMin || v >= hardMax) return 0;
  if (v >= idealMin && v <= idealMax) return 100;
  if (v < idealMin) {
    return clampPct(((v - hardMin) / (idealMin - hardMin)) * 100);
  }
  return clampPct(((hardMax - v) / (hardMax - idealMax)) * 100);
};

export const computeHealthScore = (
  p: {
    heartRate?: number; // bpm
    steps?: number; // adım
    totalCalories?: number; // kcal (dinlenme+aktif)
    activeCalories?: number; // kcal (aktif)
    sleepMinutes?: number; // dakika
  },
  opts?: {fallback?: number}, // tüm metrikler yoksa önceki skoru korumak için
) => {
  const {heartRate, steps, totalCalories, activeCalories, sleepMinutes} = p;

  // total varsa onu kullan, yoksa active; ikisi de yoksa NaN döner (linearScore içinde)
  const caloriesValue = totalCalories ?? activeCalories;

  // Alt skorlar (0–100, yoksa NaN)
  const hrScore = triangularScore(40, 55, 75, 110, heartRate);
  const stepScore = linearScore(steps, 0, 2500);
  const clScore = linearScore(caloriesValue, 0, 2750);
  const slpScore = triangularScore(240, 420, 540, 720, sleepMinutes);

  // Ağırlıklar (toplam 1.0)
  const weights = {hr: 0.25, steps: 0.3, cl: 0.15, slp: 0.3} as const;

  // Yalnızca geçerli (NaN olmayan) skorları dahil et
  const parts: Array<[number, number]> = [];
  if (!Number.isNaN(hrScore)) parts.push([hrScore, weights.hr]);
  if (!Number.isNaN(stepScore)) parts.push([stepScore, weights.steps]);
  if (!Number.isNaN(clScore)) parts.push([clScore, weights.cl]);
  if (!Number.isNaN(slpScore)) parts.push([slpScore, weights.slp]);

  // Hepsi yoksa: düşürmesin → önceki skoru koru (opsiyon), yoksa 0 dön
  if (parts.length === 0) return opts?.fallback ?? 0;

  // Ağırlıkları mevcut metriklere göre normalize et
  const totalW = parts.reduce((s, [, w]) => s + w, 0);
  const sum = parts.reduce((s, [sc, w]) => s + sc * w, 0);

  return Math.round(sum / totalW);
};
