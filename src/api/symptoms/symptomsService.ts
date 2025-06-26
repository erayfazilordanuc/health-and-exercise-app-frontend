import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../axios/axios';
import {getUser} from '../user/userService';

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

export const getAllSymptomsByDate = async (date: Date) => {
  const dateVariable = date.toISOString().slice(0, 10);
  const response = await apiClient.get(`/symptoms/date/${dateVariable}`);
  console.log('Get all symptoms by date response', response);
  return response;
};

export const upsertSymptomsById = async (id: number) => {};

export const upsertSymptomsByDate = async (date: Date, symptoms: Symptoms) => {
  const dateVariable = date.toISOString().slice(0, 10);
  const upsertDTO: UpdateSymptomsDTO = {
    pulse: symptoms.pulse,
    steps: symptoms.steps,
    activeCaloriesBurned: symptoms.activeCaloriesBurned,
    sleepHours: symptoms.sleepHours,
    sleepSessions: symptoms.sleepSessions,
  };
  console.log('upsertDTO', upsertDTO);

  const response = await apiClient.put(
    `/symptoms/date/${dateVariable}`,
    upsertDTO,
  );
  console.log('Upsert response', response);
};

// Veritabanında günlük kayıt tutulsun
// UpdateSymptoms isteği yollansın -> Backendde eğer o güne ait symptoms verisi varsa güncellensin yoksa yenisi oluşturulsun
// Bu yapı değiştirilebilir

//Cache aware
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {healthService} from './abstraction/factory';      // Android / Apple seçimi

// const DAY_KEY = () => `SYMPTOMS_${new Date().toISOString().slice(0, 10)}`;

// /** UI tarafının çağıracağı tek fonksiyon */
// export const getAllData = async () => {
//   // 1️⃣  Cache oku
//   const cachedStr = await AsyncStorage.getItem(DAY_KEY());
//   if (cachedStr) {
//     try {
//       const cached = JSON.parse(cachedStr);
//       // Arka planda taze veri çekmeye başlayalım (fire-and-forget)
//       refreshInBackground();
//       return cached;
//     } catch {/* bozuk JSON → ignore */}
//   }

//   // 2️⃣  Cache yoksa canlı oku
//   return await refreshInBackground();
// };

// /** Sağlık servisinden çekip AsyncStorage’a yazan helper */
// const refreshInBackground = async () => {
//   const fresh = await healthService.getAllSymptoms();   // DaySymptoms
//   await AsyncStorage.setItem(DAY_KEY(), JSON.stringify(fresh));
//   return fresh;
// };
