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

const getLocal = async () => {
  const localJson = await AsyncStorage.getItem(todayKey());
  if (localJson)
    return (JSON.parse(localJson) as LocalSymptoms).symptoms as Symptoms;
};

export const getSymptomsByDate = async (date: Date) => {
  try {
    const dateVariable = date.toISOString().slice(0, 10);
    const net = await NetInfo.fetch();
    const isOnline = !!net.isConnected;
    if (isOnline) {
      const response = await apiClient.get(`/symptoms/date/${dateVariable}`);
      console.log('Get symptoms by date response', response);
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        console.error('Unexpected status code:', response.status);
        return null;
      }
    } else {
      return getLocal();
    }
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    return getLocal();
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
