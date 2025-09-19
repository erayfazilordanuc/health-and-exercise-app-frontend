import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import {getUser} from '../user/userService';
import NetInfo from '@react-native-community/netinfo';
import {parseYMDLocal, ymdLocal} from '../../utils/dates';
import {getMontlySymptoms} from '../../lib/health/healthConnectService';

const keyPrefix = 'symptoms_';
const todayStr = () => ymdLocal(new Date());
const todayKey = () => keyPrefix + todayStr();

export const getSymptomsById = async (id: number) => {
  const response = await apiClient.get(`/symptoms/id/${id}`);
  console.log('Get symptoms by id', response);
  return response;
};

export const getAllSymptoms = async () => {
  const response = await apiClient.get(`/symptoms`);
  console.log('Get all symptoms by user id', response);
  return response;
};

export const getLocal = async (dateStr: string) => {
  const localJson = await AsyncStorage.getItem(keyPrefix + dateStr);
  console.log('localJson', localJson);
  if (localJson)
    return (JSON.parse(localJson) as LocalSymptoms).symptoms as Symptoms;
  return null;
};

export const getLatestSymptomsByDate = async (dateStr: string) => {
  try {
    const net = await NetInfo.fetch();
    const isOnline = !!net.isConnected;

    if (isOnline) {
      const response = await apiClient.get(`/symptoms/date/${dateStr}`);
      console.log('Get latest symptoms by date response', response);
      if (response.status >= 200 && response.status < 300) {
        return response.data as Symptoms;
      } else {
        console.error('Unexpected status code:', response.status);
        return null;
      }
    }
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    return null;
  }
};

export const createSymptoms = async (symptoms: Symptoms) => {
  const upsertDTO: UpdateSymptomsDTO = {
    pulse: symptoms.pulse,
    steps: symptoms.steps,
    totalCaloriesBurned: symptoms.totalCaloriesBurned!,
    activeCaloriesBurned: symptoms.activeCaloriesBurned!,
    sleepMinutes: symptoms.sleepMinutes!,
  };
  console.log('upsertDTO', upsertDTO);

  const response = await apiClient.post(`/symptoms`, upsertDTO);
  console.log('Create response', response);
  return response;
};

export const upsertSymptomsByDate = async (date: Date, symptoms: Symptoms) => {
  const dateVariable = ymdLocal(date);
  console.log(dateVariable);
  const upsertDTO: UpdateSymptomsDTO = {
    pulse: symptoms.pulse,
    steps: symptoms.steps,
    totalCaloriesBurned: symptoms.totalCaloriesBurned!,
    activeCaloriesBurned: symptoms.activeCaloriesBurned!,
    sleepMinutes: symptoms.sleepMinutes!,
  };
  console.log('upsertDTO', upsertDTO);

  const response = await apiClient.put(
    `/symptoms/date/${dateVariable}`,
    upsertDTO,
  );
  console.log('Upsert response', response);
  return response;
};

const LATE_HOUR = 23;

const numberDiffers = (
  a?: number | null,
  b?: number | null,
  tol: number = 0,
) => {
  // Biri var diğeri yoksa → farklı
  if ((a == null) !== (b == null)) return true;
  if (a == null && b == null) return false;
  return Math.abs((a as number) - (b as number)) >= tol;
};

const hasMeaningfulDifference = (server: Symptoms, client: Symptoms) => {
  // eşik değerleri: istersen ayarlayalım
  const pulseDiff = numberDiffers(server.pulse, client.pulse, 5); // ±5 bpm
  const stepsDiff = numberDiffers(server.steps, client.steps, 300); // ±300 adım
  const totalCalDiff = numberDiffers(
    server.totalCaloriesBurned ?? null,
    client.totalCaloriesBurned ?? null,
    150, // ±150 kcal
  );
  const activeCalDiff = numberDiffers(
    server.activeCaloriesBurned ?? null,
    client.activeCaloriesBurned ?? null,
    100, // ±100 kcal
  );
  const sleepDiff = numberDiffers(server.sleepMinutes, client.sleepMinutes, 30); // ±30 dk

  // total yoksa active'e bakılır; biri olsun yeter
  const calDiff =
    totalCalDiff || (server.totalCaloriesBurned == null && activeCalDiff);

  return pulseDiff || stepsDiff || calDiff || sleepDiff;
};

const markLocalSynced = async (dateStr: string, symptoms: Symptoms) => {
  const key = `${keyPrefix}${dateStr}`;
  const prev = await AsyncStorage.getItem(key);
  const payload: LocalSymptoms = prev
    ? {...(JSON.parse(prev) as LocalSymptoms), isSynced: true, symptoms}
    : {isSynced: true, symptoms};
  await AsyncStorage.setItem(key, JSON.stringify(payload));
};

// ------------------------------------------------------------
// Asıl senkronizasyon
// ------------------------------------------------------------
export const syncMonthlySymptoms = async (ref: Date = new Date()) => {
  // 1) Online mı?
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    console.log('[syncMonthlySymptoms] offline, çıkıyorum.');
    return {
      synced: 0,
      skipped: 0,
      errors: [] as Array<{date: string; error: any}>,
    };
  }

  // 2) Aylık verileri Health Connect’ten çek
  const monthly = await getMontlySymptoms(ref); // Array<{date: string} & Symptoms>
  const todayStrVal = ymdLocal(new Date());
  const nowHour = new Date().getHours();

  let synced = 0;
  let skipped = 0;
  const errors: Array<{date: string; error: any}> = [];

  for (const dayItem of monthly) {
    const dateStr = dayItem.date;
    const dateObj = parseYMDLocal(dateStr);
    const isPast = dateStr < todayStrVal;
    const isToday = dateStr === todayStrVal;

    // 2.1) Yerelde unsynced veri varsa onu tercih et
    let candidate = dayItem as Symptoms;
    try {
      const local = await getLocal(dateStr);
      if (local) {
        candidate = {
          ...candidate,
          ...local, // local’de varsa üstüne yazsın
        };
      }
    } catch (e) {
      // local yoksa sorun değil
    }

    // 2.2) Boş günleri atla (hiç metrik yok)
    const hasAny =
      candidate.pulse != null ||
      candidate.steps != null ||
      candidate.totalCaloriesBurned != null ||
      candidate.activeCaloriesBurned != null ||
      candidate.sleepMinutes != null;

    if (!hasAny) {
      skipped++;
      continue;
    }

    // 2.3) Sunucudan en güncel kayıt
    let server: Symptoms | null | undefined = null;
    try {
      server = await getLatestSymptomsByDate(dateStr);
    } catch (err) {
      // API hatasını topla ve devam et
      errors.push({date: dateStr, error: err});
      continue;
    }

    // 2.4) Karar:
    // - Sunucuda yoksa: hemen upsert et
    // - Sunucuda varsa ve anlamlı fark var ise:
    //      * Geçmiş gün → upsert
    //      * Bugün → saat >= LATE_HOUR ise upsert; değilse atla
    let shouldUpsert = false;

    if (!server) {
      shouldUpsert = true;
    } else if (hasMeaningfulDifference(server, candidate)) {
      shouldUpsert = isPast || (isToday && nowHour >= LATE_HOUR);
    }

    if (!shouldUpsert) {
      skipped++;
      continue;
    }

    // 2.5) Upsert et
    try {
      await upsertSymptomsByDate(dateObj, {
        pulse: candidate.pulse,
        steps: candidate.steps,
        totalCaloriesBurned: candidate.totalCaloriesBurned ?? null,
        activeCaloriesBurned: candidate.activeCaloriesBurned ?? null,
        sleepMinutes: candidate.sleepMinutes ?? null,
      });
      await markLocalSynced(dateStr, candidate);
      synced++;
    } catch (err) {
      errors.push({date: dateStr, error: err});
    }
  }

  console.log('[syncMonthlySymptoms] done →', {
    synced,
    skipped,
    errorsCount: errors.length,
  });
  return {synced, skipped, monthly, errors};
};

export const adminGetSymptomsById = async (id: number) => {
  const response = await apiClient.get(`/symptoms/id/${id}`);
  console.log('Get symptoms by id', response);
  return response;
};

export const adminGetSymptomsByUserId = async (id: number) => {
  const response = await apiClient.get(`/symptoms/user/id/${id}`);
  console.log('Get symptoms by id', response);
  return response;
};

export const adminGetLatestSymptomsByUserIdAndDate = async (
  userId: number,
  date: Date,
) => {
  const dateVariable = date.toISOString().slice(0, 10);
  const response = await apiClient.get(
    `/symptoms/user/id/${userId}/date/${dateVariable}`,
  );
  console.log('Get symptom by user id', response);
  return response;
};

export const createStepGoal = async (goal: number): Promise<StepGoalDTO> => {
  const res = await apiClient.put('/symptoms/step-goal', null, {
    params: {goal},
  });
  return res.data;
};

export const completeStepGoal = async (id: number): Promise<StepGoalDTO> => {
  const res = await apiClient.put(`/symptoms/step-goal/id/${id}/done`);
  return res.data;
};

export const getWeeklyStepGoal = async (): Promise<StepGoalDTO> => {
  const res = await apiClient.get('/symptoms/step-goal/weekly');
  return res.data;
};

export const getDoneStepGoals = async (): Promise<StepGoalDTO[]> => {
  const res = await apiClient.get('/symptoms/step-goal/done');
  return res.data;
};

export const getWeeklyStepsTotal = async (
  start: string,
  end: string,
): Promise<number> => {
  const res = await apiClient.get('/symptoms/steps/weekly', {
    params: {start, end}, // örn: 2025-08-25 .. 2025-08-29
  });
  const data = res.data;
  return typeof data === 'number' ? data : data?.total ?? 0;
};

export const adminGetWeeklySteps = async (userId: number): Promise<number> => {
  const res = await apiClient.get(`/symptoms/user/id/${userId}/steps/weekly`);
  const data = res.data;
  return typeof data === 'number' ? data : data?.total ?? 0;
};

// Bu hafta step-goal (tek kayıt) – admin, belirli kullanıcı
export const adminGetWeeklyStepGoal = async (
  userId: number,
): Promise<StepGoalDTO> => {
  const res = await apiClient.get(
    `/symptoms/user/id/${userId}/step-goal/weekly`,
  );
  return res.data;
};

// Tamamlanan hedefler listesi – admin, belirli kullanıcı
export const adminGetDoneStepGoals = async (
  userId: number,
): Promise<StepGoalDTO[]> => {
  const res = await apiClient.get(`/symptoms/user/id/${userId}/step-goal/done`);
  return res.data;
};
