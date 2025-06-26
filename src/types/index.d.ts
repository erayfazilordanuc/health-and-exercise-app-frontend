type User = {
  id?: number;
  username: string;
  fullName: string;
  email: string;
};

type LoginRequestPayload = {
  username?: string;
  password: string;
};

type RegisterRequestPayload = {
  username: string;
  email?: string;
  fullName: string;
  password: string;
};

type GuestUser = {
  id: number;
  username: string;
  password: string;
};

type Symptoms = {
  id?: number;
  pulse?: number;
  steps?: number;
  activeCaloriesBurned?: number;
  sleepHours?: number;
  sleepSessions?: string[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type UpdateSymptomsDTO = {
  pulse?: number;
  steps?: number;
  activeCaloriesBurned?: number;
  sleepHours?: number;
  sleepSessions?: string[];
};

type Label = {
  name: string;
};
