type User = {
  id?: number;
  username: string;
  fullName: string;
  email?: string;
  role: string;
  groupId?: number;
};

type UpdateUserDTO = {
  id: number;
  username: string;
  email?: string;
  fullName: string;
  groupId?: number;
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

type Label = {
  name: string;
};
