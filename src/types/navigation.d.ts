type ProfileStackParamList = {
  Profile: any;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

type SettingsStackParamList = {
  Settings: undefined;
  Preferences: undefined;
  Notifications: undefined;
  Reminders: undefined;
  Permissions: undefined;
  Security: undefined;
  Development: undefined;
  // Language: undefined;
};

type ExercisesStackParamList = {
  ExercisesUser: any;
  AllExercises: any;
  ExerciseDetail: {
    progress: ExerciseProgressDTO;
    totalDurationSec: number;
    fromMain: boolean;
  };
  Exercise: {
    exercise: ExerciseDTO;
    progress: ExerciseProgressDTO;
    videoIdx: number;
    startSec: number;
  };
  ExercisesAdmin: any;
  ExercisesAdmin: any;
  EditExercise: {exercise: ExerciseDTO | null}; // burada Exercise parametresi almalı
  // MindGames: any;
};

type PhysicalExercisesStackParamList = {
  Exercise1: any;
  Exercise2: any;
};

type MindGamesStackParamList = {
  WordGame: any;
  MindGame2: any;
};

type GroupsStackParamList = {
  Groups: any;
  Group: {groupId: number | null};
  Member: {memberId: number; fromNotification: boolean};
  Chat: {
    roomId: number;
    sender: string;
    receiver: User;
    fromNotification: boolean;
    navigatedInApp: boolean;
  };
  Achievements: {member: User};
  Progress: {member: User};
};

type RootStackParamList = {
  Home: any;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Groups: NavigatorScreenParams<GroupsStackParamList>;
  Exercises: NavigatorScreenParams<ExercisesStackParamList>;
};

type AppStackParamList = {
  Launch: undefined;
  UserLogin: undefined;
  AdminLogin: undefined;
  App: NavigatorScreenParams<RootStackParamList>;
};

type AppScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

type RootScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ProfileScreenNavigationProp =
  NativeStackNavigationProp<ProfileStackParamList>;

type SettingsScreenNavigationProp =
  NativeStackNavigationProp<SettingsStackParamList>;

type GroupsScreenNavigationProp =
  NativeStackNavigationProp<GroupsStackParamList>;

type ExercisesScreenNavigationProp =
  NativeStackNavigationProp<ExercisesStackParamList>;

type PhysicalExercisesScreenNavigationProp =
  NativeStackNavigationProp<ExercisesStackParamList>;

type MindGamesScreenNavigationProp =
  NativeStackNavigationProp<MindGamesStackParamList>;
