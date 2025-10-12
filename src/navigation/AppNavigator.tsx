import * as React from 'react';
import {
  DefaultTheme,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Launch from '../screens/launch/Launch';
import CustomHeader from '../components/CustomHeader';
import Options from '../screens/profile/settings/Settings';
import {BottomNavigator} from './BottomNavigation';
import Settings from '../screens/profile/settings/Settings';
import icons from '../constants/icons';
import Security from '../screens/profile/settings/Security';
import Notifications from '../screens/profile/settings/Reminders';
import Language from '../screens/profile/settings/Language';
import Preferences from '../screens/profile/settings/Appearance';
import {useTheme} from '../themes/ThemeProvider';
import {themes} from '../themes/themes';
import {StatusBar} from 'react-native';
import Home from '../screens/home/Home';
import Profile from '../screens/profile/Profile';
import Groups from '../screens/groups/groups';
import Exercises from '../screens/exercises/user/ExercisesUser';
import UserLogin from '../screens/login/user/UserLogin';
import AdminLogin from '../screens/login/admin/AdminLogin';
import {useNotificationNavigation} from '../hooks/useNotificationNavigation';
import {flushPendingNav, navigationRef} from './NavigationService';
import ForgotPassword from '../screens/login/forgotPassword/ForgotPassword';
import VerifyCode from '../screens/login/forgotPassword/VerifyCode';
import ResetPassword from '../screens/login/forgotPassword/ResetPassword';

const RootNativeStack = createNativeStackNavigator<RootStackParamList>();
const AppNativeStack = createNativeStackNavigator<AppStackParamList>(); // This one works
// const Stack = createStackNavigator<RootStackParamList>(); // This one not works

function AppStack() {
  return (
    <AppNativeStack.Navigator
      initialRouteName="Launch"
      screenOptions={{
        animation: 'slide_from_bottom',
      }}>
      <AppNativeStack.Screen
        name="Launch"
        component={Launch}
        options={{
          headerShown: false,
        }}
      />
      <AppNativeStack.Screen
        name="UserLogin"
        component={UserLogin}
        options={{
          headerShown: false,
        }}
      />
      <AppNativeStack.Screen
        name="AdminLogin"
        component={AdminLogin}
        options={{
          headerShown: false,
        }}
      />
      <AppNativeStack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{
          headerShown: false,
        }}
      />
      <AppNativeStack.Screen
        name="VerifyCode"
        component={VerifyCode}
        options={{
          headerShown: false,
        }}
      />
      <AppNativeStack.Screen
        name="ResetPassword"
        component={ResetPassword}
        options={{
          headerShown: false,
        }}
      />
      <AppNativeStack.Screen
        name="App"
        component={BottomNavigator}
        options={{
          headerShown: false,
        }}
      />
    </AppNativeStack.Navigator>
  );
}

export default function AppNavigator() {
  const {theme, colors} = useTheme();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background.secondary,
      card: colors.background.primary,
      text: colors.text.primary,
      border: colors.background.primary,
      notification: colors.primary[300],
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={flushPendingNav}
      theme={navTheme}>
      <StatusBar
        backgroundColor={colors.background.secondary}
        barStyle={theme.colors.isLight ? 'dark-content' : 'light-content'}
      />
      <AppStack />
    </NavigationContainer>
  );
}
