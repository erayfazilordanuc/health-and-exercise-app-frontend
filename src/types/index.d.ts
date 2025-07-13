type User = {
  id?: number;
  username: string;
  fullName: string;
  email?: string;
  role: string;
  groupId?: number;
  points: number | null;
};

type UpdateUserDTO = {
  id: number;
  username: string;
  email?: string;
  fullName: string;
  groupId?: number | null;
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

type AdminLoginRequestPayload = {
  loginDTO: LoginRequestPayload;
  code?: string | null;
};

type AdminRegisterRequestPayload = {
  registerDTO: RegisterRequestPayload;
  code?: string | null;
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

type LocalSymptoms = {
  symptoms: Symptoms;
  isSynced: boolean;
};

type Group = {
  id?: number;
  name: string;
  adminId: number;
};

type CreateGroupDTO = {
  name: string;
  adminId: number;
};

type Message = {
  id?: number;
  message: string;
  sender: string;
  receiver: string;
  roomId: number;
  createdAt?: Date;
};

type FCMToken = {
  id?: number;
  userId: number | null;
  token: string | null;
  platform: string | null;
  createdAt?: Date | null;
};
