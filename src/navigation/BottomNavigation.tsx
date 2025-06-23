import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useRef} from 'react';
import {
  Animated,
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
import Reminders from '../screens/notifications/Reminders';
import Language from '../screens/profile/settings/Language';
import Preferences from '../screens/profile/settings/Preferences';
import Profile from '../screens/profile/Profile';
import {useTheme} from '../themes/ThemeProvider';
import {themes} from '../themes/themes';
import Group from '../screens/groups/Group';
import Exercises from '../screens/exercises/Exercises';
import Exercise from '../screens/exercises/PhysicalExercises/Exercise1';
import Home from '../screens/home/Home';
import Notifications from '../screens/notifications/Notifications';
import Groups from '../screens/groups/Groups';
import Permissions from '../screens/profile/settings/Permissions';
import ExercisesHome from '../screens/exercises/Exercises';
import Exercise1 from '../screens/exercises/PhysicalExercises/Exercise1';
import WordExercise from '../screens/exercises/BrainExercises/WordExercise';
import Exercise2 from '../screens/exercises/PhysicalExercises/Exercise2';
import BrainExercise2 from '../screens/exercises/BrainExercises/BrainExercise2';

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

const BrainExercisesNativeStack =
  createNativeStackNavigator<BrainExercisesStackParamList>();

function SettingsStack() {
  const {theme, colors, setTheme} = useTheme();

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
              title={'İzinler'}
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

  return (
    <>
      <GroupsNativeStack.Navigator
        initialRouteName="Groups"
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
      </GroupsNativeStack.Navigator>
    </>
  );
}

function PhysicalExercisesStack() {
  const {theme, colors, setTheme} = useTheme();

  return (
    <>
      <PhysicalExercisesNativeStack.Navigator
        initialRouteName="Exercise1"
        screenOptions={{
          animation: 'default',
        }}>
        <PhysicalExercisesNativeStack.Screen
          name="Exercise1"
          component={Exercise1}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersizler'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
        <PhysicalExercisesNativeStack.Screen
          name="Exercise2"
          component={Exercise2}
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
        />
      </PhysicalExercisesNativeStack.Navigator>
    </>
  );
}

function BrainExercisesStack() {
  const {theme, colors, setTheme} = useTheme();

  return (
    <>
      <BrainExercisesNativeStack.Navigator
        initialRouteName="WordExercise"
        screenOptions={{
          animation: 'default',
        }}>
        <BrainExercisesNativeStack.Screen
          name="WordExercise"
          component={WordExercise}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersizler'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
        <BrainExercisesNativeStack.Screen
          name="BrainExercise2"
          component={BrainExercise2}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersizler'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
      </BrainExercisesNativeStack.Navigator>
    </>
  );
}

function ExercisesStack() {
  const {theme, colors, setTheme} = useTheme();

  return (
    <>
      <ExercisesNativeStack.Navigator
        initialRouteName="Exercises"
        screenOptions={{
          animation: 'default',
        }}>
        <ExercisesNativeStack.Screen
          name="Exercises"
          component={Exercises}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersizler'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
        <ExercisesNativeStack.Screen
          name="PhysicalExercises"
          component={PhysicalExercisesStack}
          options={{
            headerShown: false,
            header: () => (
              <CustomHeader
                title={'Egzersizler'}
                icon={icons.todo}
                className="border-primary-300"
              />
            ),
          }}
        />
        <ExercisesNativeStack.Screen
          name="BrainExercises"
          component={BrainExercisesStack}
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
        />
      </ExercisesNativeStack.Navigator>
    </>
  );
}

const TabIcon = ({
  focused,
  icon,
  title,
  size,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
  size?: string;
}) => {
  const {theme, colors, setTheme} = useTheme();

  return (
    <View
      className="flex-1 flex flex-col items-center"
      style={{marginTop: size ? (focused ? 2 : 4) : focused ? 8 : 10}}>
      <Image
        source={icon}
        tintColor={focused ? colors.primary[200] : colors.text.secondary}
        resizeMode="contain"
        className={`${
          focused
            ? title == 'Home'
              ? 'size-9'
              : 'size-8'
            : title == 'Home'
            ? 'size-8'
            : 'size-7'
        }`}
      />
      <Text
        className={`${
          focused ? 'font-rubik-medium' : 'font-rubik'
        } text-xs w-full text-center mt-1`}
        style={{
          color: focused
            ? colors.primary[200] // 250
            : colors.text.secondary,
        }}>
        {/* {focused && title} */}
      </Text>
    </View>
  );
};

export function BottomNavigator() {
  const {theme, colors, setTheme} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderColor: colors.background.primary,
          position: 'absolute',
          minHeight: 60,
          borderTopWidth: 0,
        },
        // animation: 'shift', // (ISSUE) TO DO Shift animation causes freezing when switching to profile tab.
      }}
      initialRouteName="Home">
      <Tab.Screen
        name="Groups"
        component={GroupsStack}
        options={{
          headerShown: false,
          headerTitle: 'Gruplar',
          headerTitleStyle: {
            fontFamily: 'Rubik-SemiBold',
            fontSize: 24,
          },
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon={icons.peopleV3} title="Gruplar" />
          ),
          tabBarButton: props => (
            <Pressable {...props} android_ripple={{color: 'transparent'}} />
          ),
        }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExercisesStack}
        options={{
          headerShown: false,
          headerTitle: 'Egzersizler',
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
          title: 'Exercises',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon={icons.gym} title="Egzersiz" />
          ),
          tabBarButton: props => {
            const scale = useRef(new Animated.Value(1)).current;

            const handlePressIn = () => {
              Animated.spring(scale, {
                toValue: 0.95,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
              }).start();
            };

            const handlePressOut = () => {
              Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
              }).start();
            };

            return (
              <Animated.View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{scale}],
                }}>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  android_ripple={{
                    color: 'rgba(255, 255, 255, 0.12)', // Açık mavi ve yumuşak ripple
                    borderless: true,
                    radius: 35, // Ripple boyutunu sınırla
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 35,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  {...props}
                />
              </Animated.View>
            );
          },
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
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
          tabBarButton: props => {
            const scale = useRef(new Animated.Value(1)).current;

            const handlePressIn = () => {
              Animated.spring(scale, {
                toValue: 0.95,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
              }).start();
            };

            const handlePressOut = () => {
              Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
              }).start();
            };

            return (
              <Animated.View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{scale}],
                }}>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  android_ripple={{
                    color: 'rgba(255, 255, 255, 0.12)', // Açık mavi ve yumuşak ripple
                    borderless: true,
                    radius: 35, // Ripple boyutunu sınırla
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 35,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  {...props}
                />
              </Animated.View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={Notifications}
        options={{
          headerShown: false,
          headerTitle: 'Bildirimler',
          headerTitleStyle: {
            fontFamily: 'Rubik-SemiBold',
            fontSize: 24,
          },
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon={icons.bell} title="Bildirimler" />
          ),
          tabBarButton: props => {
            const scale = useRef(new Animated.Value(1)).current;

            const handlePressIn = () => {
              Animated.spring(scale, {
                toValue: 0.95,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
              }).start();
            };

            const handlePressOut = () => {
              Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
              }).start();
            };

            return (
              <Animated.View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{scale}],
                }}>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  android_ripple={{
                    color: 'rgba(255, 255, 255, 0.12)', // Açık mavi ve yumuşak ripple
                    borderless: true,
                    radius: 35, // Ripple boyutunu sınırla
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 35,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  {...props}
                />
              </Animated.View>
            );
          },
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
          tabBarButton: props => {
            const scale = useRef(new Animated.Value(1)).current;

            const handlePressIn = () => {
              Animated.spring(scale, {
                toValue: 0.95,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
              }).start();
            };

            const handlePressOut = () => {
              Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
              }).start();
            };

            return (
              <Animated.View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{scale}],
                }}>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  android_ripple={{
                    color: 'rgba(255, 255, 255, 0.12)', // Açık mavi ve yumuşak ripple
                    borderless: true,
                    radius: 100, // Ripple boyutunu sınırla
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 100,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  {...props}
                />
              </Animated.View>
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}

// export function BottomNavigator() {
//   const {theme, colors, setTheme} = useTheme();

//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarShowLabel: false,
//         tabBarStyle: {
//           backgroundColor: colors.background.primary,
//           borderColor: colors.background.primary,
//           position: 'absolute',
//           minHeight: 60,
//           borderTopWidth: 0,
//         },
//         animation: 'shift',
//       }}
//       initialRouteName="Home">
//       <Tab.Screen
//         name="Groups"
//         component={GroupsStack}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({focused}) => (
//             <TabIcon focused={focused} icon={icons.peopleV3} title="Gruplar" />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Exercises"
//         component={ExercisesStack}
//         options={{
//           headerShown: false,
//           header: () => (
//             <CustomHeader
//               title={'Egzersizler'}
//               icon={icons.todo}
//               className="border-emerald-500"
//             />
//           ),
//           title: 'Exercises',
//           tabBarIcon: ({focused}) => (
//             <TabIcon focused={focused} icon={icons.gym} title="Egzersiz" />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Home"
//         component={Home}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({focused}) => (
//             <TabIcon focused={focused} icon={icons.home} title="Home" />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Notifications"
//         component={Notifications}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({focused}) => (
//             <TabIcon focused={focused} icon={icons.bell} title="Bildirimler" />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={ProfileStack}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({focused}) => (
//             <TabIcon focused={focused} icon={icons.person} title="Profil" />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// }
