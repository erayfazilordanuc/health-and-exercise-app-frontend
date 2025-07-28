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

export const getSymptomsByDate = async (date: Date) => {
  try {
    const dateVariable = date.toISOString().slice(0, 10);
    const response = await apiClient.get(`/symptoms/date/${dateVariable}`);
    console.log('Get symptoms by date response', response);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Unexpected status code:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    return null;
  }
};

export const upsertSymptomsById = async (id: number) => {};

export const upsertSymptomsByDate = async (date: Date, symptoms: Symptoms) => {
  const dateVariable = date.toISOString().slice(0, 10);
  const upsertDTO: UpdateSymptomsDTO = {
    pulse: symptoms.pulse,
    steps: symptoms.steps,
    activeCaloriesBurned: symptoms.activeCaloriesBurned!,
    sleepHours: symptoms.sleepHours!,
    sleepSessions: symptoms.sleepSessions,
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
