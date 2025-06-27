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