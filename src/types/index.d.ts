type User = {
  id?: number;
  username: string;
  fullName: string;
  email?: string;
  birthDate?: string; // yyyy-mm-dd
  gender?: string;
  role: string;
  groupId?: number;
  achievements: AchievementDTO[];
};

type UpdateUserDTO = {
  id: number;
  username: string;
  email?: string;
  birthDate?: string;
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
  birthDate?: string;
  password: string;
  gender?: string;
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

type ExerciseVideoDTO = {
  id?: number;
  videoUrl: string;
  exerciseId: number;
  createdAt: Date;
};

type Exercise = {
  id?: number;
  name: string;
  description: string;
  point: number;
  videos: ExerciseVideo[];
  admin: User;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type ExerciseDTO = {
  id: number | null;
  name: string | null;
  description: string | null;
  point: number | null;
  videos: ExerciseVideoDTO[];
  adminId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type CreateExerciseDTO = {
  name: string;
  description: string;
  point: number;
};

type UpdateExerciseDTO = {
  name: string;
  description: string;
  point: number;
};

type AchievementDTO = {
  id: number;
  userId: number;
  exerciseDTO: ExerciseDTO;
  createdAt: Date;
};
