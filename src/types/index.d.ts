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

type SessionState = {
  sessionId: string;
  userId: number;
  startedAt: string;
  foregroundSince?: number;
  activeMs: number;
  lastHeartbeatAt?: string;
  appVersion?: string;
  deviceModel?: string;
  pauseAt?: number;
};

type DailySessionSummaryDTO = {
  day: string; // örn: "2025-08-23" (ISO format)
  sessionsCount: number; // o gün kaç oturum
  totalActiveMs: number; // toplam aktif süre (ms)
};

type SessionDTO = {
  id: number;
  userId: number;
  sessionId: string; // UUID string
  source: 'MOBILE' | 'WEB' | 'API'; // daha kontrollü
  startedAt: string; // ISO 8601 datetime
  endedAt?: string; // ISO 8601 datetime | null olabilir
  activeMs: number; // toplam aktif süre (ms)
  lastHeartbeatAt?: string; // ISO 8601 datetime
  heartbeatCount: number;
  reason?: 'logout' | 'close'; // opsiyonel, sınırlı string
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
};

type UpsertConsentDTO = {
  purpose: ConsentPurpose;
  status: ConsentStatus;
  policyId: number;
  locale?: string;
  source?: string;
};

type ConsentDTO = {
  id: number;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  policyDTO: ConsentPolicyDTO;
  userId: number;
  locale?: string;
  source?: string;
};

type ConsentPolicy = {
  id: number;
  purpose: ConsentPolicyPurpose;
  version: string;
  locale?: string;
  contentHash: string;
  contentUrl?: string;
  contentMd: string;
  createdAt: string;
  updatedAt: string;
  effectiveAt?: string;
};

type ConsentPolicyDTO = {
  id: number;
  purpose: ConsentPolicyPurpose;
  version: string;
  locale?: string;
  contentHash: string;
  contentUrl?: string;
  content: string;
  createdAt: string;
  effectiveAt?: string;
};

type UserTheme = {
  theme: Theme;
  isDefault: boolean;
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
  totalCaloriesBurned?: number | null;
  activeCaloriesBurned?: number | null;
  sleepMinutes?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type StepGoalDTO = {
  id: number;
  userId: number;
  goal: number;
  isDone: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type UpdateSymptomsDTO = {
  pulse?: number;
  steps?: number;
  totalCaloriesBurned?: number | null;
  activeCaloriesBurned?: number;
  sleepMinutes?: number;
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
  exerciseEnabled: boolean;
};

type CreateGroupDTO = {
  name: string;
  adminId: number;
};

type UpdateGroupDTO = {
  id: number;
  name: string;
  exerciseEnabled: boolean;
};

type GroupDTO = {
  id: number;
  name: string;
  adminId: number;
};

type GroupRequestDTO = {
  id?: number;
  userDTO: UserDTO;
  groupDTO: GroupDTO;
};

type LocalMessage = {
  message: Message;
  savedAt: Date;
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
  name: string;
  videoUrl: string;
  durationSeconds: number;
  exerciseId: number;
  createdAt: Date;
};

type CreateExerciseVideoDTO = {
  name: string;
  videoUrl: string | null;
  durationSeconds: number | null;
  exerciseId: number | null;
};

type NewVideoDTO = {
  name: string;
  videoUrl: string | null;
  durationSeconds: number | null;
};

type Exercise = {
  id?: number;
  name: string;
  description: string;
  point: number;
  videos: ExerciseVideoDTO[];
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

type LocalExerciseProgressDTO = {
  id: number;
  userId: number;
  exerciseDTO: ExerciseDTO;
  progressDuration: number;
  createdAt: Date;
  updatedA?: Date | null;
};

type ExerciseProgressDTO = {
  userId: number;
  exerciseDTO: ExerciseDTO;
  videoProgress: ExerciseVideoProgressDTO[];
  totalProgressDuration: number;
};

type ExerciseProgressNavPayload = {
  userId: number;
  exerciseDTO: ExerciseDTO;
  videoProgress: ExerciseVideoProgressDTO[];
  totalProgressDuration: number;
};

type ExerciseVideoProgressDTO = {
  id?: number;
  progressDuration: number;
  isCompeleted: boolean;
  videoId: number;
  exerciseId: number;
  userId: number;
  createdAt: Date;
  updatedA?: Date | null;
};

type ExerciseVideoProgressRequestDTO = {
  seconds: number;
};

type AchievementDTO = {
  id: number;
  userId: number;
  exerciseDTO: ExerciseDTO;
  createdAt: Date;
};
