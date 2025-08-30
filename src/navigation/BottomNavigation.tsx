import {
  BottomTabBarButtonProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import React, {useEffect, useRef} from 'react';
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
} from 'react-native';
import icons from '../constants/icons';
import CustomHeader from '../components/CustomHeader';
import Settings from '../screens/profile/settings/Settings';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Security from '../screens/profile/settings/Security';
import Reminders from '../screens/profile/settings/Reminders';
import Language from '../screens/profile/settings/Language';
import Preferences from '../screens/profile/settings/Preferences';
import Profile from '../screens/profile/Profile';
import {useTheme} from '../themes/ThemeProvider';
import {themes} from '../themes/themes';
import Exercises from '../screens/exercises/user/ExercisesUser';
import Home from '../screens/home/Home';
import Permissions from '../screens/profile/settings/Permissions';
import ExercisesHome from '../screens/exercises/user/ExercisesUser';
import Exercise1 from '../screens/exercises/user/ExerciseDetail';
import WordGame from '../screens/exercises/mindGames/WordGame';
import Exercise2 from '../screens/exercises/mindGames/Exercise2';
import MindGame2 from '../screens/exercises/mindGames/MindGame2';
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
import AllExercises from '../screens/exercises/user/AllExercises';
import EditExercise from '../screens/exercises/admin/EditExercise';
import Achievements from '../screens/groups/Progress';
import Workout from '../screens/exercises/user/Exercise';
import ExerciseDetail from '../screens/exercises/user/ExerciseDetail';
import Exercise from '../screens/exercises/user/Exercise';
import DeviceInfo from 'react-native-device-info';
import sessionManager from '../session/sessionManager';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

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

const PhysicalExercisesNativeStack =
  createNativeStackNavigator<PhysicalExercisesStackParamList>();

const MindGamesNativeStack =
  createNativeStackNavigator<MindGamesStackParamList>();

function SettingsStack() {
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
              title={'Ayarlar'}
              icon={icons.settings}
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
              title={'Tercihler'}
              icon={icons.preferences}
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
              title={'Bildirimler'}
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
                  ? 'İzinler'
                  : 'İzinler ve Onaylar'
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
              title={'Güvenlik'}
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
              title={'Geliştirme'}
              icon={icons.shield}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      />
      {/* <SettingsNativeStack.Screen
        name="Language"
        component={Language}
        options={{
          header: () => (
            <CustomHeader
              title={'Dil'}
              icon={icons.language}
              className="border-primary-300"
              backArrowEnable={true}
            />
          ),
        }}
      /> */}
    </SettingsNativeStack.Navigator>
  );
}

function ProfileStack() {
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
              title={'Profil'}
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
              title={'Ayarlar'}
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
                title={'Gruplar'}
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
                title={'Grup'}
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
                title={'Üye'}
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
                title={'Sohbet'}
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
                title={'Sohbet'}
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
          name="AllExercises"
          component={AllExercises}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Tüm Egzersizler'}
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
          ? title === 'Ana Ekran'
            ? -6
            : -5
          : title === 'Ana Ekran'
          ? -5.5
          : -4,
      }}>
      <Image
        source={icon}
        tintColor={focused ? colors.primary[300] : colors.text.secondary}
        resizeMode="contain"
        className={`${
          focused
            ? title == 'Ana Ekran'
              ? 'size-7'
              : 'size-6'
            : title == 'Ana Ekran'
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

export function BottomNavigator() {
  const insets = useSafeAreaInsets();
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
        // // tabBarStyle: {
        // //   backgroundColor: colors.background.primary,
        // //   borderColor: colors.background.primary,
        // //   position: 'absolute',
        // //   minHeight: 60,
        // //   borderTopWidth: 0,
        // // },
        // tabBarStyle: {
        //   marginHorizontal: width / 24,
        //   position: 'absolute',
        //   bottom: 15,
        //   left: 15,
        //   right: 15,
        //   // height: 56,
        //   borderRadius: 40,
        //   borderWidth: 1,
        //   borderTopWidth: 0.9,
        //   borderColor:
        //     theme.name === 'Light'
        //       ? 'rgba(0,0,0,0.09)'
        //       : 'rgba(150,150,150,0.09)',
        //   backgroundColor:
        //     theme.name === 'Light'
        //       ? 'rgba(255,255,255,0.95)'
        //       : 'rgba(25,25,25,0.95)',
        //   elevation: 0,
        // },

        // Tasarım korunuyor, sabit height yok, dinamik minHeight + padding var
        tabBarStyle: {
          minHeight: 50 + Math.max(insets.bottom, 0),
          height: undefined,
          paddingTop: 11,
          paddingBottom: Math.max(insets.bottom, 11),

          // mevcut görünümü koru
          marginHorizontal: width / 24,
          position: 'absolute',
          bottom: 15,
          left: 15,
          right: 15,
          borderRadius: 40,
          borderWidth: 1,
          borderTopWidth: 0.9,
          borderColor:
            theme.name === 'Light'
              ? 'rgba(0,0,0,0.09)'
              : 'rgba(150,150,150,0.09)',
          backgroundColor:
            theme.name === 'Light'
              ? 'rgba(255,255,255,0.95)'
              : 'rgba(25,25,25,0.95)',
          elevation: 0,
        },

        // item yüksekliğini serbest bırak; margin yerine padding kullan
        tabBarItemStyle: {
          height: 'auto',
          paddingVertical: 0,
        },

        // ÖNEMLİ: İkonları saran container ortalansın; margin hilesi yok
        tabBarIconStyle: {
          margin: 0,
          padding: 0,
        },
        tabBarHideOnKeyboard: true,
        tabBarButton: props => <CustomTabButton {...props} />,
        // animation: 'shift', // (ISSUE) TO DO Shift animation causes freezing when switching to profile tab.
      }}
      initialRouteName="Home">
      <Tab.Screen
        name="Groups"
        component={GroupsStack}
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
                  ? 'Gruplar'
                  : 'Grup'
              }
            />
          ),
        }}
      />
      {/* {user && user?.role === 'ROLE_USER' && ( */}
      <Tab.Screen
        name="Exercises"
        component={ExercisesStack}
        options={{
          headerShown: false,
          headerTitle:
            user && user.role === 'ROLE_USER' ? 'Egzersiz' : 'Egzersizler',
          headerTitleStyle: {
            fontFamily: 'Rubik-SemiBold',
            fontSize: 24,
          },
          // header: () => (
          //   <CustomHeader
          //     title={'Egzersizler'}
          //     icon={icons.todo}
          //     className="border-emerald-500"
          //   />
          // ),
          title: user && user.role === 'ROLE_USER' ? 'Egzersiz' : 'Egzersizler',
          tabBarIcon: ({focused}) => (
            <TabIcon
              focused={focused}
              icon={icons.gym}
              title={
                user && user.role === 'ROLE_USER' ? 'Egzersiz' : 'Egzersizler'
              }
            />
          ),
        }}
      />
      {/* )} */}
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
            <TabIcon focused={focused} icon={icons.home} title="Ana Ekran" />
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
            <TabIcon focused={focused} icon={icons.person} title="Profil" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
