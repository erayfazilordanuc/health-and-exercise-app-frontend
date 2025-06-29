type ProfileStackParamList = {
  Profile: any;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

type SettingsStackParamList = {
  Settings: undefined;
  Preferences: undefined;
  Reminders: undefined;
  Permissions: undefined;
  Security: undefined;
  Development: undefined;
  // Language: undefined;
};

type ExercisesStackParamList = {
  Exercises: any;
  PhysicalExercises: any;
  BrainExercises: any;
};

type PhysicalExercisesStackParamList = {
  Exercise1: any;
  Exercise2: any;
};

type BrainExercisesStackParamList = {
  WordExercise: any;
  BrainExercise2: any;
};

type GroupsStackParamList = {
  Groups: any;
  Group: {groupId: number};
};

type RootStackParamList = {
  Home: any;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Groups: NavigatorScreenParams<GroupsStackParamList>;
  Exercises: NavigatorScreenParams<ExercisesStackParamList>;
  Notifications: any;
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

type BrainExercisesScreenNavigationProp =
  NativeStackNavigationProp<BrainExercisesStackParamList>;
