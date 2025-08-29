import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import {getUser} from '../user/userService';
import NetInfo from '@react-native-community/netinfo';
import {ymdLocal} from '../../utils/dates';

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

// const combine = async (synced: Symptoms, local: Symptoms) => {
//   if (!synced.pulse) {
//     if (heartRate !== merged.pulse) setHeartRate(merged.pulse);
//   } else if (syncedSymptoms && syncedSymptoms.pulse) {
//     setHeartRate(syncedSymptoms.pulse);
//     merged.pulse = syncedSymptoms.pulse;
//   }

//   if (merged.steps) {
//     if (steps !== merged.steps) setSteps(merged.steps);
//   } else if (syncedSymptoms && syncedSymptoms.steps) {
//     setSteps(syncedSymptoms.steps);
//     merged.steps = syncedSymptoms.steps;
//   }

//   if (merged.totalCaloriesBurned) {
//     if (totalCaloriesBurned !== merged.totalCaloriesBurned)
//       setTotalCaloriesBurned(merged.totalCaloriesBurned);
//   } else if (syncedSymptoms && syncedSymptoms.totalCaloriesBurned) {
//     setTotalCaloriesBurned(syncedSymptoms.totalCaloriesBurned);
//     merged.totalCaloriesBurned = syncedSymptoms.totalCaloriesBurned;
//   }

//   if (merged.activeCaloriesBurned) {
//     if (activeCaloriesBurned !== merged.activeCaloriesBurned)
//       setActiveCaloriesBurned(merged.activeCaloriesBurned);
//   } else if (syncedSymptoms && syncedSymptoms.activeCaloriesBurned) {
//     setActiveCaloriesBurned(syncedSymptoms.activeCaloriesBurned);
//     merged.activeCaloriesBurned = syncedSymptoms.activeCaloriesBurned;
//   }

//   if (merged.sleepMinutes) {
//     if (totalSleepMinutes !== merged.sleepMinutes)
//       setTotalSleepMinutes(merged.sleepMinutes);
//   } else if (syncedSymptoms && syncedSymptoms.sleepMinutes) {
//     setTotalSleepMinutes(syncedSymptoms.sleepMinutes);
//     merged.sleepMinutes = syncedSymptoms.sleepMinutes;
//   }
// };

// Localde haftalık saklanabilir
export const getLocal = async (dateStr: string) => {
  const localJson = await AsyncStorage.getItem(keyPrefix + dateStr);
  console.log('localJson', localJson);
  if (localJson)
    return (JSON.parse(localJson) as LocalSymptoms).symptoms as Symptoms;
  return null;
};

export const getSymptomsByDate = async (dateStr: string) => {
  try {
    const net = await NetInfo.fetch();
    const isOnline = !!net.isConnected;

    if (isOnline) {
      const response = await apiClient.get(`/symptoms/date/${dateStr}`);
      console.log('Get symptoms by date response', response);
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

export const upsertSymptomsById = async (id: number) => {};

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

export const adminGetSymptomsByUserIdAndDate = async (
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

// Veritabanında günlük kayıt tutulsun
// UpdateSymptoms isteği yollansın -> Backendde eğer o güne ait symptoms verisi varsa güncellensin yoksa yenisi oluşturulsun
// Bu yapı değiştirilebilir
