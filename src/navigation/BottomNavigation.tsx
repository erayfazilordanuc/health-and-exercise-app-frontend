import {
  BottomTabBarButtonProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import React, {use, useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import icons from '../constants/icons';
import CustomHeader from '../components/CustomHeader';
import Settings from '../screens/profile/settings/Settings';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Security from '../screens/profile/settings/Security';
import Reminders from '../screens/profile/settings/Reminders';
import Language from '../screens/profile/settings/Language';
import Preferences from '../screens/profile/settings/Appearance';
import Profile from '../screens/profile/Profile';
import {useTheme} from '../themes/ThemeProvider';
import {Theme, themes} from '../themes/themes';
import Exercises from '../screens/exercises/user/ExercisesUser';
import Home from '../screens/home/Home';
import Permissions from '../screens/profile/settings/Permissions';
import ExercisesHome from '../screens/exercises/user/ExercisesUser';
import Exercise1 from '../screens/exercises/user/ExerciseDetail';
import Development from '../screens/profile/settings/Development';
import {getUser} from '../api/user/userService';
import Notifications from '../screens/profile/settings/Notifications';
import Groups from '../screens/groups/Groups';
import Group from '../screens/groups/Group';
import Chat from '../screens/groups/Chat';
import Member from '../screens/groups/Member';
import {useNotificationNavigation} from '../hooks/useNotificationNavigation';
import {useUser} from '../contexts/UserContext';
import ExercisesUser from '../screens/exercises/user/ExercisesUser';
import ExercisesAdmin from '../screens/exercises/admin/ExercisesAdmin';
import EditExercise from '../screens/exercises/admin/EditExercise';
import Achievements from '../screens/groups/ExerciseProgress';
import Workout from '../screens/exercises/user/Exercise';
import ExerciseDetail from '../screens/exercises/user/ExerciseDetail';
import Exercise from '../screens/exercises/user/Exercise';
import DeviceInfo from 'react-native-device-info';
import sessionManager from '../session/sessionManager';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ExerciseProgress from '../screens/groups/ExerciseProgress';
import {useTranslation} from 'react-i18next';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import Appearance from '../screens/profile/settings/Appearance';
import Account from '../screens/profile/settings/Account';

const Tab = createBottomTabNavigator();

// {
//   screenOptions: {
//     animation: 'default',
//   },
//   screens: {
//     Groups: GroupsStack,
//     Exercises: ExercisesStack,
//     Home: Home,
//     Notifications: Notifications,
//     Profile: ProfileStack,
//   },
// }

const SettingsNativeStack =
  createNativeStackNavigator<SettingsStackParamList>();

const ProfileNativeStack = createNativeStackNavigator<ProfileStackParamList>();

const GroupsNativeStack = createNativeStackNavigator<GroupsStackParamList>();

const ExercisesNativeStack =
  createNativeStackNavigator<ExercisesStackParamList>();

function SettingsStack() {
  const {t} = useTranslation('nav');
  const {theme, colors, setTheme} = useTheme();
  const {user} = useUser();

  return (
    <SettingsNativeStack.Navigator
      initialRouteName="Settings"
      screenOptions={{
        animation: 'flip',
      }}>
      <SettingsNativeStack.Screen
        name="Settings"
        component={Settings}
        options={{
          header: () => (
            <CustomHeader
              title={t('stacks.settings.root')}
              icon={icons.settings}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
      <SettingsNativeStack.Screen
        name="Account"
        component={Account}
        options={{
          header: () => (
            <CustomHeader
              title={t('stacks.settings.account')}
              icon={icons.account}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
      <SettingsNativeStack.Screen
        name="Preferences"
        component={Preferences}
        options={{
          header: () => (
            <CustomHeader
              title={t('stacks.settings.preferences')}
              icon={icons.preferences}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
      <SettingsNativeStack.Screen
        name="Appearance"
        component={Appearance}
        options={{
          header: () => (
            <CustomHeader
              title={t('stacks.settings.appearance')}
              icon={icons.appearance}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
      <SettingsNativeStack.Screen
        name="Language"
        component={Language}
        options={{
          header: () => (
            <CustomHeader
              title={t('stacks.settings.language')}
              icon={icons.language}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
      <SettingsNativeStack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          header: () => (
            <CustomHeader
              title={t('stacks.settings.notifications')}
              icon={icons.bell}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
      {/* <SettingsNativeStack.Screen
        name="Reminders"
        component={Reminders}
        options={{
          header: () => (
            <CustomHeader
              title={'Hatırlatıcılar'}
              icon={icons.reminder}
              backArrowEnable={true}
            />
          ),
        }}
      /> */}
      <SettingsNativeStack.Screen
        name="Permissions"
        component={Permissions}
        options={{
          header: () => (
            <CustomHeader
              title={
                user && user.role === 'ROLE_ADMIN'
                  ? t('stacks.settings.permissions.admin')
                  : t('stacks.settings.permissions.user')
              }
              icon={icons.shield}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
      <SettingsNativeStack.Screen
        name="Security"
        component={Security}
        options={{
          header: () => (
            <CustomHeader
              title={t('stacks.settings.security')}
              icon={icons.shield}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
      {/* TO DO Eğer kullanıcı erayfazilordanuc ise Development seçeneği çıksın */}
      <SettingsNativeStack.Screen
        name="Development"
        component={Development}
        options={{
          header: () => (
            <CustomHeader
              title={t('stacks.settings.development')}
              icon={icons.shield}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
    </SettingsNativeStack.Navigator>
  );
}

function ProfileStack() {
  const {t} = useTranslation('nav');

  return (
    <ProfileNativeStack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        animation: 'default',
      }}>
      <ProfileNativeStack.Screen
        name="Profile"
        component={Profile}
        options={{
          headerShown: false,
          header: () => (
            <CustomHeader
              title={t('stacks.profile.root')}
              icon={icons.preferences}
              className="border-primary-300"
            />
          ),
        }}
      />
      <ProfileNativeStack.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          headerShown: false,
          header: () => (
            <CustomHeader
              title={t('stacks.profile.settings')}
              icon={icons.settings}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
    </ProfileNativeStack.Navigator>
  );
}

function GroupsStack() {
  const {t} = useTranslation('nav');
  const {theme, colors, setTheme} = useTheme();

  // const [user, setUser] = React.useState<User | null>(null);
  const {user} = useUser();
  // const [loading, setLoading] = React.useState(true);

  // b) İlk render’da kullanıcıyı getir
  // React.useEffect(() => {
  //   let isMounted = true;

  //   (async () => {
  //     try {
  //       const u = await getUser(); // API veya AsyncStorage
  //       if (isMounted) setUser(u);
  //     } catch (e) {
  //       console.error('getUser error:', e);
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   })();

  //   return () => {
  //     isMounted = false; // Memory-leak guard
  //   };
  // }, []);

  // c) Kullanıcı gelene kadar gösterilecek ekran
  // if (loading) {
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         alignItems: 'center',
  //         justifyContent: 'center',
  //         backgroundColor: 'transparent',
  //       }}>
  //       <ActivityIndicator size="large" color={colors.primary[300]} />
  //     </View>
  //   );
  // }

  return (
    <>
      <GroupsNativeStack.Navigator
        initialRouteName={`${
          (user && !user.groupId) || (user && user.role === 'ROLE_ADMIN')
            ? 'Groups'
            : 'Group'
        }`}
        screenOptions={{
          animation: 'default',
        }}>
        <GroupsNativeStack.Screen
          name="Groups"
          component={Groups}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={t('stacks.groups.root')}
                icon={icons.notes}
                className="border-primary-300"
              />
            ),
          }}
        />
        <GroupsNativeStack.Screen
          name="Group"
          component={Group}
          initialParams={{groupId: user?.groupId}} // ALERT sıkıntı çıkartabilir ama çok düşük ihtimal
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={t('stacks.groups.group')}
                icon={icons.notes}
                className="border-primary-300"
                backArrowEnable={true}
              />
            ),
          }}
        />
        <GroupsNativeStack.Screen
          name="Member"
          component={Member}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={t('stacks.groups.member')}
                icon={icons.notes}
                className="border-primary-300"
                backArrowEnable={true}
              />
            ),
          }}
        />
        <GroupsNativeStack.Screen
          name="Chat"
          component={Chat}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={t('stacks.groups.chat')}
                icon={icons.notes}
                className="border-primary-300"
                backArrowEnable={true}
              />
            ),
          }}
        />
        <GroupsNativeStack.Screen
          name="ExerciseProgress"
          component={ExerciseProgress}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={t('stacks.groups.exerciseProgress')}
                icon={icons.notes}
                className="border-primary-300"
                backArrowEnable={true}
              />
            ),
          }}
        />
        <GroupsNativeStack.Screen
          name="Achievements"
          component={Achievements}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={t('stacks.groups.achievements')}
                icon={icons.notes}
                className="border-primary-300"
                backArrowEnable={true}
              />
            ),
          }}
        />
      </GroupsNativeStack.Navigator>
    </>
  );
}

function ExercisesStack() {
  const {theme, colors, setTheme} = useTheme();
  const {user} = useUser();

  return (
    <>
      <ExercisesNativeStack.Navigator
        initialRouteName={
          user
            ? user.role === 'ROLE_USER'
              ? 'ExercisesUser'
              : 'ExercisesAdmin'
            : 'ExercisesUser'
        }
        screenOptions={{
          animation: 'default',
        }}>
        <ExercisesNativeStack.Screen
          name="ExercisesUser"
          component={ExercisesUser}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersizler Hasta'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
        <ExercisesNativeStack.Screen
          name="ExerciseDetail"
          component={ExerciseDetail}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersiz Detay'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
        <ExercisesNativeStack.Screen
          name="Exercise"
          component={Exercise}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersiz'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
        <ExercisesNativeStack.Screen
          name="ExercisesAdmin"
          component={ExercisesAdmin}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersizler Hemşire'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
        <ExercisesNativeStack.Screen
          name="EditExercise"
          component={EditExercise}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersiz Düzenle'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
        {/* <ExercisesNativeStack.Screen
          name="MindGames"
          component={MindGamesStack}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersiz'}
                icon={icons.todo}
                className="border-primary-300"
                backArrowEnable={true}
              />
            ),
          }}
        /> */}
      </ExercisesNativeStack.Navigator>
    </>
  );
}

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}) => {
  const {theme, colors, setTheme} = useTheme();

  return (
    <View
      className="flex-1 flex flex-col items-center"
      style={{
        marginTop: focused
          ? icon === icons.home
            ? -6
            : -5
          : icon === icons.home
          ? -5.5
          : -4,
      }}>
      <Image
        source={icon}
        tintColor={focused ? colors.primary[300] : colors.text.secondary}
        resizeMode="contain"
        className={`${
          focused
            ? icon === icons.home
              ? 'size-7'
              : 'size-6'
            : icon === icons.home
            ? 'size-7'
            : 'size-6'
        }`}
      />
      <Text
        className={`${
          focused ? 'font-rubik' : 'font-rubik'
        } text-xs w-full text-center mt-1`}
        style={{
          fontSize: 11,
          color: focused
            ? colors.primary[300] // 250
            : colors.text.secondary,
        }}>
        {title}
        {/* {focused && title} */}
      </Text>
    </View>
  );
};

export default function CustomTabButton({
  accessibilityState,
  onPress,
  onLongPress,
  style,
  children,
}: BottomTabBarButtonProps) {
  const selected = !!accessibilityState?.selected;

  // focusScale: seçiliyken 1.08, değilken 1.0
  const focusScale = useRef(new Animated.Value(selected ? 1.08 : 1)).current;
  useEffect(() => {
    Animated.spring(focusScale, {
      toValue: selected ? 1.08 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  }, [selected]);

  // pressScale: basılıyken 0.96, değilken 1.0
  const pressScale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={[
        {flex: 1, alignItems: 'center', justifyContent: 'center'},
        {
          transform: [{scale: Animated.multiply(focusScale, pressScale)}],
        },
        style as any,
      ]}>
      <Pressable
        // RIPPLE YOK: android_ripple vermiyoruz
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() =>
          Animated.spring(pressScale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 15,
            bounciness: 0,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 15,
            bounciness: 0,
          }).start()
        }
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 28,
        }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function getActiveChildRoute(
  state: import('@react-navigation/native').NavigationState | undefined,
) {
  let s = state;
  let r: any = null;
  while (s && typeof s.index === 'number') {
    r = s.routes[s.index] as any;
    // nested state varsa aşağı in
    s = r?.state as any;
    if (!s) break;
  }
  return r; // { name, params, ... }
}

export function baseTabBarStyle(
  theme: Theme,
  width: number,
  bottomInset: number,
): ViewStyle {
  const style: ViewStyle = {
    minHeight: 60,
    // height: undefined, // gerek yok, kaldır
    paddingTop: 11,
    paddingBottom: 11,
    marginHorizontal: width / 24,
    position: 'absolute',
    bottom: 15 + Math.max(bottomInset, 0),
    left: 15,
    right: 15,
    borderRadius: 40,
    borderWidth: 1,
    borderTopWidth: 0.9,
    borderColor: theme.colors.isLight
      ? 'rgba(0,0,0,0.09)'
      : 'rgba(150,150,150,0.09)',
    backgroundColor: theme.colors.isLight
      ? 'rgba(255,255,255,0.95)'
      : 'rgba(25,25,25,0.95)',
    elevation: 0,
  };
  return style;
}

export function BottomNavigator() {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation('nav');
  const {theme, colors, setTheme} = useTheme();
  const {width} = Dimensions.get('screen');
  const {user} = useUser();

  useEffect(() => {
    if (user?.id) {
      console.log('initledi');
      sessionManager.init(
        user.id,
        DeviceInfo.getVersion(),
        DeviceInfo.getModel(),
      );
    }
    return () => {
      console.log('returnledi');
      if (user?.id) sessionManager.stopSession('close').catch(() => {});
    };
  }, [user?.id]);

  return (
    <Tab.Navigator
      key={theme.name}
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: baseTabBarStyle(theme, width, insets.bottom),
        tabBarItemStyle: {height: 'auto', paddingVertical: 0},
        tabBarIconStyle: {margin: 0, padding: 0},
        tabBarHideOnKeyboard: true,
        tabBarButton: props => <CustomTabButton {...props} />,
      }}
      initialRouteName="Home">
      <Tab.Screen
        name="Groups"
        component={GroupsStack}
        listeners={({navigation}) => ({
          tabPress: e => {
            const state = navigation.getState();
            const tabRoute = state.routes.find(r => r.name === 'Groups');
            const stackState = tabRoute?.state as
              | import('@react-navigation/native').NavigationState
              | undefined;

            let current: string | null = null;
            let params: any = null;

            if (stackState && typeof stackState.index === 'number') {
              const activeRoute = stackState.routes[stackState.index];
              current = activeRoute?.name ?? null;
              params = activeRoute?.params ?? null;
            }

            console.log('current', current, 'params', params, 'user', user);

            if (
              (!current ||
                current === 'Chat' ||
                (user?.role === 'ROLE_ADMIN' && current === 'Member') ||
                (user?.role === 'ROLE_ADMIN' && current === 'Group')) &&
              (!params || params.fromNotification) // gariplikler !current ve !params
            )
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Groups',
                  },
                ],
              });
          },
        })}
        options={{
          headerShown: false,
          headerTitle: 'Grup',
          headerTitleStyle: {
            fontFamily: 'Rubik-SemiBold',
            fontSize: 24,
          },
          tabBarIcon: ({focused}) => (
            <TabIcon
              focused={focused}
              icon={icons.peopleV3}
              title={
                (user && !user.groupId) || (user && user.role === 'ROLE_ADMIN')
                  ? t('tabs.groups.admin')
                  : t('tabs.groups.user')
              }
            />
          ),
        }}
      />
      {/* {user && user?.role === 'ROLE_USER' && ( */}
      <Tab.Screen
        name="Exercises"
        component={ExercisesStack}
        options={({route}) => {
          // İçte hangi ekran odakta?
          const focused =
            getFocusedRouteNameFromRoute(route) ?? 'ExercisesUser';

          // Exercise ekrandaysa tab bar’ı sakla
          const hideTabBar = focused === 'Exercise';

          const style: ViewStyle = hideTabBar
            ? {display: 'none'}
            : baseTabBarStyle(theme, width, insets.bottom);

          return {
            headerShown: false,
            headerTitle:
              user && user.role === 'ROLE_USER' ? 'Egzersiz' : 'Egzersizler',
            headerTitleStyle: {fontFamily: 'Rubik-SemiBold', fontSize: 24},
            tabBarStyle: style,
            tabBarItemStyle: {height: 'auto', paddingVertical: 0},
            tabBarIconStyle: {margin: 0, padding: 0},
            tabBarHideOnKeyboard: true,
            tabBarButton: props => <CustomTabButton {...props} />,
            title:
              user && user.role === 'ROLE_USER'
                ? t('tabs.exercises.user')
                : t('tabs.exercises.admin'),
            tabBarIcon: ({focused}) => (
              <TabIcon
                focused={focused}
                icon={icons.gym}
                title={
                  user && user.role === 'ROLE_USER'
                    ? t('tabs.exercises.user')
                    : t('tabs.exercises.admin')
                }
              />
            ),
          };
        }}
      />
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
          headerTitle: 'Ana Ekran',
          headerTitleStyle: {
            fontFamily: 'Rubik-SemiBold',
            fontSize: 24,
          },
          tabBarIcon: ({focused}) => (
            <TabIcon
              focused={focused}
              icon={icons.home}
              title={t('tabs.home')}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          headerShown: false,
          headerTitle: 'Profil',
          headerStyle: {
            // backgroundColor: '#f4511e', // Header arka plan rengi
          },
          // headerTintColor: '#fff', // Başlık ve ikonların rengi
          headerTitleStyle: {
            fontFamily: 'Rubik-SemiBold',
            fontSize: 24,
          },
          tabBarIcon: ({focused}) => (
            <TabIcon
              focused={focused}
              icon={icons.person}
              title={t('tabs.profile')}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
