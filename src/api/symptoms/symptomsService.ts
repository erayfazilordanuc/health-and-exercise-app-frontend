import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import {getUser} from '../user/userService';
import NetInfo from '@react-native-community/netinfo';

const todayStart = () => new Date().setHours(0, 0, 0, 0);
const todayEnd = () => new Date().setHours(23, 59, 59, 999);
const keyPrefix = 'symptoms_';
const todayStr = () => new Date().toISOString().slice(0, 10);
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
export const getLocal = async () => {
  const localJson = await AsyncStorage.getItem(todayKey());
  console.log('localJson', localJson);
  if (localJson)
    return (JSON.parse(localJson) as LocalSymptoms).symptoms as Symptoms;
};

export const getSymptomsByDate = async (date: Date) => {
  const dateStr = date.toISOString().slice(0, 10);
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
      }
    }
  } catch (error) {
    console.error('Error fetching symptoms:', error);
  }
};

export const upsertSymptomsById = async (id: number) => {};

export const upsertSymptomsByDate = async (date: Date, symptoms: Symptoms) => {
  const dateVariable = date.toISOString().slice(0, 10);
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
